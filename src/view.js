"use strict";

var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);

function decorateScene(scene) {
	function helperScene() {
		var axisHelper = new THREE.AxisHelper(5);
		axisHelper.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
		var gridHelper = new THREE.GridHelper(30, 1);
		var sunLight = new THREE.DirectionalLight(0xFFEEA3, 0.8);
		var hemiLight = new THREE.HemisphereLight(0x67D5EB, 0xA9C0C4, 0.2);

		gridHelper.setColors(0x888888, 0x444444);
		sunLight.position.set(1, 10, -3);

		var helper = new THREE.Scene();
		helper.add(axisHelper);
		helper.add(gridHelper);
		helper.add(sunLight);
		helper.add(hemiLight);
		return helper;
	}

	var helper = helperScene();
	var rootscene = new THREE.Scene();
	rootscene.add(helper);
	rootscene.add(scene);
	return rootscene;
}

function View(domElement) {
	//
	// Rendering and control setup
	//
	var _domElement = domElement;
	var _renderer = new THREE.WebGLRenderer();
	_domElement.appendChild(_renderer.domElement);
	var _camera = new
	THREE.PerspectiveCamera(
		70.0 /*degrees*/ ,
		1.0 / 1.0 /*width/height*/ ,
		0.1 /*near*/ ,
		1000.0 /*far*/ );
	_camera.position.set(20, 20, 20);
	_camera.lookAt(new THREE.Vector3(0, 0, 0));
	var _controls = new OrbitControls(_camera, _renderer.domElement);
	var _currentScene = new THREE.Scene();

	var draw = function draw() {
		_renderer.render(decorateScene(_currentScene), _camera);
	};

	//
	// Redraw setup
	//
	var redraw = (function() {
		var waitingForDraw = false;
		return function redraw() {
			if (!waitingForDraw) {
				waitingForDraw = true;
				requestAnimationFrame(function() {
					draw();
					waitingForDraw = false;
				});
			}
		};
	})();

	_controls.addEventListener("change", redraw);

	var resize = function resize(width, height) {
		_renderer.setSize(width, height);
		_camera.aspect = width / height;
		_camera.updateProjectionMatrix();
	};

	var refitToDomElement = function refitToDomElement() {
		resize(_domElement.clientWidth, _domElement.clientHeight);
	};

	window.addEventListener("resize", function() {
		refitToDomElement();
		redraw();
	});

	refitToDomElement();
	redraw();

	//
	// Scene displaying
	//
	var setScene = function setScene(scene) {
		_currentScene = scene;
		redraw();
	};

	this.setScene = setScene;
}

module.exports = {
	on: function(domElement) {
		return new View(domElement);
	}
};