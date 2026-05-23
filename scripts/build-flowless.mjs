import { transform } from '@babel/core';
import flowRemoveTypes from 'flow-remove-types';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('E:/react');

const PAIRS = [
  ['packages/react/src',              'react/src'],
  ['packages/react-dom/src',          'react-dom/src'],
  ['packages/react-dom-bindings/src', 'react-dom-bindings/src'],
  ['packages/react-reconciler/src',   'react-reconciler/src'],
  ['packages/react-client/src',       'react-client/src'],
  ['packages/shared',                 'shared'],
  ['packages/scheduler/src',          'scheduler/src'],
];

const OPTS = {
  presets: [['@babel/preset-flow', { all: true }]],
  comments: false,
};

function isReactDomSrc(abs) {
  const p = abs.replace(/\\/g, '/');
  return /[\\/]react-dom[\\/]src[\\/]/.test(p);
}
function isSharedSrc(abs) {
  const p = abs.replace(/\\/g, '/');
  return /(?:^|[\\/])shared(?:[\\/]|$)/.test(p);
}

function stripFlowComponentType(src) {
  let out = src.replace(/\bcomponent\([^)]*\)/g, 'any');
  out = out.replace(
    /(:\s*)?\?component\([^)]*\)(?=\s*[,\]\}\)]|\s*$)/gm,
    '$1any'
  );
  out = out.replace(
    /([:(,={\s])\s*component\([^)]*\)(?=[,\]\}\)]|\s*$)/gm,
    '$1 any'
  );
  return out;
}

function stripFlowFlowTypeDecl(src) {
  const open = src.indexOf("export type Awaited<T>");
  const foot = src.indexOf("\nexport type ReactCallSite");
  if (open >= 0 && foot >= 0 && foot > open) {
    return src.slice(0, open) + src.slice(foot);
  }
  return src;
}

function stripFlowDeclareBlock(src) {
  // shared/isArray.js opens with a `declare function isArray<T>(…): v is …;`
  // ambient declaration. flow-remove-types can't reason about TS-style
  // `v is X` predicates inside Flow, so we excise just the declare block
  // (from `declare function isArray<` to its terminating `;`) and keep the
  // real implementation that follows.
  const open = src.indexOf("declare function isArray<");
  if (open < 0) return src;
  // Find the end of the declare statement: the first `;` that isn't inside
  // brackets. Simpler heuristic: the line containing `: v is`'s terminating
  // `;` — locate the closing `;` after the `v is …` predicate.
  const predicate = src.indexOf("v is", open);
  if (predicate < 0) return src;
  const semi = src.indexOf(";", predicate);
  if (semi < 0) return src;
  return src.slice(0, open) + src.slice(semi + 1);
}

function stripFlowSchedulerNativeDecl(src) {
  const open = src.indexOf("declare const nativeRuntimeScheduler:");
  const eol  = open >= 0 ? src.indexOf("\n", open) : -1;
  if (open >= 0 && eol >= 0) {
    return src.slice(0, open) + src.slice(eol);
  }
  return src;
}

function stripFlowSchedulerPostTaskDecl(src) {
  const open = src.indexOf("declare class TaskController {");
  const foot = src.indexOf("}\n\ntype PostTaskPriorityLevel");
  if (open >= 0 && foot >= 0 && foot > open) {
    return src.slice(0, open) + src.slice(foot + 1);
  }
  return src;
}

// walk with relative-path support so sub-directories (e.g. client/) are
// preserved in the output tree.
function walk(src, cb, rel) {
  rel = rel || '';
  for (const name of fs.readdirSync(src)) {
    if (name === '__tests__') continue;
    const abs = path.join(src, name);
    const st  = fs.statSync(abs);
    if (st.isDirectory()) walk(abs, cb, rel + name + '/');
    else if (/\.js$/.test(name)) cb(abs, rel + name);
  }
}

for (const [srcRel, outRel] of PAIRS) {
  const srcDir = path.join(ROOT, srcRel);
  const outDir = path.join(ROOT, 'build-flowless', outRel);
  console.log(`\n→ ${srcRel}  →  build-flowless/${outRel}/`);
  fs.mkdirSync(outDir, { recursive: true });

  let n = 0, dirty = 0, skipped = 0;
  walk(srcDir, (abs, rel) => {
    const out = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const raw      = fs.readFileSync(abs, 'utf8');
    let   stage1   = isReactDomSrc(abs) ? stripFlowComponentType(raw) : raw;
    let   stage2   = isSharedSrc(abs) ? stripFlowFlowTypeDecl(stage1) : stage1;
    let   stage3   = isSharedSrc(abs) ? stripFlowDeclareBlock(stage2) : stage2;
    const norm = abs.replace(/\\/g, '/');
    if (/scheduler\/src\/forks\/SchedulerNative\.js$/.test(norm))  stage3 = stripFlowSchedulerNativeDecl(stage3);
    if (/scheduler\/src\/forks\/SchedulerPostTask\.js$/.test(norm)) stage3 = stripFlowSchedulerPostTaskDecl(stage3);
    if (stage3 !== stage2) dirty++;
    if (stage2 !== stage1) dirty++;
    if (stage1 !== raw)     dirty++;
    const src = stage3;
    let outCode;
    try {
      // flow-remove-types is FB's own stripper — handles all current Flow
      // syntax including `as` casts, `declare`, opaque types, etc.
      outCode = flowRemoveTypes(src, { all: true, pretty: true }).toString();
    } catch (e) {
      skipped++;
      const stub = `// build-flowless: skipped (flow-remove-types failed)\n// original: ${rel}\nthrow new Error('build-flowless stub: ${rel} should not be imported by the DOM debug entry');\n`;
      fs.writeFileSync(out, stub, 'utf8');
      console.warn(`   ⚠️  skip ${rel}: ${e.message.split('\n')[0]}`);
      n++;
      return;
    }
    fs.writeFileSync(out, outCode, 'utf8');
    n++;
  });
  console.log(`   ${n} files${dirty ? `  (${dirty} react-dom files pre-stripped)` : ''}${skipped ? `  (${skipped} skipped)` : ''}`);
}

[
  ['packages/react/index.js',             'build-flowless/react/index.dev.js'],
  ['packages/react-dom/index.js',         'build-flowless/react-dom/index.dev.js'],
  ['packages/react-reconciler/index.js',  'build-flowless/react-reconciler/index.dev.js'],
  ['packages/scheduler/index.js',         'build-flowless/scheduler/index.dev.js'],
].forEach(([inp, outp]) => {
  const absIn  = path.join(ROOT, inp);
  const absOut = path.join(ROOT, outp);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  const raw = fs.readFileSync(absIn, 'utf8');
  const outCode = flowRemoveTypes(raw, { all: true, pretty: true }).toString();
  fs.writeFileSync(absOut, outCode, 'utf8');
  console.log(`stub   ${inp}  →  ${outp}`);
});

console.log('\nbuild-flowless.mjs: done');
