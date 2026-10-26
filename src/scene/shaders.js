// GLSL for the map world. Colors are written in display space (no tone mapping).

export const MAX_LIGHTS = 28

const fogFn = /* glsl */ `
  float fogF(float depth, float d){ return 1. - exp(-d * d * depth * depth); }
`

const noise = /* glsl */ `
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`

export const floorVert = /* glsl */ `
  varying vec3 vW; varying float vDepth;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.);
    vW = w.xyz;
    vec4 mv = viewMatrix * w; vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

export const floorFrag = /* glsl */ `
  #define MAXL ${MAX_LIGHTS}
  uniform float uTime, uAmb, uGpt, uGem, uFog, uReveal;
  uniform vec3 uBg;
  uniform int uCount;
  uniform vec4 uL[MAXL];   // x, z, radius, intensity
  uniform vec3 uLC[MAXL];  // color
  uniform vec4 uRip;       // x, z, strength, -
  uniform vec2 uGptC, uGemC;
  varying vec3 vW; varying float vDepth;
  ${noise}
  ${fogFn}
  float line(float v, float w){ float fw = fwidth(v); return 1. - smoothstep(0., fw * w, abs(fract(v - .5) - .5)); }
  vec3 gemGrad(vec2 p){
    float t = clamp((p.x - uGemC.x) / 46. + .5 + (p.y - uGemC.y) / 90., 0., 1.);
    vec3 a = vec3(.28, .59, .89), b = vec3(.57, .47, .80), c = vec3(.82, .42, .50);
    return t < .5 ? mix(a, b, t * 2.) : mix(b, c, t * 2. - 1.);
  }
  void main(){
    vec2 p = vW.xz;
    vec3 light = vec3(0.);
    for (int i = 0; i < MAXL; i++){
      if (i >= uCount) break;
      vec4 L = uL[i];
      float d = length(p - L.xy);
      float core = 1. - smoothstep(0., L.z, d);
      float halo = exp(-d * d / (L.z * L.z * 3.2));
      light += uLC[i] * L.w * (core * core * .95 + halo * .32);
    }
    float gz = exp(-pow(length(p - uGptC) / 30., 2.));
    float mz = exp(-pow(length(p - uGemC) / 31., 2.));
    vec3 amb = vec3(.78, .82, .92) * gz * uGpt * (.085 + uAmb * .12) + gemGrad(p) * mz * uGem * (.11 + uAmb * .16) + vec3(.06, .055, .07) * uAmb;
    vec3 lit = light + amb;

    float h = fbm(p * .034 + 3.7);
    float hk = h * 15.;
    float cont = line(hk, 1.1);
    float contMajor = line(hk / 5., 1.4);
    float gMinor = max(line(p.x / 2., 1.), line(p.y / 2., 1.));
    float gMajor = max(line(p.x / 10., 1.3), line(p.y / 10., 1.3));
    float cross = (1. - smoothstep(.0, .35, abs(fract(p.x / 10. - .5) - .5) * 10.)) * (1. - smoothstep(.0, .35, abs(fract(p.y / 10. - .5) - .5) * 10.));

    vec3 col = uBg + vec3(.010, .009, .013) * (.6 + h);
    col += lit * (.42 + h * .25);
    col += lit * (gMinor * .22 + gMajor * .55);
    col += lit * (cont * .55 + contMajor * .5) * vec3(1., .78, .62);
    col += vec3(.035, .032, .04) * (gMajor * .5 + cross * .9) * (.35 + uReveal);
    col += vec3(.75, .45, .25) * contMajor * .018 * uReveal;

    float rd = length(p - uRip.xy);
    float ring = 1. - smoothstep(0., .22, abs(fract(rd / 5. - uTime * .35) - .5) * 5. - 2.25);
    col += vec3(1.) * uRip.z * ring * exp(-rd / 7.) * .32;

    col = mix(col, uBg, fogF(vDepth, uFog));
    gl_FragColor = vec4(col, 1.);
  }
