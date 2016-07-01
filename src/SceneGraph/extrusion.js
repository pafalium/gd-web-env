
import {zip, flatten} from 'lodash';
import THREE from 'three';
import {solidMat} from './default-materials.js';

// naive version:
//   assumes extrudable has vertices property
//   assumes surface extrudable (always closed)
//   assumes standard winding (CCW)
//   assumes convex extrudable

function boundarySection(vertices) {
  return { vertices };
}

function boundarySectionsFromBoundaryVertices(vertices) {
  // duplicar vertices para cada smooth group
  // em extrusão poligonal todos os lados têm smooth group diferente
  // Note: Currenly only for a polygon surface.
  let sections = [];
  for (let sec=0; sec < vertices.length; sec++) {
    sections.push(boundarySection([
      vertices[sec], 
      vertices[(sec+1)%vertices.length]
    ]));
  }
  return sections;
}

function extrudableBoundary(extrudable) {
  const verts = extrudable.args.vertices;
  return {
    vertices: verts,
    sections: boundarySectionsFromBoundaryVertices(verts),
    addVector(vector) {
      let newVertices = this.vertices.map(v => v.clone().add(vector));
      return {
        vertices: newVertices,
        sections: boundarySectionsFromBoundaryVertices(newVertices),
        addVector: this.addVector
      };
    }
  };
}

function boundarySurfaceNormal(boundary) {
  const verts = boundary.vertices;
  let v0_1 = verts[1].clone().sub(verts[0]);
  let v0_2 = verts[2].clone().sub(verts[0]);
  return (new THREE.Vector3()).crossVectors(v0_1, v0_2);
}

function triangleFanFaces(vertexNum, reversed, offset) {
  let faces = [];
  for (let v0=0, v1=v0+1, v2=v0+2; v2 < vertexNum; v1++, v2++) {
    if (!reversed) {
      faces.push(new THREE.Face3(v0+offset, v1+offset, v2+offset));
    } else {
      faces.push(new THREE.Face3(v0+offset, v2+offset, v1+offset));
    }
  }
  return faces;
}

/*
    Generates array of THREE.Face3 for a quad strip connecting two separate
  line strips.
*/
function quadStripFaces(vertNum, reversed, offset1, offset2) {
  let faces = [];
  for (let quad=0; quad < vertNum-1; quad++) {
    let v1 = offset1 + quad, 
      v2 = offset1 + quad + 1,
      v3 = offset2 + quad + 1,
      v4 = offset2 + quad;
    if (!reversed) {
      faces.push(new THREE.Face3(v1, v2, v3));
      faces.push(new THREE.Face3(v3, v4, v1));
    } else {
      faces.push(new THREE.Face3(v1, v3, v2));
      faces.push(new THREE.Face3(v3, v1, v4));
    }
  }
  return faces;
}

function extrusionGeometry(extrudable, displacement) {
  let geom = new THREE.Geometry();
  // set vertices
  let startBoundary = extrudableBoundary(extrudable);
  let endBoundary = startBoundary.addVector(displacement);
  let startVertices = startBoundary.vertices;
  let endVertices = endBoundary.vertices;
  let startSections = startBoundary.sections;
  let endSections = endBoundary.sections;
  let sectionPairs = zip(startSections, endSections);
  let sectionPairVertices = sectionPairs.map(
    ([s1, s2]) => [...s1.vertices, ...s2.vertices]
  );
  let allSectionVertices = flatten(sectionPairVertices);

  geom.vertices = [
    ...startVertices,
    ...endVertices,
    ...allSectionVertices
  ];

  let startCapNormal = boundarySurfaceNormal(startBoundary);
  let startCapReversed = startCapNormal.dot(displacement) > 0;
  let startCapFaces = triangleFanFaces(startVertices.length, startCapReversed, 0);
  let endCapFaces = triangleFanFaces(endVertices.length, !startCapReversed, startVertices.length);

  let sectionPairStartingOffset = startVertices.length + endVertices.length;
  let sectionPairVerticeOffsets = sectionPairs
    .map(([s1, s2]) => s1.vertices.length + s2.vertices.length)
    .reduce(
      (prev, curr) => [...prev, prev[prev.length-1]+curr], 
      [sectionPairStartingOffset]
    ); // this is a scan
  let sectionPairFaces = sectionPairs.map(([s1, s2], idx) => {
    let baseOffset = sectionPairVerticeOffsets[idx];
    return quadStripFaces(s1.vertices.length, !startCapReversed, baseOffset, baseOffset+s1.vertices.length);
  });
  let sideFaces = flatten(sectionPairFaces);

  geom.faces = [
    ...startCapFaces,
    ...endCapFaces,
    ...sideFaces
  ];

  // compute normals
  geom.computeFaceNormals();
  geom.computeVertexNormals();
  // compute bounding sphere
  geom.computeBoundingSphere();
  return geom;
}

// extrude.surface
// extrude.path
function toThreeExtrusion(result) {
  const extrudable = result.args.extrudable;
  const displacement = result.args.displacement;
  let geom = extrusionGeometry(extrudable, displacement);
  let obj = new THREE.Mesh(geom, solidMat);
  return obj;
}

export {toThreeExtrusion as extrusion};
