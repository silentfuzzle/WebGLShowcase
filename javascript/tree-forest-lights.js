//Emily Palmieri
//Tree and forest
//9-29-2014
// Base code: unit3-teapot-demo.js

////////////////////////////////////////////////////////////////////////////////
// Teapot demo (unit 3): focus is on illumination model and shading
////////////////////////////////////////////////////////////////////////////////
/*global THREE, requestAnimationFrame, dat, window */

var camera, scene, renderer;
var cameraControls;
var effectController;
var clock = new THREE.Clock();
var teapotSize = 400;
var tess = -1;	// force initialization
var wire;
var flat;
var phong;
var ambientLight;
var discoBall;
var spotlight, hue;

function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	// CAMERA

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
	camera.position.set( -600, 550, 1300 );

	// RENDERER

	renderer = new THREE.WebGLRenderer( { antialias: false, maxLights: 1000 } );
    renderer.shadowMapEnabled = true;
	renderer.setSize( canvasWidth, canvasHeight );
	renderer.setClearColorHex( 0x000000, 1.0 );

	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// EVENTS

	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS

	cameraControls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	cameraControls.target.set(0, 0, 0);
    
	// GUI
	setupGui();

}

// EVENT HANDLERS

function onWindowResize() {

	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth/ canvasHeight;
	camera.updateProjectionMatrix();

}

function setupGui() {

	effectController = {

		shininess: 100.0,
		ka: 0.2,
		kd: 0.7,
		ks: 0.7,
		metallic: false,

		hue:		0.09,
		saturation: 0.46,
		lightness:  0.9,

		lhue:        0.04,
		lsaturation: 0.01,	// so that fractions will be shown
		llightness:  1.0,

		// bizarrely, if you initialize these with negative numbers, the sliders
		// will not show any decimal places.
		lx: 0.32,
		ly: 0.39,
		lz: 0.7,
		newTess: 6,
		newFlat: false,
		newPhong: true,
		newWire: false
	};

	var h;

	var gui = new dat.GUI();

	// material (attributes)
    
	// light (point)

	h = gui.addFolder( "Light color" );

	h.add( effectController, "lhue", 0.0, 1.0, 0.025 ).name("hue");
	h.add( effectController, "lsaturation", 0.0, 1.0, 0.025 ).name("saturation");
	h.add( effectController, "llightness", 0.0, 1.0, 0.025 ).name("lightness");

	// light (directional)

	h = gui.addFolder( "Light direction" );

	h.add( effectController, "lx", -1.0, 1.0, 0.025 ).name("x");
	h.add( effectController, "ly", -1.0, 1.0, 0.025 ).name("y");
	h.add( effectController, "lz", -1.0, 1.0, 0.025 ).name("z");
}


//

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	var delta = clock.getDelta();

	cameraControls.update( delta );
	if ( effectController.newTess !== tess || effectController.newFlat !== flat || effectController.newPhong !== phong || effectController.newWire !== wire)
	{
		tess = effectController.newTess;
		flat = effectController.newFlat;
		phong = effectController.newPhong;
		wire = effectController.newWire;

		fillScene();
	}
    
    // Rotate disco ball
    var layerOffset = discoBall.position.y / 5;
    for (var l=0; l < discoBall.layers.length; l++) {
        var numLights = discoBall.layers[l].length;
        var betweenLights = 360 / numLights * Math.PI / 180;
        var offset = (l + 1) * layerOffset;
        
        for (var c=0; c < numLights; c++) {
            var light = discoBall.layers[l][c];
            var addDegree = (c % numLights) * betweenLights;
            
            light.target.position.x = offset * Math.cos(-(discoBall.rotation.y + addDegree));
            light.target.position.z = offset * Math.sin(-(discoBall.rotation.y + addDegree));
        }
    }    
    discoBall.rotation.y = discoBall.rotation.y + (1 * Math.PI / 180);
    
    spotlight.color.setHSL(hue, 1, 0.5);
    hue = hue + 0.01
    if (hue > 1) {
        hue = 0;
    }
    
	renderer.render( scene, camera );

}

