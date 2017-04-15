//Emily Palmieri
//Height Field
//9-15-2014

/*global THREE, requestAnimationFrame, dat, window */

var camera, scene, renderer;
var cameraControls;
var effectController;
var clock = new THREE.Clock();
var ambientLight, light, particleLight;
var tess = -1;	// force initialization
var wire;
var flat;
var phong;
var flatGouraudMaterial, flatPhongMaterial, gouraudMaterial, phongMaterial, wireMaterial;

var useImage = false;
var useImage1 = true;
var iterative = true;
var startingRoughness = 200;
var decreaseRoughness = 1;
var scale = 3;

// Initialize the application
function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	// CAMERA

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
	camera.position.set( -600, 550, 1300 );

	// LIGHTS

	ambientLight = new THREE.AmbientLight( 0x333333 );	// 0.2

	light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	// direction is set in GUI

	// RENDERER

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( canvasWidth, canvasHeight );
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );

	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// EVENTS

	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS

	cameraControls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	cameraControls.target.set(0, 0, 0);


	// MATERIALS
	// Note: setting per pixel off does not affect the specular highlight;
	// it affects only whether the light direction is recalculated each pixel.
	var materialColor = new THREE.Color();
	materialColor.setRGB( 1.0, 0.8, 0.6 );
	flatGouraudMaterial = createShaderMaterial( "gouraud", light, ambientLight );
	flatGouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	flatGouraudMaterial.shading = THREE.FlatShading;
	flatGouraudMaterial.side = THREE.DoubleSide;

	flatPhongMaterial = createShaderMaterial( "phong", light, ambientLight );
	flatPhongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	flatPhongMaterial.shading = THREE.FlatShading;
	flatPhongMaterial.side = THREE.DoubleSide;

	gouraudMaterial = createShaderMaterial( "gouraud", light, ambientLight );
	gouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	gouraudMaterial.side = THREE.DoubleSide;

	phongMaterial = createShaderMaterial( "phong", light, ambientLight );
	phongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	phongMaterial.side = THREE.DoubleSide;

	wireMaterial = new THREE.MeshBasicMaterial( { color: 0xFFCC99, wireframe: true } ) ;

	// GUI
	setupGui();

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

//Setup the controls in the upper right
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
		newWire: false,
		
		useImage: useImage,
		useImage1: useImage1,
		iterative: iterative,
		startingRoughness: startingRoughness,
		decreaseRoughness: decreaseRoughness,
		scale: scale
	};

	var h;

	var gui = new dat.GUI();

	// material (attributes)

	h = gui.addFolder( "Material control" );

	h.add( effectController, "shininess", 1.0, 400.0, 1.0 ).name("m_shininess");
	h.add( effectController, "ka", 0.0, 1.0, 0.025 ).name("m_ka");
	h.add( effectController, "kd", 0.0, 1.0, 0.025 ).name("m_kd");
	h.add( effectController, "ks", 0.0, 1.0, 0.025 ).name("m_ks");
	h.add( effectController, "metallic" );

	// material (color)

	h = gui.addFolder( "Material color" );

	h.add( effectController, "hue", 0.0, 1.0, 0.025 ).name("m_hue");
	h.add( effectController, "saturation", 0.0, 1.0, 0.025 ).name("m_saturation");
	h.add( effectController, "lightness", 0.0, 1.0, 0.025 ).name("m_lightness");

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

	h = gui.addFolder( "Tessellation control" );
	h.add( effectController, "newTess", [2,3,4,5,6,8,10,12,16,24,32] ).name("Tessellation Level");
	h.add( effectController, "newFlat" ).name("Flat Shading");
	h.add( effectController, "newPhong" ).name("Use Phong");
	h.add( effectController, "newWire" ).name("Show wireframe only");
	
	// Height field controls
	
	h = gui.addFolder("Height Field");
	h.add( effectController, "useImage");
	h.add( effectController, "useImage1");
	h.add( effectController, "iterative");
	h.add( effectController, "startingRoughness", 0, 500).step(10);
	h.add( effectController, "decreaseRoughness", 0, 1).step(0.01);
	h.add( effectController, "scale", 1, 5).step(1);
}

//Resize the application when the user resizes their browser
function onWindowResize() {

	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth/ canvasHeight;
	camera.updateProjectionMatrix();

}

