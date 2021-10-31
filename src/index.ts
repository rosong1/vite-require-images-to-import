import { Plugin } from 'vite'
import requireImgToImport from './babel-require-image-to-import'
import * as babel from '@babel/core'

export default function Plugin(): Plugin {

    return {
        name: 'vite-require-image-to-import',
        enforce: 'pre',
        async transform(code, id) {
            if (/node_modules/g.test(id)) return null;
            if (/\.(mjs|[tj]sx?)$/.test(id)) {
                const result = await babel.transformAsync(code, { plugins: [requireImgToImport] })
                return {
                    code: result.code,
                    map: result.map
                }
            }
            return null;
        }
    }
}