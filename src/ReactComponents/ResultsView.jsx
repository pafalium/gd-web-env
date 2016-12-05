
import React from 'react';
import OrbitThreeView from './OrbitThreeView.jsx';
import {ProgramResults} from '../Runner/run.js';
import toThree from '../SceneGraph/to-three.js';
import THREE from 'three';
import {noop, isEqual, difference, flatten, map, forEach,
				throttle} from 'lodash';

import time from '../utils/time.js';

//8888888b.                            888 888            888     888 d8b                        
//888   Y88b                           888 888            888     888 Y8P                        
//888    888                           888 888            888     888                            
//888   d88P .d88b.  .d8888b  888  888 888 888888 .d8888b Y88b   d88P 888  .d88b.  888  888  888 
//8888888P" d8P  Y8b 88K      888  888 888 888    88K      Y88b d88P  888 d8P  Y8b 888  888  888 
//888 T88b  88888888 "Y8888b. 888  888 888 888    "Y8888b.  Y88o88P   888 88888888 888  888  888 
//888  T88b Y8b.          X88 Y88b 888 888 Y88b.       X88   Y888P    888 Y8b.     Y88b 888 d88P 
//888   T88b "Y8888   88888P'  "Y88888 888  "Y888  88888P'    Y8P     888  "Y8888   "Y8888888P"  
//                                                                                               
//                                                                                               
//                                                                                               

class ResultsView extends React.Component {
	/*
		Responsibility: 
			Display a controlable 3D view containing program results to the user; 
			Render 3D objects which may have decorations applied;
			Provide hooks to react to what is pointed.
		Props:
			- results: a list of the top level results of a program
			- resultDecorations: a list of decorations to change appearence of some result instances
			- onHoveredResultInstance: a function to be called when the current hovered result instance changes
		State:
			- threeConvertedResults {ThreeConvertedResults}
			- handleMouseMove {Function} either noop or detect result instance below mouse
	*/
	constructor(props) {
		super(props);
		//Initialize bound methods.
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.performPicking = this.performPicking.bind(this);
		this.schedulePicking = throttle(this.performPicking, 100/*msec*/);
		//Initialize state.
		this.initializeResultDecorations();
		this.state = this.computeState({}, props);
	}

	componentWillReceiveProps(newProps) {
		const oldProps = this.props;
		this.setState(this.computeState(oldProps, newProps));
	}

	computeState(oldProps, newProps) {
		// Compute threeObjects and relations between threeObjects and results.
		let shouldComputeObjects = oldProps.results !== newProps.results;
		let programResults = newProps.results.results.topLevelExprResults.values();
		let threeConvertedResults = shouldComputeObjects
			? time("three convertion", () => toThree.convert.keepingCorrespondence(programResults))
			: this.state.threeConvertedResults;

		// Apply resultInstance decorations.
		let shouldUpdateDecorations = oldProps.resultDecorations !== newProps.resultDecorations
		if(shouldUpdateDecorations) {
			this.updateResultDecorations(threeConvertedResults, newProps.resultDecorations);
		}
		// Return the new complete state.
		let shouldHandleHovers = !!newProps.onHoveredResultInstance;
		return {
			threeConvertedResults,
			handleMouseMove: shouldHandleHovers 
				? this.handleMouseMove
				: noop
		};
	}

	computeThreeScene() {
		let scene = new THREE.Scene();
		scene.add(
			this.computeStaticThreeObjects(), 
			this.computeResultInstanceThreeObjects());// or threeConvertedResults.getObjects()
		return scene;
	}