`

export const beamVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vDepth;
  void main(){
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - w.xyz);
    vec4 mv = viewMatrix * w; vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

export const beamFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uI, uTime, uSeed, uFog;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vDepth;
  ${fogFn}
  void main(){
    float f = abs(dot(normalize(vN), normalize(vV)));
    float edge = pow(f, 2.2);
    float v = vUv.y;
    float a = edge * mix(.18, 1., pow(v, .8)) * smoothstep(0., .1, v) * smoothstep(1., .92, v);
    float flick = .92 + .08 * sin(uTime * 6.3 + uSeed * 20.) * sin(uTime * 2.7 + uSeed * 7.);
    float dust = .85 + .15 * sin(v * 40. - uTime * 1.5 + uSeed * 9.);
    gl_FragColor = vec4(uColor, a * uI * flick * dust * (1. - fogF(vDepth, uFog)));
  }
`

export const padVert = /* glsl */ `
  varying vec2 vUv; varying float vDepth;
  void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }
`

// node pedestal: rings + rotating ticks; uKind 0 = module, 1 = hub
export const padFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uA, uTime, uHover, uKind, uFog, uI;
  varying vec2 vUv; varying float vDepth;
  ${fogFn}
  float ring(float r, float c, float w){ return 1. - smoothstep(0., w, abs(r - c)); }
  void main(){
    vec2 p = vUv * 2. - 1.;
    float r = length(p);
    float ang = atan(p.y, p.x) / 6.28318 + .5;
    float a = 0.;
    if (uKind < .5){
      a += ring(r, .86, .035) * .9;
      a += ring(r, .62, .02) * step(.45, fract(ang * 24. + uTime * .04)) * .6;
      a += step(.92, r) * step(r, .99) * step(.72, fract(ang * 60. - uTime * .06)) * .45;
      a += exp(-r * r * 7.) * (.25 + uA * .9);
    } else {
      a += ring(r, .95, .012) * .8;
      a += ring(r, .78, .01) * step(.5, fract(ang * 72. + uTime * .02)) * .7;
      a += ring(r, .56, .018) * step(.3, fract(ang * 6. - uTime * .05)) * .8;
      a += ring(r, .34, .012) * .6;
      a += step(.82, r) * step(r, .9) * step(.86, fract(ang * 120. - uTime * .03)) * .5;
      a += exp(-r * r * 12.) * (.3 + uA * .7);
    }
    a *= smoothstep(1., .97, r);
    float k = (.28 + .72 * uA + .45 * uHover) * uI;
    gl_FragColor = vec4(uColor, a * k * (1. - fogF(vDepth, uFog)));
  }
`

export const routeVert = /* glsl */ `
  varying vec2 vUv; varying float vDepth;
  void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }
`

export const routeFrag = /* glsl */ `
  uniform float uProg, uTime, uFog, uGlow, uReveal, uBoost;
  uniform vec3 uCopper, uHot;
  varying vec2 vUv; varying float vDepth;
  ${fogFn}
  void main(){
    float u = vUv.x;
    float lit = 1. - smoothstep(uProg - .0015, uProg + .0015, u);
    float dash = step(.55, fract(u * 260.));
    float flow = pow(max(0., 1. - abs(fract(u * 34. - uTime * .22) - .5) * 9.), 3.);
    float head = exp(-pow((u - uProg) * 140., 2.));
    // a comet that keeps circling the ∞ (strongest in the wide shots)
    float comet = pow(max(0., 1. - fract(u * 2. - uTime * .045) * 7.), 2.5) * (1. - lit);
    vec3 col = uCopper * mix(uGlow > .5 ? .8 : dash * .5, 1., lit) + uHot * (lit * flow * (.9 + uBoost) + head * 2.4 + comet * uBoost * 2.2);
    col *= 1. + uBoost * 1.2;
    float a = uGlow > .5 ? (1. - abs(vUv.y - .5) * 2.) : 1.;
    // the glow ribbon: bright where travelled, a faint ∞ everywhere else
    a = uGlow > .5
      ? pow(a, 2.5) * .5 * (lit * (.7 + uBoost * 1.3) + head + (1. - lit) * (.12 + uBoost * .7 * max(0., 1. - uProg * 2.2)) * max(uReveal, .5) + comet * uBoost * 1.6)
      : max(max(lit, dash * .5 * uReveal), comet * uBoost);
    gl_FragColor = vec4(col, a * (1. - fogF(vDepth, uFog)));
  }
