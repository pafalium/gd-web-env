
const cFrustum = coneFrustum.byBottomRadiusTopRadius;
const xyz = point.byXYZ;
const addP = point.add;
const vec = vector;

function cruzeta(p, rb, rt, c) {
  return [
    cFrustum(p, rb, vec.add(p, vec.byX(c)), rt),
    cFrustum(p, rb, vec.add(p, vec.byY(c)), rt),
    cFrustum(p, rb, vec.add(p, vec.byZ(c)), rt),
    cFrustum(p, rb, vec.add(p, vec.byX(-c)), rt),
    cFrustum(p, rb, vec.add(p, vec.byY(-c)), rt),
    cFrustum(p, rb, vec.add(p, vec.byZ(-c)), rt)
  ];
}


cruzeta(xyz(0, 0, 0), 0.2, 0.4, 0.8);
