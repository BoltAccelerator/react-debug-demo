import path from 'path';
import { loadPartialConfig, transformSync } from '@babel/core';

const REACT_SRC = path.resolve('E:/react/packages');

const babelConfig = loadPartialConfig({
  cwd: 'E:/react',
  configFile: 'E:/react/babel.config.js',
  babelrc: false,
  // Don't rely on preset-env/transform-runtime — react-dom ships modern
  // ESM and has all helpers inlined.  We only need to strip Flow and
  // understand JSX.
})?.options;

babelConfig &&= { ...babelConfig };
babelConfig.presets = babelConfig.presets || [];

// We deliberately don't call preset-env / preset-react here: we only
// need to strip Flow types; the source files already use bare `export`
// and standard JSX-free helpers.
babelConfig!.comments = false;
babelConfig!.sourceMaps = 'inline';

export default function reactSourceTransform(code, id) {
  if (!id.startsWith(REACT_SRC) || !babelConfig) {
    return null;
  }
  try {
    const result = transformSync(code, {
      ...babelConfig,
      filename: id,
      sourceRoot: REACT_SRC,
    });
    return result ? { code: result.code || '', map: result.map } : null;
  } catch (e) {
    console.error('[react-source-transform] failed for', id, e.message);
    return null;
  }
}
