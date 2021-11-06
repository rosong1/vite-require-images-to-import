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
export declare const defaultMetaType: string[];
export default function requireImgToImport({ types: t }: {
    types: any;
}): {
    name: string;
    visitor: {
        Program(path: any, state: any): void;
    };
};