///////////////////////////////////////////////////////////////////////////////
//Animation methods
///////////////////////////////////////////////////////////////////////////////

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	var delta = clock.getDelta();
	cameraControls.update( delta );
	if ( effectController.newTess !== tess ||
			effectController.newFlat !== flat || 
			effectController.newPhong !== phong || 
			effectController.newWire !== wire ||
			effectController.useImage !== useImage ||
			effectController.useImage1 !== useImage1 ||
			effectController.iterative !== iterative ||
			effectController.startingRoughness !== startingRoughness ||
			effectController.decreaseRoughness !== decreaseRoughness ||
			effectController.scale !== scale)
	{
		tess = effectController.newTess;
		flat = effectController.newFlat;
		phong = effectController.newPhong;
		wire = effectController.newWire;
		
		useImage = effectController.useImage;
		useImage1 = effectController.useImage1;
		iterative = effectController.iterative;
		startingRoughness = effectController.startingRoughness;
		decreaseRoughness = effectController.decreaseRoughness;
		scale = effectController.scale;

		fillScene();
	}

	flatGouraudMaterial.uniforms.shininess.value = effectController.shininess;
	flatPhongMaterial.uniforms.shininess.value = effectController.shininess;
	gouraudMaterial.uniforms.shininess.value = effectController.shininess;
	phongMaterial.uniforms.shininess.value = effectController.shininess;

	flatGouraudMaterial.uniforms.uKd.value = effectController.kd;
	flatPhongMaterial.uniforms.uKd.value = effectController.kd;
	gouraudMaterial.uniforms.uKd.value = effectController.kd;
	phongMaterial.uniforms.uKd.value = effectController.kd;

	flatGouraudMaterial.uniforms.uKs.value = effectController.ks;
	flatPhongMaterial.uniforms.uKs.value = effectController.ks;
	gouraudMaterial.uniforms.uKs.value = effectController.ks;
	phongMaterial.uniforms.uKs.value = effectController.ks;

	var materialColor = new THREE.Color();
	materialColor.setHSL( effectController.hue, effectController.saturation, effectController.lightness );
	flatGouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	flatPhongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	gouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
	phongMaterial.uniforms.uMaterialColor.value.copy( materialColor );

	if ( !effectController.metallic )
	{
		materialColor.setRGB(1,1,1);
	}
	flatGouraudMaterial.uniforms.uSpecularColor.value.copy( materialColor );
	flatPhongMaterial.uniforms.uSpecularColor.value.copy( materialColor );
	gouraudMaterial.uniforms.uSpecularColor.value.copy( materialColor );
	phongMaterial.uniforms.uSpecularColor.value.copy( materialColor );

	// Ambient's actually controlled by the light for this demo - TODO fix
	ambientLight.color.setHSL( effectController.hue, effectController.saturation, effectController.lightness * effectController.ka );

	light.position.set( effectController.lx, effectController.ly, effectController.lz );
	light.color.setHSL( effectController.lhue, effectController.lsaturation, effectController.llightness );
	renderer.render( scene, camera );

}

///////////////////////////////////////////////////////////////////////////////
//Create and display height field methods
///////////////////////////////////////////////////////////////////////////////

// Generate the terrain and lighting to display
function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS

	scene.add( ambientLight );
	scene.add( light );
	scene.add( particleLight );
    
	if (useImage) {
		if (useImage1) {
		    // (source file location, scale)
		    createHeightFieldFromImage('./media/heightField1.png', scale);
		}
		else {
		    // (source file location, scale)
		    createHeightFieldFromImage('./media/heightField2.jpg', scale);
		}
	}
	else {
	    // (w defines the width - width = 2^w + 1,
	    //  h defines the height - height = 2^h + 1,
	    //  starting roughness, 
	    //  rate at which roughness decreases between 0 and 1,
	    //  true if iterative diamond-square should be used/false if recursive, 
	    //  scale)
	    createHeightFieldFromDiamondSquare(8, 8, startingRoughness, decreaseRoughness, iterative, scale);
	}
}

// Creates and displays a 3D geometry, mesh, and material of the passed height field data
//heightData - a 1D array of data about the terrain to display
//w - defines the width - width = 2^w + 1
//h - defines the height - height = 2^h + 1
//scale - the value to scale the geometry by
function createHeightField(heightData, width, height, scale) {
    console.log('Starting geometry creation...');
    var fieldGeo = new THREE.PlaneGeometry(width*scale, height*scale, width-1, height-1);
    for (var v=0; v < heightData.length; v++) {
        fieldGeo.vertices[v].z = heightData[v];
    }
    
    fieldGeo.computeFaceNormals();
    fieldGeo.computeVertexNormals();
    
    console.log('Finished geometry creation...');
    
    var fieldMesh = new THREE.Mesh(fieldGeo, 
        wire ? wireMaterial : (
		flat ?
			( phong ? flatPhongMaterial : flatGouraudMaterial ) :
			( phong ? phongMaterial : gouraudMaterial ) ));
    scene.add(fieldMesh);
    
    console.log("Done");
}

///////////////////////////////////////////////////////////////////////////////
//Create height field from image methods
///////////////////////////////////////////////////////////////////////////////