`

export const dustVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime, uPx;
  varying float vA; varying float vX;
  void main(){
    vec3 p = position;
    p.y += sin(uTime * .25 + aSeed * 40.) * .6;
    p.x += cos(uTime * .2 + aSeed * 30.) * .5;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (.5 + aSeed * 1.6) * uPx * (60. / -mv.z);
    vA = (.25 + .75 * (.5 + .5 * sin(uTime * (.5 + aSeed) + aSeed * 50.))) * smoothstep(2., 10., -mv.z) * (1. - smoothstep(120., 230., -mv.z));
    vX = p.x;
  }
`

export const dustFrag = /* glsl */ `
  uniform float uGpt, uGem, uAmb;
  varying float vA; varying float vX;
  void main(){
    vec2 c = gl_PointCoord - .5; float d = length(c);
    float a = smoothstep(.5, 0., d) * vA;
    float side = smoothstep(-8., 8., vX);
    vec3 col = mix(vec3(.85, .9, 1.) * (.25 + uGpt), vec3(.6, .62, 1.) * (.25 + uGem), side);
    gl_FragColor = vec4(col, a * (.35 + uAmb * .6 + max(uGpt * (1. - side), uGem * side) * .5));
  }
`

// Gemini-territory star glints (generic four-point flare)
export const glintVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime, uPx;
  varying float vA; varying float vT;
  void main(){
    vec3 p = position; p.y += sin(uTime * .4 + aSeed * 20.) * .5;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    float tw = pow(.5 + .5 * sin(uTime * (.6 + aSeed * .8) + aSeed * 60.), 6.);
    gl_PointSize = (3. + aSeed * 5.) * uPx * (70. / -mv.z) * (.4 + tw);
    vA = tw; vT = aSeed;
  }
`

export const glintFrag = /* glsl */ `
  uniform float uGem;
  varying float vA; varying float vT;
  void main(){
    vec2 p = (gl_PointCoord - .5) * 2.;
    float s = exp(-abs(p.x) * 14.) * exp(-abs(p.y) * 2.2) + exp(-abs(p.y) * 14.) * exp(-abs(p.x) * 2.2);
    s += exp(-dot(p, p) * 18.) * .8;
    vec3 col = mix(vec3(.45, .7, 1.), vec3(.95, .6, .75), vT);
    gl_FragColor = vec4(col, s * vA * uGem);
  }
`

// token stream: billboarded text quads rising from the active node
export const tokenVert = /* glsl */ `
  attribute vec4 aData; // token index, seed, angle, speed
  uniform float uTime, uCols, uRows, uSet;
  uniform vec3 uOrigin;
  varying vec2 vUv; varying float vA;
  void main(){
    float t = fract(uTime * aData.w * .05 + aData.y);
    // orbit the front half of the pedestal (toward the camera) so tokens never sit behind the floating card
    float ang = mix(.1, .9, fract(aData.z / 6.2832)) * 3.14159 + (t - .5) * .5;
    float rad = 3.4 + t * 5.;
    vec3 c = uOrigin + vec3(cos(ang) * rad, .35 + sin(t * 3.14159) * 1.4, sin(ang) * rad);
    vec4 mv = viewMatrix * vec4(c, 1.);
    float sc = .8 + fract(aData.y * 7.) * .3;
    mv.xy += position.xy * vec2(2., .5) * sc;
    gl_Position = projectionMatrix * mv;
    float idx = aData.x + uSet * 16.;
    vec2 cell = vec2(mod(idx, uCols), floor(idx / uCols));
    vUv = vec2((cell.x + uv.x) / uCols, 1. - (cell.y + 1. - uv.y) / uRows);
    vA = smoothstep(0., .12, t) * (1. - smoothstep(.55, 1., t));
  }
`

export const tokenFrag = /* glsl */ `
  uniform sampler2D uAtlas; uniform float uI; uniform vec3 uTint;
  varying vec2 vUv; varying float vA;
  void main(){
    float a = texture2D(uAtlas, vUv).a;
    gl_FragColor = vec4(uTint, a * vA * uI);
  }
`
