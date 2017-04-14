// Animate a snowman part from its current position to a passed final position and rotation
// finalPX, finalPY, finalPZ - the part's (x, y, z) position at the end of the animation
// finalRX, finalRY, finalRZ - the part's (x, y, z) rotation at the end of the animation
// snowmanPart - the THREE object to animate
// current - the object storing the part's position and animation during the animation, if defined
// duration - the among of time to animate over
function createPartTween(finalPX, finalPY, finalPZ, finalRX, finalRY, finalRZ, snowmanPart, current, duration) {
    // If attributes of the final position or rotation are undefined,
    // assign it to the the current state of the snowman part
    if (finalPX == undefined) {
        finalPX = snowmanPart.position.x;
    }
    if (finalPY == undefined) {
        finalPY = snowmanPart.position.y;
    }
    if (finalPZ == undefined) {
        finalPZ = snowmanPart.position.z;
    }
    if (finalRX == undefined) {
        finalRX = snowmanPart.rotation.x;
    }
    if (finalRY == undefined) {
        finalRY = snowmanPart.rotation.y;
    }
    if (finalRZ == undefined) {
        finalRZ = snowmanPart.rotation.z;
    }
    if (duration == undefined) {
        duration = 1000;
    }
    
    // Create an object for animating the position and rotation
    // if one hasn't been created
    if (current == undefined) {
        current = currentObject(
            snowmanPart.position.x,
            snowmanPart.position.y,
            snowmanPart.position.z,
            snowmanPart.rotation.x,
            snowmanPart.rotation.y,
            snowmanPart.rotation.z);
    }

    // Create an object storing the final position to animate to
	var finalPartPosition = currentObject( finalPX, finalPY, finalPZ, finalRX, finalRY, finalRZ);
    
    // Create and return a basic Tween object to perform the animation
    var tweenPart = new TWEEN.Tween(current).to(finalPartPosition, duration );
	tweenPart.onUpdate(function() { updateSnowmanPart(snowmanPart, current); });
	tweenPart.easing(TWEEN.Easing.Cubic.In);
    
    return tweenPart;
}

// Create and return an object that stores the current position and rotation
// of a snowman part over the course of an animation
// xPos, yPos, zPos - the (x, y, z) position this object is initialized to
// xRot, yRot, zRot - the (x, y, z) rotation this object is initialized to
function currentObject(xPos, yPos, zPos, xRot, yRot, zRot) {
    var current = {
        xPos: xPos,
        yPos: yPos,
        zPos: zPos,
        xRot: xRot,
        yRot: yRot,
        zRot: zRot
    };
    
    return current;
}

// Updates the position and rotation of a snowman part while an animation is occurring
// snowmanPart - the snowman part to move to the updated position and rotation
// current - the object storing the updated position and rotation
function updateSnowmanPart(snowmanPart, current) {
    snowmanPart.position.x = current.xPos;
    snowmanPart.position.y = current.yPos;
    snowmanPart.position.z = current.zPos;
    snowmanPart.rotation.x = current.xRot;
    snowmanPart.rotation.y = current.yRot;
    snowmanPart.rotation.z = current.zRot;
}