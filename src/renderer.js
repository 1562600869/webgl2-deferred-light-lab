import { createGL, program } from './glutil.js';
import { createUVSphere } from './mesh.js';

const SHADER_BASE = 'src/shaders/';

async function loadShader(name) {
  const res = await fetch(SHADER_BASE + name);
  if (!res.ok) throw new Error(`failed to load shader ${name}`);
  return res.text();
}

// Column-major mat4 helpers (Float32Array(16)).
function identity() {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}
function lookAt(eye, center, up) {
  const z = normalize(sub(eye, center));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  const m = identity();
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[12] = -dot(x, eye);
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[13] = -dot(y, eye);
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2]; m[14] = -dot(z, eye);
  return m;
}
function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function createColorTexture(gl, w, h, internalFormat = gl.RGBA8, type = gl.UNSIGNED_BYTE) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export async function init(canvas) {
  const gl = createGL(canvas);
  const width = canvas.width;
  const height = canvas.height;

  const [gbVert, gbFrag, ltVert, ltFrag] = await Promise.all([
    loadShader('gbuffer.vert.glsl'),
    loadShader('gbuffer.frag.glsl'),
    loadShader('light.vert.glsl'),
    loadShader('light.frag.glsl'),
  ]);
  const geoProgram = program(gl, gbVert, gbFrag);
  const lightProgram = program(gl, ltVert, ltFrag);

  // G-Buffer: albedo + normal + position, plus depth.
  // Normal/position need signed values: prefer RGBA16F, else pack into RGBA8.
  const packed = !gl.getExtension('EXT_color_buffer_float');
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const texAlbedo = createColorTexture(gl, width, height);
  const texNormal = packed
    ? createColorTexture(gl, width, height)
    : createColorTexture(gl, width, height, gl.RGBA16F, gl.HALF_FLOAT);
  const texPosition = packed
    ? createColorTexture(gl, width, height)
    : createColorTexture(gl, width, height, gl.RGBA16F, gl.HALF_FLOAT);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texAlbedo, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texNormal, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, texPosition, 0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
  const depthRb = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('G-Buffer framebuffer incomplete');
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Sphere VAO.
  const sphere = createUVSphere(32, 48);
  const sphereVao = gl.createVertexArray();
  gl.bindVertexArray(sphereVao);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const nrmBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  // Fullscreen triangle VAO.
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // Uniform locations.
  const uMVP = gl.getUniformLocation(geoProgram, 'uMVP');
  const uModel = gl.getUniformLocation(geoProgram, 'uModel');
  gl.useProgram(geoProgram);
  gl.uniform1f(gl.getUniformLocation(geoProgram, 'uPack'), packed ? 1 : 0);
  gl.useProgram(lightProgram);
  gl.uniform1i(gl.getUniformLocation(lightProgram, 'uAlbedo'), 0);
  gl.uniform1i(gl.getUniformLocation(lightProgram, 'uNormal'), 1);
  gl.uniform1i(gl.getUniformLocation(lightProgram, 'uPosition'), 2);
  gl.uniform1f(gl.getUniformLocation(lightProgram, 'uPack'), packed ? 1 : 0);
  const uCamPos = gl.getUniformLocation(lightProgram, 'uCamPos');
  const uLightPos = gl.getUniformLocation(lightProgram, 'uLightPos');
  const uLightColor = gl.getUniformLocation(lightProgram, 'uLightColor');
  const uIntensity = gl.getUniformLocation(lightProgram, 'uIntensity');
  const uExposure = gl.getUniformLocation(lightProgram, 'uExposure');
  const uShininess = gl.getUniformLocation(lightProgram, 'uShininess');

  const params = {
    exposure: 1.0,
    intensity: 1.5,
    shininess: 32,
    lightCount: 3,
    lights: [
      { position: [2.0, 1.5, 1.5], color: [1.0, 0.85, 0.7] },
      { position: [-2.0, 0.8, 1.0], color: [0.5, 0.7, 1.0] },
      { position: [0.0, 2.0, -2.0], color: [0.6, 1.0, 0.6] },
    ],
  };

  const model = identity();
  const proj = perspective(Math.PI / 4, width / height, 0.1, 100);

  function render(time = performance.now()) {
    const angle = time * 0.0004;
    const eye = [Math.sin(angle) * 3.2, 1.4, Math.cos(angle) * 3.2];
    const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const mvp = multiply(proj, multiply(view, model));

    // Pass 1: geometry into G-Buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(geoProgram);
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.uniformMatrix4fv(uModel, false, model);
    gl.bindVertexArray(sphereVao);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    // Pass 2: fullscreen lighting composite to default framebuffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(lightProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texAlbedo);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texNormal);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texPosition);
    gl.uniform3fv(uCamPos, eye);
    gl.uniform3fv(uLightPos, params.lights.flatMap((l) => l.position));
    gl.uniform3fv(uLightColor, params.lights.flatMap((l) => l.color));
    gl.uniform1f(uIntensity, params.intensity);
    gl.uniform1f(uExposure, params.exposure);
    gl.uniform1f(uShininess, params.shininess);
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  return {
    render,
    setParams(next = {}) {
      if (next.lights) params.lights = next.lights.slice(0, 3);
      for (const key of ['exposure', 'intensity', 'shininess']) {
        if (typeof next[key] === 'number' && Number.isFinite(next[key])) params[key] = next[key];
      }
    },
    capture() {
      render();
      return canvas.toDataURL('image/png');
    },
    getStats() {
      return {
        lightCount: params.lights.length,
        exposure: params.exposure,
        intensity: params.intensity,
      };
    },
  };
}
