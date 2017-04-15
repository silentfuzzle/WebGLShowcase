// Emily Palmieri
// CSCI 491
// Project 2
// 12-8-2014

// Code adapted from Eric Haines' unit5-ps_cylinder_exercise.js

/*global THREE, Coordinates, document, window, dat, $*/
var camera, scene, renderer;
var cameraControls, effectController, gui;
var clock = new THREE.Clock();
var gridX = true;
var gridY = true;
var gridZ = true;
var axes = true;
var ground = true;

var ikLimb, ikLimbBuilder;

///////////////////////////////////////////////////////////////////////////////
//Scene creation methods
///////////////////////////////////////////////////////////////////////////////

// Fill the scene with objects and lights
function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );

	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -500, 250, -200 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);
    
    // BUILD IK LIMB
	if (ikLimb == null) {
	    ikLimbBuilder = new IKLimbBuilder();
	    ikLimb = ikLimbBuilder.buildLimb();
	}
	else {
		ikLimbBuilder.rebuildLimb(ikLimb);
	}
	
    scene.add(ikLimb.root);
    
    // Add grid lines
    drawHelpers();
}

// Add requested grid lines to the scene
function drawHelpers() {
	if (ground) {
		Coordinates.drawGround({size:10000});
	}
	if (gridX) {
		Coordinates.drawGrid({size:10000,scale:0.01});
	}
	if (gridY) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});
	}
	if (gridZ) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});
	}
	if (axes) {
		Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});
	}
}

///////////////////////////////////////////////////////////////////////////////
//Initialization methods
///////////////////////////////////////////////////////////////////////////////

// Initialize the application
function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.autoClear = false;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 10000 );
	camera.position.set( -528, 513, 92 );
	// CONTROLS
	cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
	cameraControls.target.set(0,200,0);

}

// Setup the controls in the upper right
function setupGui() {
	effectController = {
		newGridX: gridX,
		newGridY: gridY,
		newGridZ: gridZ,
		newGround: ground,
		newAxes: axes
	};

	gui = new dat.GUI();
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
    
    ikLimb.buildController(gui);
}

//Adds the scene to the web page
function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

///////////////////////////////////////////////////////////////////////////////
//Animation methods
///////////////////////////////////////////////////////////////////////////////

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	if ( effectController.newGridX !== gridX || 
        effectController.newGridY !== gridY || 
        effectController.newGridZ !== gridZ || 
        effectController.newGround !== ground || 
        effectController.newAxes !== axes)
	{
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		fillScene();
	}
    
    ikLimb.update(ikLimbBuilder.makeLengthAngleAxisTransform);
    
	renderer.render(scene, camera);
}

// Run the application
init();
fillScene();
setupGui();
addToDOM();
animate();

