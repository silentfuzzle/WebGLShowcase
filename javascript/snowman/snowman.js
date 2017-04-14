// Create a snowman
// armMaterial - the THREE.Material to use for the snowman's arms
// snowMaterial - the THREE.Material to use for the snowman's body and head
// lowerBodyLength - the height of the snowman's lower body
// upperBodyLength - the height of the snowman's upper body
// armLength - the length of the snowman's arms
// headLength - the height of the snowman's head
// sphere - true if spheres should be used to build the body, false if cubes
function Snowman(armMaterial, snowMaterial, lowerBodyLength, upperBodyLength, armLength, headLength, spheres) {

    // Meshes
    this.head;
    this.leftArm;
    this.rightArm;
    this.upperBody;
    
    // Object3Ds used for pivoting the meshes
    this.leftArmPivot;
    this.rightArmPivot;
    this.upperBodyPivot;
    this.lowerBodyPivot;
    
    // Materials
    this.armMaterial = armMaterial;
    this.snowMaterial = snowMaterial;
    
    // Lengths and sizes
    this.headLength = headLength;
    this.armLength = armLength;
    this.upperBodyLength = upperBodyLength;
    this.lowerBodyLength = lowerBodyLength;
    this.spheres = spheres;
    
    // True if the body part should be attached
    // when the snowman is initialized
    this.attachHead = false;
    this.attachLeftArm = true;
    this.attachRightArm = true;
    this.attachUpperBody = true;
    
    // Creates the snowman's geometry
    this.buildGeometry = function() {
        this.head = this.buildPart(this.headLength);
            
        this.leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, this.armLength, 32),
            this.armMaterial);
            
        this.rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, this.armLength, 32),
            this.armMaterial);
            
        this.upperBody = this.buildPart(this.upperBodyLength);
    }
    
    // Creates a body part or head for the snowman
    // length - the height of the body part
    this.buildPart = function(length) {
        if (this.spheres) {
            // Create the body part with a sphere of diameter length
            return new THREE.Mesh(
                new THREE.SphereGeometry(
                    length / 2, 32, 32),
                this.snowMaterial);
        }
        else {
            // Create a cube of dimensions length x length x length
            return new THREE.Mesh(
                new THREE.CubeGeometry( 
                    length, length, length), 
                this.snowMaterial);
        }
    }
    
    // Builds the snowman with Object3Ds to rotate its parts with
    // attachHead - true if the head should be initialized as attached to the upper body
    // attachLeftArm - true if the left arm should be initialized as attached to the upper body
    // attachRightArm - true if the right arm should be initialized as attached to the upper body
    // attachUpperbody - true if the upper body should be initialized as attached to the lower body
    this.buildSkeleton = function(attachHead, attachLeftArm, attachRightArm, attachUpperBody) {
        // Set the variables that indicate which body parts are attached
        if (attachHead != undefined) {
            this.attachHead = attachHead;
        }
        if (attachLeftArm != undefined) {
            this.attachLeftArm = attachLeftArm;
        }
        if (attachRightArm != undefined) {
            this.attachRightArm = attachRightArm;
        }
        if (attachUpperBody != undefined) {
            this.attachUpperBody = attachUpperBody;
        }
        
        var snowmanLowerLength = this.lowerBodyLength;
        var snowmanUpperLength = this.upperBodyLength;
        
        // Create the lower body, which rotates about its center
        var snowmanLower = this.buildPart(snowmanLowerLength);
        this.lowerBodyPivot = new THREE.Object3D();
        this.lowerBodyPivot.add(snowmanLower);
        this.lowerBodyPivot.position.y = snowmanLowerLength / 2;
            
        // Create the upper body, which rotates about the center of the lower body
        this.upperBodyPivot = new THREE.Object3D();
        this.lowerBodyPivot.add(this.upperBodyPivot);
        this.upperBody.position.y = snowmanLowerLength / 2 + snowmanUpperLength / 2;
        this.upperBodyPivot.add(this.upperBody);
        
        // Create the left arm, which rotates about its end
        this.leftArm.position.y = this.armLength / 2;
        this.leftArmPivot = new THREE.Object3D();
        this.leftArmPivot.add(this.leftArm);
        this.leftArmPivot.rotation.x = 90 * Math.PI / 180;
        this.leftArmPivot.rotation.z = 90 * Math.PI / 180;
        this.leftArmPivot.position.x = -snowmanUpperLength / 2;
        this.leftArmPivot.position.y = snowmanLowerLength / 2 + snowmanUpperLength / 2;
        this.upperBodyPivot.add(this.leftArmPivot);
        
        // Create the right arm, which rotates about its end
        this.rightArm.position.y = -this.armLength / 2;
        this.rightArmPivot = new THREE.Object3D();
        this.rightArmPivot.add(this.rightArm);
        this.rightArmPivot.rotation.x = 90 * Math.PI / 180;
        this.rightArmPivot.rotation.z = 90 * Math.PI / 180;
        this.rightArmPivot.position.x = snowmanUpperLength / 2;
        this.rightArmPivot.position.y = snowmanLowerLength / 2 + snowmanUpperLength / 2;
        this.upperBodyPivot.add(this.rightArmPivot);
         
        if (this.attachHead) {
            // Create the head, which rotates about its center
            // and about the center of the upper body
            var headTurnPivot = new THREE.Object3D();
            headTurnPivot.add(this.head);
            headTurnPivot.position.y = snowmanUpperLength / 2 + this.headLength / 2;
            var headSlidePivot = new THREE.Object3D();
            headSlidePivot.position.y = snowmanLowerLength / 2 + snowmanUpperLength / 2;
            headSlidePivot.add(headTurnPivot);
            this.upperBodyPivot.add(headSlidePivot);
        }
        
        //lowerPivot.rotation.z = 45 * Math.PI / 180;
        //snowmanUpperPivot.rotation.x = 90 * Math.PI / 180;
        //leftArmPivot.rotation.y = 45 * Math.PI / 180;
        //rightArmPivot.rotation.z = 45 * Math.PI / 180;
        //headSlidePivot.rotation.x = 90 * Math.PI / 180;
        //headTurnPivot.rotation.y = 45 * Math.PI / 180;
    }
    
    // Adds the snowman's attached and detached parts to the scene
    // scene - the scene to add the snowman parts to
    this.addPartsToScene = function(scene) {
        if (!this.attachHead) {
            scene.add(this.head);
        }
        if (!this.attachLeftArm) {
            scene.add(this.leftArm);
        }
        if (!this.attachRightArm) {
            scene.add(this.rightArm);
        }
        if (!this.attachUpperBody) {
            scene.add(this.upperBodyPivot);
        }
        scene.add(this.lowerBodyPivot);
    }
    
    this.buildGeometry(spheres);
}