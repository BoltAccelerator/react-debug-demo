// ===================================================================
//  main.js — React 源码调试 Demo
// ===================================================================
//  在浏览器 DevTools (F12) → Sources 面板里你会直接看到
//  packages/react/src/…  和  packages/react-dom/src/…
//  这些文件，进去打断点 F11 一步步跟进去吧。
// ===================================================================

import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';

// ── 1. useState 组件 ────────────────────────────────────────────────
function Counter() {
  const [count, setCount] = useState(0);

  // ── 在这行 createElement 上直接 break / F11 跟进去即可 ──────
  return createElement(
    'div',
    { className: 'box' },
    createElement('h2', null, '计数器：', count),
    createElement('button', { onClick: () => setCount(c => c + 1) }, '+1'),
    createElement('button', { onClick: () => setCount(0) }, '归零'),
  );
}

// ── 2. 混合嵌套 ─────────────────────────────────────────────────
function TodoItem({ label }) {
  return createElement('li', null, label);
}

function TodoList() {
  const items = ['读源码', '打断点', 'F11 跟进去'];
  // ➊ 跟到 ReactChildren.mapIntoArray 看 children 展开
  return createElement(
    'ul',
    null,
    items.map(label => createElement(TodoItem, { key: label, label })),
  );
}

function App() {
  return createElement(
    'div',
    null,
    createElement(Counter),
    createElement('h2', null, 'TODO'),
    createElement(TodoList),
  );
}

// ── 3. 挂载 ──────────────────────────────────────────────────────
// ➋ 这里 F11 进入 createRoot → updateContainer → scheduleUpdateOnFiber
const container = document.getElementById('app');

// ── 断点 A：createRoot 之前 ──
// F11 进 createRoot → createContainer → createFiberRoot
debugger;
const root = createRoot(container);

// ── 断点 B：render 之前 ──
// F11 进 render → updateContainer → scheduleUpdateOnFiber → performWorkOnRoot
debugger;
root.render(createElement(App));
