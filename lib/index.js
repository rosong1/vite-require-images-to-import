"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_require_image_to_import_1 = __importStar(require("./babel-require-image-to-import"));
const babel = __importStar(require("@babel/core"));
const vueCompiler = require("@vue/compiler-sfc");
function viteRequireImageToImport(options) {
    const metaType = (options === null || options === void 0 ? void 0 : options.metaType) ? options === null || options === void 0 ? void 0 : options.metaType : babel_require_image_to_import_1.defaultMetaType;
    const babelPlugins = [
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        [
            "@babel/plugin-proposal-class-properties",
            { loose: true },
        ],
        [babel_require_image_to_import_1.default, { metaType }],
    ];
    const basePlugin = {
        name: "vite-require-image-to-import",
        enforce: "pre",
        transform(code, id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (/node_modules/g.test(id))
                    return null;
                // like App.vue?vue&type=style&index=1&scoped=true&lang.ts
                if (id.indexOf('.vue') !== -1)
                    return null;
                if (/\.(mjs|[tj]sx?)$/.test(id)) {
                    const result = yield babel.transformAsync(code, {
                        plugins: (/\.tsx?/.test(id) ? [[
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
            });
        },
    };
    const vuePlugin = {
        name: "vite-require-image-to-import:vue",
        transform(code, id) {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                if (/node_modules/g.test(id))
                    return null;
                if (/\.vue$/.test(id)) {
                    const parseResult = vueCompiler.parse(code);
                    const descriptor = parseResult.descriptor;
                    const handleScript = (scriptDescriptor) => __awaiter(this, void 0, void 0, function* () {
                        if (!(scriptDescriptor === null || scriptDescriptor === void 0 ? void 0 : scriptDescriptor.content))
                            return '';
                        const scriptResult = scriptDescriptor.content
                            ? yield babel.transformAsync(scriptDescriptor.content, {
                                presets: [['@vue/babel-preset-jsx', options === null || options === void 0 ? void 0 : options.jsxOptions]],
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
                            attrs: scriptDescriptor.attrs,
                            children: `\n${scriptResult.code}`,
                        }) : '';
                    });
                    // TODO: @babel/plugin-transform-typescript will add `export {}` at last, but why
                    const fixTypescriptWillAddExport = (scriptSetupTag) => {
                        return scriptSetupTag.replace(/export \{\};/g, '');
                    };
                    // 1. scriptSetup
                    const scriptSetupResultTag = fixTypescriptWillAddExport(yield handleScript(descriptor === null || descriptor === void 0 ? void 0 : descriptor.scriptSetup));
                    // 2. script
                    const scriptResultTag = yield handleScript(descriptor === null || descriptor === void 0 ? void 0 : descriptor.script);
                    // 3. template
                    const templateResult = (_c = (_b = (_a = descriptor === null || descriptor === void 0 ? void 0 : descriptor.template) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.replace) === null || _c === void 0 ? void 0 : _c.call(_b, /(require\(([^)]+)\))/g, (__, $1, $2) => {
                        // TODO: support build path
                        const replaceResult = `${getRequireFilePage(id, $2).replace(/['"]/g, "")}`;
                        return isMatchMeta(replaceResult, metaType)
                            ? `'${replaceResult}'`
                            : $1;
                    });
                    const templateTag = !templateResult ? '' : setAttr({
                        type: "template",
                        attrs: descriptor === null || descriptor === void 0 ? void 0 : descriptor.template.attrs,
                        children: templateResult,
                    });
                    // 4. style
                    const stylesTag = descriptor === null || descriptor === void 0 ? void 0 : descriptor.styles.map((styleDescriptor) => setAttr({
                        type: "style",
                        attrs: styleDescriptor.attrs,
                        children: styleDescriptor.content,
                    })).join("\n");
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
            });
        },
    };
    return [basePlugin, vuePlugin];
}
exports.default = viteRequireImageToImport;
function setAttr(params) {
    const flatAttrs = Object.entries((params === null || params === void 0 ? void 0 : params.attrs) || {}).reduce((acc, [key, value]) => {
        return (acc += ` ${key}${value === true ? "" : `="${value}"`}`);
    }, "");
    return `<${params.type}${flatAttrs}>${params.children || ""}</${params.type}>`;
}
/**
 * @see https://github.com/wangzongming/vite-plugin-require/blob/master/src/index.ts#L44-L60
 */
function getRequireFilePage(fileSrc, requireSrc) {
    var _a;
    // Get up .. the number of, It could be a level
    const parentLevel = ((_a = requireSrc.match(/(\.\.\/)/g)) === null || _a === void 0 ? void 0 : _a.length) || 0;
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
function isMatchMeta(meta, metaType) {
    return metaType.some((type) => meta.endsWith(type));
}
