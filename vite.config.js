import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',

  resolve: {
    symlinks: true,
    alias: [
      { find: /^react\/jsx-runtime$/,     replacement: 'E:/react/packages/react/jsx-runtime.js' },
      { find: /^react\/jsx-dev-runtime$/, replacement: 'E:/react/packages/react/jsx-dev-runtime.js' },
      { find: /^react$/,                  replacement: 'E:/react/build-flowless/react/index.dev.js' },
      { find: /^react-dom\/client$/,      replacement: 'E:/react/build-flowless/react-dom/src/client/ReactDOMClient.js' },
      { find: /^react-dom$/,              replacement: 'E:/react/build-flowless/react-dom/index.dev.js' },
      { find: /^react-dom-bindings\/(.*)/, replacement: 'E:/react/build-flowless/react-dom-bindings/$1' },
      { find: /^react-dom-bindings$/,     replacement: 'E:/react/build-flowless/react-dom-bindings/src' },
      { find: /^react-reconciler\/(.*)/,  replacement: 'E:/react/build-flowless/react-reconciler/$1' },
      { find: /^react-reconciler$/,       replacement: 'E:/react/build-flowless/react-reconciler/index.dev.js' },
      { find: /^shared\/(.*)/,            replacement: 'E:/react/build-flowless/shared/$1' },
      { find: /^scheduler\/(.*)/,         replacement: 'E:/react/build-flowless/scheduler/$1' },
      { find: /^scheduler$/,              replacement: 'E:/react/build-flowless/scheduler/index.dev.js' },
    ],
  },

  server: {
    fs: { strict: false, allow: ['E:/react', 'E:/react-debug-demo'] },
  },
});