function createShaderMaterial( id, light, ambientLight ) {

	var shader = THREE.ShaderTypes[ id ];

	var u = THREE.UniformsUtils.clone( shader.uniforms );

	var vs = shader.vertexShader;
	var fs = shader.fragmentShader;

	var material = new THREE.ShaderMaterial( { uniforms: u, vertexShader: vs, fragmentShader: fs } );

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;

	material.uniforms.uAmbientLightColor.value = ambientLight.color;

	return material;

}

///////////////////////////////////////////////////////////////////////////////
//Constructor methods and attributes
///////////////////////////////////////////////////////////////////////////////

// Materials
var treeMaterial = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture("./media/treeBark.jpg")
  });  
var leafMaterial = new THREE.MeshLambertMaterial({ color: 0x00DD00, ambient : 0x00DD00 });

function fillScene() {
	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

    var maxTreeBase = 50;
    
	// LIGHTS

	ambientLight = new THREE.AmbientLight( 0x555555 );	// 0.2
    scene.add( ambientLight );
    
    // Disco ball
    var ballCast = false;
    createDiscoBall(maxTreeBase, ballCast);
    scene.add(discoBall);
    if (!ballCast) {
        var treeShadow = new THREE.DirectionalLight( 0xFFFFFF, 1);
        treeShadow.position.set(0,4500,0);
        treeShadow.shadowCameraLeft = -1000;
        treeShadow.shadowCameraRight = 1000;
        treeShadow.shadowCameraTop = 1000;
        treeShadow.shadowCameraBottom = -1000;
        treeShadow.onlyShadow = true;
        //treeShadow.shadowCameraVisible = true;
        treeShadow.castShadow = true;
        scene.add(treeShadow);
    }
    
    // Colored spot
    hue = 0;
    var intensity = 1.5;
    spotlight = new THREE.DirectionalLight(0xFF0000, intensity);
    spotlight.position.set(0,-1,0);
    spotlight.castShadow = true;
    scene.add(spotlight);
    
	// GROUND
    
    var solidGround = new THREE.Mesh(
		new THREE.PlaneGeometry( 10000, 10000 ),
		new THREE.MeshPhongMaterial({ color: 0x005500, ambient: 0x005500,
			// polygonOffset moves the plane back from the eye a bit, so that the lines on top of
			// the grid do not have z-fighting with the grid:
			// Factor == 1 moves it back relative to the slope (more on-edge means move back farther)
			// Units == 4 is a fixed amount to move back, and 4 is usually a good value
			polygonOffset: true, polygonOffsetFactor: 1.0, polygonOffsetUnits: 4.0
		}));
    solidGround.rotation.x = -Math.PI / 2;
    solidGround.receiveShadow = true;
    
    scene.add( solidGround );
    
    // SET VARIABLES HERE
    
    // SET UNIFORM FOREST VARIABLES HERE
    // (numTrees - the number of trees to generate for the forest
    //  bottomRadius - the starting bottom radius of all the trees
    //  height - the starting height of all the trees
    //  totalLayers - the number of times to branch from branches
    //  H - Determines the amount to reduce the height of the branch by each iteration
    //  rotateRand - the maximum or minimum amount a branch can rotate randomly from its starting rotation)
    var forest = createUniformForest(1, maxTreeBase, 4, 0.5, 10);
    
    // SET RANDOM FOREST VARIABLES HERE
    // (numTrees - the number of trees to generate for the forest
    // totalLayers - the number of times to branch from branches
    // H - the amount to reduce the height of the branch by each iteration
    // rotateRand - the maximum or minimum amount a branch can rotate randomly from its starting rotation)
    //var forest = createRandomForest(5, 5, 0.5, 10);
    
    // SET LAYOUT VARIABLES HERE
    // (forest - the list of trees to layout
    // maxTreeSpacing - the starting distance to place the trees from one another
    // p - determines the random value to add to the tree's x and z position, (Math.random() * p * 2) - p)
    //layoutForestGrid(forest, 800, 500);
    layoutTree(forest);
}

///////////////////////////////////////////////////////////////////////////////
//Lighting methods
///////////////////////////////////////////////////////////////////////////////

function createDiscoBall(treeBase, castShadows) {
    discoBall = new THREE.Object3D();
    discoBall.layers = [];
    discoBall.layers.push(createDiscoBallLayer(4, treeBase, castShadows));
    discoBall.layers.push(createDiscoBallLayer(8, treeBase, castShadows));
    console.log(discoBall.children.length);
    
    var ballGeometry = new THREE.SphereGeometry(50, 32, 16);
    var ballMaterial = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture("./media/discoBall.jpg"),
        shininess: 100,
        emissive: 0xFFFFFF
    }) 
    var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    
    discoBall.add(ballMesh);
    discoBall.position.set(0,30 * treeBase,0);
}

