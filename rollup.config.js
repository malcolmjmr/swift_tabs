import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import image from '@rollup/plugin-image';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const chromeApiMockPath = path.resolve(__dirname, 'src/demo/chromeApiMock.js');
const tabStoreDemoPath = path.resolve(__dirname, 'src/demo/tabStoreDemo.js');

/** Rollup plugin: demo bundle uses in-memory chrome API + tab store (no extension host). */
function swiftTabsDemoAliases() {
    return {
        name: 'swift-tabs-demo-aliases',
        resolveId(source) {
            if (
                source.includes('chromeApiMock') ||
                source.includes('tabStoreDemo')
            ) {
                return null;
            }
            const n = source.split(path.sep).join('/');
            if (n.endsWith('services/chromeApi.js')) {
                return chromeApiMockPath;
            }
            if (n.endsWith('stores/tabStore.js')) {
                return tabStoreDemoPath;
            }
            return null;
        },
    };
}

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
    },
    {
        input: 'src/content-dev.js',
        output: {
            sourcemap: !production,
            format: 'iife',
            name: 'contentDev',
            file: 'dist/content-dev.js'
        },
        plugins: [
            svelte({
                compilerOptions: {
                    dev: !production
                }
            }),

            css({ output: 'content-dev.css' }),

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
    },
    {
        input: 'src/planner.js',
        output: {
            sourcemap: !production,
            format: 'iife',
            name: 'planner',
            file: 'dist/planner.js'
        },
        plugins: [
            svelte({
                compilerOptions: {
                    dev: !production
                }
            }),

            css({ output: 'planner.css' }),

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
    },
    {
        input: 'src/newtab.js',
        output: {
            sourcemap: !production,
            format: 'iife',
            name: 'swiftTabsNewTab',
            file: 'dist/newtab.js'
        },
        plugins: [
            svelte({
                compilerOptions: {
                    dev: !production
                }
            }),

            css({ output: 'newtab.css' }),

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
    },
    {
        input: 'src/demo/main.js',
        output: {
            sourcemap: !production,
            format: 'iife',
            name: 'swiftTabsDemo',
            file: 'dist/demo/demo.js',
        },
        plugins: [
            swiftTabsDemoAliases(),
            svelte({
                compilerOptions: {
                    dev: !production,
                },
            }),
            css({ output: 'demo.css' }),
            resolve({
                browser: true,
                dedupe: ['svelte'],
            }),
            commonjs(),
            image(),
            production && terser(),
        ],
        watch: {
            clearScreen: false,
        },
    },
];
