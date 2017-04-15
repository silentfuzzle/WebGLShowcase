/*global THREE, requestAnimationFrame, document, window, dat*/
var camera, scene, renderer;

var cameraControls;

var clock = new THREE.Clock();

var ambientLight, light;

var snowman;
var parenter;

var effectController;
var demoManual = false; 	  // Set true to demonstrate the effects of naively using Object3D.remove() and Object3D.add() methods
var useAlt3 = false; 		  // Set false to demonstrate the effects of parenting an object directly from one object to another
var updateWorldMatrix = true; // Set false to demonstrate the effects of not making sure world matrices are up to date
var buildWithSpheres = false;

///////////////////////////////////////////////////////////////////////////////
//Scene refreshing
///////////////////////////////////////////////////////////////////////////////

function fillScene() {

	scene = new THREE.Scene();

	// LIGHTS

	ambientLight = new THREE.AmbientLight( 0xffffff );
	scene.add( ambientLight );

	light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set( -620, 390, 100 );

	scene.add( light );

	// SNOWMAN
	
    // Determines the method used to parent and deparent objects
    parenter = new Parenter(demoManual, updateWorldMatrix);
	
    // Define snowman material here
	var snowMaterial = new THREE.MeshLambertMaterial( { color: 0x80fc66, transparent: true, opacity: 0.6 } );
	var ka = 0.4;
	snowMaterial.ambient.setRGB( snowMaterial.color.r * ka, 
        snowMaterial.color.g * ka, snowMaterial.color.b * ka );
        
    // Define snowman stick arm material here
    var armMaterial = new THREE.MeshLambertMaterial( { color: 0x444444, ambient: 0x444444 });

    // Define snowman dimensions here
    var snowmanLowerLength = 300;
    var snowmanUpperLength = 200;
    var snowmanHeadLength = 100;
    var snowmanArmLength = 500;
	
	snowman = new Snowman(
	        armMaterial,
	        snowMaterial, 
	        snowmanLowerLength, 
	        snowmanUpperLength, 
	        snowmanArmLength, 
	        snowmanHeadLength,
	        buildWithSpheres);
	    snowman.buildSkeleton();
	    snowman.head.position.y = 50;
	    snowman.head.position.z = -500;
	    snowman.addPartsToScene(scene); 
	    
	// GROUND
	    
    var solidGround = new THREE.Mesh(
		new THREE.PlaneGeometry( 10000, 10000 ),
		new THREE.MeshPhongMaterial({ color: 0x555555, ambient: 0x555555,
			// polygonOffset moves the plane back from the eye a bit, so that the lines on top of
			// the grid do not have z-fighting with the grid:
			// Factor == 1 moves it back relative to the slope (more on-edge means move back farther)
			// Units == 4 is a fixed amount to move back, and 4 is usually a good value
			polygonOffset: true, polygonOffsetFactor: 1.0, polygonOffsetUnits: 4.0
		}));
    solidGround.rotation.x = -Math.PI / 2;
    
    scene.add(solidGround);
    
    animationStep1();
}

// Check if the user has changed the simulation settings such that the scene needs to be refreshed
function checkRefreshScene() {
	if (effectController.demoManual !== demoManual ||
			effectController.updateWorldMatrix !== updateWorldMatrix ||
			effectController.buildWithSpheres !== buildWithSpheres) {
		
		demoManual = effectController.demoManual;
		updateWorldMatrix = effectController.updateWorldMatrix;
		buildWithSpheres = effectController.buildWithSpheres;
		
		fillScene();
		
		return true;
	}
	return false;
}

///////////////////////////////////////////////////////////////////////////////
//Animation steps
///////////////////////////////////////////////////////////////////////////////

