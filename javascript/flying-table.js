// globals
var gl;
var pwgl = {};
pwgl.listOfPressedKeys = [];
// Keep track of ongoing image loads to be able to handle lost context
pwgl.ongoingImageLoads = []; 
var canvas;

///////////////////////////////////////////////////////////////////////////////
//Lighting and shader setup methods
///////////////////////////////////////////////////////////////////////////////

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
      !gl.isContextLost()) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

function setupShaders() {
  var vertexShader = loadShaderFromDOM("shader-vs");
  var fragmentShader = loadShaderFromDOM("shader-fs");
  
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) &&
      !gl.isContextLost()) {
    alert("Failed to link shaders: " + gl.getProgramInfoLog(shaderProgram));
  }

  gl.useProgram(shaderProgram);
  pwgl.vertexPositionAttributeLoc = 
    gl.getAttribLocation(shaderProgram, "aVertexPosition"); 
    
  pwgl.vertexNormalAttributeLoc = 
    gl.getAttribLocation(shaderProgram, "aVertexNormal");
    
  pwgl.vertexTextureAttributeLoc = 
    gl.getAttribLocation(shaderProgram, "aTextureCoordinates");

  pwgl.uniformMVMatrixLoc = 
    gl.getUniformLocation(shaderProgram, "uMVMatrix");
    
  pwgl.uniformProjMatrixLoc = 
    gl.getUniformLocation(shaderProgram, "uPMatrix");
    
  pwgl.uniformNormalMatrixLoc = 
    gl.getUniformLocation(shaderProgram, "uNMatrix"); 
    
  pwgl.uniformSamplerLoc = 
    gl.getUniformLocation(shaderProgram, "uSampler");
    
  pwgl.uniformLightPositionLoc = 
    gl.getUniformLocation(shaderProgram, "uLightPosition");
    
  pwgl.uniformAmbientLightColorLoc = 
    gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    
  pwgl.uniformDiffuseLightColorLoc = 
    gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    
  pwgl.uniformSpecularLightColorLoc = 
    gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    
  gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
  gl.enableVertexAttribArray(pwgl.vertexNormalAttributeLoc);
  gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);
  
  pwgl.modelViewMatrix = mat4.create(); 
  pwgl.projectionMatrix = mat4.create();
  pwgl.modelViewMatrixStack = [];
}

///////////////////////////////////////////////////////////////////////////////
//Model buffer setup methods
///////////////////////////////////////////////////////////////////////////////

function setupFloorBuffers() {   
  pwgl.floorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexPositionBuffer);
  
  var floorVertexPosition = [
      // Plane in y=0
       5.0,   0.0,  5.0,  //v0
       5.0,   0.0, -5.0,  //v1
      -5.0,   0.0, -5.0,  //v2
      -5.0,   0.0,  5.0]; //v3
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition),
                gl.STATIC_DRAW);
  
  pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE = 3;
  pwgl.FLOOR_VERTEX_POS_BUF_NUM_ITEMS = 4;
  
  // Specify normals to be able to do lighting calculations
  pwgl.floorVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexNormalBuffer);
  
  var floorVertexNormals = [
       0.0,   1.0,  0.0,  //v0
       0.0,   1.0,  0.0,  //v1
       0.0,   1.0,  0.0,  //v2
       0.0,   1.0,  0.0]; //v3
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexNormals),
                gl.STATIC_DRAW);
  
  pwgl.FLOOR_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;
  pwgl.FLOOR_VERTEX_NORMAL_BUF_NUM_ITEMS = 4;
  
  // Setup texture coordinates buffer
  pwgl.floorVertexTextureCoordinateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexTextureCoordinateBuffer);
  var floorVertexTextureCoordinates = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexTextureCoordinates),
                gl.STATIC_DRAW);
  
  pwgl.FLOOR_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
  pwgl.FLOOR_VERTEX_TEX_COORD_BUF_NUM_ITEMS = 4;
  
  // Setup index buffer 
  pwgl.floorVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.floorVertexIndexBuffer);
  var floorVertexIndices = [0, 1, 2, 3];  
            
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorVertexIndices), 
                gl.STATIC_DRAW);

  pwgl.FLOOR_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
  pwgl.FLOOR_VERTEX_INDEX_BUF_NUM_ITEMS = 4;
}

