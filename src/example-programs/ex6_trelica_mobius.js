
const mapInInterval = (fn, a, b, n)=>
  sequence.map(fn, sequence.intervalDivision(a, b, n));
const enumerateN = mapInInterval;
const enumerateMN = function(fn, u1, u2, m, v1, v2, n) {
  return enumerateN((u)=>
    enumerateN((v)=>fn(u, v), v1, v2, n), 
    u1, u2, m);
};
const distance = (p1, p2)=>vector.length(point.pointMinusPoint(p2, p1));


function noTrelica(pt, radius) {
  return sphere.byCenterRadius(pt, radius);
}

function barraTrelica(p0, p1, radius) {
  return cylinder.byCentersRadius([p0, p1], radius);
}

function nosTrelica(pts, radius) {
  return sequence.map((pt)=>noTrelica(pt, radius), pts);
}

function barrasTrelica(ps, qs, radius) {
  return sequence.map(
    ([p, q])=>barraTrelica(p, q, radius),
    sequence.zip(ps, qs));
}

function trelica(curves, knot_radius, bar_radius) {
  var as = curves[0];
  var bs = curves[1];
  var cs = curves[2];

  var elems = [
    nosTrelica(as, knot_radius),
    nosTrelica(bs, knot_radius),
    barrasTrelica(as, cs, bar_radius),
    barrasTrelica(bs, as.slice(0, as.length-1), bar_radius),
    barrasTrelica(bs, cs.slice(0, cs.length-1), bar_radius),
    barrasTrelica(bs, as.slice(1), bar_radius),
    barrasTrelica(bs, cs.slice(1), bar_radius),
    barrasTrelica(as.slice(1), as.slice(0, as.length-1), bar_radius),
    barrasTrelica(bs.slice(1), bs.slice(0, bs.length-1), bar_radius),
    curves.length - 3 === 0 ?
        [nosTrelica(cs, knot_radius),
                 barrasTrelica(cs.slice(1), cs.slice(0, cs.length-1), bar_radius)] 
     : [barrasTrelica(bs, curves[3], bar_radius),
                 trelica(curves.slice(2), knot_radius, bar_radius)] 
    ];
  return elems;
}

function crossProducts(vecs) {
  let crosses = sequence.map(([v1, v2])=>vector.cross(v1, v2),
    sequence.zip(vecs, sequence.drop(vecs, 1)));
  return sequence.reduce((vec, prev)=>vector.add(vec, prev),
    crosses, vector.byXYZ(0, 0, 0));
}

function polygonNormal(pts) {
  let loopedPts = sequence.concat(pts, [pts[0]]);
  let sideVecs = sequence.map(([p1, p2])=>point.pointMinusPoint(p2, p1),
    sequence.zip(loopedPts, sequence.drop(loopedPts, 1)));
  return vector.scale(
    vector.normalized(
      crossProducts(sideVecs)),
    -1);
}
function midCoord(c1, c2) {
  // This is an hack since c1 and c2 should be points.
  // The result of vector.add will be (x,y,z,2) which is invalid.
  return vector.scale(vector.add(c1, c2), 0.5);
}
function quadCenter(c1, c2, c3, c4) {
  return midCoord(midCoord(c1, c2), midCoord(c3, c4));
}
function quadNormal(c1, c2, c3, c4) {
  return polygonNormal([c1, c2, c3, c4]);
}

function quadPyramidApex(c1, c2, c3, c4) {
  var h = (distance(c1, c2) + distance(c2, c3)
    + distance(c3, c4) + distance(c4, c1)) / (4 * Math.sqrt(2));
  return vector.add(
    quadCenter(c1, c2, c3, c4), 
    vector.scale(quadNormal(c1, c2, c3, c4), h));
}

function insertPyramicApex2Curves(cs1, cs2) {
  var res = [];
  for(var baseIndex=0; baseIndex < cs1.length - 1; baseIndex += 1) {
    res.push(
      quadPyramidApex(
          cs1[baseIndex], 
          cs2[baseIndex], 
          cs2[baseIndex+1], 
          cs1[baseIndex+1]));
  }
  return res;
}
function insertPyramicApexCurves(curves) {
  var res = [];
  for(var i=0; i < curves.length-1; i += 1) {
    res.push(curves[i]); 
    res.push(insertPyramicApex2Curves(curves[i], curves[i+1]));
  }
  res.push(curves[curves.length-1]);
  return res;
}
function spatialTrussInsertApex(cs) {
  var c1 = (cs[0])[0];
  var c2 = (cs[1])[0];
  var c4 = (cs[0])[1];

  var d = Math.min(distance(c1, c2), distance(c1, c4));

  var knot_radius = d / 5;
  var bar_radius = d / 15;

  return trelica(insertPyramicApexCurves(cs), knot_radius, bar_radius);
}

function moebiusCs(r, u1, u2, m, v1, v2, n) {
  return enumerateMN(function(u, v) {
    return point.byCylindrical(
      r * (1 + (v*Math.cos(u/2))),//radius
      u,//angle
      r * (v*Math.sin(u/2)));//z
  }, u1, u2, m, v1, v2, n);
}

function moebiusTruss(r, u1, u2, m, v1, v2, n) {
  return spatialTrussInsertApex(moebiusCs(r, u1, u2, m, v1, v2, n));
}

moebiusTruss(10, 0, Math.PI*4, 160, 0, 0.3, 10);
