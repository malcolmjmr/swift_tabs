import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import image from '@rollup/plugin-image';

const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: 'src/content.js',
        output: {
            sourcemap: !production,
            format: 'iife',
            name: 'content',
            file: 'dist/content.js'
        },
        plugins: [
            svelte({
                compilerOptions: {
                    dev: !production
                }
            }),

            css({ output: 'content.css' }),

            resolve({
                browser: true,
                dedupe: ['svelte']
            }),

            commonjs(),


            image(),

            production && terser()
        ],
        watch: {
            clearScreen: false

        }
    }
];