function setupCubeBuffers() {
  pwgl.cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);
  
  var cubeVertexPosition = [
       // Front face
       1.0,  1.0,  1.0, //v0
      -1.0,  1.0,  1.0, //v1
      -1.0, -1.0,  1.0, //v2
       1.0, -1.0,  1.0, //v3

       // Back face
       1.0,  1.0, -1.0, //v4
      -1.0,  1.0, -1.0, //v5
      -1.0, -1.0, -1.0, //v6
       1.0, -1.0, -1.0, //v7
       
       // Left face
      -1.0,  1.0,  1.0, //v8
      -1.0,  1.0, -1.0, //v9
      -1.0, -1.0, -1.0, //v10
      -1.0, -1.0,  1.0, //v11
       
       // Right face
       1.0,  1.0,  1.0, //12
       1.0, -1.0,  1.0, //13
       1.0, -1.0, -1.0, //14
       1.0,  1.0, -1.0, //15
       
        // Top face
        1.0,  1.0,  1.0, //v16
        1.0,  1.0, -1.0, //v17
       -1.0,  1.0, -1.0, //v18
       -1.0,  1.0,  1.0, //v19
       
        // Bottom face
        1.0, -1.0,  1.0, //v20
        1.0, -1.0, -1.0, //v21
       -1.0, -1.0, -1.0, //v22
       -1.0, -1.0,  1.0, //v23
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexPosition),
                gl.STATIC_DRAW);

  pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE = 3;
  pwgl.CUBE_VERTEX_POS_BUF_NUM_ITEMS = 24;
  
  // Specify normals to be able to do lighting calculations
  pwgl.cubeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexNormalBuffer);
  
  var cubeVertexNormals = [
       // Front face
       0.0,  0.0,  1.0, //v0
       0.0,  0.0,  1.0, //v1
       0.0,  0.0,  1.0, //v2
       0.0,  0.0,  1.0, //v3

       // Back face
       0.0,  0.0, -1.0, //v4
       0.0,  0.0, -1.0, //v5
       0.0,  0.0, -1.0, //v6
       0.0,  0.0, -1.0, //v7
       
       // Left face
      -1.0,  0.0,  0.0, //v8
      -1.0,  0.0,  0.0, //v9
      -1.0,  0.0,  0.0, //v10
      -1.0,  0.0,  0.0, //v11
       
       // Right face
       1.0,  0.0,  0.0, //12
       1.0,  0.0,  0.0, //13
       1.0,  0.0,  0.0, //14
       1.0,  0.0,  0.0, //15
       
        // Top face
        0.0,  1.0,  0.0, //v16
        0.0,  1.0,  0.0, //v17
        0.0,  1.0,  0.0, //v18
        0.0,  1.0,  0.0, //v19
       
        // Bottom face
        0.0, -1.0,  0.0, //v20
        0.0, -1.0,  0.0, //v21
        0.0, -1.0,  0.0, //v22
        0.0, -1.0,  0.0, //v23
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexNormals),
                gl.STATIC_DRAW);

  pwgl.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;
  pwgl.CUBE_VERTEX_NORMAL_BUF_NUM_ITEMS = 24;
   
  // Setup buffer with texture coordinates
  pwgl.cubeVertexTextureCoordinateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);
  var textureCoordinates = [
    //Front face
    0.0, 0.0, //v0
    1.0, 0.0, //v1
    1.0, 1.0, //v2
    0.0, 1.0, //v3
    
    // Back face
    0.0, 1.0, //v4
    1.0, 1.0, //v5
    1.0, 0.0, //v6
    0.0, 0.0, //v7
    
    // Left face
    0.0, 1.0, //v8
    1.0, 1.0, //v9
    1.0, 0.0, //v10
    0.0, 0.0, //v11
    
    // Right face
    0.0, 1.0, //v12
    1.0, 1.0, //v13
    1.0, 0.0, //v14
    0.0, 0.0, //v15
    
    // Top face
    0.0, 1.0, //v16
    1.0, 1.0, //v17
    1.0, 0.0, //v18
    0.0, 0.0, //v19
    
    // Bottom face
    0.0, 1.0, //v20
    1.0, 1.0, //v21
    1.0, 0.0, //v22
    0.0, 0.0, //v23
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),gl.STATIC_DRAW);
  pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
  pwgl.CUBE_VERTEX_TEX_COORD_BUF_NUM_ITEMS = 24;
  
  pwgl.cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);
  var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 6, 5,      4, 7, 6,    // Back face
            8, 9, 10,     8, 10, 11,  // Left face
            12, 13, 14,   12, 14, 15, // Right face
            16, 17, 18,   16, 18, 19, // Top face
            20, 22, 21,   20, 23, 22  // Bottom face
        ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), 
                gl.STATIC_DRAW);
  pwgl.CUBE_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
  pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS = 36;
}

