
import React from 'react';
import OrbitThreeView from './OrbitThreeView.jsx';
import toThree from '../SceneGraph/to-three.js';
import THREE from 'three';
import {noop, isEqual} from 'lodash';

class ResultsView extends React.Component {
	/*
		Props:
			- results: a list of the top level results of a program
			- resultInstanceDecorations: a list of decorations to change appearence of some result instances
			- onHoveredResultInstance: a function to be called when the current hovered result instance changes
		State:
			- threeObjects {Array.<THREE.Object3D>}
			- resultToTHREEObjects {?Map<ProgramResult, Array.<THREE.Object3D>}
			- threeObjectToResult {?Map<THREE.Object3D, ProgramResult>}
			- handleMouseMove {Function} either noop or detect result instance below mouse
	*/
	constructor(props) {
		super(props);
		//Initialize bound methods.
		this.handleMouseMove = this.handleMouseMove.bind(this);
		//Initialize state.
		this.state = this.computeState(props);
	}
	componentWillReceiveProps(newProps) {
		this.setState(this.computeState(newProps));
	}
	computeState(props) {
		//TODO Do not recompute threeObjects if results haven't changed.
		//TODO Do not reapply decorations if the haven't changed.
		//TODO Keep record of last decorations to remove them when new ones come in.
		let shouldHandleHovers = !!props.onHoveredResultInstance;
		// Compute threeObjects and relations between threeObjects and results.
		let programResults = props.results.results.topLevelExprResults.values();
		let {
			threeObjects, 
			resultToTHREEObjects, 
			threeObjectToResult } = toThree.convert.keepingCorrespondence(programResults);
		// Apply resultInstance decorations.
		this.applyResultInstanceDecorations(threeObjects, resultToTHREEObjects, threeObjectToResult, props.resultInstanceDecorations);
		// Return the new complete state.
		return {
			threeObjects,
			resultToTHREEObjects,
			threeObjectToResult,
			handleMouseMove: shouldHandleHovers 
				? this.handleMouseMove
				: noop
		};
	}
	computeThreeScene() {
		let scene = new THREE.Scene();
		scene.add(
			this.computeStaticThreeObjects(), 
			this.computeResultInstanceThreeObjects());
		return scene;
	}
	computeResultInstanceThreeObjects() {
		// create three objects for the results
		let threeObjects = this.state.threeObjects;
		// The program's results are in Z is up coordinates.
		// They need to be rotated back into Y is up coordinates to fit OpenGL's standard.
		// We do this by rotating all results -pi/2 radians around the x axis.
		let objectGroup = new THREE.Object3D();
		objectGroup.add(new THREE.Object3D(), ...threeObjects);
		objectGroup.rotateOnAxis(new THREE.Vector3(1.0, 0.0, 0.0), -Math.PI/2.0);
		return objectGroup;
	}
	computeStaticThreeObjects() {
		// create lights
		const sunLight = new THREE.DirectionalLight(0xffffca, 0.5);
		sunLight.position.set(0.1, 1, 0.3);
		const belowLight = new THREE.DirectionalLight(0xffffca, 0.1);
		belowLight.position.set(-0.1, -1, -0.4)
		const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
		// create global coordinates helpers
		const gridHelper = new THREE.GridHelper(100, 1);
		gridHelper.setColors(0x888888, 0x444444);
		const axisHelper = new THREE.AxisHelper(5);
		axisHelper.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2.0);
		const staticRoot = new THREE.Object3D();
		staticRoot.add(sunLight, belowLight, hemiLight, gridHelper, axisHelper);
		return staticRoot;
	}
	applyResultInstanceDecorations(threeObjects, resultToTHREEObjects, threeObjectToResult, decorations) {
		function threeObjectsFromPath(path) {
			function hasAssociatedResult(threeObject) {
				return threeObjectToResult.has(threeObject);
			}
			function getResult(threeObject) {
				return threeObjectToResult.get(threeObject);
			}
			const belongsToPath = path => threeObject => {
				//threeObject parents match each path's elements three objects
				const parents = parentChain(threeObject).filter(hasAssociatedResult);
				return isEqual(parents.map(getResult), path);
			};
			let leafResult = path[0];
			let leafObjects = resultToTHREEObjects.get(leafResult);
			return leafObjects.filter(belongsToPath(path));
		}
		function decorationMaterial(decoration) {
			let mat = new THREE.MeshPhongMaterial();
			mat.emissive.set(decoration.color);
			mat.transparent = true;
			mat.opacity = 0.9;
			mat.depthTest = false;
			mat.depthWrite = false;
			return mat;
		}
		decorations.forEach(d=>{
			let material = decorationMaterial(d);
			threeObjectsFromPath(d.path)
				.map(getMeshes)
				.forEach(meshes=>{
					meshes.forEach(mesh=>{
						mesh.material = material;
					});
				});
		});
	}
	/*
		@param {THREE.Object3D} threeObject
		@returns {Array.<ProgramResult>}
	*/
	buildResultInstancePath(threeObject) {
		//build the chain of results up to the top level result.
		return parentChain(threeObject)
			.filter(o=>this.state.threeObjectToResult.has(o))
			.map(o=>this.state.threeObjectToResult.get(o));
	}
	handleMouseMove(mouseMoveEvent) {
		//discover what result instance is below the mouse
		//call the onHoveredResultInstance callback in it
		let coords = this.mouseEventNormalizedDeviceCoords(mouseMoveEvent);
		let objectBelowMouse = this.pickClosest(coords);
		let path = this.buildResultInstancePath(objectBelowMouse);
		this.props.onHoveredResultInstance({
			resultInstance: path[0],
			path
		});
	}
	mouseEventNormalizedDeviceCoords(mouseEvent) {
		let {offsetX, offsetY} = mouseEvent.nativeEvent;
		let {width, height} = mouseEvent.target.getBoundingClientRect();
		let res = new THREE.Vector2(
			(offsetX / width) * 2 - 1,
			-(offsetY / height) * 2 + 1);
		return res;
	}
	/*
		@param {THREE.Vector2} coord Ray origin in normalized device coordinates.
		@returns {?THREE.Object3D}
	*/
	pickClosest(coords) {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(coords, this.getCamera());
		const intersections = raycaster.intersectObjects(this.state.threeObjects, true/*recursive*/);
		return intersections.length > 0
			? intersections[0].object
			: null;
	}
	getCamera() {
		return this.refs["threeview"].getCurrentCamera();
	}
	render() {
		return (
			<div onMouseMove={this.state.handleMouseMove}>
				<OrbitThreeView 
					ref="threeview"
					scene={this.computeThreeScene()}/>
			</div>
		);
	}
}


function parentChain(threeObject) {
	let res = [];
	let curThreeObj = threeObject;
	while(curThreeObj) {
		res.push(curThreeObj);
		curThreeObj = curThreeObj.parent;
	}
	return res;
}
function getMeshes(threeObject) {
	let res = [];
	threeObject.traverse(obj=>{
		if(obj instanceof THREE.Mesh) {
			res.push(obj);
		}
	});
	return res;
}

class ResultInstanceDecoration {
	constructor(path, color) {
		this.path = path;
		this.color = color;
	}
}

export {ResultInstanceDecoration};
export default ResultsView;
