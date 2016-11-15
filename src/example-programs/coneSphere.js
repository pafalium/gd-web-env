
const {intervalMiddles, cartesianProduct, map} = sequence;
const {lerp} = math;
const sph = point.bySpherical;
const xyz = point.byXYZ;

function coneSphere(p, sphR, equatorConeR, poleConeR, parallelsNum, meridiansNum) {
  return map(([phi, th]) => {
      let baseP = sph(sphR, th, phi);
      let baseR = sphSurfToRadius(phi, th, equatorConeR, poleConeR);
      return coneFrustum.byBottomRadiusTopRadius(baseP, baseR, p, 0.01);
    },
    sphSurfCoords(parallelsNum, meridiansNum));  
}

function sphSurfCoords(parallelsNum, meridiansNum) {
  let parallelPhis = intervalMiddles(0, Math.PI, parallelsNum);
  let meridianThetas = intervalMiddles(0, 2*Math.PI, meridiansNum);
  return cartesianProduct(parallelPhis, meridianThetas);
}

function sphSurfToRadius(phi, theta, equatorConeR, poleConeR) {
  return lerp(poleConeR, equatorConeR, Math.sin(phi));
}


coneSphere(xyz(0, 0, 0), 10, 1, 0.1, 10, 5);

