// MultiJointModel.js (c) 2012 matsuda and itami
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n'+
'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Color = a_Color;\n' +  // Robot color
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_TexCoords = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
  // Normalize the normal because it is interpolated and not 1.0 in length any more
  'vec3 normal = normalize(v_Normal);\n' +
  // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
  // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
   // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse;\n' +
  '  if (u_UseTextures) {\n' +
  '     vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '     diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;\n' +
  '  vec3 ambient = u_AmbientLight * TexColor.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, TexColor.a);\n' +
  '  } else {\n' +
  '     diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '  }\n' +


  '}\n';

function main() {
  loadImages([
    "resources/rose.png",
    "resources/sofa.png",
    "resources/painting.png",
    "resources/wood1.png",
    "resources/whitebrick.png",
    "resources/woodplank.png",
    "resources/stalk.jpg",
    "resources/rope1.png"


  ], render);
}

function render() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }



  console.log('before initTextures');
  textures = initTextures(gl, n);
  console.log('after textures', textures);

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }


  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables
  window.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  window.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  window.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_ModelMatrix || a_Position < 0 || a_Normal < 0 || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) {
    console.log('Failed to get the storage location');
    return;
  }


  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 0.0, 3.0, 0.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);





  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, canvas); };

　draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, canvas); // Draw the robot arm
}

var textures;
var ANGLE_STEP = 3.0;     // The increments of rotation angle (degrees)
var g_ttJointAngle = 0.0; // The rotation angle of tabletop joint (degrees)
var POS_STEP = 0.35;
var g_chairPos = 6.5;
var g_eyeX = 20.0, g_eyeY = 0.0, g_eyeZ = 20.0; // Eye position
var g_lampMove = 0;




function keydown(ev, gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, canvas) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> move the lamp up
      if (g_lampMove < 2) g_lampMove += POS_STEP;
      break;
    case 38: // Down arrow key -> move the lamp down
      if (g_lampMove > -2) g_lampMove -= POS_STEP;
      break;
    case 39:
      if (g_eyeX < 27) {
        g_eyeX += 1;
        if (g_eyeX < 0) g_eyeZ += 0.4;
        if (g_eyeX > 0) g_eyeZ -= 0.4;
      }
      break;
    case 37:
      if (g_eyeX > -31) {
        g_eyeX -= 1;
        if (g_eyeX < 0) g_eyeZ -= 0.4;
        if (g_eyeX > 0) g_eyeZ += 0.4;
      }
      break;
    case 90: // 'ｚ'key -> the positive rotation of joint2
      if (g_chairPos > 3.5)(g_chairPos -= POS_STEP);
      break; 
    case 88: // 'x'key -> the negative rotation of joint2
      if (g_chairPos < 7.5)(g_chairPos += POS_STEP);
      break;
    case 86: // 'v'key -> the positive rotation of table flaps
      if (g_ttJointAngle < 180.0)  g_ttJointAngle = (g_ttJointAngle + ANGLE_STEP) % 360;
      break;
    case 67: // 'c'key -> the negative rotation of table flaps
      if (g_ttJointAngle > 0.0) g_ttJointAngle = (g_ttJointAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, canvas);
}

var g_cubeBuffer = null;     // Buffer object for cube
var g_trapBuffer = null;     // Buffer object for trapezium prism
var g_cubeNormalBuffer = null;     // Normal Buffer object for cube
var g_trapNormalBuffer = null;     // Normal Buffer object for trapezium prism
var g_upstrapNormalBuffer = null;     // Normal Buffer object for trapezium prism
var g_orangeBuffer = null;
var g_peachBuffer = null;


