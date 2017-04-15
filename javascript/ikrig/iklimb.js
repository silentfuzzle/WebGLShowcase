// Emily Palmieri
// CSCI 491
// Project 2
// 12-8-2014

// This class creates a two part limb (such as an arm or a leg) that is positioned using inverse kinematics.
// upperLength - The length of the upper leg/arm
// lowerLength - The length of the lower leg/arm
function IKLimb(upperLength, lowerLength) {

    // Limb lengths
    this.upperLength = upperLength;
    this.lowerLength = lowerLength;
    this.totalLength = upperLength + lowerLength;
    
    // Limb objects
    this.upperLimb;
    this.lowerLimb;
    this.root;
    this.socket;
    this.limb;
    
    // Limb guides
    this.outerLimit;
    this.innerLimit;
    this.cursor;
    this.pointer;
    
    // Guide materials
    this.limitMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, opacity: 0.5, transparent: true} );
    this.pointerMaterial = new THREE.MeshBasicMaterial( { color: 0x551111 } );
    this.invisibleMaterial = new THREE.MeshBasicMaterial( { opacity: 0, transparent: true} );
    
    // Limb and guide controller
    this.controller = {
        handX: this.totalLength,
        handY: 0,
        handZ: 0,
        shoulderX: 0,
        shoulderY: 0,
        shoulderZ: 0,
        elbowSpin: 0,
        showOLimit: false,
        showILimit: false,
        showPointer: false,
        showCursor: false
	};
    
    // Create the limb as defined by the passed arguments
    // upperLimb - the mesh to use for the upper limb
    // lowerLimb - the mesh to use for the lower limb
    this.buildLimb = function(upperLimb, lowerLimb) {
        
        this.buildGuides();
    
        // Set limb meshes
        this.upperLimb = upperLimb;
        this.lowerLimb = lowerLimb;
        
        // Add the upper and lower limb to an object that spins the elbow
        this.socket = new THREE.Object3D();
        this.socket.add(this.upperLimb);
        this.socket.add(this.lowerLimb);
        
        // Add the socket to an object that rotates the limb
        this.limb = new THREE.Object3D();
        this.limb.add(this.socket);
        this.limb.add(this.pointer);
        
        // Add the limb to an object that positions the limb in the scene
        this.root = new THREE.Object3D();
        this.root.add(this.limb);
        this.root.add(this.outerLimit);
        this.root.add(this.innerLimit);
        this.root.add(this.cursor);
    }
    
    // Create objects that show the constraints on the limb
    this.buildGuides = function() {
        
        // Show the outer and inner limits of the locations the hand can reach
        this.outerLimit = new THREE.Mesh( new THREE.SphereGeometry( this.totalLength, 32, 32 )); 
        this.innerLimit = new THREE.Mesh( new THREE.SphereGeometry( Math.abs(this.upperLength - this.lowerLength), 32, 32 ));
        
        // Show the orientation of the limb
        var pointerGeo = new THREE.CylinderGeometry( 5, 5, this.totalLength, 32, 1 );
        this.pointer = new THREE.Mesh( pointerGeo);
        this.pointer.position.x = this.totalLength / 2;
        this.pointer.rotation.z = -90 * Math.PI / 180;
        
        // Show the point the hand is placed at or pointing to
        this.cursor = new THREE.Mesh( new THREE.SphereGeometry( 20, 32, 32));
    }
    
    // Create a GUI for controlling the position and rotation of the limb
    // gui - a dat.gui object storing all controls in the scene
    this.buildController = function(gui) {
        var l = gui.addFolder("Arm controls");
        
        // Control the visibility of the guide objects
        var g = l.addFolder("Guides");
        g.add( this.controller, "showOLimit").name("Show outer limit");
        g.add( this.controller, "showILimit" ).name("Show inner limit");
        g.add( this.controller, "showPointer" ).name("Show pointer");
        g.add( this.controller, "showCursor" ).name("Show cursor");
    
        // Control the position of the hand
        var armLength = ikLimb.totalLength;
        var h = l.addFolder("Hand controls");
        h.add( this.controller, "handX", -armLength, armLength, 1).name("Hand x");
        h.add( this.controller, "handY", -armLength, armLength, 1).name("Hand y");
        h.add( this.controller, "handZ", -armLength, armLength, 1).name("Hand z");
        
        // Control the spin of the elbow
        l.add( this.controller, "elbowSpin", 0, 360, 1).name("Elbow spin");
        
        // Control the position of the limb in the scene
        var r = l.addFolder("Root controls");
        r.add( this.controller, "shoulderX", -500, 500, 1).name("Root x");
        r.add( this.controller, "shoulderY", -500, 500, 1).name("Root y");
        r.add( this.controller, "shoulderZ", -500, 500, 1).name("Root z");
    }
    
    // Update the position of the limb from the values set in the GUI
    // makeLengthAngleAxisTransform - the method to use in positioning the upper and lower limbs from their ends
    this.update = function(makeLengthAngleAxisTransform) {
    
        // Position root
        this.root.position.x = this.controller.shoulderX;
        this.root.position.y = this.controller.shoulderY;
        this.root.position.z = this.controller.shoulderZ;
        
        // Update cursor position
        this.cursor.position.x = this.controller.handX;
        this.cursor.position.y = this.controller.handY;
        this.cursor.position.z = this.controller.handZ;
        
        // Update guides
        // Display outer limit?
        if (this.controller.showOLimit) {
            this.outerLimit.material = this.limitMaterial;
        }
        else {
            this.outerLimit.material = this.invisibleMaterial;
        }
        
        // Display inner limit?
        if (this.controller.showILimit) {
            this.innerLimit.material = this.limitMaterial
        }
        else {
            this.innerLimit.material = this.invisibleMaterial;
        }
        
        // Display pointer?
        if (this.controller.showPointer) {
            this.pointer.material = this.pointerMaterial;
        }
        else {
            this.pointer.material = this.invisibleMaterial;
        }
        
        // Display cursor?
        if (this.controller.showCursor) {
            this.cursor.material = this.pointerMaterial;
        }
        else {
            this.cursor.material = this.invisibleMaterial;
        }
        
        // Constrain hand position
        var limit = new THREE.Vector3(this.controller.handX, this.controller.handY, this.controller.handZ);
        if (limit.length() > this.outerLimit.geometry.radius) {
            limit.setLength(this.outerLimit.geometry.radius - 0.01);
        }
        else if (limit.length() < this.innerLimit.geometry.radius) {
            limit.setLength(this.innerLimit.geometry.radius + 0.01);
        }
        
        // Calculate angles
        var xzTheta = -Math.atan(limit.z/limit.x);      // Negative to align with cursor
        var xzDistance = limit.x / Math.cos(xzTheta); 
        var xyTheta = Math.atan(limit.y/xzDistance);
        
        var rootToHandLength = xzDistance / Math.cos(xyTheta);
        var elbowTheta = Math.acos(
                (Math.pow(this.lowerLength, 2) - Math.pow(rootToHandLength, 2) - Math.pow(this.upperLength, 2))/
                (-2*rootToHandLength*this.upperLength)
            );
        
        // Calculate elbow position
        xzDistance = Math.cos(elbowTheta) * this.upperLength;
        var elbowY = Math.abs(Math.sin(elbowTheta)) * this.upperLength;
        
        // Adjust coordinates for -x location
        var negativeAdjust = 0;
        if (limit.x < 0) {
            xyTheta = -(xyTheta + Math.PI);
            xzTheta *= -1;
            negativeAdjust = Math.PI;
            
            // Negate the position of the elbow if needed
            var elbowX = xzDistance * Math.cos(xzTheta);  
            xzDistance = -elbowX / Math.cos(xzTheta);
        }
        
        // Set elbow position
        var elbowPos = new THREE.Vector3( xzDistance, elbowY, 0 );
        this.socket.rotation.x = this.controller.elbowSpin * Math.PI / 180;
        
        // Rotate limb
        this.limb.rotation.x = negativeAdjust;
        this.limb.rotation.y = xzTheta;
        this.limb.rotation.z = xyTheta;
        
        // Position upper limb
        makeLengthAngleAxisTransform(this.upperLimb, 
            elbowPos, new THREE.Vector3( 0, 0, 0 ));
        this.upperLimb.updateMatrixWorld(true);
        
        // Position lower limb
        makeLengthAngleAxisTransform(this.lowerLimb,
            elbowPos, new THREE.Vector3(Math.abs(rootToHandLength), 0, 0));
        this.lowerLimb.updateMatrixWorld(true);
    }
}