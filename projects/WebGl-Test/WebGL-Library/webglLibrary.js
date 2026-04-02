function backgroundColor(gl, r, g, b, a) {
  gl.clearColor(r/255, g/255, b/255, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function triangle(x1, y1, x2, y2, x3, y3, r, g, b, a) {
  const triangleVertices = [
    (x1 / canvas.width) * 2 - 1, ((y1 / canvas.height) * 2 - 1) / 2,
    (x2 / canvas.width) * 2 - 1, ((y2 / canvas.height) * 2 - 1) / 2,
    (x3 / canvas.width) * 2 - 1, ((y3 / canvas.height) * 2 - 1) / 2
  ];
  const triangleVerticesCPUBuffer = new Float32Array(triangleVertices);

  const triangleGeoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCPUBuffer, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;

  uniform vec2 canvasSize;
  uniform vec2 shapeLocation;
  uniform float shapeSize;

  void main() {
    vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
    vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

    gl_Position = vec4(clipPosition, 0.0, 1.0);
  }`;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(${r/255}, ${g/255}, ${b/255}, ${a});
  }`;

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

  const shapeLocationUniform = gl.getUniformLocation(triangleShaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(triangleShaderProgram, "shapeSize");
  const canvasSizeUniform = gl.getUniformLocation(triangleShaderProgram, "canvasSize");
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    console.error("Failed to get uniform locations");
    return;
  }

  // Output merger - how to merge the shaded pixel fragment with the existing output image

  // Rasterizer - what pixels are part of a triangle
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set GPU program (vertex and fragment shader)
  gl.useProgram(triangleShaderProgram);

  const vertexPositionAttributeLocation = gl.getAttribLocation(triangleShaderProgram, "vertexPosition");
  if (vertexPositionAttributeLocation < 0) {
    console.error("Failed to get the attribute location for vertexPosition");
    return;
  }

  gl.enableVertexAttribArray(vertexPositionAttributeLocation);

  // Input assembler - how to read vertices from our GPU triangle buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.vertexAttribPointer(
    /*index=: which attribute to use*/
    vertexPositionAttributeLocation,
    /*size=: how many components in that attribute*/
    2,
    /*type=: what is the data type stored in the GPU buffer for this attribute*/
    gl.FLOAT,
    /*normalized=: determines how to convert ints to floats*/
    false,
    /*stride=: how many bytes to move forward into the buffer to find the same attribute for the next vertex*/
    0, //0 is automatic
    /*offset=: how many bytes should the input assembler skip into the buffer when reading attributes*/
    0
  );

  gl.uniform2f(canvasSizeUniform, canvas.width / 2, canvas.height / 2);

  gl.uniform1f(shapeSizeUniform, canvas.height);
  gl.uniform2f(shapeLocationUniform, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
