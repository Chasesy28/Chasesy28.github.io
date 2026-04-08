const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl2");

canvas.style.width = "100dvw";
canvas.style.height = "100dvh";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

if (!gl) {
  alert("WebGL not supported in this browser.");
}

//Stuff from tutorials

const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

uniform vec2 canvasSize;
uniform vec2 shapeLocation;
uniform float shapeSize;

void main() {
  fragmentColor = vertexColor;
  vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
  vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

  gl_Position = vec4(clipPosition, 0.0, 1.0);
}`;

const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1.0);
}`;

const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
const rgbTriangleColors = new Uint8Array([
  255, 0, 0,
  0, 255, 0,
  0, 0, 255
]);
const fireyTriangleColors = new Uint8Array([
  229, 47, 15,
  246, 206, 29,
  233, 154, 26
]);

function createStaticVertexBuffer(gl = WebGL2RenderingContext, data = ArrayBuffer) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buffer;
}

function createTwoBufferVAO(gl = WebGL2RenderingContext, positionBuffer = WebGLBuffer, colorBuffer = WebGLBuffer, positionAttribLocation = number, colorAttribLocation = number) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return vao;
}

class MovingShape {
  constructor() {
    this.position = [number, number];
    this.velocity = [number, number];
    this.size = number;
    this.vao = WebGLVertexArrayObject;
  }

  update(dt = number) {
    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;
  }
}

function helloTriangle() {
  const triangleGeoBuffer = createStaticVertexBuffer(gl, triangleVertices);
  const rgbTriangleColorBuffer = createStaticVertexBuffer(gl, rgbTriangleColors);
  const fireyTriangleColorBuffer = createStaticVertexBuffer(gl, fireyTriangleColors);

  if (!triangleGeoBuffer || !rgbTriangleColorBuffer || !fireyTriangleColorBuffer) {
    console.error("Failed to create buffers");
    return;
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("Fragment shader compilation error: " + gl.getShaderInfoLog(fragmentShader));
    return;
  }

  const triangleShaderProgram = gl.createProgram();
  gl.attachShader(triangleShaderProgram, vertexShader);
  gl.attachShader(triangleShaderProgram, fragmentShader);
  gl.linkProgram(triangleShaderProgram);
  if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)) {
    console.error("Shader program linking error: " + gl.getProgramInfoLog(triangleShaderProgram));
    return;
  }
  const vertexPositionAttributeLocation = gl.getAttribLocation(triangleShaderProgram, "vertexPosition");
  const vertexColorAttributeLocation = gl.getAttribLocation(triangleShaderProgram, "vertexColor");
  if (vertexPositionAttributeLocation < 0 || vertexColorAttributeLocation < 0) {
    console.error("Failed to get the attribute location for vertexPosition or vertexColor");
    return;
  }

  const shapeLocationUniform = gl.getUniformLocation(triangleShaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(triangleShaderProgram, "shapeSize");
  const canvasSizeUniform = gl.getUniformLocation(triangleShaderProgram, "canvasSize");
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    console.error("Failed to get uniform locations");
    return;
  }

  const rgbTriangleVAO = createTwoBufferVAO(gl, triangleGeoBuffer, rgbTriangleColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const fireyTriangleVAO = createTwoBufferVAO(gl, triangleGeoBuffer, fireyTriangleColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);

  if (!rgbTriangleVAO || !fireyTriangleVAO) {
    console.error("Failed to create VAOs");
    return;
  }

  const frame = function() {
    backgroundColor(gl, 20, 20, 20, 1.0);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set GPU program (vertex and fragment shader)
    gl.useProgram(triangleShaderProgram);

    // Draw call (Primitive assembler - how to make triangles from those vertices)
    gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    // First triangle
    gl.uniform1f(shapeSizeUniform, 100.0);
    gl.uniform2f(shapeLocationUniform, 300, 600);
    gl.bindVertexArray(rgbTriangleVAO);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Second triangle
    gl.uniform1f(shapeSizeUniform, 150.0);
    gl.uniform2f(shapeLocationUniform, 600, 300);
    gl.bindVertexArray(fireyTriangleVAO);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function loop() {
  backgroundColor(gl, 20, 20, 20, 1.0);
  let time = performance.now() / 1000; // Time in seconds
  let x1 = Math.sin(time) * 0.5 * Math.cos(time * 0.5);
  let y1 = Math.cos(time + 1) * 0.5 * Math.cos((time + 1) * 0.5);
  let x2 = Math.sin(time + 2) * 0.5 * Math.cos((time + 2) * 0.5);
  let y2 = Math.cos(time + 3) * 0.5 * Math.cos((time + 3) * 0.5);
  let x3 = Math.sin(time + 4) * 0.5 * Math.cos((time + 4) * 0.5);
  let y3 = Math.cos(time + 5) * 0.5 * Math.cos((time + 5) * 0.5);

  triangle(
    x1, y1,
    x2, y2,
    x3, y3,
    255, 0, 255, 1.0
  );



  requestAnimationFrame(loop);
}
//loop();
helloTriangle();
