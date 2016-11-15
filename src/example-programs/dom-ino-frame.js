
const {map, division, cartesianProduct, count} = sequence;
const {compose} = functional;

const floors = 3;
const floorWidth = 13.0;
const floorDepth = 7.0;
const floorToCeiling = 2.5;
const slabHeight = 0.3;
const stairWidth = 1.0;
const stairStepNum = 18;

//columns + foundations
const spacesBetweenColumns = 3;
const backColumnDistanceToEdge = 0.20;
const frontColumnDistanceToEdge = 0.4;
const columnToSide = 0.20;
const columnSide = 0.20;
const foundationSide = 1.0;
const foundationHeight = 0.5;

domIno();

function domIno() {
  return [
    slabs(),
    columns(),
    stairs()
  ];
}


function slabs() {
  let floorSlab = [
    box.byCorners([ // living area portion
      point.byXYZ(0, 0, 0),
      point.byXYZ(floorWidth, floorDepth, slabHeight)
    ]),
    box.byCorners([ // stair landing extension
      point.byXYZ(floorWidth, 0, 0),
      point.byXYZ(floorWidth + stairWidth, stairWidth, slabHeight)
    ]),
    box.byCornerXYZ( // stair landing
        point.byXYZ(floorWidth, stairWidth, 0),
        [2*stairWidth, stairWidth, slabHeight])
  ];
  return map(
    i => translate(floorSlab).byZ(i*(slabHeight + floorToCeiling)),
    count(floors + 1));
}


function columns() {
  let backColumnPositions = map(
    ([x, y]) => point.byXY(x,y),
    cartesianProduct(
      division(columnToSide, floorWidth - columnToSide, spacesBetweenColumns),
      [backColumnDistanceToEdge]));
  let frontColumnPositions = map(
    ([x, y]) => point.byXY(x,y),
    cartesianProduct(
      division(columnToSide, floorWidth - columnToSide, spacesBetweenColumns),
      [floorDepth - frontColumnDistanceToEdge]));
  return [
    map(column, backColumnPositions),
    map(column, frontColumnPositions)
  ];
}

function column(pos) {
  const height = slabHeight + (slabHeight + floorToCeiling)*floors;
  return [
    box.byBottomWidthHeightZ(pos, [columnSide, columnSide], height),
    box.byCentersWidthHeight(
      [pos, point.subZ(pos, foundationHeight)],
      [foundationSide, foundationSide])
  ];
}


function stairs() {
  return map(
    i => translate(
      uShapedStairs(
        stairWidth,
        stairStepNum,
        stairWidth,
        stairStepNum*0.15,
        floorToCeiling + slabHeight))
      .byXYZ(floorWidth, 2*stairWidth, slabHeight + i*(slabHeight + floorToCeiling)),
    count(floors))
}

function straightStairs(width, runLength, riseHeight, steps) {
  const stepLength = runLength/steps;
  const stepHeight = riseHeight/steps;
  const translateVector = vector.byYZ(stepLength, stepHeight);
  const bottomLeftCorner = point.byXYZ(0, 0, 0);
  const topRightCorner = point.byXYZ(width, stepLength, stepHeight);
  const stepsGeom = map(i =>
    box.byCorners([
      point.add(bottomLeftCorner, vector.scale(translateVector, i)),
      point.add(topRightCorner, vector.scale(translateVector, i))
    ]),
    count(steps));
  const underneathAngle = Math.atan2(stepHeight, stepLength);
  const underneathHeight = stepLength*Math.sin(underneathAngle);
  const underneathLength = (steps - 1)*stepLength/Math.cos(underneathAngle);
  const underneath = compose(
    translate.byXYZ(0, stepLength, 0),
    rotate.aroundXByAngle(underneathAngle)
  )(box.byCornerXYZ(point.byXYZ(0,0,0), [width, underneathLength, underneathHeight]));
  return [
    stepsGeom,
    underneath
  ];
}

function uShapedStairs(flightWidth, steps, turnStepLength, straightLength, riseHeight) {
  const stepHeight = riseHeight/steps;
  const straightStepsNum = steps - 1;
  const bottomStepsNum = Math.floor(straightStepsNum/2);
  const topStepsNum = Math.ceil(straightStepsNum/2);
  const bottomRiseHeight = stepHeight*bottomStepsNum;
  const topRiseHeight = stepHeight*topStepsNum;

  const bottomFlight = straightStairs(flightWidth, straightLength, bottomRiseHeight, bottomStepsNum);
  const turnStep = box.byCorners([
    point.byXYZ(0, straightLength, bottomRiseHeight),
    point.byXYZ(
      2*flightWidth,
      straightLength + turnStepLength,
      bottomRiseHeight + stepHeight)
  ]);
  const topFlight = compose(
    translate.byXYZ(2*flightWidth, straightLength, bottomRiseHeight + stepHeight),
    rotate.aroundZByAngle(Math.PI)
  )(straightStairs(flightWidth, straightLength, topRiseHeight, topStepsNum));

  return [
    bottomFlight,
    turnStep,
    topFlight
  ];
}
