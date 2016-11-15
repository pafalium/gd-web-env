
const {
  map, reduce, zip, intervalDivision, 
  drop, dropRight, concat, interleave } = sequence;

const mapInInterval = (fn, a, b, n) =>
  map(fn, intervalDivision(a, b, n));
const enumerateN = mapInInterval;
const enumerateMN = function(fn, u1, u2, m, v1, v2, n) {
  return enumerateN((u) =>
    enumerateN((v) => fn(u, v), v1, v2, n),
    u1, u2, m);
};
const distance = (p1, p2) => vector.length(point.pointMinusPoint(p2, p1));



function trussKnots(pts, radius) {
  return map((pt) => sphere.byCenterRadius(pt, radius), pts);
}

function trussBars(ps, qs, radius) {
  return map(([p, q]) => cylinder.byCentersRadius([p, q], radius), zip(ps, qs));
}

function spatialTruss(curves, knotRadius, barRadius) {
  let as = curves[0];
  let bs = curves[1];
  let cs = curves[2];

  return [
    trussKnots(as, knotRadius),
    trussKnots(bs, knotRadius),
    trussBars(as, cs, barRadius),
    trussBars(bs, dropRight(as, 1), barRadius),
    trussBars(bs, dropRight(cs, 1), barRadius),
    trussBars(bs, drop(as, 1), barRadius),
    trussBars(bs, drop(cs, 1), barRadius),
    trussBars(drop(as, 1), dropRight(as, 1), barRadius),
    trussBars(drop(bs, 1), dropRight(bs, 1), barRadius),
    curves.length === 3 ?
      [
        trussKnots(cs, knotRadius),
        trussBars(drop(cs, 1), dropRight(cs, 1), barRadius)
      ]
      : [
        trussBars(bs, curves[3], barRadius),
        spatialTruss(drop(curves, 2), knotRadius, barRadius)
      ]
  ];
}



function crossProducts(vecs) {
  let crosses = map(([v1, v2]) => vector.cross(v1, v2),
    zip(vecs, drop(vecs, 1)));
  return reduce((vec, prev) => vector.add(vec, prev),
    crosses, vector.byXYZ(0, 0, 0));
}

function polygonNormal(pts) {
  let loopedPts = concat(pts, [pts[0]]);
  let sideVecs = map(([p1, p2]) => point.pointMinusPoint(p2, p1),
    zip(loopedPts, drop(loopedPts, 1)));
  return vector.scale(
    vector.normalized(
      crossProducts(sideVecs)),
    -1);
}

function midCoord(c1, c2) {
  // This is an hack since c1 and c2 should be points.
  // The result of vector.add will be (x,y,z,2) which is invalid.
  // On top of computing the middle coordinates, vector.scale also corrects the invalid value.
  return vector.scale(vector.add(c1, c2), 0.5);
}

function quadCenter(c1, c2, c3, c4) {
  return midCoord(midCoord(c1, c2), midCoord(c3, c4));
}

function quadNormal(c1, c2, c3, c4) {
  return polygonNormal([c1, c2, c3, c4]);
}

function quadPyramidApex(c1, c2, c3, c4) {
  let h = (distance(c1, c2) + distance(c2, c3)
    + distance(c3, c4) + distance(c4, c1))/(4*Math.sqrt(2));
  return vector.add(
    quadCenter(c1, c2, c3, c4),
    vector.scale(quadNormal(c1, c2, c3, c4), h));
}

function insertPyramidApex2Curves(cs1, cs2) {
  let pts1 = cs1,
    pts2 = cs2,
    pts3 = drop(cs2, 1),
    pts4 = drop(cs1, 1);
  return map(
    ([p1, p2, p3, p4]) => quadPyramidApex(p1, p2, p3, p4),
    zip(pts1, pts2, pts3, pts4));

  /*
  let res = [];
  for (let baseIndex=0; baseIndex < cs1.length - 1; baseIndex += 1) {
    res.push(
      quadPyramidApex(
          cs1[baseIndex],
          cs2[baseIndex],
          cs2[baseIndex+1],
          cs1[baseIndex+1]));
  }
  return res;
  */
}

function insertPyramidApexCurves(curves) {
  let css1 = curves,
    css2 = drop(curves, 1);
  let apexess = map(
    ([cs1, cs2]) => insertPyramidApex2Curves(cs1, cs2),
    zip(css1, css2));
  return interleave(css1, apexess);
}

function spatialTrussInsertApex(cs) {
  let c1 = (cs[0])[0];
  let c2 = (cs[1])[0];
  let c4 = (cs[0])[1];

  let d = Math.min(distance(c1, c2), distance(c1, c4));

  let knotRadius = d/5;
  let barRadius = d/15;

  return spatialTruss(insertPyramidApexCurves(cs), knotRadius, barRadius);
}


