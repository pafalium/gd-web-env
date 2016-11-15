
const functional = {};
functional.compose = function(...fns) {
  return function(...args) {
    return fns.reduceRight((prev, fn) => fn.apply(null, [prev]), args);
  };
};

/*
  @param {[boolean, thunk]} condPairs
*/
functional.cond = function cond(condPairs) {
  let i = 0;
  while (i < condPairs.length) {
    if (condPairs[i][0]) {
      return condPairs[i][1]();
    }
    i++;
  }
};

export default functional;