function createDiscoBallLayer(numLights, treeBase, castShadows) {
    var lightLayer = [];
    for (var l=0; l < numLights; l++) {
        lightLayer[l] = getDiscoBallLight(castShadows);
        if (castShadows) {
            lightLayer[l].position.y = treeBase * 20;
        }
        discoBall.add(lightLayer[l]);
    }
    
    return lightLayer;
}

function getDiscoBallLight(castShadows) {
    var spotRadius = 1;
    if (castShadows) {
        spotRadius = 0.5;
    }
    var light = new THREE.SpotLight( 0xFFFFFF, 1.5, 0, spotRadius * Math.PI / 180, 1 );
    if (castShadows) {
        light.castShadow = true;
        light.shadowDarkness = 0.1;
    }
    
    return light;
}

///////////////////////////////////////////////////////////////////////////////
//Forest building methods
///////////////////////////////////////////////////////////////////////////////

// Creates a forest using randomly generated parameters to create individual trees
// numTrees - the number of trees to generate for the forest
// totalLayers - the number of times to branch from branches
// H - the amount to reduce the height of the branch by each iteration
// rotateRand - the maximum or minimum amount a branch can rotate randomly from its starting rotation
function createRandomForest(numTrees, totalLayers, H, rotateRand) {
    var forest = [];
    for (var t=0; t < numTrees; t++) {
        var bottomRadius = (Math.random() * 100) + 10;
        var height = bottomRadius * 10;
        var leafSize = getLeafSize(bottomRadius);
        var tree = createTree(bottomRadius, height, totalLayers, H, rotateRand, leafSize);
        forest[t] = tree;
    }
    
    return forest;
}

// Creates a forest using the passed parameters to create the individual trees
// numTrees - the number of trees to generate for the forest
// bottomRadius - the starting bottom radius of all the trees
// height - the starting height of all the trees
// totalLayers - the number of times to branch from branches
// H - The amount to reduce the height of the branch by each iteration
// rotateRand - The random amount to add to the rotation of each branch
function createUniformForest(numTrees, bottomRadius, totalLayers, H, rotateRand) {
    var forest = [];
    var height = bottomRadius * 10;
    var leafSize = getLeafSize(bottomRadius);
    
    // Creates the number of trees specified and places them in the forest
    for (var t=0; t < numTrees; t++) {
        var tree = createTree(bottomRadius, height, totalLayers, H, rotateRand, leafSize);
        forest[t] = tree;
    }
    
    return forest;
}

// Layouts out the trees in a list in a square grid with some randomness
// forest - the list of trees to layout
// maxTreeSpacing - the starting distance to place the trees from one another
// p - determines the random value to add to the tree's x and z position, (Math.random() * p * 2) - p
function layoutForestGrid(forest, maxTreeSpacing, p) {
    var square = Math.sqrt(forest.length);
    var totalX = Math.floor(square);
    x = 0;
    z = 0;
    
    for (var t=0; t < forest.length; t++) {
        var tree = forest[t];
        tree.position.x = x * maxTreeSpacing + ((Math.random() * p * 2) - p);
        tree.position.z = z * maxTreeSpacing + ((Math.random() * p * 2) - p);
        scene.add(tree);
        
        // Set the position of the next tree
        x = x + 1;
        if (x == totalX) {
            x = 0;
            z = z + 1;
        }
    }
}

function layoutTree(forest) {
    var tree = forest[0];
    tree.position.x = 0;
    tree.position.z = 0;
    scene.add(tree);
}

///////////////////////////////////////////////////////////////////////////////
//Tree building methods
///////////////////////////////////////////////////////////////////////////////