function setupBuffers() {
  setupFloorBuffers();
  setupCubeBuffers();
}

///////////////////////////////////////////////////////////////////////////////
//Texture setup methods
///////////////////////////////////////////////////////////////////////////////

function textureFinishedLoading(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, 
                image);
                
  gl.generateMipmap(gl.TEXTURE_2D);
  
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null); 
}

function loadImageForTexture(url, texture) {
  var image = new Image();
  image.onload = function() {
    pwgl.ongoingImageLoads.splice(pwgl.ongoingImageLoads.indexOf(image), 1);
    textureFinishedLoading(image, texture);
  }
  pwgl.ongoingImageLoads.push(image);
  image.src = url;
}

function setupTextures() {
  // Texture for the table
  pwgl.woodTexture = gl.createTexture();
  loadImageForTexture("./media/wood_128x128.jpg", pwgl.woodTexture);
 
  // Texture for the floor
  pwgl.groundTexture = gl.createTexture();
  loadImageForTexture("./media/metal_floor_256.jpg", pwgl.groundTexture);

  // Texture for the box on the table
  pwgl.boxTexture = gl.createTexture();
  loadImageForTexture("./media/wicker_256.jpg", pwgl.boxTexture);
}

///////////////////////////////////////////////////////////////////////////////
//Model building methods
///////////////////////////////////////////////////////////////////////////////

function pushModelViewMatrix() {
  var copyToPush = mat4.create(pwgl.modelViewMatrix);
  pwgl.modelViewMatrixStack.push(copyToPush);
}

function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(pwgl.uniformMVMatrixLoc, false, pwgl.modelViewMatrix);
}

function uploadNormalMatrixToShader() {
  var normalMatrix = mat3.create();
  mat4.toInverseMat3(pwgl.modelViewMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(pwgl.uniformNormalMatrixLoc, false, normalMatrix);
}

function popModelViewMatrix() {
  if (pwgl.modelViewMatrixStack.length == 0) {
    throw "Error popModelViewMatrix() - Stack was empty ";
  }
  pwgl.modelViewMatrix = pwgl.modelViewMatrixStack.pop();
}

function drawFloor() {
  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexPositionBuffer);
  gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc, 
                         pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE, 
                         gl.FLOAT, false, 0, 0);
                         
  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexNormalBuffer);
  gl.vertexAttribPointer(pwgl.vertexNormalAttributeLoc, 
                         pwgl.FLOOR_VERTEX_NORMAL_BUF_ITEM_SIZE,
                         gl.FLOAT, false, 0, 0);
                         
  // Bind texture coordinate buffer             
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexTextureCoordinateBuffer);
  gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc,
                         pwgl.FLOOR_VERTEX_TEX_COORD_BUF_ITEM_SIZE,
                         gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, pwgl.groundTexture);
 
  // Bind index buffer and draw the floor                    
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.floorVertexIndexBuffer);
  gl.drawElements(gl.TRIANGLE_FAN, pwgl.FLOOR_VERTEX_INDEX_BUF_NUM_ITEMS,
                gl.UNSIGNED_SHORT, 0);
}

function drawCube(texture) {
  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);
  gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc, 
                         pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE,
                         gl.FLOAT, false, 0, 0);
                         
  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexNormalBuffer);
  gl.vertexAttribPointer(pwgl.vertexNormalAttributeLoc, 
                         pwgl.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE,
                         gl.FLOAT, false, 0, 0);
  

  // Bind texture coordinate buffer                       
  gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);
  gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc,
                         pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE,
                         gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
        
  // Bind index buffer and draw cube
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);
        
  gl.drawElements(gl.TRIANGLES, pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS,
                  gl.UNSIGNED_SHORT, 0);
}

