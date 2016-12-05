
const {intervalDivision, map, cartesianProduct, count} = sequence;
const {scale, add} = vector;
const xyz = vector.byXYZ;
const x = vector.byX;
const y = vector.byY;
const z = vector.byZ;




function coordinateGrid(p, uu, vv, m, n) {
  return map(
    ([u, v]) => add(p,
      add(scale(uu, u), scale(vv, v))),
    cartesianProduct(count(m), count(n))
  );
}

function building1(p) {
  return random.real(3) < 1
    ? cylinder.byCentersRadius(
      [p, add(p, z(75))], 10)
    : box.byBottomWidthHeightZ(
      p, [20, 20], 60);
}

function city1(p) {
  return map(building1,
    coordinateGrid(p, x(25), y(25),
      10, 10));
}

city1(xyz(0, 0, 0));




function building2(p) {
  return random.real(3) < 1
    ? cylinder.byCentersRadius(
      [p, add(p,
        z(random.real.inRange(10, 75)))],
      10)
    : box.byBottomWidthHeightZ(p, [20, 20],
      random.real.inRange(5, 60));
}

function city2(p) {
  return map(building2,
    coordinateGrid(p, x(25), y(25),
      10, 10));
}

city2(xyz(0, 0, 0));



function city3(p, buildingFns) {
  return map(pt =>
    buildingFns[random.integer(buildingFns.length - 1)](pt),
    coordinateGrid(p, x(25), y(25), 10, 10));
}

function cylBuilding(p) {
  return cylinder.byCentersRadius(
    [p, add(p, z(random.real.inRange(10, 75)))],
    10);
}
function boxBuilding(p) {
  return box.byBottomWidthHeightZ(p, [20, 20],
    random.real.inRange(5, 60));
}
function coneBuilding(p) {
  return coneFrustum.byBottomTopRadiusesHeight(
    p, 10, random.real.inRange(0, 8),
    random.real.inRange(5, 60)
  );
}


city3(xyz(0, 0, 0),
  [cylBuilding, boxBuilding, coneBuilding]);