// Creates a forest using the passed parameters to create the individual trees
// bottomRadius - the starting bottom radius of all the trees
// height - the starting height of all the trees
// totalLayers - the number of times to branch from branches
// H - The amount to reduce the height of the branch by each iteration
// rotateRand - the maximum or minimum amount a branch can rotate randomly from its starting rotation
// leafSize - Determines the size of the leaves
function createTree(bottomRadius, height, totalLayers, H, rotateRand, leafSize) {
    var tree = addToTree(bottomRadius, height, 0, totalLayers, H, leafSize);
    
    // Allow the leaves to rotate randomly only between -45 and 45 of their starting angle
    if (rotateRand < -45) {
        rotateRand = -45;
    }
    if (rotateRand > 45) {
        rotateRand = 45;
    }
    rotateBranches(tree, rotateRand);
    
    return tree;
}

// Adds a branch to a tree part
// bottomRadius - the starting bottom radius of all the trees
// height - the starting height of all the trees
// totalLayers - the number of times to branch from branches
// H - The amount to reduce the height of the branch by each iteration
// leafSize - Determines the size of the leaves
function addToTree(bottomRadius, height, layer, totalLayers, H, leafSize) {
    // Get the radius of the top of the branch based on the bottom radius
    var topRadius = getTopRadius(bottomRadius, H, layer == totalLayers);
    
    // Create the branch's mesh
    var trunk = createBranch(bottomRadius, height, topRadius);
    
    // Create a list where the parent stores the Object3D of its child branches so they can be rotated later
    trunk.branches = [];
    if (layer < totalLayers) {
        // Add between 1 and 4 child branches to the new parent branch
        var numBranches = Math.ceil(Math.random() * 3) + 1;
        for (var b=0; b < numBranches; b++) {
            // Get the radius of the bottom of the child branch based on the top radius of the parent branch
            var newBottomRadius = getNextBottomRadius(topRadius);
            
            // Redus the height of the child branch as specified by H
            var newHeight = getNextHeight(height, H);
            
            // Recursively create the child branch
            trunk.branches[b] = addToTree(newBottomRadius, newHeight, layer+1, totalLayers, H, leafSize);
            trunk.branches[b].position.y = height - trunk.branches[b].bottomRadius;
            trunk.add(trunk.branches[b]);
        }
    }
    else {
        // The specified depth of the tree has been reached
        // Add leaves to the branch and stop recursing
        var leaf = createLeaf(leafSize);
        leaf.position.y = height;
        trunk.add(leaf);
    }
    
    return trunk;
}

// Creates the mesh for a branch, positions it, and places it in an Object3D for easy rotation later
// bottomRadius - the bottom radius of the branch
// height - the height of the branch
// topRadius - the top radius of the branch
function createBranch(bottomRadius, height, topRadius) {
    var branch = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32, 1);
    var branchMesh = getMesh(branch);
    
    branchMesh.receiveShadow = true;
    branchMesh.castShadow = true;
    branchMesh.position.y = height / 2;
    
    var pivot = new THREE.Object3D();
    pivot.add(branchMesh);
    pivot.bottomRadius = bottomRadius;
    
    return pivot;
}

// Creates a leaf to add to the end of a branch
// leafSize - used to set the distance between the bottom two points and the bottom edge and top point of the leaf
function createLeaf(leafSize) {
    var mesh;
    var lightRad = leafSize / 2;
    
    var leafType = Math.random() * 2;
    if (leafType < 1.0) {
        var halfLeaf = leafSize / 2;
        
        // Create a simple triangle representing a leaf
        leafGeometry = new THREE.Geometry();
        leafGeometry.vertices.push(new THREE.Vector3( -halfLeaf, 0, 0));
        leafGeometry.vertices.push(new THREE.Vector3(halfLeaf, 0, 0));
        leafGeometry.vertices.push(new THREE.Vector3(0, leafSize, 0));
        
        // Add both sides of the leaf as faces so that it isn't culled
        leafGeometry.faces.push(new THREE.Face3(0, 1, 2));
        leafGeometry.faces.push(new THREE.Face3(0, 2, 1));
        
        leafGeometry.computeFaceNormals();
        
        // Set the leaves to be displayed in wireframe or green
        mesh = new THREE.Mesh(leafGeometry, wire ? wireMaterial : leafMaterial);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.position.y = halfLeaf;
    }
    else {
        var lightGeometry = new THREE.SphereGeometry(lightRad, 32, 16);
        var c = new THREE.Color();
        
        var r = Math.random();
        var g = Math.random();
        var b = Math.random();
        var alpha = Math.random();

        if (c === null) {
            c = new THREE.Color()
        }

        c.setRGB(r, g, b);

        var lightMaterial = new THREE.MeshPhongMaterial({
            color: c,
            transparent: true,
            opacity: alpha,
            wireframe: false,
            shininess: 100,
            emissive: c.getHex()
        })
                
        var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
        var light = new THREE.PointLight(c.getHex(), 2, 200);
        mesh = new THREE.Object3D();
        mesh.add(lightMesh);
        mesh.add(light);
        mesh.position.y = lightRad / 2;
    }
    
    return mesh;
}