// Creates and displays a height field from the values in an image
// source - the path to the image file to use
// scale - the value to scale the image by
function createHeightFieldFromImage(source, scale) {
    var img = new Image();
    img.src = source;
    img.onload = function() {
        console.log("Reading height data...");
        var pixelData = getHeightData(img, scale);
        createHeightField(pixelData, img.width, img.height, scale);
    }
}

// Gets the height data from an image object
// img - The object containing the image
//scale - the value to scale the image by
function getHeightData(img,scale) {

    if (scale == undefined) scale=1;

    var canvas = document.createElement( 'canvas' );
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext( '2d' );

    var size = img.width * img.height;
    var data = new Float32Array( size );

    context.drawImage(img,0,0);

    for ( var i = 0; i < size; i ++ ) {
        data[i] = 0
    }

    var imgd = context.getImageData(0, 0, img.width, img.height);
    var pix = imgd.data;

    var j=0;
    for (var i = 0; i<pix.length; i +=4) {
        var all = pix[i]+pix[i+1]+pix[i+2];
        data[j++] = all * scale;
    }
    
    return data;
}

///////////////////////////////////////////////////////////////////////////////
//Create height field from diamond-square algorithm methods
///////////////////////////////////////////////////////////////////////////////

// Creates a height field from the diamond square algorithm and displays it
// w - defines the width - width = 2^w + 1
// h - defines the height - height = 2^h + 1
// H - the roughness of the terrain
// f - the rate at which H shrinks per iteration, a value between 0 and 1, H / 2^f
// iterative - true if the iterative method should be used, false if the recursive method should be used
// scale - the value to scale the geometry by
function createHeightFieldFromDiamondSquare(w, h, H, f, iterative, scale) {
    var terrainWidth = Math.pow(2, w) + 1;
    var terrainHeight = Math.pow(2, h) + 1;
    var terrain = getTerrainData(terrainWidth, terrainHeight, H, f, iterative);
    createHeightField(terrain, terrainWidth, terrainHeight, scale);
}

// Creates a height field from the diamond-square algorithm and returns it for display
//terrainWidth - defines the width - width = 2^w + 1
//terrainHeight - defines the height - height = 2^h + 1
//H - the roughness of the terrain
//f - the rate at which H shrinks per iteration, a value between 0 and 1, H / 2^f
//iterative - true if the iterative method should be used, false if the recursive method should be used
function getTerrainData(terrainWidth, terrainHeight, H, f, iterative) {

    // Initializes the 2D array of terrain data
    var terrain = [];
    for (var h=0; h < terrainHeight; h++) {
        var row = [];
        for (var w=0; w < terrainWidth; w++) {
            row[w]  = 0;
        }
        terrain[h] = row;
    }
    
    if (iterative) {
        // Uses the iterative diamond-square algorithm to generate the field
        terrain = buildTerrainIterative(terrain, H, f);
    }
    else {
        // Uses the recursive diamond-square algorithm to generate the field
        terrain = buildTerrainRecursive(terrain, 0, terrainWidth-1, 0, terrainHeight-1, H, f);
    }
    
    // Converts the 2D array to a 1D array for display
    var terrain1D = [];
    var terrain1DIndex = 0;
    for (var x=0; x < terrainHeight; x++) {
        for (var y=0; y < terrainWidth; y++) {
            terrain1D[terrain1DIndex] = terrain[x][y];
            terrain1DIndex = terrain1DIndex + 1;
        }
    }
        
    return terrain1D;
}

// Generates a height field using the recursive diamond-square algorithm
// terrain - the current state of the terrain data
// (minX, minY) - the top left corner of the square to process
// (maxX, maxY) - the bottom right corner of the square to process
// H - roughness
// f - the rate at which H shrinks per iteration, a value between 0 and 1, H / 2^f
function buildTerrainRecursive(terrain, minX, maxX, minY, maxY, H, f) {
    if (maxX - minX > 1) {
        terrain = performDiamondStep(terrain, minX, maxX, minY, maxY, H);
        
        // Perform square step
        var mx = getMidPoint(minX, maxX);
        var my = getMidPoint(minY, maxY);
        
        var diamondRadius = my - minY;
        terrain = getTerrainFromDiamondCenter(terrain, mx, minY, diamondRadius, H, f);      // Process top diamond
        terrain = getTerrainFromDiamondCenter(terrain, mx, maxY, diamondRadius, H, f);      // Process bottom diamond
        terrain = getTerrainFromDiamondCenter(terrain, minX, my, diamondRadius, H, f);      // Process left diamond
        terrain = getTerrainFromDiamondCenter(terrain, maxX, my, diamondRadius, H, f);      // Process right diamond

        // Recurse
        var newH = getNewH(H, f);
        terrain = buildTerrainRecursive(terrain, minX, mx, minY, my, newH, f);      // Process upper right square
        terrain = buildTerrainRecursive(terrain, mx, maxX, minY, my, newH, f);      // Process upper left square
        terrain = buildTerrainRecursive(terrain, minX, mx, my, maxY, newH, f);      // Process lower right square
        terrain = buildTerrainRecursive(terrain, mx, maxX, my, maxY, newH, f);      // Process lower left square
    }
    
    return terrain;
}

