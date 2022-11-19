
const {map, cartesianProduct, division} = sequence;

const buildingLength = 90.600,
  buildingWidth = 33.600,
  buildingHeight = 13.500,
  buildingFloors = 4,
  slabHeight = 0.500,
  columnWidth = 0.600,
  barThickness = 0.200;

function floorPlans() {
  let slab = translate(
    box.byWidthHeightDepth(buildingLength, buildingWidth, slabHeight)
  ).byZ(slabHeight*0.5);
  return map(translate(slab).byZ,
    division(0, buildingHeight, buildingFloors));
}

floorPlans();

function columns(n, m) {
  let column = translate(
    box.byWidthHeightDepth(columnWidth, columnWidth, buildingHeight))
    .byZ(buildingHeight*0.5);
  let cols = map(
    ([x,y])=>translate(column).byXYZ(x, y, 0),
    cartesianProduct(
      division(0, buildingLength - columnWidth, n),
      division(0, buildingWidth - columnWidth, m)));
  return translate(cols)
    .byXYZ(
      -(buildingLength - columnWidth)*0.5,
      -(buildingWidth - columnWidth)*0.5,
      0);
}

columns(11, 6);

function facade(length, height, n, m) {
  let elementLength = length/n,
    elementHeight = height/m;
  return map(
    ([r, z])=>
        translate(
          facadeElement(elementLength, elementHeight,
            2.000 + (1.000*Math.cos((z*(1.0/height)*2*Math.PI) + (r*(1.0/length)*4*Math.PI))))
        ).byXYZ(r, 0, z + elementHeight/2.0),
    cartesianProduct(
      division(0, length - elementLength, n),
      division(0, height - elementHeight, m)));
}

function facadeElement(width, height, dist) {
  let e = height/2.0;
  let p = point.byXYZ(0,0,0);
  let b1, b2;
  {
    let p0 = p,
      p1 = point.add(p, vector.byXYZ(width/2.0, -dist, 0));
    let v = vector.normalized(point.sub(p1, p0));
    let pa = point.add(p0, vector.scale(v, -e/2)),
      pb = point.add(p1, vector.scale(v, e/2));
    b1 = box.byCentersWidthHeight([pa, pb], [e, e]);
  }
  {
    let p0 = point.add(p, vector.byXYZ(width, 0, e)),
      p1 = point.add(p, vector.byXYZ(width/2.0, -dist, e));
    let v = vector.normalized(point.sub(p1, p0));
    let pa = point.add(p0, vector.scale(v, -e/2)),
      pb = point.add(p1, vector.scale(v, e/2));
    b2 = box.byCentersWidthHeight([pa, pb], [e, e]);
  }
  return [b1, b2];
}

function facades(length, width, height, n0, n1, m) {
  function rotateMove(obj, vec, angle) {
    return translate(rotate(obj).aroundZByAngle(angle)).byVector(vec);
  }
  return [
    rotateMove(
      facade(length, height, n0, m),
      vector.byXYZ(-length/2, -width/2, 0),
      0),
    rotateMove(
      facade(width, height, n1, m),
      vector.byXYZ(length/2, -width/2, 0),
      Math.PI/2),
    rotateMove(
      facade(length, height, n0, m),
      vector.byXYZ(length/2, width/2, 0),
      Math.PI),
    rotateMove(
      facade(width, height, n1, m),
      vector.byXYZ(-length/2, width/2, 0),
      3*Math.PI/2)
  ];
}

facades(buildingLength, buildingWidth, buildingHeight, 50, 20, 40);
