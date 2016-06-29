
/*
  @param {[boolean, thunk]} condPairs
*/
function cond(condPairs) {
  let i = 0;
  while (i < condPairs.length) {
    if (condPairs[i][0]) {
      return condPairs[i][1]();
    }
    i++;
  }
}

/*
  @param {List<List<a>>} divisions
  @returns 
  @example
  mapDivisions(identity, [0, 1, 2])
  -> [[0], [1], [2]]
  mapDivisions(identity, [[0, 1, 2], [3, 4, 5]])
  -> [[[0,3], [0,4], [0,5]], 
      [[1,3], [1,4], [1,5]],
      [[2,3], [2,4], [2,5]]]
  mapDivisions(identity, [[0], [1, 2, 3], [4, 5, 6]])
  -> [[[[0, 1, 4], [0, 1, 5], [0, 1, 6]],
       [[0, 1, 4], [0, 1, 5], [0, 1, 6]],
       [[0, 1, 4], [0, 1, 5], [0, 1, 6]]]]
*/
function mapDivisions(fn, divisions) {
  if (divisions.length === 1) {
    return sequence.map(fn, divisions[0]);
  } else {
    return sequence.map(
      el => mapDivisions(fn.bind(null, el), sequence.drop(divisions, 1)), 
      divisions[0]);
  }
}

/*
  @param {List<List<Point>>} pointGrid
  @param {(Point, Point, Point, Point) -> a} fn
  @returns {List<List<a>>} lists of results of each quad strip of pointGrid
*/
function iteraQuads(fn, pointGrid) {
  let quadStrips = sequence.zip(pointGrid, sequence.drop(pointGrid, 1));
  return sequence.map(([pts0, pts1]) => 
    sequence.map(
      ([p1, p2, p3, p4]) => fn(p1, p2, p3, p4),
      sequence.zip(
        pts0, 
        pts1, 
        sequence.drop(pts1, 1), 
        sequence.drop(pts0, 1))),
    quadStrips);
}

// Point lerp.
function intermediatePoint(p0, p1, f) {
  return point.add(p0, vector.scale(point.sub(p1, p0), f));
}

// Paralelogram area by three points.
function area(p0, p1, p3) {
  let p0To1 = point.sub(p1, p0);
  let p0To3 = point.sub(p3, p0);
  return vector.length(vector.cross(p0To1, p0To3));
}

const r1 = 0.1,
  r2 = 0.6,
  r = 0.7,
  h = 75,
  l = 20;
function sub(p0, p1, p2, p3) {
  let f1 = random.inRange(0.2, 0.8),
    f2 = random.inRange(0.2, 0.8),
    p01 = intermediatePoint(p0, p1, f1),
    p03 = intermediatePoint(p0, p3, f2),
    p32 = intermediatePoint(p3, p2, f1),
    p12 = intermediatePoint(p1, p2, f2),
    p = intermediatePoint(p03, p12, f1);
    return point.z(p0) > h / 3
      ? block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2)
      : block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r, r);
}


//(define white (create-layer "white"))
//(define glass (create-layer "glass"))

//const extrusion = (obj, displacement) => obj;
function block(p0, p1, p2, p3, r) {
  let d = -0.01;
  return extrusion.bySurfaceVector(
      polygon.surface.byVertices([
        p0,
        point.addX(p1, d),
        point.addXZ(p2, d, d),
        point.addZ(p3, d),
        p0
      ]),
      vector.byY(-r));
}

function block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2) {
  return [
   block(p0, p01, p, p03, random.inRange(r1, r2)),
   block(p01, p1, p12, p, random.inRange(r1, r2)),
   block(p, p12, p2, p32, random.inRange(r1, r2)),
   block(p03, p, p32, p3, random.inRange(r1, r2))
  ];
}

function hotel(p0, p1, p2, p3) { //fazer rugosidades na parte lisa
  let f1 = random.inRange(0.2, 0.8),
    f2 = random.inRange(0.2, 0.8),
    p01 = intermediatePoint(p0, p1, f1),
    p03 = intermediatePoint(p0, p3, f2),
    p32 = intermediatePoint(p3, p2, f1),
    p12 = intermediatePoint(p1, p2, f2),
    p = intermediatePoint(p03, p12, f1),
    i = area(p0, p1, p2) / 2;
    return point.z(p0) > h / 5
      || (point.x(p0) > l * random.inRange(0.42, 0.65)
        && point.x(p0) < l * random.inRange(0.65, 0.94))
      ? // parte rugosa
        cond([[area(p0, p01, p) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                    sub(p0, p01, p, p03),
                    block(p01, p1, p12, p, random.inRange(r1, r2)),
                    block(p, p12, p2, p32, random.inRange(r1, r2)),
                    block(p03, p, p32, p3, random.inRange(r1, r2))
                  ]
                  : block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2)],
              [area(p01, p1, p12) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                    sub(p01, p1, p12, p),
                    block(p0, p01, p, p03, random.inRange(r1, r2)),
                    block(p, p12, p2, p32, random.inRange(r1, r2)),
                    block(p03, p, p32, p3, random.inRange(r1, r2))
                  ]
                  : block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2)],
              [area(p, p12, p2) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                      sub(p, p12, p2, p32),
                      block(p0, p01, p, p03, random.inRange(r1, r2)),
                      block(p01, p1, p12, p, random.inRange(r1, r2)),
                      block(p03, p, p32, p3, random.inRange(r1, r2))
                  ]
                  : block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2)],
              [true, () => 
                block4(p, p0, p01, p1, p12, p2, p32, p3, p03, r1, r2)]])
      : //parte lisa
        cond([[area(p0, p01, p) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                    sub(p0, p01, p, p03),
                    block(p01, p1, p12, p, r),
                    block(p, p12, p2, p32, r),
                    block(p03, p, p32, p3, r)
                  ]
                  : [
                    block(p0, p01, p, p03, r),
                    block(p01, p1, p12, p, r),
                    block(p, p12, p2, p32, r),
                    block(p03, p, p32, p3, r)
                  ]],
              [area(p01, p1, p12) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                    sub(p01, p1, p12, p),
                    block(p0, p01, p, p03, r),
                    block(p, p12, p2, p32, r),
                    block(p03, p, p32, p3, r)
                  ]
                  : [
                    block(p0, p01, p, p03, r),
                    block(p01, p1, p12, p, r),
                    block(p, p12, p2, p32, r),
                    block(p03, p, p32, p3, r)
                  ]],
              [area(p, p12, p2) > i, () => 
                random.integer.inRange(0, 2) === 0
                  ? [
                    sub(p, p12, p2, p32),
                    block(p0, p01, p, p03, r),
                    block(p01, p1, p12, p, r),
                    block(p03, p, p32, p3, r)
                  ]
                  : [
                    block(p0, p01, p, p03, r),
                    block(p01, p1, p12, p, r),
                    block(p, p12, p2, p32, r),
                    block(p03, p, p32, p3, r)
                  ]],
              [true, () => 
                [
                  block(p0, p01, p, p03, r),
                  block(p01, p1, p12, p, r),
                  block(p, p12, p2, p32, r),
                  block(p03, p, p32, p3, r)
                ]]]);
}

const us = sequence.division(0, l, 16);
const vs = sequence.division(0, h, 45);
const quads = mapDivisions((i, j) => point.byXZ(i, j), [us, vs]);

iteraQuads(hotel, quads);

