
const functional = {};
functional.compose = function(...fns) {
  return function(...args) {
    return fns.reduceRight((prev, fn) => fn.apply(null, [prev]), args);
  };
};

export default functional;
