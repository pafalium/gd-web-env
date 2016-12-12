
import React from 'react';
import ReactDOM from 'react-dom';
import THREE from 'three';
import orbtCtrls from 'three-orbit-controls';
import ThreeRenderer from './ThreeRenderer.jsx';
const OrbitControls = orbtCtrls(THREE);

class OrbitThreeView extends React.Component {
  constructor(props) {
    super(props);
    // Setup OrbitControls camera
    let canvasSize = {
      width: 512,
      height: 512
    };
    let aspect = canvasSize.width / canvasSize.height;
    let camera = new THREE.PerspectiveCamera(70.0/*deg*/, aspect, 0.1, 10000.0);
    camera.position.set(0, 0, 10);
    camera.updateMatrix();
    camera.updateMatrixWorld();
    this.ctrlsCam = camera;
    // Initialize state
    this.state = {
      canvasSize,
      camera
    };
    // Initialize bound methods
    this.updateSizeState = this.updateSizeState.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateSizeState);
    this.updateSizeState();

    let orbitControls = new OrbitControls(this.ctrlsCam, ReactDOM.findDOMNode(this.refs["anchor"]));
    orbitControls.addEventListener("change", () => {
      this.ctrlsCam.updateMatrix();
      this.ctrlsCam.updateMatrixWorld();
      this.setState({camera: this.ctrlsCam.clone()});
    });
    this.orbitControls = orbitControls;
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateSizeState);
  }

  updateSizeState() {
    const {width, height} = this.refs["anchor"].getBoundingClientRect();
    this.ctrlsCam.aspect = width / height;
    this.ctrlsCam.updateProjectionMatrix();
    this.setState({
      canvasSize: {width, height}
    });
  }

  getCurrentCamera() {
    return this.state.camera;
  }
  
  render() {
    return (
      <div ref="anchor">
        <ThreeRenderer 
          width={this.state.canvasSize.width} 
          height={this.state.canvasSize.height} 
          scene={this.props.scene} 
          camera={this.state.camera} />
      </div>
    );
  }
}

export default OrbitThreeView;
