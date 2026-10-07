/**
 * Raw WebGL (no three.js/ogl) — a single full-viewport triangle and a tiny
 * value-noise fragment shader. The whole effect is ~70 lines of GLSL/JS,
 * which is less code and no new dependency compared to pulling in a 3D
 * library just to draw one slowly drifting gradient.
 */

const VERTEX_SOURCE = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// Two octaves of value noise, "max ~12% brightness impact" per CLAUDE.md —
// the 0.12 multiplier at the end is the whole brightness budget.
const FRAGMENT_SOURCE = `
  precision mediump float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uAccent;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float t = uTime * 0.02;
    float n = noise(uv * 2.2 + vec2(t, -t * 0.6));
    n += 0.5 * noise(uv * 4.0 - vec2(t * 0.7, t * 0.3));
    float alpha = smoothstep(0.25, 0.9, n) * 0.12;
    gl_FragColor = vec4(uAccent * alpha, alpha);
  }
`

export interface AmbientShaderHandle {
  pause: () => void
  resume: () => void
  destroy: () => void
}

const DPR_CAP = 1.5
// "render at half resolution" — a second multiplier on top of the DPR cap.
const RESOLUTION_SCALE = 0.5

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function readAccentRgb(): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4ade80'
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return [0.29, 0.87, 0.5]
  return [Number.parseInt(match[1]!, 16) / 255, Number.parseInt(match[2]!, 16) / 255, Number.parseInt(match[3]!, 16) / 255]
}

/** Returns null if WebGL (or shader compilation) is unavailable — the caller falls back to a static CSS gradient. */
export function createAmbientShader(canvas: HTMLCanvasElement): AmbientShaderHandle | null {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' })
  if (!gl) return null

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  // One big triangle covering the whole clip-space viewport — cheaper than two triangles (a quad) for a full-screen pass.
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  const resolutionLocation = gl.getUniformLocation(program, 'uResolution')
  const timeLocation = gl.getUniformLocation(program, 'uTime')
  const accentLocation = gl.getUniformLocation(program, 'uAccent')
  const accent = readAccentRgb()

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, DPR_CAP) * RESOLUTION_SCALE
    const width = Math.max(1, Math.floor(window.innerWidth * scale))
    const height = Math.max(1, Math.floor(window.innerHeight * scale))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl!.viewport(0, 0, width, height)
  }
  resize()
  window.addEventListener('resize', resize)

  const startTime = performance.now()
  let rafId: number | null = null
  let isPaused = false

  function frame(now: number) {
    if (isPaused) return
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.uniform2f(resolutionLocation, canvas.width, canvas.height)
    gl!.uniform1f(timeLocation, (now - startTime) / 1000)
    gl!.uniform3f(accentLocation, accent[0], accent[1], accent[2])
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    rafId = requestAnimationFrame(frame)
  }

  function resume() {
    if (rafId !== null) return
    isPaused = false
    rafId = requestAnimationFrame(frame)
  }

  function pause() {
    isPaused = true
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // Deletes this instance's own GL objects but deliberately does NOT force
  // the context itself to be lost (WEBGL_lose_context): this component is a
  // singleton mounted once for the app's whole lifetime, and the only time
  // destroy() actually runs while the canvas stays in the DOM is React
  // StrictMode's dev-only mount->cleanup->mount double-invoke — losing the
  // context there poisons it before the second mount's getContext() call,
  // permanently tripping the "WebGL unavailable" fallback. A real unmount
  // (navigating away from the SPA entirely) reclaims the GPU context anyway.
  function destroy() {
    pause()
    window.removeEventListener('resize', resize)
    gl!.deleteProgram(program)
    gl!.deleteShader(vertexShader)
    gl!.deleteShader(fragmentShader)
    gl!.deleteBuffer(positionBuffer)
  }

  resume()
  return { pause, resume, destroy }
}
