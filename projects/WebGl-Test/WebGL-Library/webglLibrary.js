function backgroundColor(gl, color) {
  gl.clearColor(color[0], color[1], color[2], color[3]);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function line(gl, x1, y1, x2, y2) {
  // Vertex shader source:
  // - Receives 2D line endpoints from JavaScript.
  // - Converts them into clip-space 4D coordinates for the GPU pipeline.
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader source:
  // - Runs for each pixel that makes up the line.
  // - Outputs white RGBA color for all pixels along the line.
  const fragmentShaderSource = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Helper function to compile a shader from source code.
  // Returns the compiled shader object or null if compilation fails.
  function createShader(shaderType, source) {
    // Create a shader object of the requested type (VERTEX_SHADER or FRAGMENT_SHADER).
    const shader = gl.createShader(shaderType);

    // Attach the GLSL source code string to the shader object.
    gl.shaderSource(shader, source);

    // Compile the GLSL source into GPU machine instructions.
    gl.compileShader(shader);

    // Validate compilation: check if any errors occurred during compilation.
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // If compilation failed, log the error message and clean up.
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    // Return the successfully compiled shader.
    return shader;
  }

  // Compile both required shaders: vertex and fragment.
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Abort if either shader failed to compile (return early to avoid errors).
  if (!vertexShader || !fragmentShader) {
    return;
  }

  // Create a program object that will hold the linked shader pipeline.
  const program = gl.createProgram();

  // Attach the compiled vertex shader to the program.
  gl.attachShader(program, vertexShader);

  // Attach the compiled fragment shader to the program.
  gl.attachShader(program, fragmentShader);

  // Link the two shaders together into a complete, executable GPU program.
  gl.linkProgram(program);

  // Check if linking succeeded; log errors and abort if it failed.
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  // Create a Float32Array containing the two endpoints of the line.
  // Each endpoint is a 2D point (x, y) in clip space [-1.0, 1.0].
  // Parameters x1, y1, x2, y2 are the line segment start and end points.
  const vertices = new Float32Array([
    x1, y1,  // Start point of the line
    x2, y2,  // End point of the line
  ]);

  // Create a GPU buffer object to hold vertex data on the graphics card.
  const buffer = gl.createBuffer();

  // Bind this buffer as the current ARRAY_BUFFER target for subsequent operations.
  // This tells WebGL where to store the vertex data.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Copy the vertex data from CPU memory (JavaScript) to GPU memory.
  // gl.STATIC_DRAW hints that this data will not change frequently.
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Retrieve the memory location of the `a_position` attribute in the shader program.
  // This location is used to connect CPU vertex data to the GPU shader.
  const positionLocation = gl.getAttribLocation(program, "a_position");

  // Set up the viewport to map clip space coordinates to canvas pixel coordinates.
  // Maps the entire canvas area for rendering.
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Direct WebGL to use this program for all subsequent drawing operations.
  gl.useProgram(program);

  // Enable the vertex attribute array so the shader can read data from the buffer.
  gl.enableVertexAttribArray(positionLocation);

  // Specify how the vertex data in the buffer is formatted:
  // - 2: Each vertex has 2 components (x and y).
  // - gl.FLOAT: Each component is a 32-bit floating-point number.
  // - false: Do not normalize the values.
  // - 0: No stride (tightly packed, no gap between vertices).
  // - 0: Start reading from byte offset 0 in the buffer.
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Draw the line using the two vertices in the buffer.
  // gl.LINE_STRIP connects consecutive vertices with line segments.
  // Starting from vertex 0, drawing 2 vertices total (the start and end points).
  gl.drawArrays(gl.LINE_STRIP, 0, 2);
}

function square(gl) {
  // Vertex shader source:
  // - Receives each 2D vertex position from JavaScript.
  // - Converts it into clip-space 4D coordinates for the GPU pipeline.
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader source:
  // - Runs for each pixel covered by the square.
  // - Outputs solid white RGBA color.
  const fragmentShaderSource = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Helper to compile a shader and return it.
  // Returns null if compilation fails.
  function createShader(shaderType, source) {
    // Create a shader object of the requested type.
    const shader = gl.createShader(shaderType);

    // Attach GLSL source code to the shader object.
    gl.shaderSource(shader, source);

    // Compile the shader source into GPU-understandable instructions.
    gl.compileShader(shader);

    // Check for compile errors so we can fail gracefully with diagnostics.
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    // Shader compiled successfully.
    return shader;
  }

  // Compile both shaders needed by the graphics pipeline.
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Stop if either shader failed to compile.
  if (!vertexShader || !fragmentShader) {
    return;
  }

  // Create a shader program and attach compiled shaders.
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link shaders into an executable GPU program.
  gl.linkProgram(program);

  // Check link status and report errors if program creation failed.
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  // Define four 2D corners of a centered square in clip space.
  // Coordinates in clip space range from -1.0 to 1.0.
  const vertices = new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,
    -0.5, 0.5,
  ]);

  // Create a GPU buffer to store vertex data.
  const buffer = gl.createBuffer();

  // Bind it as the current ARRAY_BUFFER target.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Upload vertex data from CPU memory to GPU memory.
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Find the location of `a_position` in the linked shader program.
  const positionLocation = gl.getAttribLocation(program, "a_position");

  // Map clip space output to the full canvas size.
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Tell WebGL to use this linked program for subsequent draw calls.
  gl.useProgram(program);

  // Enable the vertex attribute so the shader can read from the bound buffer.
  gl.enableVertexAttribArray(positionLocation);

  // Describe how buffer data is laid out for `a_position`:
  // - 2 components per vertex (x, y)
  // - Data type float
  // - No normalization
  // - No stride/padding between vertices
  // - Start at byte offset 0
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Draw the square as a fan of triangles using 4 vertices.
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}