// Returns a branch mesh with a bark texture
// geometry - the geometry object of the branch to get a mesh for
function getMesh(geometry) {
    var mesh = new THREE.Mesh(geometry, treeMaterial);
    
    return mesh;
}

///////////////////////////////////////////////////////////////////////////////
//Branch rotation methods
///////////////////////////////////////////////////////////////////////////////

// Rotates the branches of a parent branch randomly
// trunk - the parent branch's mesh
// rotateRand - the maximum or minimum amount a branch can rotate from its starting rotation
function rotateBranches(trunk, rotateRand) {
    var chosenAngles = [];
    for (var c=0; c < trunk.branches.length; c++) {
        var child = trunk.branches[c];
        
        var found = false;
        var xAngle = -1;
        var zAngle = -1;        
        while (found == false) {
            // Rotate the branch randomly
            xAngle = Math.floor(Math.random() * 3) - 1;
            var randXRotation = getRandomAngle(xAngle);
            
            zAngle = Math.floor(Math.random() * 3) - 1;
            var randZRotation = getRandomAngle(zAngle);
            
            // Make sure the position of the branch hasn't been chosen by another sibling
            if (!angleChosen(chosenAngles, xAngle, zAngle)) {
                var baseAngle = [xAngle, zAngle];
                chosenAngles.push(baseAngle);
                found = true;
            }
        }
        
        // Add a random rotation to the 45 degree angles
        var randXRotation = randXRotation + (Math.random() * rotateRand);
        var randZRotation = randZRotation + (Math.random() * rotateRand);
        
        // Set the child branch's rotation
        child.rotation.x = randXRotation * Math.PI / 180;
        child.rotation.z = randZRotation * Math.PI / 180;
        
        // Rotate the child branch's child branches
        rotateBranches(child, rotateRand);
    }
}

// Returns whether the chosen start angle was chosen by a sibling branch
// chosenAngles - the list of angles that have been chosen this iteration
// xAngle - the x-angle chosen by the current branch
// zAngle - the z-angle chosen by the current branch
function angleChosen(chosenAngles, xAngle, zAngle) {
    for (var i=0; i < chosenAngles.length; i++) {
        if (chosenAngles[i][0] == xAngle && chosenAngles[i][1] == zAngle) {
            return true;
        }
    }
    
    return false;
}

///////////////////////////////////////////////////////////////////////////////
//Height and radius decay equations
///////////////////////////////////////////////////////////////////////////////

// Returns the top radius of a branch given its bottom radius
// baseValue - the radius of the bottom of the branch
// finalLayer - true if this is the last branch to be generated recursively
function getTopRadius(baseValue, H, finalLayer) {
    if (finalLayer) {
        // The last branch in the recursion ends as a point
        return 1;
    }
    else {
        var randomBase = baseValue / 10;
        var randAdd = (Math.random() * randomBase * 2) - randomBase;
        return baseValue / Math.pow(2, H) + randAdd;
    }
}

// Returns the bottom radius of a branch given the radius of the top of its parent branch
// baseValue - the radius of its parent's top
function getNextBottomRadius(baseValue) {
    return baseValue;
    //return baseValue - (Math.random() * (baseValue / 5));
}

// Returns the height of a branch giving the height of its parent
// baseValue - the height of the branch's parent
// H - a user-secified value determining how fast the height decreases
function getNextHeight(baseValue, H) {
    var randomBase = baseValue / 10;
    var randAdd = (Math.random() * randomBase * 2) - randomBase;
    return baseValue / Math.pow(2, H) + randAdd;
}

// Returns the size of the leaves based on the radius of the base of the tree
function getLeafSize(baseValue) {
    return baseValue;
}

// Returns a random angle from a value between -1 and 1
function getRandomAngle(baseAngle) {
    var randRotation = (baseAngle * 45);
    return randRotation;
}

init();
animate();



