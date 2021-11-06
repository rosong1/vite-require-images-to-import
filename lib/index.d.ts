import { Plugin } from "vite";
declare type TOptions = {
    metaType?: string[];
    jsxOptions?: any;
};
export default function viteRequireImageToImport(options?: TOptions): Plugin[];
export {};
