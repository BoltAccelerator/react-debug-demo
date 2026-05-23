import { defineConfig } from 'vite';

// React's Rollup build rewrites `react-reconciler/src/ReactFiberConfig` to a
// renderer-specific fork (dom/native/test/...). The raw source ships a shim
// that throws "This module must be shimmed by a specific renderer." We do the
// same rewrite via a Vite plugin so the relative `./ReactFiberConfig` imports
// inside react-reconciler resolve to the DOM fork.
const RECONCILER_SHIM = 'E:/react/build-flowless/react-reconciler/src/ReactFiberConfig.js';
const RECONCILER_DOM_FORK = 'E:/react/build-flowless/react-reconciler/src/forks/ReactFiberConfig.dom.js';

function reactReconcilerShim() {
  return {
    name: 'react-reconciler-config-shim',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer) return null;
      // Catch both the bare `react-reconciler/src/ReactFiberConfig` and the
      // relative `./ReactFiberConfig` inside the reconciler source tree.
      if (
        source === 'react-reconciler/src/ReactFiberConfig' ||
        source === './ReactFiberConfig' ||
        source.endsWith('/ReactFiberConfig')
      ) {
        const resolved = await this.resolve(source, importer, { skipSelf: true });
        const id = resolved?.id?.replace(/\\/g, '/');
        if (id === RECONCILER_SHIM || id?.endsWith('react-reconciler/src/ReactFiberConfig.js')) {
          return RECONCILER_DOM_FORK;
        }
      }
      return null;
    },
  };
}

// React's Rollup build replaces these at compile time. Without Rollup we
// inline the replacements via a tiny transform plugin (Vite's own `define`
// silently no-ops on files outside its core entry graph in some setups).
const REACT_GLOBALS = {
  __DEV__: 'true',
  __PROFILE__: 'true',
  __EXPERIMENTAL__: 'true',
  __VARIANT__: 'false',
  __NEXT_MAJOR__: 'false',
};

function reactDefines() {
  const pattern = new RegExp('\\b(' + Object.keys(REACT_GLOBALS).join('|') + ')\\b', 'g');
  return {
    name: 'react-build-time-defines',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(m?js|tsx?)$/.test(id)) return null;
      if (!pattern.test(code)) return null;
      pattern.lastIndex = 0;
      return { code: code.replace(pattern, (_, k) => REACT_GLOBALS[k]), map: null };
    },
  };
}

export default defineConfig({
  root: '.',

  plugins: [reactDefines(), reactReconcilerShim()],

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
      { find: /^react-client\/(.*)/,      replacement: 'E:/react/build-flowless/react-client/$1' },
      // shared/ReactSharedInternals creates a circular dep through `react`'s
      // barrel export (TDZ on `__CLIENT_INTERNALS_...`). Rollup inlines past
      // it; we short-circuit by routing the shim straight to the source.
      { find: /^shared\/ReactSharedInternals$/, replacement: 'E:/react/build-flowless/react/src/ReactSharedInternalsClient.js' },
      { find: /^shared\/(.*)/,            replacement: 'E:/react/build-flowless/shared/$1' },
      { find: /^scheduler\/(.*)/,         replacement: 'E:/react/build-flowless/scheduler/$1' },
      { find: /^scheduler$/,              replacement: 'E:/react/build-flowless/scheduler/index.dev.js' },
    ],
  },

  server: {
    fs: { strict: false, allow: ['E:/react', 'E:/react-debug-demo'] },
  },
});
