import { Plugin } from "vite";
import requireImgToImport from "./babel-require-image-to-import";
import * as babel from "@babel/core";
const vueCompiler = require("@vue/compiler-sfc");

export const metaType = [".jpg", ".jpeg", ".webp", ".svg", ".png"];

export default function viteRequireImageToImport(): Plugin[] {
  const basePlugin: Plugin = {
    name: "vite-require-image-to-import",
    enforce: "pre",
    async transform(code, id) {
      if (/node_modules/g.test(id)) return null;
      if (/\.(mjs|[tj]sx?)$/.test(id)) {
        const result = await babel.transformAsync(code, {
          plugins: [requireImgToImport],
        });
        return {
          code: result.code,
          map: result.map,
        };
      }
      return null;
    },
  };
  const Vue3plugin: Plugin = {
    name: "vite-require-image-to-import:vue3",
    async transform(code, id) {
      if (/node_modules/g.test(id)) return null;
      if (/App\.vue$/.test(id)) {
        const parseResult = vueCompiler.parse(code);
        const descriptor = parseResult.descriptor;

        // 1. scriptSetup
        const scriptSetupResult = descriptor?.scriptSetup?.content
          ? await babel.transformAsync(descriptor?.scriptSetup.content, {
              plugins: [requireImgToImport],
            })
          : { code: "" };
        const scriptSetupResultTag = setAttr({
          type: "script",
          attrs: descriptor?.scriptSetup!.attrs,
          children: `\n${scriptSetupResult.code}`,
        });

        // 2. script
        const scriptResult = descriptor?.script?.content
          ? await babel.transformAsync(descriptor?.script?.content, {
              plugins: [requireImgToImport],
            })
          : { code: "" };
        const scriptResultTag = setAttr({
          type: "script",
          attrs: descriptor?.script!.attrs,
          children: `\n${scriptResult.code}`,
        });

        // 3. template
        const templateResult = descriptor?.template!.content.replace(
          /(require\(([^)]+)\))/g,
          (__, $1, $2) => {
            const replaceResult = `${getRequireFilePage(id, $2).replace(
              /['"]/g,
              ""
            )}`;
            return isMatchMeta(replaceResult, metaType)
              ? `'${replaceResult}'`
              : $1;
          }
        );
        const templateTag = setAttr({
          type: "template",
          attrs: descriptor?.template!.attrs,
          children: templateResult,
        });

        // 4. style
        const stylesTag = descriptor?.styles
          .map((styleDescriptor) =>
            setAttr({
              type: "style",
              attrs: styleDescriptor.attrs,
              children: styleDescriptor.content,
            })
          )
          .join("\n");

        const resultCode = [
          scriptSetupResultTag,
          scriptResultTag,
          templateTag,
          stylesTag,
        ].join("\n");

        return {
          code: resultCode,
        };
      }

      return null;
    },
  };
  return [basePlugin, Vue3plugin];
}

function setAttr(params: {
  type: string;
  attrs: { [key: string]: any };
  children?: string;
}) {
  const flatAttrs = Object.entries(params.attrs).reduce((acc, [key, value]) => {
    return (acc += ` ${key}${value === true ? "" : `="${value}"`}`);
  }, "");
  return `<${params.type}${flatAttrs}>${params.children || ""}</${
    params.type
  }>`;
}

/**
 * @see https://github.com/wangzongming/vite-plugin-require/blob/master/src/index.ts#L44-L60
 */
function getRequireFilePage(fileSrc: string, requireSrc: string) {
  // Get up .. the number of, It could be a level
  const parentLevel = requireSrc.match(/(\.\.\/)/g)?.length || 0;
  const requireSrcLoc = requireSrc.replace(/(\.\.\/|\.\/)/g, "");
  const arrrs = fileSrc.split("/").reverse();
  // The current file must be deleted
  // arrrs.splice(0, parentLevel === 0 ? parentLevel + 1 : parentLevel);
  // All layers should be added by one
  arrrs.splice(0, parentLevel + 1);

  const reqPath = arrrs.reverse().join("/");
  let reaSrc = `${reqPath}/${requireSrcLoc}`;
  // public String getPath, Remove the drive letter
  reaSrc = reaSrc.replace(process.cwd().replace(/\\/g, "/"), "");

  return `"${reaSrc}"`;
}

function isMatchMeta(meta: string, metaType: string[]) {
  return metaType.some((type) => meta.endsWith(type));
}