function initVertexBuffers(gl) {
  // Coordinates（Cube which length of one side is 1 with the origin on the center of the bottom)
  var vertices = new Float32Array([
    0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
    0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
    0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
   -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
    0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
  ]);

  var trapVertices = new Float32Array([
    1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -2.0, -1.0, -2.0,  2.0, -1.0, -2.0, // v0-v1-v2-v3 front
    1.0, 1.0, -1.0,  2.0, -1.0, -2.0,  2.0, -1.0, 2.0,  1.0, 1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 1.0, -1.0,  1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -2.0, -1.0, 2.0, -2.0, -1.0, -2.0, // v1-v6-v7-v2 left
    -2.0, -1.0, 2.0,  2.0, -1.0, 2.0, 2.0, -1.0, -2.0, -2.0, -1.0, -2.0, // v7-v4-v3-v2 down
    2.0, -1.0, 2.0, -2.0, -1.0, 2.0, -1.0, 1.0, 1.0,  1.0, 1.0, 1.0  // v4-v7-v6-v5 back
  ]);

  // Trap Normal
  var trapNormals = new Float32Array([
    0.0, -(2.0/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)),  0.0, -(2.0/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)),  0.0, -(2.0/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)),  0.0, -(2.0/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)), // v0-v1-v2-v3 front
    -(4.0/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0,  -(4.0/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0,  -(4.0/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0,  -(4.0/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -((-4.0)/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0, -((-4.0)/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0, -((-4.0)/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0, -((-4.0)/Math.sqrt(20)), -(2.0/Math.sqrt(20)), 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    -((-2.0)/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)), 0.0, -((-2.0)/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)), 0.0,  -((-2.0)/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)), 0.0,  -((-2.0)/Math.sqrt(20)), -((-4.0)/Math.sqrt(20)), 0.0  // v4-v7-v6-v5 back
  ]);

  var upstrapNormals = new Float32Array([
    0.0, (2.0/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)),  0.0, (2.0/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)),  0.0, (2.0/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)),  0.0, (2.0/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)), // v0-v1-v2-v3 front
    (4.0/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0,  (4.0/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0,  (4.0/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0,  (4.0/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0, // v0-v3-v4-v5 right
    0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0, // v0-v5-v6-v1 up
    ((-4.0)/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0, ((-4.0)/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0, ((-4.0)/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0, ((-4.0)/Math.sqrt(20)), (2.0/Math.sqrt(20)), 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    ((-2.0)/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)), 0.0, ((-2.0)/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)), 0.0,  ((-2.0)/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)), 0.0,  ((-2.0)/Math.sqrt(20)), ((-4.0)/Math.sqrt(20)), 0.0  // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0, 0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back

  ]);

  // Texture Coordinates
  var texCoord = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);

  var orange = new Float32Array([
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6,     // v0-v1-v2-v3 front
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6,      // v0-v3-v4-v5 right
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6,      // v0-v5-v6-v1 up
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6,      // v1-v6-v7-v2 left
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6,      // v7-v4-v3-v2 down
    0.8, 0.4, 0.6,  0.8, 0.4, 0.6,   0.8, 0.4, 0.6, 0.8, 0.4, 0.6 　    // v4-v7-v6-v5 back
  ]);

  var peach = new Float32Array([
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9,     // v0-v1-v2-v3 front
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9,      // v0-v3-v4-v5 right
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9,    // v0-v5-v6-v1 up
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9,     // v1-v6-v7-v2 left
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9,      // v7-v4-v3-v2 down
    1.0, 0.9, 0.9,   1.0, 0.9, 0.9,  1.0, 0.9, 0.9,  1.0, 0.9, 0.9  　    // v4-v7-v6-v5 back
  ]);


  g_cubeBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  g_trapBuffer = initArrayBufferForLaterUse(gl, trapVertices, 3, gl.FLOAT);
  // Write the vertex property to buffers (coordinates and normals)
  g_cubeNormalBuffer = initNormalBufferForLaterUse(gl, normals, gl.FLOAT, 3);
  g_trapNormalBuffer = initNormalBufferForLaterUse(gl, trapNormals, gl.FLOAT, 3);
  g_upstrapNormalBuffer = initNormalBufferForLaterUse(gl, upstrapNormals, gl.FLOAT, 3);
  g_orangeBuffer = initArrayBufferForLaterUse(gl, orange, 3, gl.FLOAT);
  g_peachBuffer = initArrayBufferForLaterUse(gl, peach, 3, gl.FLOAT);

  if (!g_peachBuffer ||!g_orangeBuffer ||!g_cubeBuffer || !g_trapBuffer || !g_cubeNormalBuffer || !g_trapNormalBuffer || !g_upstrapNormalBuffer  ) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  var textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);
  textureBuffer.itemSize = 2;
  textureBuffer.numItems = 24;

  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  return indices.length;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initNormalBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}


// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, canvas) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // ----------------------- TABLE -----------------------
  // Table legs
  var legHeight = 5.0;
  g_modelMatrix.setTranslate(-5.0, -12.0, 0.0);
  drawBox(gl, n, 2.0, legHeight, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer , -1);

  g_modelMatrix.translate(5, 0, 0);
  drawBox(gl, n, 2.0, legHeight, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  g_modelMatrix.translate(0, 0, -10);
  drawBox(gl, n, 2.0, legHeight, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  g_modelMatrix.translate(-5, 0, 0);
  drawBox(gl, n, 2.0, legHeight, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  // Table top
  g_modelMatrix.translate(2.5, legHeight, 5);
  drawBox(gl, n, 8.0, 0.5, 12.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  //Table top opening 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-4.0, 0.0, 0.0); // Move joint to end of table
  g_modelMatrix.rotate(g_ttJointAngle, 0.0, 0.0, 1.0);  // Rotate around the x-axis
  g_modelMatrix.translate(2.0, 0.0, 0.0);
  drawBox(gl, n, 4.0, 0.5, 12.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  g_modelMatrix = popMatrix();

  //Table top opening 2
  g_modelMatrix.translate(4.0, 0.0, 0.0); // Move joint to end of table
  g_modelMatrix.rotate(-g_ttJointAngle, 0.0, 0.0, 1.0);  // Rotate around the x-axis
  g_modelMatrix.translate(-2.0, 0.0, 0.0);
  drawBox(gl, n, 4.0, 0.5, 12.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  // ----------------------- CHAIR -----------------------
  //Chair base stand
  g_modelMatrix.setTranslate(g_chairPos, -12.0, -6.0);
  drawBox(gl, n, 0.5, 2.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair back
  g_modelMatrix.translate(3.0, 2.5, 0.0);
  drawBox(gl, n, 0.5, 3.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair seat
  g_modelMatrix.translate(-1.5, 0.0, 0.0);
  drawBox(gl, n, 3.5, 0.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair base
  g_modelMatrix.translate(0.0, -2.5, 0.0);
  drawBox(gl, n, 3.0, 0.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  // ----------------------- CHAIR 2 -----------------------
  //Chair base stand
  g_modelMatrix.setTranslate((-5.0 -g_chairPos), -12.0, -6.0); //initial x value is -11.5
  drawBox(gl, n, 0.5, 2.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair back
  g_modelMatrix.translate(-3.0, 2.5, 0.0);
  drawBox(gl, n, 0.5, 3.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair seat
  g_modelMatrix.translate(1.5, 0.0, 0.0);
  drawBox(gl, n, 3.5, 0.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  //Chair base
  g_modelMatrix.translate(0.0, -2.5, 0.0);
  drawBox(gl, n, 3.0, 0.5, 3, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);

  // ----------------------- DANGLING LIGHT  -----------------------
  //Dangling Bit
  g_modelMatrix.setTranslate(-2.5, 3- g_lampMove, -5);
  drawBox(gl, n, 0.5, 7 + g_lampMove, 0.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 7);
  //Lampshade
  g_modelMatrix.translate(0, -1, 0);
  drawBox(gl, n, 1, 1, 1, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_trapBuffer, g_trapNormalBuffer, g_orangeBuffer, -1);

  // ----------------------- TV STAND  -----------------------
  g_modelMatrix.setTranslate(-2.5, -12, -31);
  drawBox(gl, n, 18.0, 3.0, 6.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 3);

  //TV
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-3.0, 3.0, 1.0);
  drawBox(gl, n, 10.0, 7.0, 1.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  g_modelMatrix = popMatrix();

  //PLANT POT
  g_modelMatrix.translate(4.5, 5.0, 0.0); //Position with trap base on table
  g_modelMatrix.rotate(180.0, 0.0, 0.0, 1.0);
  drawBox(gl, n, 0.5, 2, 0.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_trapBuffer, g_upstrapNormalBuffer, g_orangeBuffer, -1);
  g_modelMatrix.rotate(180.0, 0.0, 0.0, 1.0);

  //FLOWERS
  //FLOWER 1
  pushMatrix(g_modelMatrix);
  //STALK
  g_modelMatrix.translate(-0.5, 2.0, -0.5);
  g_modelMatrix.rotate(20.0, 0.0, 0.0, 1.0);
  drawBox(gl, n, 0.2, 1, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 6);
  //FLOWER
  g_modelMatrix.translate(0.0, 1.2, 0.0);
  g_modelMatrix.rotate(180.0, 0.0, 0.0, 1.0);
  drawBox(gl, n, 0.2, 0.2, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_trapBuffer, g_upstrapNormalBuffer, g_orangeBuffer, 0);
  g_modelMatrix = popMatrix();

  //FLOWER 2
  pushMatrix(g_modelMatrix);
  //STALK
  g_modelMatrix.translate(-0.1, 2.0, 0.5);
  g_modelMatrix.rotate(15.0, 1.0, 0.0, 1.0);
  drawBox(gl, n, 0.2, 1, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 6);
  //FLOWER
  g_modelMatrix.translate(0.0, 1.2, 0.0);
  g_modelMatrix.rotate(180.0, 0.0, 0.0, 1.0);
  drawBox(gl, n, 0.2, 0.2, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_trapBuffer, g_upstrapNormalBuffer, g_orangeBuffer, 0);
  g_modelMatrix = popMatrix();

  //FLOWER 3
  //STALK
  g_modelMatrix.translate(0.4, 2.0, 0.3);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, -1.0);
  drawBox(gl, n, 0.2, 1, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 6);
  //FLOWER
  g_modelMatrix.translate(0.0, 1.2, 0.0);
  g_modelMatrix.rotate(180.0, 0.0, 0.0, 1.0);
  drawBox(gl, n, 0.2, 0.2, 0.2, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_trapBuffer, g_upstrapNormalBuffer, g_orangeBuffer, 0);

  // ----------------------- PAINTING  -----------------------

  g_modelMatrix.setTranslate(-2.5, 1.0, -35.25);
  drawBox(gl, n, 7.0, 5.0, 0.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, -1);
  g_modelMatrix.translate(0.0, 0.5, 0.3);
  drawBox(gl, n, 6.0, 4.0, 0.1, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 2);

  // ----------------------- SOFA  -----------------------
  //Sofa base
  g_modelMatrix.setTranslate(-18.5, -12.0, -17.0);
  g_modelMatrix.rotate(35.0 , 0, 1, 0);

  drawBox(gl, n, 8.0, 3.0, 10.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  //Sofa back
  g_modelMatrix.translate(-3.0, 3.0, 0.0);
  drawBox(gl, n, 2.0, 5.0, 10.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  //Arm 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(4.0, 0.0, 4.0);
  drawBox(gl, n, 6.0, 2.0, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  g_modelMatrix = popMatrix();
  //Arm 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(4.0, 0.0, -4.0);
  drawBox(gl, n, 6.0, 2.0, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  g_modelMatrix = popMatrix();

  // ----------------------- SOFA 2  -----------------------
  //Sofa base
  g_modelMatrix.setTranslate(17.5, -12.0, -17.0);
  g_modelMatrix.rotate(-145.0 , 0, 1, 0);

  drawBox(gl, n, 8.0, 3.0, 10.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  //Sofa back
  g_modelMatrix.translate(-3.0, 3.0, 0.0);
  drawBox(gl, n, 2.0, 5.0, 10.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  //Arm 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(4.0, 0.0, 4.0);
  drawBox(gl, n, 6.0, 2.0, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  g_modelMatrix = popMatrix();
  //Arm 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(4.0, 0.0, -4.0);
  drawBox(gl, n, 6.0, 2.0, 2.0, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_orangeBuffer, 1);
  g_modelMatrix = popMatrix();

  // ----------------------- WALLS   -----------------------
  //FRONT
  g_modelMatrix.setTranslate(-2.0, -12.0, 30.0);
  drawBox(gl, n, 60.0, 22.0, 0.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, 4);
  g_modelMatrix.translate(29.75, 0.0, -32.75);
  drawBox(gl, n, 0.5, 22.0, 65.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, 4);
  g_modelMatrix.translate(-59.5, 0.0, 0.0);
  drawBox(gl, n, 0.5, 22.0, 65.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, 4);
  g_modelMatrix.translate(29.75, 0.0, -33.0);
  drawBox(gl, n, 60.0, 22.0, 0.5, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, 4);

  // ----------------------- FLOOR   -----------------------
  g_modelMatrix.setTranslate(-2.0, -12.5, -2.0);
  drawBox(gl, n, 60.0, 0.5, 70, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, 5);

  //----------------------- CEILING   -----------------------
  g_modelMatrix.setTranslate(-2.0, 10.0, -2.0);
  drawBox(gl, n, 60.0, 0.5, 70, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, g_cubeBuffer, g_cubeNormalBuffer, g_peachBuffer, -1);
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw rectangular solid
function drawBox(gl, n, width, height, depth, viewProjMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, coordBuffer, normalBuffer, colorBuffer, num) {
  gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
  // Assign the buffer object to the attribute variable
  gl.vertexAttribPointer(a_Position, coordBuffer.num, coordBuffer.type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_Position);


  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_Normal);

  //Colour
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_Color);


  pushMatrix(g_modelMatrix);   // Save the model matrix
    // Scale a cube and draw
    g_modelMatrix.scale(width, height, depth);
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
   gl.uniformMatrix4fv(u_ModelMatrix, false, g_modelMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    if (num === -1) {
      // Enable texture mapping
      gl.uniform1i(u_UseTextures, false);
    } else {
      gl.uniform1i(u_UseTextures, true);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[num]);
    }

    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  g_modelMatrix = popMatrix();   // Retrieve the model matrix
}


function initTextures(gl, n) {
  console.log('in initTextures');
  window.u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
  if (!u_UseTextures) {
    console.log('Failed to get the storage location for texture map enable flag');
    return;
  }
  window.u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var textures = [];
  for (var ii = 0; ii < images.length; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    gl.uniform1i(u_Sampler, 0);

    // add the texture to the array of textures.
    textures.push(texture);
  }
  return textures;
}


function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}

var images = [];

function loadImages(urls, callback) {
  var imagesToLoad = urls.length;

  // Called each time an image finished loading.
  var onImageLoad = function() {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad == 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}