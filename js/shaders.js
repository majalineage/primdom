/**
 * Shaders for PrimDom Hero Interactive Day/Night Showcase
 */

export const simplexNoise2D = /* glsl */ `
vec3 permute(vec3 x) { 
  return mod(((x * 34.0) + 1.0) * x, 289.0); 
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
   -0.577350269189626,
    0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export const quadVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fluidSimFragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPrevTrail;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform vec2 uVelocity;
uniform float uAspect;
uniform float uTime;
uniform float uPointerActive;
uniform float uRadius;
uniform float uDecay;

${simplexNoise2D}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 aspectVec = vec2(uAspect, 1.0);
  vec2 uvAspect = vUv * aspectVec;
  vec2 mouseAspect = uMouse * aspectVec;
  vec2 prevMouseAspect = uPrevMouse * aspectVec;

  vec4 prevSample = texture2D(uPrevTrail, vUv);
  vec2 prevVel = (prevSample.gb - 0.5) * 2.0;

  // Organic fluid advection along movement with noise
  float curl = snoise(vUv * 4.2 + vec2(uTime * 0.16, -uTime * 0.12));
  vec2 curlDir = vec2(cos(curl * 3.14159), sin(curl * 3.14159)) * 0.00075;
  vec2 advectedUv = clamp(vUv - prevVel * 0.0042 + curlDir, 0.001, 0.999);

  // 5-tap diffusion
  vec4 c = texture2D(uPrevTrail, advectedUv);
  vec4 n = texture2D(uPrevTrail, advectedUv + vec2(0.0, 0.0028));
  vec4 s = texture2D(uPrevTrail, advectedUv - vec2(0.0, 0.0028));
  vec4 e = texture2D(uPrevTrail, advectedUv + vec2(0.0028, 0.0));
  vec4 w = texture2D(uPrevTrail, advectedUv - vec2(0.0028, 0.0));
  vec4 blurred = (c * 4.0 + n + s + e + w) / 8.0;

  // Distortion around cursor
  float n1 = snoise(uvAspect * 3.2 - uTime * 0.35) * 0.036;
  float n2 = snoise(uvAspect * 7.5 + uTime * 0.52) * 0.016;
  float dist = sdSegment(uvAspect, prevMouseAspect, mouseAspect) + n1 + n2;

  float speed = length(uVelocity);
  float baseRadius = uRadius * (1.0 + clamp(speed * 4.0, 0.0, 0.35));

  float brushCore = (1.0 - smoothstep(baseRadius * 0.35, baseRadius, dist)) * uPointerActive;
  float brushOuter = (1.0 - smoothstep(baseRadius * 0.15, baseRadius * 1.25, dist)) * uPointerActive;

  float reliefWave = exp(-pow((dist - baseRadius * 0.72) / (baseRadius * 0.22), 2.0)) * uPointerActive;

  float reveal = max(blurred.r * uDecay - 0.003, brushCore);
  reveal = clamp(reveal, 0.0, 1.0);

  vec2 newVel = mix(prevVel * 0.90, clamp(uVelocity * 14.0, -1.0, 1.0), brushOuter * 0.7);
  vec2 encodedVel = clamp(newVel * 0.5 + 0.5, 0.0, 1.0);

  float ripple = max(blurred.a * 0.91 - 0.004, reliefWave * (0.65 + clamp(speed * 12.0, 0.0, 0.45)));

  gl_FragColor = vec4(reveal, encodedVel.x, encodedVel.y, clamp(ripple, 0.0, 1.0));
}
`;

export const basReliefVertexShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uFluidMap;
uniform float uReliefLift;
uniform float uRippleLift;

