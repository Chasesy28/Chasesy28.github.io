function backgroundColor(gl, r, g, b, a) {
  gl.clearColor(r/255, g/255, b/255, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