// Step 1: The snowman's head moves to the neck and then the right hand
function animationStep1() {
	if (checkRefreshScene()) {
		return;
	}
	
    var snowmanLowerLength = snowman.lowerBodyLength;
    var snowmanUpperLength = snowman.upperBodyLength;
    var snowmanHeadLength = snowman.headLength;
    var snowmanHead = snowman.head;
    
    // Stores the current position and rotation of the snowman's head while tweening
    var current = currentObject(
        snowmanHead.position.x,
        snowmanHead.position.y,
        snowmanHead.position.z,
        0, 0, 0);
            
    // Move the head to the neck
    var tweenHeadToBody = createPartTween(
        0, snowmanLowerLength + snowmanUpperLength + snowmanHeadLength / 2, 0, 
        0, 0, 0, 
        snowmanHead, current);
        
    var yPos = snowmanLowerLength;
    if (effectController.useAlt3) {
        yPos += snowmanUpperLength / 2 + snowmanHeadLength / 2;
    }
    else {
        yPos += snowmanUpperLength;
    }
    
    
    // Move the head to the right hand
    var tweenHeadToHand = createPartTween(
        snowman.armLength, yPos, 0, 
        0, 0, 0, 
        snowmanHead, current);
    // Go to the next animation step once the head is on the hand
    tweenHeadToHand.onComplete(animationStep2);
    
    // Start the animation
    tweenHeadToBody.chain(tweenHeadToHand);
    tweenHeadToBody.start()
}

// Step 2: The snowman's head is parented to the right hand 
// The left and right arms are rotated so the hands are above the body
function animationStep2() {
	if (checkRefreshScene()) {
		return;
	}
	
    var rightArmPivot = snowman.rightArmPivot;
    var leftArmPivot = snowman.leftArmPivot;
    
    // Parent the head to the right hand
    parenter.parent(rightArmPivot, snowman.head, scene);
    
    var tweenRightArm = createPartTween(
        undefined, undefined, undefined,
        undefined, 90 * Math.PI / 180, undefined, 
        rightArmPivot);
    
    var tweenLeftArm = createPartTween(
        undefined, undefined, undefined,
        undefined, -90 * Math.PI / 180, undefined, 
        snowman.leftArmPivot);
        
    if (effectController.useAlt3) {
        // De-parent the head in a separate step from rotation
        tweenLeftArm.onComplete(altAnimationStep3A);
    }
    else {
        // Re-parent the head and rotate in a single step
        tweenLeftArm.onComplete(animationStep3B);
    }
    
    // Begin animating the left and right arm simultaneously
    tweenRightArm.start();
    tweenLeftArm.start();
}

// Step 3A: The snowman's head is removed as a child from the right hand
// The head is moved to the left hand
function altAnimationStep3A() {
	if (checkRefreshScene()) {
		return;
	}
	
    var snowmanHead = snowman.head;
    var rightArmPivot = snowman.rightArmPivot;
    
    // De-parent the right hand from the head
    parenter.deparent(rightArmPivot, snowmanHead, scene);
    
    var tweenHead = createPartTween(
        -snowman.headLength / 2, undefined, undefined,
        0, 0, 0,
        snowmanHead);
    // This alternative transition hides some of the effects of floating point errors
	tweenHead.easing(TWEEN.Easing.Cubic.Out);   
    tweenHead.onComplete(animationStep3B);
    tweenHead.start();
}

// Step 3B: The snowman's head is parented from the right hand to the left hand
// The left and right arms are rotated back to their rest positions
function animationStep3B() {
	if (checkRefreshScene()) {
		return;
	}
	
    var rightArmPivot = snowman.rightArmPivot;
    var leftArmPivot = snowman.leftArmPivot;
    var snowmanHead = snowman.head;
    
    // Parent the snowman's head from the right to the left hand
    if (effectController.useAlt3) {
        parenter.parent(leftArmPivot, snowmanHead, scene);
    }
    else {
        parenter.switchParent(rightArmPivot, leftArmPivot, snowmanHead, scene);
    }
    
    var tweenRightArm = createPartTween(
        undefined, undefined, undefined,
        undefined, 0, undefined, 
        rightArmPivot);
    tweenRightArm.delay(10);
    
    var tweenLeftArm = createPartTween(
        undefined, undefined, undefined,
        undefined, 0, undefined, 
        leftArmPivot);
    tweenLeftArm.delay(10);
    
    // Slide the head down the left arm
    var tweenHead = createPartTween(
        0, snowman.headLength / 2, undefined,
        0, 0, 0,
        snowmanHead);
        
    // Go to the next animation step when the left arm is done rotating
    tweenLeftArm.onComplete(animationStep4);
        
    // Begin animating the left and right arm simultaneously
    tweenHead.start();
    tweenRightArm.start();
    tweenLeftArm.start();
}

