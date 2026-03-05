// Polyfill for __name helper injected by esbuild-compiled dependencies (e.g. @edge-runtime/primitives)
/* eslint-disable no-var */
if (typeof __name === 'undefined') {
  var __name = function (target, name) {
    try { Object.defineProperty(target, 'name', { value: name, configurable: true }); } catch { /* ignore */ }
    return target;
  };
}
/* eslint-enable no-var */