function drawTable(){
  // Draw a simple table by modifying the modelview matrix 
  // (translate and scale) and then use the function drawCube()
  // to draw a table top and four table legs.
 
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [0.0, pwgl.tablePosY, pwgl.tablePosZ], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [2.0, 0.1, 2.0], pwgl.modelViewMatrix); 
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  // Draw the actual cube (now scaled to a cuboid) with woodTexture
  drawCube(pwgl.woodTexture);
  
  mat4.scale(pwgl.modelViewMatrix, [0.5, 10.0, 0.5], pwgl.modelViewMatrix); 
  
  // Calculate the position for the box
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [0, 1.0, 0], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [0.5, 0.5, 0.5], pwgl.modelViewMatrix);
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  drawCube(pwgl.boxTexture);
  popModelViewMatrix();
  
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [1.9, -0.1, 1.9], pwgl.modelViewMatrix);
  mat4.rotate(pwgl.modelViewMatrix, pwgl.angle[0], [0,0,1], pwgl.modelViewMatrix);
  mat4.translate(pwgl.modelViewMatrix, [pwgl.scale, 0, 0], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [pwgl.scale, 0.1, 0.1], pwgl.modelViewMatrix);
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  drawCube(pwgl.woodTexture);
  popModelViewMatrix();
  
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [-1.9, -0.1, -1.9], pwgl.modelViewMatrix);
  mat4.rotate(pwgl.modelViewMatrix, pwgl.angle[1], [0,0,1], pwgl.modelViewMatrix);
  mat4.translate(pwgl.modelViewMatrix, [pwgl.scale, 0, 0], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [pwgl.scale, 0.1, 0.1], pwgl.modelViewMatrix);
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  drawCube(pwgl.woodTexture);
  popModelViewMatrix();
  
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [1.9, -0.1, -1.9], pwgl.modelViewMatrix);
  mat4.rotate(pwgl.modelViewMatrix, pwgl.angle[2], [0,0,1], pwgl.modelViewMatrix);
  mat4.translate(pwgl.modelViewMatrix, [pwgl.scale, 0, 0], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [pwgl.scale, 0.1, 0.1], pwgl.modelViewMatrix);
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  drawCube(pwgl.woodTexture);
  popModelViewMatrix();
  
  pushModelViewMatrix();
  mat4.translate(pwgl.modelViewMatrix, [-1.9, -0.1, 1.9], pwgl.modelViewMatrix);
  mat4.rotate(pwgl.modelViewMatrix, pwgl.angle[3], [0,0,1], pwgl.modelViewMatrix);
  mat4.translate(pwgl.modelViewMatrix, [pwgl.scale, 0, 0], pwgl.modelViewMatrix);
  mat4.scale(pwgl.modelViewMatrix, [pwgl.scale, 0.1, 0.1], pwgl.modelViewMatrix);
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  drawCube(pwgl.woodTexture);
  popModelViewMatrix();
  
  popModelViewMatrix();
}

///////////////////////////////////////////////////////////////////////////////
//Animation methods
///////////////////////////////////////////////////////////////////////////////

// Update the frame and animations
function draw(currentTime) { 
	handlePressedDownKeys();
  
	pwgl.requestId = requestAnimationFrame(draw);
	if (currentTime === undefined) {
		currentTime = Date.now();
	}
	  
	  // Update FPS if a second or more has passed since last FPS update
	if(currentTime - pwgl.previousFrameTimeStamp >= 1000) {
		pwgl.fpsCounter.innerHTML = pwgl.nbrOfFramesForFPS;
		pwgl.nbrOfFramesForFPS = 0;
		pwgl.previousFrameTimeStamp = currentTime;                    
	} 
 
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	mat4.perspective(60, gl.viewportWidth / gl.viewportHeight, 
                   1, 100.0, pwgl.projectionMatrix);
	mat4.identity(pwgl.modelViewMatrix);
	mat4.lookAt([8, 12, 8],[0, 0, 0], [0, 1,0], pwgl.modelViewMatrix);
  
	uploadModelViewMatrixToShader();
	gl.uniformMatrix4fv(pwgl.uniformProjMatrixLoc, 
			false, pwgl.projectionMatrix);
	uploadNormalMatrixToShader();
	gl.uniform1i(pwgl.uniformSamplerLoc, 0);
  
	drawFloor();
  
	//Animate legs, table, and box
  	
	// Determine which way and how fast to rotate the table legs to create a flying motion
    if ((pwgl.angle[0] > Math.PI/2) || (pwgl.angle[0] < -Math.PI/4)) {
    	pwgl.legsReverse *= -1;
    	if (pwgl.legsReverse == -1) {
    		pwgl.speed = 100;
    	}
    	else {
    		pwgl.speed = 200;
    	}
    }
    
    // Rotate the table legs
    pwgl.angle[0] += 2*Math.PI/pwgl.speed*pwgl.legsReverse;
    pwgl.angle[1] = -pwgl.angle[0]+Math.PI;
    pwgl.angle[2] = pwgl.angle[0];
    pwgl.angle[3] = -pwgl.angle[0]+Math.PI;
    
    if (pwgl.legsReverse == -1 && pwgl.scale < 3) {
    	// Shorten the table legs and raise the table as the legs rotate downward
    	pwgl.scale += 0.15;
    	pwgl.tablePosY += 0.1;
    }
    else if (pwgl.legsReverse == 1 && pwgl.scale > 1) {
    	// Lengthen the table legs and lower the table as the legs rotate upward
    	pwgl.scale -= 0.1;
    	pwgl.tablePosY -= 0.01;
    }
    else {
    	// The table sinks until the legs flap
    	pwgl.tablePosY -= 0.01;
    }
    
    // Increase or decrease the speed of the flap of the table legs
    if (pwgl.tablePosY < 1) {
    	pwgl.speed = 100;
    }
    else if (pwgl.tablePosY > 3) {
    	pwgl.speed = 400;
    }
    else if (pwgl.speed != 200) {
    	pwgl.speed = 200;
    }
  
	// Draw table
	pushModelViewMatrix();
	mat4.translate(pwgl.modelViewMatrix, [0.0, 1.1, 0.0], pwgl.modelViewMatrix);
	uploadModelViewMatrixToShader();
	uploadNormalMatrixToShader();
	drawTable();
	popModelViewMatrix();
  
	// Update number of drawn frames to be able to count fps
	pwgl.nbrOfFramesForFPS++;
}

