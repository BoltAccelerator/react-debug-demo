import path from 'path';
import { transformSync, loadPartialConfig } from '@babel/core';

const REACT_SRC = path.resolve('E:/react/packages');

const config = loadPartialConfig({
  cwd: 'E:/react',
  configFile: 'E:/react/babel.config.js',
  babelrc: false,
});

const opts = config ? { ...config.options } : null;
if (!opts) {
  console.warn('[flow-transform] ⚠️  babel config not loaded, Flow types will fail');
}

export default function flowTransformPlugin() {
  return {
    name: 'flow-transform-for-react-source',
    enforce: 'pre',
    async transform(src, id) {
      if (!id.startsWith(REACT_SRC) || !opts) return null;
      try {
        const { code, map } = transformSync(src, {
          ...opts,
          comments: false,
          filename: id,
          sourceRoot: REACT_SRC,
          sourceMaps: 'inline',
        });
        if (code) return { code, map };
      } catch (e) {
        console.error('[flow-transform]', id, e.message);
      }
      return null;
    },
  };
}
