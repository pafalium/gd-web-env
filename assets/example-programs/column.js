
const xyz = point.byXYZ;
const add = point.add;
const z = vector.byZ;

function abacus(p, height, side) {
  return box.byBottomWidthHeightZ(p, [side, side], height);
}

function echinus(p, height, side, neckSide) {
  return coneFrustum.byBottomTopRadiusesHeight(p, neckSide/2, side/2, height);
}

function shaft(p, height, side, neckSide) {
  return coneFrustum.byBottomTopRadiusesHeight(p, side/2, neckSide/2, height);
}

function column(p, shaftH, shaftBaseD, echinusH, echinusBaseD, abacusH, abacusS) {
  return [
    abacus(add(p, z(shaftH + echinusH)), abacusH, abacusS),
    echinus(add(p, z(shaftH)), echinusH, abacusS, echinusBaseD),
    shaft(p, shaftH, shaftBaseD, echinusBaseD)
  ];
}

column(xyz(0, 0, 0), 6.00, 0.8, 0.2, 0.7, 0.1, 0.9);