// Move the table back and forth depending on what key the user has pressed
function handlePressedDownKeys() {
	if (pwgl.listOfPressedKeys[38]) {
		 // Arrow up, move table forwards
		 pwgl.tablePosZ -= 0.1;
	}
	if (pwgl.listOfPressedKeys[40]) {
		 // Arrow down, move table backwards
		 pwgl.tablePosZ += 0.1;
	}
}

///////////////////////////////////////////////////////////////////////////////
//Initialization methods
///////////////////////////////////////////////////////////////////////////////

// The method that runs when the webpage opens
function startup() {
  canvas = document.getElementById("myGLCanvas");
  canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
  
  // Add event listeners
  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
  document.addEventListener('keydown', handleKeyDown, false);
  document.addEventListener('keyup', handleKeyUp, false);
  
  gl = createGLContext(canvas);
  init();
  
  pwgl.fpsCounter = document.getElementById("fps");
  
  // Draw the complete scene  
  draw();
}

// Get the canvas to display graphics in webpage
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//Initialize the scene
function init() {
	// Initialization that is performed during first startup, but when the
	// event webglcontextrestored is received is included in this function.
	setupShaders(); 
	setupBuffers();
	setupLights();  
	setupTextures();
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Initialize some varibles for the moving box
	pwgl.angle = new Array();
	pwgl.angle[0] = 0;
	pwgl.legsReverse = 1;
	pwgl.scale = 1.0;
	pwgl.tablePosY = 1.0;
	pwgl.tablePosZ = 0.0;
	pwgl.tableRev = 1;
	pwgl.speed = 200;
	// Initialize some variables related to the animation
	pwgl.nbrOfFramesForFPS = 0;
	pwgl.previousFrameTimeStamp = Date.now();
}

function setupLights() {
  gl.uniform3fv(pwgl.uniformLightPositionLoc, [0.0, 20.0, 0.0]);
  gl.uniform3fv(pwgl.uniformAmbientLightColorLoc, [0.2, 0.2, 0.2]);
  gl.uniform3fv(pwgl.uniformDiffuseLightColorLoc, [0.7, 0.7, 0.7]);
  gl.uniform3fv(pwgl.uniformSpecularLightColorLoc, [0.8, 0.8, 0.8]);
}
 
///////////////////////////////////////////////////////////////////////////////
//Event handlers
///////////////////////////////////////////////////////////////////////////////

// Handle what happens when the application loses access to the GPU
function handleContextLost(event) {
  event.preventDefault();
  cancelRequestAnimFrame(pwgl.requestId);
  
   // Ignore all ongoing image loads by removing
   // their onload handler
   for (var i = 0; i < pwgl.ongoingImageLoads.length; i++) {
     pwgl.ongoingImageLoads[i].onload = undefined;
   }
   pwgl.ongoingImageLoads = [];
}

// Handle what happens when the application regains access to the GPU
function handleContextRestored(event) {
  init();
  pwgl.requestId = requestAnimFrame(draw,canvas);
}

// Add a key to the list of pressed keys
function handleKeyDown(event) {
  pwgl.listOfPressedKeys[event.keyCode] = true;
}

// Remove a key from the list of pressed keys
function handleKeyUp(event) {
  pwgl.listOfPressedKeys[event.keyCode] = false;
}
