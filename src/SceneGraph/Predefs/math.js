
const math = {};
math.lerp = function lerp(a, b, t) {
  return a + (b-a)*t;
};


export default math;