void main() {
  vUv = uv;
  vec4 fluid = texture2D(uFluidMap, uv);
  float reveal = fluid.r;
  float ripple = fluid.a;
  vec2 fluidVel = (fluid.gb - 0.5) * 2.0;

  vec3 pos = position;
  pos.z += (reveal * uReliefLift + ripple * uRippleLift);
  pos.xy += fluidVel * 0.0008 * reveal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const basReliefFragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uDayTex;
uniform sampler2D uNightTex;
uniform sampler2D uFluidMap;
uniform vec2 uResolution;
uniform vec2 uImageAspect;
uniform vec2 uMouse;
uniform float uTime;
uniform float uLightZ;
uniform float uNormalStrength;
uniform float uManualNight; // 0.0 = Day, 1.0 = Night

${simplexNoise2D}

vec2 getCoverUv(vec2 uv, vec2 screenRes, vec2 imgAspect) {
  float screenAspect = screenRes.x / max(screenRes.y, 1.0);
  float texAspect = imgAspect.x / max(imgAspect.y, 1.0);
  vec2 scale = vec2(1.0);
  if (screenAspect > texAspect) {
    scale.y = texAspect / screenAspect;
  } else {
    scale.x = screenAspect / texAspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

float getLuma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 baseUv = getCoverUv(vUv, uResolution, uImageAspect);

  vec4 fluid = texture2D(uFluidMap, vUv);
  float trail = fluid.r;
  vec2 fluidVel = (fluid.gb - 0.5) * 2.0;
  float ripple = fluid.a;

  // Fast-path when completely idle and stable
  if (trail < 0.003 && ripple < 0.003) {
    if (uManualNight < 0.003) {
      vec3 pureDay = texture2D(uDayTex, baseUv).rgb;
      gl_FragColor = vec4(pureDay, 1.0);
      return;
    } else if (uManualNight > 0.997) {
      vec3 pureNight = texture2D(uNightTex, baseUv).rgb;
      gl_FragColor = vec4(pureNight, 1.0);
      return;
    }
  }

  // Wave gradient along cursor movement
  vec2 texel = 1.0 / uResolution;
  float fL = texture2D(uFluidMap, vUv - vec2(texel.x * 3.0, 0.0)).r;
  float fR = texture2D(uFluidMap, vUv + vec2(texel.x * 3.0, 0.0)).r;
  float fB = texture2D(uFluidMap, vUv - vec2(0.0, texel.y * 3.0)).r;
  float fT = texture2D(uFluidMap, vUv + vec2(0.0, texel.y * 3.0)).r;
  vec2 fluidGrad = vec2(fR - fL, fT - fB);

  // Dynamic Day/Night interaction:
  // In Day mode (uManualNight = 0.0): cursor reveals Night (nightTarget = trail)
  // In Night mode (uManualNight = 1.0): cursor reveals Day (nightTarget = 1.0 - trail)
  float nightTarget = mix(uManualNight, 1.0 - uManualNight, trail);

  float edgeActivity = trail * (1.0 - trail) * 4.0;
  float nEdge = snoise(vUv * 6.5 + fluidVel * 0.4 + uTime * 0.15) * 0.04 * edgeActivity;
  float transitionSign = (uManualNight > 0.5) ? -1.0 : 1.0;

  float eveningMask = smoothstep(0.04, 0.65, nightTarget + nEdge * transitionSign);
  eveningMask = clamp(eveningMask, 0.0, 1.0);

  // Tactile relief rim along cursor boundary
  float reliefRim = smoothstep(0.02, 0.36, trail) * (1.0 - smoothstep(0.55, 0.96, trail));
  float reliefMask = clamp(reliefRim * 1.35 + ripple * 0.65, 0.0, 1.0);

  // Bas-Relief Sobel Normal reconstruction from architecture textures
  vec2 stepUv = vec2(0.0018, 0.0018);
  float hL = getLuma(texture2D(uNightTex, baseUv - vec2(stepUv.x, 0.0)).rgb);
  float hR = getLuma(texture2D(uNightTex, baseUv + vec2(stepUv.x, 0.0)).rgb);
  float hB = getLuma(texture2D(uNightTex, baseUv - vec2(0.0, stepUv.y)).rgb);
  float hT = getLuma(texture2D(uNightTex, baseUv + vec2(0.0, stepUv.y)).rgb);

  vec2 archGrad = vec2(hR - hL, hT - hB) * uNormalStrength * reliefMask;
  vec2 waveGrad = fluidGrad * 3.2;
  vec3 normal = normalize(vec3(-(archGrad.x + waveGrad.x), -(archGrad.y + waveGrad.y), 1.0));

  // 3D Point Light following cursor
  vec3 lightPos = vec3(uMouse.x, uMouse.y, uLightZ);
  vec3 lightDir = normalize(lightPos - vec3(vUv, 0.0));
  float diff = max(dot(normal, lightDir), 0.0);

  vec2 viewOffset = (uMouse - vUv) * 0.0012 * eveningMask;
  vec2 refractOffset = (normal.xy * 0.001 + fluidVel * 0.001) * reliefMask;
  vec2 dayUv = clamp(baseUv + refractOffset * 0.3, 0.001, 0.999);
  vec2 nightUv = clamp(baseUv - refractOffset * 0.4 + viewOffset * (hL - 0.5), 0.001, 0.999);

  vec3 dayColor = texture2D(uDayTex, dayUv).rgb;
  vec3 nightColor = texture2D(uNightTex, nightUv).rgb;

  float reliefShade = clamp((diff - 0.58) * 0.32 * reliefMask, -0.14, 0.14);
  nightColor = clamp(nightColor * (1.0 + reliefShade), 0.0, 1.0);

  // Adaptive contour halo: warm amber when revealing night, crisp daylight beam when revealing day
  vec3 rimTone = mix(vec3(1.0, 0.72, 0.28), vec3(0.92, 0.96, 1.0), uManualNight);
  float structuralEdge = clamp(length(archGrad) * 0.45, 0.0, 0.25);
  vec3 waveRimGlow = rimTone * (reliefRim * 0.14 + structuralEdge * reliefMask * 0.18);

  vec3 finalColor = mix(dayColor, clamp(nightColor + waveRimGlow, 0.0, 1.0), eveningMask);

  // Soft selective bloom around warm windows when night is visible
  if (eveningMask > 0.08) {
    float isAmberWindow = clamp((nightColor.r - nightColor.b) * 1.8, 0.0, 1.0) * smoothstep(0.45, 0.85, nightColor.r);
    finalColor += vec3(0.9, 0.6, 0.2) * isAmberWindow * 0.16 * eveningMask;
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