// Step 4: The snowman's head removed as a child of the the left hand
// The head is moved to the neck
function animationStep4() {
	if (checkRefreshScene()) {
		return;
	}
	
    // De-parent the head from the left hand
    parenter.deparent(snowman.leftArmPivot, snowman.head, scene);

    var tweenHeadToBody = createPartTween(
        0, snowman.lowerBodyLength + snowman.upperBodyLength + snowman.headLength / 2, 0, 
        0, 0, 0, 
        snowman.head);
    tweenHeadToBody.onComplete(animationStep5);
    tweenHeadToBody.start();
}

// Step 5: The snowman's head is parented to the upper body
// The upper body is rotated 90 degrees
function animationStep5() {
	if (checkRefreshScene()) {
		return;
	}
	
    var snowmanUpperPivot = snowman.upperBodyPivot;
    
    // Parent the head to the upper body
    parenter.parent(snowmanUpperPivot, snowman.head, scene);
    
    var tweenPivot = createPartTween(
        undefined, undefined, undefined,
        -90 * Math.PI / 180, 0, 0, 
        snowmanUpperPivot);
    tweenPivot.onComplete(animationStep6);    
    tweenPivot.start();
}

// Step 6: The snowman's head removed as a child of the the upper body
// The head and body return to their start positions
function animationStep6() {
	if (checkRefreshScene()) {
		return;
	}
	
    var snowmanUpperPivot = snowman.upperBodyPivot;
    
    // De-parent the head from the upper body
    parenter.deparent(snowmanUpperPivot, snowman.head, scene);
    
    // Move the head to the ground
    var tweenHead = createPartTween(
        0, 50, -500, 
        0, 0, 0, 
        snowman.head);
    
    // Straighten the body
    var tweenPivot = createPartTween(
        undefined, undefined, undefined, 
        0, 0, 0, 
        snowmanUpperPivot);
    // Return to the first animation step once the body has finished rotating
    tweenPivot.onComplete(animationStep1);
    
    // Begin the animation
    tweenHead.chain(tweenPivot);    // Move the body after positioning the head
    tweenHead.start();
}

///////////////////////////////////////////////////////////////////////////////
//Initialization methods
///////////////////////////////////////////////////////////////////////////////

// Initialize the application
function init() {

	// RENDERER

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	
	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	// CAMERA

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
	camera.position.set( -1000, 450, -1300 );

	// CONTROLS

	cameraControls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	cameraControls.target.set(0, 0, 0);
	setupGui();
	
	fillScene();
}

// Setup the controls in the upper right
function setupGui() {
	
	effectController = {
			demoManual: demoManual,
			useAlt3: useAlt3,
			updateWorldMatrix: updateWorldMatrix,
			buildWithSpheres: buildWithSpheres

	};

	var gui = new dat.GUI();

	gui.add( effectController, "demoManual").name("Object3d Adding");
	gui.add( effectController, "useAlt3").name("Direct Parenting");
	gui.add( effectController, "updateWorldMatrix").name("Update World Matrix");
	gui.add( effectController, "buildWithSpheres").name("Spheres");

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
    
    // Update any active animations
    TWEEN.update();
	
	renderer.render( scene, camera );

}

// Run application
init();
animate();
