
const buildingLength = 90.600,
  buildingWidth = 33.600,
  buildingHeight = 13.500,
  buildingFloors = 4,
  slabHeight = 0.500,
  columnWidth = 0.600,
  barThickness = 0.200;

function floorPlans() {
  var slab = move(
    box(buildingLength, buildingWidth, slabHeight), 
    0, 0, slabHeight*0.5);
  return division(0, buildingHeight, buildingFloors).map(
    h=>move(slab, 0, 0, h));
}

floorPlans();

function columns(n, m) {
  var column = move(
    box(columnWidth, columnWidth, buildingHeight),
    0, 0, buildingHeight*0.5);
  var cols = cartesianProduct(
    division(0, buildingLength-columnWidth, n),
    division(0, buildingWidth-columnWidth, m)).map(
      ([x,y])=>move(column, x, y, 0));
  return move(
    cols, 
    -(buildingLength-columnWidth)*0.5, -(buildingWidth-columnWidth)*0.5, 0);
}

columns(11, 6);

function facade(length, height, n, m) {
  let elementLength = length / n,
    elementHeight = height / m;
  return cartesianProduct(
    division(0, length-elementLength, n),
    division(0, height-elementHeight, m)).
  map(
    ([r, z])=>
      move(
        facadeElement(
          elementLength, 
          elementHeight, 
          2.000 + (1.000 * Math.cos((z*(1.0/height)*2*Math.PI)+
                                    (r*(1.0/length)*4*Math.PI)))),
      r, 0, z+elementHeight/2.0));
}

function facadeElement(width, height, dist) {
  let e = height/2.0;
  let p = xyz(0,0,0);
  let b1, b2;
  {
    let p0 = p,
      p1 = add(p, xyz(width/2.0, -dist, 0));
    let v = normalize(sub(p1, p0));
    let pa = add(p0, multScalar(v, -e/2)),
      pb = add(p1, multScalar(v, e/2));
    b1 = rightCuboid(pa, e, pb); 
  }
  {
    let p0 = add(p, xyz(width, 0, e)),
      p1 = add(p, xyz(width/2.0, -dist, e));
    let v = normalize(sub(p1, p0));
    let pa = add(p0, multScalar(v, -e/2)),
      pb = add(p1, multScalar(v, e/2));
    b2 = rightCuboid(pa, e, pb);
  }
  return [b1, b2];
}

function facades(length, width, height, n0, n1, m) {
  function moveRotate(obj, vec, angle) {
    return move(rotate(obj, xyz(0,0,1), angle), vec.x, vec.y, vec.z);
  }
  return [ 
    moveRotate(
      facade(length, height, n0, m), 
      xyz(-length/2, -width/2, 0),
      0),
    moveRotate(
      facade(width, height, n1, m), 
      xyz(length/2, -width/2, 0),
      Math.PI/2),
    moveRotate(
      facade(length, height, n0, m), 
      xyz(length/2, width/2, 0),
      Math.PI),
    moveRotate(
      facade(width, height, n1, m), 
      xyz(-length/2, width/2, 0),
      3*Math.PI/2)
  ];
}

facades(buildingLength, buildingWidth, buildingHeight, 50, 20, 40);

function rightCuboid(p1, r, p2) {
  var newAxis = normalize(sub(p2, p1));
  var rotAxis = normalize(cross(xyz(0, 0, 1), newAxis));
  var rotAngle = Math.acos(dot(xyz(0, 0, 1), newAxis));
  var height = length(sub(p2, p1));
  var b = move(box(r, r, height), 0, 0, height/2.0);
  return move(rotate(b, rotAxis, rotAngle), p1.x, p1.y, p1.z);
}
