import { createVuePlugin } from "vite-plugin-vue2";
import { defineConfig } from "vite";
import requireImgToImport from '../../lib'

import path from "path";
export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^~/,
                replacement: "",
            },
            {
                find: "@",
                replacement: path.resolve(__dirname, "src"),
            },
            {
                find: "images",
                replacement: path.resolve(__dirname, "src/assets"),
            },
        ],
    },

    plugins: [
        requireImgToImport(),
        createVuePlugin({
            jsx: true,
            vueTemplateOptions: {
                compilerOptions: {
                    whitespace: "condense",
                },
            },
        }),
    ],
});