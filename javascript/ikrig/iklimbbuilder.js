// Emily Palmieri
// CSCI 491
// Project 2
// 12-8-2014

// This class is used to build two-part limbs that are controlled by inverse kinematics.
function IKLimbBuilder() {
    
    // Code by Eric Haines
    // Positions a passed cylinder Mesh by its top and bottom
    // cyl - the Mesh to position
    // top - the position the top of the cylinder should be at
    // bottom - the position the bottom of the cylinder should be at
    this.makeLengthAngleAxisTransform = function( cyl, top, bottom )
    {
        // Find the length of the cylinder
        var distance = new THREE.Vector3();
        distance.subVectors(top, bottom);
        var length = distance.length();
        
        // Set the axis through the center of the cylinder
        var cylAxis = new THREE.Vector3().copy(distance);
        
        cyl.matrixAutoUpdate = false;

        // Place the center of the cylinder an equal distance from its end points
        distance.divideScalar(2);
        var center = new THREE.Vector3(distance.x + bottom.x, 
            distance.y + bottom.y, distance.z + bottom.z);
        cyl.matrix.makeTranslation( center.x, center.y, center.z );

        // Find the axis perpendicular to the vector 
        // from the bottom to the top of the cylinder
        var yAxis = new THREE.Vector3(0,1,0);
        cylAxis.normalize();
        var rotationAxis = new THREE.Vector3();
        rotationAxis.crossVectors( cylAxis, yAxis );
        if ( rotationAxis.length() < 0.000001 )
        {
            // Special case: if rotationAxis is just about zero, set to X axis,
            // so that the angle can be given as 0 or PI. This works ONLY
            // because we know one of the two axes is +Y.
            rotationAxis.set( 1, 0, 0 );
        }
        rotationAxis.normalize();

        // Determine how far to rotate the cylinder around the rotation axis
        // to place its top and bottom at the desired positions
        var theta = -Math.acos( cylAxis.dot( yAxis ) );
        
        // Apply the rotation around the rotation axis
        var rotMatrix = new THREE.Matrix4();
        rotMatrix.makeRotationAxis( rotationAxis, theta );
        cyl.matrix.multiply( rotMatrix );
    }
    
    // Returns a THREE.Mesh cone (CylinderGeometry) going from top to bottom positions
    // material - THREE.Material
    // radius - the radius of the capsule's cylinder
    // top, bottom - THREE.Vector3, top and bottom positions of cone
    this.createCylinderFromEnds = function( material, radiusTop, radiusBottom, top, bottom)
    {    
        var distance = new THREE.Vector3();
        distance.subVectors(top, bottom);
        var length = distance.length();
        
        var cylGeom = new THREE.CylinderGeometry( radiusTop, radiusBottom, length, 32 );
        var cyl = new THREE.Mesh( cylGeom, material );
        
        // Set the cylinder's initial position
        this.makeLengthAngleAxisTransform( cyl, top, bottom );

        return cyl;
    }

    // Creates and returns a limb controlled with inverse kinematics
    this.buildLimb = function() {

        var upperLength = 200;
        var lowerLength = 300;
        
        var ikLimb = new IKLimb(upperLength, lowerLength);
        
        // Build the ik limb's meshes
        this.rebuildLimb(ikLimb);
        
        return ikLimb;
    }
    
    // Creates a new set of meshes for the given ikLimb container object
    // ikLimb - The IKLimb object to generate new meshes for
    this.rebuildLimb = function(ikLimb) {

        // DEFINE MATERIALS AND PARAMETERS HERE
        var upperMaterial = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
        var lowerMaterial = new THREE.MeshLambertMaterial( { color: 0x0000FF } );
        
        var radiusTop = 30;
        var radiusBottom = 20;
        
        // Create limb meshes
        var upperLimb = this.createCylinderFromEnds( upperMaterial,
            radiusTop, radiusBottom,
            new THREE.Vector3( ikLimb.upperLength, 0, 0 ),
            new THREE.Vector3( 0, 0, 0 ));
        var lowerLimb = this.createCylinderFromEnds( lowerMaterial,
            radiusTop, radiusBottom,
            new THREE.Vector3( ikLimb.upperLength, 0, 0 ),
            new THREE.Vector3( ikLimb.totalLength, 0, 0 ));
            
        // Build the IK limb
        ikLimb.buildLimb(upperLimb, lowerLimb);
    }
}