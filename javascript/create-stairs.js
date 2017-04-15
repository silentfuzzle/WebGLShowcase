//Emily Palmieri
//Icosahedron
//2014

/*global THREE, Coordinates, $, document, window, dat*/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

var generatorMethod = 0;
var initialized = false;

///////////////////////////////////////////////////////////////////////////////
//Icosahedron creation methods
///////////////////////////////////////////////////////////////////////////////

var triangles = [
[0,4,1], [0,9,4], [9,5,4], [4,5,8], [4,8,1],
[8,10,1], [8,3,10], [5,3,8], [5,2,3], [2,7,3],
[7,10,3], [7,6,10], [7,11,6], [11,0,6], [0,1,6],
[6,1,10], [9,0,11], [9,11,2], [9,2,5], [7,2,11] ];

// Creates an Icosohedron using a basic Geometry object
function createIcosahedron0() {
    var cupMaterial = new THREE.MeshLambertMaterial( { color: 0xFDD017 });
	var icosahedronGeo = new THREE.Geometry();
    
    var vdata = calculateVData(200);
    for (v in vdata) {
        icosahedronGeo.vertices.push(new THREE.Vector3( vdata[v][0], vdata[v][1],vdata[v][2] ));
    }
    
    // Flip two of the vertex numbers in each defined face so that the proper faces are culled
    for (t in triangles) {
        icosahedronGeo.faces.push(new THREE.Face3(triangles[t][0], triangles[t][2], triangles[t][1] ));
    }
    
    icosahedronGeo.computeFaceNormals();
    icosahedronGeo.computeVertexNormals();
    
    addIcosahedron(icosahedronGeo, cupMaterial);
}

// Creates an Icosahedron using the Icosahedron Geometry class
function createIcosahedron1() {
	var cupMaterial = new THREE.MeshLambertMaterial( { color: 0xFDD017});
    var icosahedronGeo = new THREE.IcosahedronGeometry(200, 0);
    addIcosahedron(icosahedronGeo, cupMaterial);
}

// Creates an Icosahedron using the Polyhedron Geometry class
function createIcosahedron2() {
	var cupMaterial = new THREE.MeshLambertMaterial( { color: 0xFDD017});

    // vdata is scaled in the negative direction so that the icosahedron is drawn right side up
    // with the shadow beneath the object and the proper faces are culled
    var vdata = calculateVData(-1);
    var icosahedronGeo = new THREE.PolyhedronGeometry(vdata, triangles, 200, 0);
    addIcosahedron(icosahedronGeo, cupMaterial);
}

// Adds an icosahedron to the scene at the top of the stairs
function addIcosahedron(geometry, material) {
    var icosahedron = new THREE.Mesh(geometry, material);
    icosahedron.position.x = 0;
    icosahedron.position.y = 1725;
    icosahedron.position.z = 1925;
    scene.add(icosahedron);
}

// Calculates the position of the vertices of the icosahedron
// scale - The value to scale the icosahedron by, negative is right-side up
function calculateVData(scale) {
    var X = 0.525731112119133606 * scale;
    var Z = 0.850650808352039932 * scale;
    
    var vdata = [
    [-X, 0.0, Z], [X, 0.0, Z], [-X, 0.0, -Z], [X, 0.0, -Z],
    [0.0, Z, X], [0.0, Z, -X], [0.0, -Z, X], [0.0, -Z, -X],
    [Z, X, 0.0], [-Z, X, 0.0], [Z, -X, 0.0], [-Z, -X, 0.0]
    ];
    
    return vdata;
}

///////////////////////////////////////////////////////////////////////////////
//Other scene creation methods
///////////////////////////////////////////////////////////////////////////////

