
import React from 'react';
import THREE from 'three';
import ThreeRenderer from './ThreeRenderer.jsx';


class OrbitThreeView extends React.Component {
	constructor(props) {
		super(props);
		//Initialize state
		this._dragState = this.getInitialDragState();
		this.state = { // Position of the camera in spherical coordinates around the origin.
			latitudeDegrees: 45,
			longitudeDegrees: 45,
			distanceToCenter: 50,
			center: new THREE.Vector3(0,0,0),
			canvasSize: {
				width: 512,
				height: 512
			}
		};
		//Initialize bound methods
		this._onMouseDown = this._onMouseDown.bind(this);
		this._onMouseUp = this._onMouseUp.bind(this);
		this._onMouseMove = this._onMouseMove.bind(this);
		this._onMouseWheel = this._onMouseWheel.bind(this);
		this.updateSizeState = this.updateSizeState.bind(this);
	}
	computeCamera() {
		const xyz = (x,y,z) => { 
			let v = new THREE.Vector3(); 
			v.set(x,y,z); 
			return v; 
		};
		const m4 = new THREE.Matrix4();
		//translateDistance -> rotateLatitude -> rotateLongitude
		let transCenter = m4.clone().makeTranslation(this.state.center.x, this.state.center.y, this.state.center.z),
			transDist = m4.clone().makeTranslation(0,0,this.state.distanceToCenter),
			rotLat = m4.clone().makeRotationAxis(xyz(1,0,0), -(this.state.latitudeDegrees/180.0)*Math.PI),
			rotLong = m4.clone().makeRotationAxis(xyz(0,1,0), -(this.state.longitudeDegrees/180.0)*Math.PI);
		let cameraWorldMatrix = m4.multiply(transCenter).multiply(rotLong).multiply(rotLat).multiply(transDist);
		//let viewMatrix = cameraWorldMatrix.clone().getInverse();
		let aspect = this.state.canvasSize.width / this.state.canvasSize.height;
		let camera = new THREE.PerspectiveCamera(70.0/*deg*/, aspect, 0.1, 1000.0);
		camera.applyMatrix(cameraWorldMatrix);
		camera.updateMatrixWorld();
		return camera;
	}
	getInitialDragState() {
			return {
				dragging: false,
				mode: null,
				lastPos: null
			};
	}
	_onMouseDown(e) {
		//begin drag
		this._dragState.dragging = true;
		this._dragState.mode = e.button === 1 ? "pan" : "rotate";
		this._dragState.lastPos = [e.screenX, e.screenY];
		//add mousemove and mouseup to document
		document.addEventListener("mousemove", this._onMouseMove);
		document.addEventListener("mouseup", this._onMouseUp);
	}
	_onMouseMove(e) {
		//update drag
		//compute delta
		let lastPos = this._dragState.lastPos,
			curPos = [e.screenX, e.screenY];
		let deltaPos = curPos.map((_,i)=>curPos[i]-lastPos[i]);
		if (this._dragState.mode === "rotate"){
			//convert delta to latlong
			let latLongDelta = deltaPos.map(d=>d*0.5);
			//update state
			this.setState({
				latitudeDegrees: this.state.latitudeDegrees + latLongDelta[1],
				longitudeDegrees: this.state.longitudeDegrees + latLongDelta[0]
			});
		} else {
			const {canvasSize, center} = this.state;
			let scaledDeltaPos = [deltaPos[0]/canvasSize.width, deltaPos[1]/canvasSize.height];
			let newCenter = center.clone().add(new THREE.Vector3(-scaledDeltaPos[0], 0, scaledDeltaPos[1]));
			this.setState({center: newCenter});
		}
		this._dragState.lastPos = curPos;
	}
	_onMouseUp(e) {
		//finish drag
		this._dragState.dragging = false;
		this._dragState.startPos = null;
		this._dragState.currPos = null;
		//remove mousemove and mouseup from document
		document.removeEventListener("mousemove", this._onMouseMove);
		document.removeEventListener("mouseup", this._onMouseUp);
	}
	_onMouseWheel(e) {
		e.preventDefault();
		//change distance to center
		//console.log(e.deltaMode);
		//console.log(e.deltaX, e.deltaY, e.deltaZ);
		// Avoid that the camera goes past the center.
		// TODO: Decrease the amount exponentially with the closeness to the center.
		// TODO: Use THREE.OrbitControls instead. Pretend that it is immutable.
		let deltaWeight = 1/100.0;
		let candidateDistance = this.state.distanceToCenter + e.deltaY*deltaWeight;
		this.setState({
			distanceToCenter: Math.max(0.0, candidateDistance)
		});
	}
	onContextMenu(contextMenuEvent) {
		contextMenuEvent.preventDefault();
	}
	componentDidMount() {
		window.addEventListener("resize", this.updateSizeState);
		this.updateSizeState();
	}
	componentWillUnmount() {
		window.removeEventListener("resize", this.updateSizeState);
	}
	updateSizeState() {
		const {width, height} = this.refs["anchor"].getBoundingClientRect();
		this.setState({
			canvasSize: {width, height}
		});
	}
	getCurrentCamera() {
		return this.computeCamera();
	}
	render() {
		return (
			<div 
				ref="anchor"
				onMouseDown={this._onMouseDown} 
				onWheel={this._onMouseWheel}
				onContextMenu={this.onContextMenu}>
				<ThreeRenderer 
					width={this.state.canvasSize.width} 
					height={this.state.canvasSize.height} 
					scene={this.props.scene} 
					camera={this.computeCamera()} />
			</div>
		);
	}
}

export default OrbitThreeView;
