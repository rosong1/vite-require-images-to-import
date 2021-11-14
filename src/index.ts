import { Plugin } from "vite";
import requireImgToImport, { defaultMetaType } from "./babel-require-image-to-import";
import * as babel from "@babel/core";
const vueCompiler = require("@vue/compiler-sfc");

type TOptions = {
  metaType?: string[];
  jsxOptions?: any;
}

export default function viteRequireImageToImport(options?: TOptions): Plugin[] {
  const metaType = options?.metaType ? options?.metaType : defaultMetaType;
  const babelPlugins: any[][] = [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    [
      "@babel/plugin-proposal-class-properties",
      { loose: true },
    ],
    [requireImgToImport, { metaType }],

  ];

  const basePlugin: Plugin = {
    name: "vite-require-image-to-import",
    enforce: "pre",
    async transform(code, id) {
      if (/node_modules/g.test(id) || code.indexOf('require(') === -1) return null;

      // like App.vue?vue&type=style&index=1&scoped=true&lang.ts
      if (id.indexOf('.vue') !== -1) return null;

      if (/\.(mjs|[tj]sx?)$/.test(id)) {
        const result = await babel.transformAsync(code, {
          plugins:
            (/\.tsx?/.test(id) ? [[
              '@babel/plugin-transform-typescript',
              { isTSX: true, allowExtensions: true, allowDeclareFields: true },
            ]] : []).concat(babelPlugins),
          sourceFileName: id,
          filename: id,
        });
        return {
          code: result.code,
          map: result.map,
        };
      }
      return null;
    },
  };
  const vuePlugin: Plugin = {
    name: "vite-require-image-to-import:vue",
    async transform(code, id) {
      if (/node_modules/g.test(id) || code.indexOf('require(') === -1) return null;
      if (/\.vue$/.test(id)) {
        const parseResult = vueCompiler.parse(code);
        const descriptor = parseResult.descriptor;

        const handleScript = async (scriptDescriptor) => {
          if (!scriptDescriptor?.content) return '';

          const scriptResult = scriptDescriptor.content
            ? await babel.transformAsync(scriptDescriptor.content, {
              presets: [['@vue/babel-preset-jsx', options?.jsxOptions]],
              sourceFileName: id,
              filename: id,
              plugins: (/tsx?/.test(scriptDescriptor.lang) ? [[
                '@babel/plugin-transform-typescript',
                { isTSX: scriptDescriptor.lang === 'tsx', allowExtensions: true, allowDeclareFields: true, onlyRemoveTypeImports: true },
              ]] : []).concat(babelPlugins),
            })
            : { code: '' };
          return scriptResult.code ? setAttr({
            type: "script",
            attrs: scriptDescriptor!.attrs,
            children: `\n${scriptResult.code}`,
          }) : '';
        };

        // TODO: @babel/plugin-transform-typescript will add `export {}` at last, but why
        const fixTypescriptWillAddExport = (scriptSetupTag: string) => {
          return scriptSetupTag.replace(/export \{\};/g, '')
        };

        // 1. scriptSetup
        const scriptSetupResultTag = fixTypescriptWillAddExport(await handleScript(descriptor?.scriptSetup));

        // 2. script
        const scriptResultTag = await handleScript(descriptor?.script);

        // 3. template
        const templateResult = descriptor?.template?.content?.replace?.(
          /(require\(([^)]+)\))/g,
          (__, $1, $2) => {
            // TODO: support build path
            const replaceResult = `${getRequireFilePage(id, $2).replace(
              /['"]/g,
              ""
            )}`;
            return isMatchMeta(replaceResult, metaType)
              ? `'${replaceResult}'`
              : $1;
          }
        );
        const templateTag = !templateResult ? '' : setAttr({
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

        // TODO: custom block
        const resultCode = [
          scriptSetupResultTag,
          scriptResultTag,
          templateTag,
          stylesTag,
        ].filter(Boolean).join("\n");

        return {
          code: resultCode,
        };
      }

      return null;
    },
  };
  return [basePlugin, vuePlugin];
}

function setAttr(params: {
  type: string;
  attrs: { [key: string]: any };
  children?: string;
}) {
  const flatAttrs = Object.entries(params?.attrs || {}).reduce((acc, [key, value]) => {
    return (acc += ` ${key}${value === true ? "" : `="${value}"`}`);
  }, "");
  return `<${params.type}${flatAttrs}>${params.children || ""}</${params.type
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