//Build the staircase
function createStairs() {

	// MATERIALS
	var stepMaterialVertical = new THREE.MeshLambertMaterial( {
		color: 0xA85F35
	} );
	var stepMaterialHorizontal = new THREE.MeshLambertMaterial( {
		color: 0xBC7349
	} );

	var stepWidth = 500;
	var stepSize = 200;
	var stepThickness = 50;
	// height from top of one step to bottom of next step up
	var verticalStepHeight = stepSize;
	var horizontalStepDepth = stepSize*2;

	var stepHalfThickness = stepThickness/2;

	// +Y direction is up
	// Define the two pieces of the step, vertical and horizontal
	// THREE.CubeGeometry takes (width, height, depth)
	var stepVertical = new THREE.CubeGeometry(stepWidth, verticalStepHeight, stepThickness);
	var stepHorizontal = new THREE.CubeGeometry(stepWidth, stepThickness, horizontalStepDepth);
	var stepMesh;
 
 for (var s = 0; s < 6; s++)
 {
     var yOffset = s*(verticalStepHeight + stepThickness);
     var zOffset = s*(horizontalStepDepth - stepThickness);
     
     // Make and position the vertical part of the step
     stepMesh = new THREE.Mesh( stepVertical, stepMaterialVertical );
     // The position is where the center of the block will be put.
     // You can define position as THREE.Vector3(x, y, z) or in the following way:
     stepMesh.position.x = 0;			// centered at origin
     stepMesh.position.y = yOffset + verticalStepHeight/2;	// half of height: put it above ground plane
     stepMesh.position.z = zOffset;			// centered at origin
     scene.add( stepMesh );

     // Make and position the horizontal part
     stepMesh = new THREE.Mesh( stepHorizontal, stepMaterialHorizontal );
     stepMesh.position.x = 0;
     // Push up by half of horizontal step's height, plus vertical step's height
     stepMesh.position.y = yOffset + stepThickness/2 + verticalStepHeight;
     // Push step forward by half the depth, minus half the vertical step's thickness
     stepMesh.position.z = zOffset + (horizontalStepDepth/2 - stepHalfThickness);
     scene.add( stepMesh );
 }
}

//Adds the lights and objects to the scene
function fillScene() {
	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 3000, 6000 );
	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -400, 200, -300 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);

	if (generatorMethod == 0) {
		console.log("Generated Icosahedron using the Geometry class.");
	    createIcosahedron0(); // Use Geometry
	}
	else if (generatorMethod == 1) {
		console.log("Generated Icosahedron using the IcosahedronGeometry class.");
		createIcosahedron1(); // Use IcosahedronGeometry
	}
	else {
		console.log("Generated Icosahedron using the PolyhedronGeometry class.");
		createIcosahedron2();  // Use PolyhedronGeometry
	}

	var stairs = createStairs();
	scene.add(stairs);
}

///////////////////////////////////////////////////////////////////////////////
//Initialization methods
///////////////////////////////////////////////////////////////////////////////

// Initialize the application
function init() {
	var canvasWidth = 846;
	var canvasHeight = 494;
	// For grading the window is fixed in size; here's general code:
	//var canvasWidth = window.innerWidth;
	//var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 40000 );
	camera.position.set( -700, 500, -1600 );
	// CONTROLS
	cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
	cameraControls.target.set(0,600,0);
}

// Adds the scene to the web page
function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

//Setup the controls in the upper right
function setupGui() {

	effectController = {
		generatorMethod: generatorMethod
	};

	var gui = new dat.GUI();
	gui.add(effectController, "generatorMethod", 
			{ 'Geometry Class': 0, 'Icosahedron Class': 1, 'Polyhedron Class': 2 } )
			.name("Generator");
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
	if (generatorMethod !== effectController.generatorMethod || !initialized)
	{
		initialized = true;
		generatorMethod = effectController.generatorMethod;
		fillScene();
	}
	renderer.render(scene, camera);
}

// Run application
try {
	init();
	setupGui();
	addToDOM();
	animate();
} catch(e) {
	var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
	$('#container').append(errorReport+e);
}