const cylindrical = vector.byCylindrical;

function moebiusCs(r, u1, u2, m, v1, v2, n) {
  return enumerateMN(function(u, v) {
    return cylindrical(
      r*(1 + (v*Math.cos(u/2))),//radius
      u,//angle
      r*(v*Math.sin(u/2)));//z
  }, u1, u2, m, v1, v2, n);
}

function moebiusTruss(r, u1, u2, m, v1, v2, n) {
  return spatialTrussInsertApex(moebiusCs(r, u1, u2, m, v1, v2, n));
}

moebiusTruss(10, 0, Math.PI*4, 160, 0, 0.3, 10);





const add = vector.add;
const xyz = vector.byXYZ;
const spherical = vector.bySpherical;
const polar = vector.byPolar;

function arcCs(p, r, phi, psi0, psi1, n) {
  return map(psi => add(p, spherical(r, phi, psi)),
    intervalDivision(psi0, psi1, n));
}

function arcTrussCs(p, apexR, baseR, phi, psi0, psi1, e, n) {
  let dpsi = (psi1 - psi0)/n;
  return [
    arcCs(add(p, polar(e/2, phi + Math.PI/2)), apexR, phi, psi0, psi1, n),//base arc
    arcCs(p, baseR, phi, psi0 + dpsi/2, psi1 - dpsi/2, n-1),//apex arc
    arcCs(add(p, polar(e/2, phi - Math.PI/2)), apexR, phi, psi0, psi1, n)//base arc
  ];
}

function arcTruss(p, apexR, baseR, phi, psi0, psi1, e, n) {
  return spatialTruss(
    arcTrussCs(p, apexR, baseR, phi, psi0, psi1, e, n), 
    0.3, 0.1);
}


arcTruss(xyz(0,0,0), 10, 8, 0.0*Math.PI, -1.0*Math.PI/2, 1.0*Math.PI/2, 1.5, 10);





function waveTrussCs(p, apexR, baseR, l, phi, psi0, psi1, dpsi, alpha0, alpha1, dAlpha, rAmpl) {
  let n = Math.floor((psi1-psi0) / dpsi);
  //caso final - ultimo arcCs
  if(alpha0 >= alpha1) {
    return [
      arcCs(
        add(p, polar(l/2.0, phi - Math.PI/2)), 
        apexR + rAmpl * Math.sin(alpha0),
        phi, psi0, psi1, n
      )
    ];
  } else {
    return concat(
      [
        arcCs(
          add(p, polar(l/2.0, phi - Math.PI/2)),
          apexR + rAmpl * Math.sin(alpha0),
          phi, psi0, psi1, n
        ),
        arcCs(
          p, baseR + rAmpl * Math.sin(alpha0),
          phi, psi0 + dpsi/2.0, psi1 - dpsi/2.0, n
        )
      ],
      waveTrussCs(
        add(p, polar(l, phi + Math.PI/2)),
        apexR, baseR, l, phi, psi0, psi1, dpsi,
        alpha0 + dAlpha, alpha1, dAlpha, rAmpl
      )
    );
  }
}


spatialTruss(
  waveTrussCs(
    xyz(0, 0, 0), 10, 8, 1.5, 0.0*Math.PI, 
    -1.0*Math.PI/2, 1.0*Math.PI/2, 0.1*Math.PI, 
    0.0*Math.PI, 2.0*Math.PI, 0.1*Math.PI, 4.0
  ),
  0.2, 0.1
);




const {count} = sequence;

function wavyCs(p, baseR, l, phi, psi0, psi1, psiN, alpha0, alpha1, alphaN, rAmpl) {
  return map(
    ([i, alpha]) => arcCs(
      add(p, polar(i*l, phi + Math.PI/2)), 
      baseR + rAmpl*Math.sin(alpha), phi, psi0, psi1, psiN
    ),
    zip(count(alphaN), intervalDivision(alpha0, alpha1, alphaN))
  );
}

function wavyTruss(p, baseR, l, phi, psi0, psi1, psiN, alpha0, alpha1, alphaN, rAmpl) {
  return spatialTrussInsertApex(wavyCs(p, baseR, l, phi, psi0, psi1, psiN, alpha0, alpha1, alphaN, rAmpl));
}

wavyTruss(xyz(0, 0, 0),
  10, 1.5, 0.0*Math.PI,
  -1.0*Math.PI/2, 1.0*Math.PI/2, 15,
  0.0*Math.PI, 2.0*Math.PI, 30,
  4.0);