// Generates a height field using the iterative diamond-square algorithm
// terrain - the initial state of the terrain data
// H - roughness
// f - the rate at which H shrinks per iteration, a value between 0 and 1, H / 2^f
function buildTerrainIterative(terrain, H, f) {
    var squareLen = Math.min(terrain.length - 1, terrain[0].length - 1);
    while (squareLen > 1) {
        // Perform the diamond step for all squares in the field
        for (var s1=0; s1 < (terrain.length - 1)/squareLen; s1++) {
            for (var s2=0; s2 < (terrain[0].length - 1)/squareLen; s2++) {
                terrain = performDiamondStep(terrain, s1*squareLen, (s1*squareLen) + squareLen,
                    s2*squareLen, (s2*squareLen) + squareLen, H);
            }
        }
        
        var halfSquareLen = squareLen / 2;
        
        // Perform the square step for all diamonds in the field
        var y = 0;
        var maxEdge = Math.max(terrain.length, terrain[0].length);
        while (y < maxEdge) {
            var x = y + halfSquareLen;
            while (x < maxEdge) {
                if (x < terrain.length && y < terrain[0].length) {
                    terrain = getTerrainFromDiamondCenter (terrain, x, y, halfSquareLen, H, f);
                }
                if (y < terrain.length && x < terrain[0].length) {
                    terrain = getTerrainFromDiamondCenter (terrain, y, x, halfSquareLen, H, f);
                }
                x = x + squareLen;
            }
            y = y + halfSquareLen;
        }
        
        // Reduce the size of the squares to find in the next step and the roughness
        squareLen = halfSquareLen;
        H = getNewH(H, f);
    }
    
    return terrain;
}

///////////////////////////////////////////////////////////////////////////////
//Step definitions
///////////////////////////////////////////////////////////////////////////////

// Converts a square to a diamond, generates a random height at a square's center
// terrain - the current state of the terrain data
// (minX, minY) - the top left corner of the square to process
// (maxX, maxY) - the bottom right corner of the square to process
// H - roughness
function performDiamondStep(terrain, minX, maxX, minY, maxY, H) {
    var average = terrain[minX][minY] + terrain[maxX][minY] + terrain[minX][maxY] + terrain[maxX][maxY];
    average = average / 4;
    
    var mx = getMidPoint(minX, maxX);
    var my = getMidPoint(minY, maxY);
    
    terrain[mx][my] = getRandomHeight(average, H);
    
    return terrain;
}

// Converts a diamond to a square, generates a random height at a diamond's center
// terrain - the current state of the terrain data
// (dmx, dmy) - the coordinate of the diamond's center in the terrain data
// dr - the radius of the diamond from it's center to a corner
// H - roughness
function getTerrainFromDiamondCenter (terrain, dmx, dmy, dr, H) {
    var average = 0;
    
    // Find the height of the diamond's top corner
    var dty = dmy - dr;
    if (dty < 0) {
        dty = dmy + dr;
    }
    average = average + terrain[dmx][dty];
    
    // Find the height of the diamond's bottom corner
    var dby = dmy + dr;
    if (dby >= terrain[0].length) {
        dby = dmy - dr;
    }
    average = average + terrain[dmx][dby];
    
    // Find the height of the diamond's left corner
    var dlx = dmx - dr;
    if (dlx < 0) {
        dlx = dmx + dr;
    }
    average = average + terrain[dlx][dmy];
    
    // Find the height of the diamond's right corner
    var drx = dmx + dr;
    if (drx >= terrain.length) {
        drx = dmx - dr;
    }
    average = average + terrain[drx][dmy];
    
    // Find the average of the diamond's corners and generate a random height for it's center
    average = average / 4;
    terrain[dmx][dmy] = getRandomHeight(average, H);
    
    return terrain;
}

///////////////////////////////////////////////////////////////////////////////
//Helper functions
///////////////////////////////////////////////////////////////////////////////

// Calculates the roughness of the next iteration of the diamond-square algorithm
// H - roughness
// f - the rate at which H shrinks per iteration, a value between 0 and 1, H / 2^f
function getNewH(H, f) {
    return  H / Math.pow(2, f);
}

// Returns the mid-point between two values
function getMidPoint(min, max) {
    return min + ((max - min) / 2);
}

// Returns a random height to assign a point
// average - the average of the four corners of the square or diamond surrounding the point
// H - the roughness value to generate a random number to add to the average from
function getRandomHeight(average, H) {
    return (average + ((Math.random() * H * 2) - H));
}

init();
animate();
