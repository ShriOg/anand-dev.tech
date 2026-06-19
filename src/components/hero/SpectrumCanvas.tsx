"use client";

import { useEffect, useRef } from "react";

const VS = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FS = `
precision mediump float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_scroll;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.1;
    a *= 0.5;
  }
  return v;
}

vec2 warp(vec2 p, float t, float pull) {
  vec2 center = vec2(0.5, 0.5) + (u_mouse - 0.5) * 0.12;
  p = mix(p, p + (center - p) * 0.5, pull * 0.7);
  float q1 = fbm(p + vec2(0.0, t * 0.03));
  float q2 = fbm(p + vec2(5.2, t * 0.025));
  return p + vec2(q1, q2) * 0.38;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.7;
  float pull = smoothstep(0.0, 0.8, u_scroll);

  vec2 w = warp(p, t, pull);

  float mb = u_mouse.x;

  vec3 c0 = vec3(1.00, 0.30, 0.30); // red
  vec3 c1 = vec3(1.00, 0.55, 0.00); // orange
  vec3 c2 = vec3(1.00, 0.84, 0.00); // yellow
  vec3 c3 = vec3(0.00, 0.90, 0.46); // green
  vec3 c4 = vec3(0.00, 0.90, 1.00); // cyan
  vec3 c5 = vec3(0.39, 0.40, 0.95); // indigo
  vec3 c6 = vec3(0.75, 0.52, 0.99); // violet

  float w0 = smoothstep(0.0, 0.65, fbm(w + vec2(0.0,  1.7) + t*0.04)) * (1.2 - mb);
  float w1 = smoothstep(0.0, 0.65, fbm(w + vec2(3.2,  5.1) + t*0.05)) * (1.1 - mb);
  float w2 = smoothstep(0.0, 0.65, fbm(w + vec2(7.4,  2.3) + t*0.03)) * 0.85;
  float w3 = smoothstep(0.0, 0.65, fbm(w + vec2(1.8,  8.6) + t*0.06)) * 0.9;
  float w4 = smoothstep(0.0, 0.65, fbm(w + vec2(6.3,  0.9) + t*0.04)) * (0.2 + mb);
  float w5 = smoothstep(0.0, 0.65, fbm(w + vec2(2.7,  4.4) + t*0.05)) * (0.1 + mb);
  float w6 = smoothstep(0.0, 0.65, fbm(w + vec2(9.1,  7.2) + t*0.04)) * (0.1 + mb);

  float total = w0+w1+w2+w3+w4+w5+w6;
  vec3 col = vec3(0.0);
  if (total > 0.001) {
    col = (c0*w0 + c1*w1 + c2*w2 + c3*w3 + c4*w4 + c5*w5 + c6*w6) / total;
  }

  vec2 cp = vec2(0.5 * aspect, 0.5);
  float d = distance(p, cp);
  float vig = smoothstep(1.1 * aspect, 0.15, d);
  float centerGlow = pow(smoothstep(0.7, 0.0, d), 2.5);

  vec3 bg = vec3(0.012, 0.008, 0.04);
  col = mix(bg, col, vig * 0.9);
  col += vec3(1.0, 0.95, 0.9) * centerGlow * pull * 0.5;

  float fade = smoothstep(1.0, 0.7, u_scroll);
  col *= fade;

  gl_FragColor = vec4(col, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export function SpectrumCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, VS);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime   = gl.getUniformLocation(prog, "u_time");
    const uRes    = gl.getUniformLocation(prog, "u_res");
    const uMouse  = gl.getUniformLocation(prog, "u_mouse");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");

    const mouse   = { x: 0.5, y: 0.5 };
    const smoothM = { x: 0.5, y: 0.5 };
    let scroll    = 0;
    const start   = performance.now();
    let raf: number;
    let w = 0, h = 0;

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      if (canvas.width !== window.innerWidth * dpr || canvas.height !== window.innerHeight * dpr) {
        w = canvas.width  = window.innerWidth  * dpr;
        h = canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      resize();
      smoothM.x += (mouse.x - smoothM.x) * 0.04;
      smoothM.y += (mouse.y - smoothM.y) * 0.04;
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uMouse, smoothM.x, smoothM.y);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
      aria-hidden="true"
    />
  );
}