	computeResultInstanceThreeObjects() {
		// create three objects for the results
		let threeObjects = this.state.threeConvertedResults.threeObjects;
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

	initializeResultDecorations() {
		this.decorationToObjects = new Map();
		this.objectToOldMaterial = new WeakMap();
	}

	updateResultDecorations(threeConvertedResults, decorations) {
		//threeConvertedResults.addDecoration()
		//threeConvertedResults.removeDecoration()

		const decorationToObjects = this.decorationToObjects;
		const objectToOldMaterial = this.objectToOldMaterial;

		let prevDecorations = Array.from(decorationToObjects.keys());
		let enteringDecorations = difference(decorations, prevDecorations);
		let leavingDecorations = difference(prevDecorations, decorations);

		forEach(leavingDecorations, d=>{
			//Restore decoration's objects materials.
			forEach(decorationToObjects.get(d), obj=>{
				obj.material = objectToOldMaterial.get(obj);
			});
			//Clear decorationToObjects entry.
			decorationToObjects.delete(d);
		});

		forEach(enteringDecorations, d=>{
			//Get objects affected by decoration.
			let decMeshes = flatten(
				map(
					threeObjectsForDecoration(d, threeConvertedResults), 
					getMeshes)
			);
			//Add decorationToObjects entry.
			decorationToObjects.set(d, decMeshes);
			//Save decoration's objects original materials.
			forEach(decMeshes, mesh=>{
				if(!objectToOldMaterial.has(mesh)) {
					objectToOldMaterial.set(mesh, mesh.material);
				}
			});
			//Set affected objects' materials to the one from the decoration.
			let decMaterial = decorationMaterial(d);
			forEach(decMeshes, mesh=>{
				mesh.material = decMaterial;
			});
		});
	}
	
	//8888888b.  d8b          888      d8b                   
	//888   Y88b Y8P          888      Y8P                   
	//888    888              888                            
	//888   d88P 888  .d8888b 888  888 888 88888b.   .d88b.  
	//8888888P"  888 d88P"    888 .88P 888 888 "88b d88P"88b 
	//888        888 888      888888K  888 888  888 888  888 
	//888        888 Y88b.    888 "88b 888 888  888 Y88b 888 
	//888        888  "Y8888P 888  888 888 888  888  "Y88888 
	//                                                   888 
	//                                              Y8b d88P 
	//                                               "Y88P"  

	handleMouseMove(mouseMoveEvent) {
		let coords = mouseEventNormalizedDeviceCoords(mouseMoveEvent);
		this.schedulePicking(coords);
	}

	performPicking(normDevCoords) {
		let objectBelowMouse = pickClosest(normDevCoords, this.getCamera(), this.state.threeConvertedResults.threeObjects);
		let path = buildResultInstancePath(objectBelowMouse, this.state.threeConvertedResults.threeObjectToResult);
		this.props.onHoveredResultInstance({
			resultInstance: path[0],
			path
		});
	}

	//8888888b.                        888                  
	//888   Y88b                       888                  
	//888    888                       888                  
	//888   d88P .d88b.  88888b.   .d88888  .d88b.  888d888 
	//8888888P" d8P  Y8b 888 "88b d88" 888 d8P  Y8b 888P"   
	//888 T88b  88888888 888  888 888  888 88888888 888     
	//888  T88b Y8b.     888  888 Y88b 888 Y8b.     888     
	//888   T88b "Y8888  888  888  "Y88888  "Y8888  888     
	//                                                      
	//                                                      
	//                                                      

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

//88888888888 888                                     .d88888b.  888       d8b          
//    888     888                                    d88P" "Y88b 888       Y8P          
//    888     888                                    888     888 888                    
//    888     88888b.  888d888 .d88b.   .d88b.       888     888 88888b.  8888 .d8888b  
//    888     888 "88b 888P"  d8P  Y8b d8P  Y8b      888     888 888 "88b "888 88K      
//    888     888  888 888    88888888 88888888      888     888 888  888  888 "Y8888b. 
//    888     888  888 888    Y8b.     Y8b.          Y88b. .d88P 888 d88P  888      X88 
//    888     888  888 888     "Y8888   "Y8888        "Y88888P"  88888P"   888  88888P' 
//                                                                         888          
//                                                                        d88P          
//                                                                      888P"           

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

//8888888b.                          d88P 88888888888 888                               
//888   Y88b                        d88P      888     888                               
//888    888                       d88P       888     888                               
//888   d88P .d88b.  .d8888b      d88P        888     88888b.  888d888 .d88b.   .d88b.  
//8888888P" d8P  Y8b 88K         d88P         888     888 "88b 888P"  d8P  Y8b d8P  Y8b 
//888 T88b  88888888 "Y8888b.   d88P          888     888  888 888    88888888 88888888 
//888  T88b Y8b.          X88  d88P           888     888  888 888    Y8b.     Y8b.     
//888   T88b "Y8888   88888P' d88P            888     888  888 888     "Y8888   "Y8888  
//                                                                                      
//                                                                                      
//                                                                                      

/**
	@typedef ThreeConvertedResults
	@type {object}
	@property {Array.<ProgramResult>} results
	@property {Array.<THREE.Object3D>} threeObjects
	@property {Map<ProgramResult,Array.<THREE.Object3D>>} resultToThreeObjects
	@property {Map<THREE.Object3D,ProgramResult>} threeObjectToResult
*/
/*
 ThreeConvertedResults: Holds all data from converting a set of ProgramResults
 	to a set of THREE.Object3D.
 */


/**
	@param {THREE.Object3D} threeObject
	@param {Map<THREE.Object3D,ProgramResult>} threeObjToResult
	@returns {Array.<ProgramResult>}
*/
function buildResultInstancePath(threeObject, threeObjToResult) {
	//build the chain of results up to the top level result.
	return parentChain(threeObject)
		.filter(o=>threeObjToResult.has(o))
		.map(o=>threeObjToResult.get(o));
}

/**
	@param {THREE.Vector2} coord Ray origin in normalized device coordinates.
	@param {THREE.Camera} camera
	@param {Array<THREE.Object3D>} threeObjects
	@returns {?THREE.Object3D}
*/
function pickClosest(coords, camera, threeObjects) {
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(coords, camera);
	const intersections = raycaster.intersectObjects(threeObjects, true/*recursive*/);
	return intersections.length > 0
		? intersections[0].object
		: null;
}

/**
	@param {ResultDecoration} dec
	@param {ThreeConvertedResults} threeConvertedResults
	@returns {Array.<THREE.Object3D>}
 */
function threeObjectsForDecoration(dec, {threeObjects, resultToTHREEObjects, threeObjectToResult}) {
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

	function threeObjectsFromResult(result) {
		return resultToTHREEObjects.get(result);
	}

	if (dec instanceof ResultInstanceDecoration) {
		return threeObjectsFromPath(dec.path);
	} else if (dec instanceof ResultOcorrencesDecoration) {
		return threeObjectsFromResult(dec.result);
	} else {
		throw new Error("Unknown ResultDecoration type.");
	}
}

//8888888b.                                            888    d8b                            
//888  "Y88b                                           888    Y8P                            
//888    888                                           888                                   
//888    888  .d88b.   .d8888b .d88b.  888d888 8888b.  888888 888  .d88b.  88888b.  .d8888b  
//888    888 d8P  Y8b d88P"   d88""88b 888P"      "88b 888    888 d88""88b 888 "88b 88K      
//888    888 88888888 888     888  888 888    .d888888 888    888 888  888 888  888 "Y8888b. 
//888  .d88P Y8b.     Y88b.   Y88..88P 888    888  888 Y88b.  888 Y88..88P 888  888      X88 
//8888888P"   "Y8888   "Y8888P "Y88P"  888    "Y888888  "Y888 888  "Y88P"  888  888  88888P' 
//                                                                                           
//                                                                                           
//                                                                                           


class ResultDecoration {}

class ResultInstanceDecoration extends ResultDecoration {
	constructor(path, color) {
		super();
		this.path = path;
		this.color = color;
	}
}

class ResultOcorrencesDecoration extends ResultDecoration {
	constructor(result, color) {
		super();
		this.result = result;
		this.color = color;
	}
}

function makeResultInstanceDecoration(path, color) {
  return new ResultInstanceDecoration(path, color);
}
function makeResultOcorrencesDecoration(result, color) {
  return new ResultOcorrencesDecoration(result, color);
}

function decorationMaterial(decoration) {
	let mat = new THREE.MeshPhongMaterial();
	mat.emissive.set(decoration.color);
	mat.transparent = true;
	mat.opacity = 0.9;
	mat.depthTest = false;
	mat.depthWrite = false;
	mat.side = THREE.DoubleSide;
	return mat;
}

//888b     d888 d8b                   
//8888b   d8888 Y8P                   
//88888b.d88888                       
//888Y88888P888 888 .d8888b   .d8888b 
//888 Y888P 888 888 88K      d88P"    
//888  Y8P  888 888 "Y8888b. 888      
//888   "   888 888      X88 Y88b.    
//888       888 888  88888P'  "Y8888P 
//                                    
//                                    
//                                    

function mouseEventNormalizedDeviceCoords(mouseEvent) {
	let {offsetX, offsetY} = mouseEvent.nativeEvent;
	let {width, height} = mouseEvent.target.getBoundingClientRect();
	let res = new THREE.Vector2(
		(offsetX / width) * 2 - 1,
		-(offsetY / height) * 2 + 1);
	return res;
}


//8888888888                                    888    
//888                                           888    
//888                                           888    
//8888888    888  888 88888b.   .d88b.  888d888 888888 
//888        `Y8bd8P' 888 "88b d88""88b 888P"   888    
//888          X88K   888  888 888  888 888     888    
//888        .d8""8b. 888 d88P Y88..88P 888     Y88b.  
//8888888888 888  888 88888P"   "Y88P"  888      "Y888 
//                    888                              
//                    888                              
//                    888                              

export {makeResultInstanceDecoration, makeResultOcorrencesDecoration};
export default ResultsView;



ResultsView.propTypes = {
	onHoveredResultInstance: React.PropTypes.func,
	results: React.PropTypes.instanceOf(ProgramResults),
	resultDecorations: React.PropTypes.arrayOf(React.PropTypes.instanceOf(ResultDecoration))
};
