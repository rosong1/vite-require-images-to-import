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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaType = void 0;
const babel_require_image_to_import_1 = __importDefault(require("./babel-require-image-to-import"));
const babel = __importStar(require("@babel/core"));
const vueCompiler = require("@vue/compiler-sfc");
exports.metaType = [".jpg", ".jpeg", ".webp", ".svg", ".png"];
function viteRequireImageToImport() {
    const basePlugin = {
        name: "vite-require-image-to-import",
        enforce: "pre",
        transform(code, id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (/node_modules/g.test(id))
                    return null;
                if (/\.(mjs|[tj]sx?)$/.test(id)) {
                    const result = yield babel.transformAsync(code, {
                        plugins: [babel_require_image_to_import_1.default],
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
    const Vue3plugin = {
        name: "vite-require-image-to-import:vue3",
        transform(code, id) {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                if (/node_modules/g.test(id))
                    return null;
                if (/App\.vue$/.test(id)) {
                    const parseResult = vueCompiler.parse(code);
                    const descriptor = parseResult.descriptor;
                    // 1. scriptSetup
                    const scriptSetupResult = ((_a = descriptor === null || descriptor === void 0 ? void 0 : descriptor.scriptSetup) === null || _a === void 0 ? void 0 : _a.content)
                        ? yield babel.transformAsync(descriptor === null || descriptor === void 0 ? void 0 : descriptor.scriptSetup.content, {
                            plugins: [babel_require_image_to_import_1.default],
                        })
                        : { code: "" };
                    const scriptSetupResultTag = setAttr({
                        type: "script",
                        attrs: descriptor === null || descriptor === void 0 ? void 0 : descriptor.scriptSetup.attrs,
                        children: `\n${scriptSetupResult.code}`,
                    });
                    // 2. script
                    const scriptResult = ((_b = descriptor === null || descriptor === void 0 ? void 0 : descriptor.script) === null || _b === void 0 ? void 0 : _b.content)
                        ? yield babel.transformAsync((_c = descriptor === null || descriptor === void 0 ? void 0 : descriptor.script) === null || _c === void 0 ? void 0 : _c.content, {
                            plugins: [babel_require_image_to_import_1.default],
                        })
                        : { code: "" };
                    const scriptResultTag = setAttr({
                        type: "script",
                        attrs: descriptor === null || descriptor === void 0 ? void 0 : descriptor.script.attrs,
                        children: `\n${scriptResult.code}`,
                    });
                    // 3. template
                    const templateResult = descriptor === null || descriptor === void 0 ? void 0 : descriptor.template.content.replace(/(require\(([^)]+)\))/g, (__, $1, $2) => {
                        const replaceResult = `${getRequireFilePage(id, $2).replace(/['"]/g, "")}`;
                        return isMatchMeta(replaceResult, exports.metaType)
                            ? `'${replaceResult}'`
                            : $1;
                    });
                    const templateTag = setAttr({
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
            });
        },
    };
    return [basePlugin, Vue3plugin];
}
exports.default = viteRequireImageToImport;
function setAttr(params) {
    const flatAttrs = Object.entries(params.attrs).reduce((acc, [key, value]) => {
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
