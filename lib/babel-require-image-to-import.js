"use strict";
/**
 * @see https://github.com/rosong1/babel-require-image-to-import
 *
 * const img1 = require("./img/icon1.webp");
 *
 * becomes:
 *
 * import _img_uid from "./img/icon1.webp";
 * const img1 = _img_uid;
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMetaType = void 0;
exports.defaultMetaType = [".jpg", ".jpeg", ".webp", ".svg", ".png", ".gif", ".avif"];
function requireImgToImport({ types: t }) {
    return {
        name: "require-img-to-import",
        visitor: {
            Program(path, state) {
                const metaType = state.opts.metaType || exports.defaultMetaType;
                const addImport = (imgPath) => {
                    const uid = path.scope.generateUidIdentifier("img_uid");
                    const importDefaultSpecifier = [t.ImportDefaultSpecifier(uid)];
                    const importDeclaration = t.ImportDeclaration(importDefaultSpecifier, t.StringLiteral(imgPath));
                    path.get("body")[0] &&
                        path.get("body")[0].insertBefore(importDeclaration);
                    return uid;
                };
                path.traverse({
                    CallExpression(path) {
                        if (path.node.callee.name === "require" &&
                            path.node.arguments.length === 1) {
                            const arr = path.node.arguments[0].value.split(".");
                            if (arr.length > 1 &&
                                metaType.some((metaTypeItem) => path.node.arguments[0].value.endsWith(metaTypeItem))) {
                                const uid = addImport(path.node.arguments[0].value);
                                path.replaceWith(t.identifier(uid.name));
                            }
                        }
                    },
                });
            },
        },
    };
}
exports.default = requireImgToImport;
;
