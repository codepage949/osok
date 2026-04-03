import * as THREE from "three";
import { CONFIG } from "./config";
import { NOISE_GLSL } from "./glsl";
import { noise1D } from "./utils";
import {
  createPointsData,
  createPositionTexture,
  createRenderTarget,
} from "./particles";

export function initBackground(canvas: HTMLCanvasElement): () => void {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.z = 3.1;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
    stencil: false,
    precision: "highp",
  });
  renderer.setClearColor(0x060816, 0);
  renderer.autoClear = false;

  const clock = new THREE.Clock(false);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const intersectionPoint = new THREE.Vector3();
  const raycastPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(12.5, 12.5),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  scene.add(raycastPlane);

  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  const pointsData = createPointsData();
  const count = Math.min(pointsData.length / 2, CONFIG.size * CONFIG.size);
  const length = CONFIG.size * CONFIG.size;
  const posTex = createPositionTexture(
    pointsData.slice(0, count * 2),
    length,
  );
  let rt1 = createRenderTarget(renderer);
  let rt2 = createRenderTarget(renderer);
  let everRendered = false;
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let isIntersecting = false;
  let mouseIsOver = false;
  let animationFrameId: number | null = null;
  let elapsedTime = 0;

  const ringPos = new THREE.Vector2();
  const cursorPos = new THREE.Vector2();
  const idleSeedX = Math.random() * 1000;
  const idleSeedY = Math.random() * 1000;

  const simScene = new THREE.Scene();
  const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const simMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPosition: { value: posTex },
      uPosRefs: { value: posTex },
      uRingPos: { value: new THREE.Vector2() },
      uRingRadius: { value: 0.2 },
      uDeltaTime: { value: 0 },
      uRingWidth: { value: 0.05 },
      uRingWidth2: { value: 0.015 },
      uRingDisplacement: { value: CONFIG.ringDisplacement },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform sampler2D uPosition;
      uniform sampler2D uPosRefs;
      uniform vec2 uRingPos;
      uniform float uTime;
      uniform float uDeltaTime;
      uniform float uRingRadius;
      uniform float uRingWidth;
      uniform float uRingWidth2;
      uniform float uRingDisplacement;

      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        vec2 simTexCoords = vUv;
        vec4 pFrame = texture2D(uPosition, simTexCoords);

        float scale = pFrame.z;
        float velocity = pFrame.w;
        vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;
        float time = uTime * 0.5;
        vec2 currentPos = refPos;

        vec2 pos = pFrame.xy;
        pos *= 0.8;

        float dist = distance(currentPos.xy, uRingPos);
        float noise0 = snoise(
          vec3(currentPos.xy * 0.2 + vec2(18.4924, 72.9744), time * 0.5)
        );
        float dist1 = distance(currentPos.xy + (noise0 * 0.005), uRingPos);

        float t = smoothstep(
          uRingRadius - (uRingWidth * 2.0),
          uRingRadius,
          dist
        ) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
        float t2 = smoothstep(
          uRingRadius - (uRingWidth2 * 2.0),
          uRingRadius,
          dist
        ) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
        float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);

        t = pow(t, 2.0);
        t2 = pow(t2, 3.0);

        t += t2 * 3.0;
        t += t3 * 0.4;
        t += snoise(
          vec3(currentPos.xy * 30.0 + vec2(11.4924, 12.9744), time * 0.5)
        ) * t3 * 0.5;

        float nS = snoise(
          vec3(currentPos.xy * 2.0 + vec2(18.4924, 72.9744), time * 0.5)
        );
        t += pow((nS + 1.5) * 0.5, 2.0) * 0.6;

        float noise1 = snoise(
          vec3(currentPos.xy * 4.0 + vec2(88.494, 32.4397), time * 0.35)
        );
        float noise2 = snoise(
          vec3(currentPos.xy * 4.0 + vec2(50.904, 120.947), time * 0.35)
        );
        float noise3 = snoise(
          vec3(currentPos.xy * 20.0 + vec2(18.4924, 72.9744), time * 0.5)
        );
        float noise4 = snoise(
          vec3(currentPos.xy * 20.0 + vec2(50.904, 120.947), time * 0.5)
        );

        vec2 disp = vec2(noise1, noise2) * 0.03;
        disp += vec2(noise3, noise4) * 0.005;
        disp.x += sin((refPos.x * 20.0) + (time * 4.0)) * 0.02 * clamp(dist, 0.0, 1.0);
        disp.y += cos((refPos.y * 20.0) + (time * 3.0)) * 0.02 * clamp(dist, 0.0, 1.0);

        pos -= (uRingPos - (currentPos + disp)) * pow(t2, 0.75) * uRingDisplacement;

        float scaleDiff = t - scale;
        scaleDiff *= 0.2;
        scale += scaleDiff;

        vec2 finalPos = currentPos + disp + (pos * 0.25);

        velocity *= 0.5;
        velocity += scale * 0.25;

        gl_FragColor = vec4(finalPos, scale, velocity);
      }
    `,
  });

  simScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial));

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 4);

  for (let i = 0; i < count; i += 1) {
    const x = i % CONFIG.size;
    const y = Math.floor(i / CONFIG.size);
    const uvOffset = i * 2;
    const seedOffset = i * 4;
    uvs[uvOffset] = x / CONFIG.size;
    uvs[uvOffset + 1] = y / CONFIG.size;
    seeds[seedOffset] = Math.random();
    seeds[seedOffset + 1] = Math.random();
    seeds[seedOffset + 2] = Math.random();
    seeds[seedOffset + 3] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("seeds", new THREE.BufferAttribute(seeds, 4));

  const renderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPosition: { value: posTex },
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(CONFIG.color1) },
      uColor2: { value: new THREE.Color(CONFIG.color2) },
      uColor3: { value: new THREE.Color(CONFIG.color3) },
      uAlpha: { value: 1 },
      uRingPos: { value: new THREE.Vector2() },
      uRez: { value: new THREE.Vector2(1, 1) },
      uParticleScale: { value: 1 },
      uPixelRatio: { value: 1 },
      uColorScheme: { value: 1 },
    },
    vertexShader: `
      precision highp float;

      attribute vec4 seeds;

      uniform sampler2D uPosition;
      uniform float uTime;
      uniform float uParticleScale;
      uniform float uPixelRatio;
      uniform int uColorScheme;

      varying vec4 vSeeds;
      varying float vVelocity;
      varying vec2 vLocalPos;
      varying vec2 vScreenPos;
      varying float vScale;

      void main() {
        vec4 pos = texture2D(uPosition, uv);
        vSeeds = seeds;

        vVelocity = pos.w;
        vScale = pos.z;
        vLocalPos = pos.xy;

        vec4 viewSpace = modelViewMatrix * vec4(vec3(pos.xy, 0.0), 1.0);
        gl_Position = projectionMatrix * viewSpace;
        vScreenPos = gl_Position.xy;
        gl_PointSize = ((vScale * 7.0) * (uPixelRatio * 0.5) * uParticleScale);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec4 vSeeds;
      varying vec2 vScreenPos;
      varying vec2 vLocalPos;
      varying float vScale;
      varying float vVelocity;

      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec2 uRingPos;
      uniform vec2 uRez;
      uniform float uAlpha;
      uniform float uTime;
      uniform int uColorScheme;

      ${NOISE_GLSL}

      float sdRoundBox(in vec2 p, in vec2 b, in vec4 r) {
        r.xy = (p.x > 0.0) ? r.xy : r.zw;
        r.x = (p.y > 0.0) ? r.x : r.y;
        vec2 q = abs(p) - b + r.x;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
      }

      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, s, -s, c);
        return m * v;
      }

      void main() {
        float ratio = uRez.x / max(uRez.y, 1.0);
        float noiseAngle = snoise(
          vec3(vLocalPos * 10.0 + vec2(18.4924, 72.9744), uTime * 0.85)
        );
        float noiseColor = snoise(
          vec3(vLocalPos * 2.0 + vec2(74.664, 91.556), uTime * 0.5)
        );
        noiseColor = (noiseColor + 1.0) * 0.5;
        float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);

        vec2 uv = gl_PointCoord.xy;
        uv -= vec2(0.5);
        uv.y *= -1.0;
        uv = rotate(uv, -angle + (noiseAngle * 0.5));

        vec2 tuv = vScreenPos;
        tuv = rotate(tuv, uTime);
        tuv.y *= 1.0 / ratio;
        tuv += 0.5;

        float h = 0.8;
        float progress = smoothstep(0.0, 0.75, pow(noiseColor, 2.0));
        vec3 col = mix(
          mix(uColor1, uColor2, progress / h),
          mix(uColor2, uColor3, (progress - h) / (1.0 - h)),
          step(h, progress)
        );
        vec3 color = col;

        float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(0.25));
        rounded = smoothstep(0.1, 0.0, rounded);
        float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale);
        if (a < 0.01) discard;

        color = clamp(color, 0.0, 1.0);
        color = mix(color, color * clamp(vVelocity, 0.0, 1.0), float(uColorScheme));
        gl_FragColor = vec4(color, clamp(a, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.Points(geometry, renderMaterial);
  mesh.position.set(0, 0, 0);
  mesh.scale.set(5, 5, 5);
  scene.add(mesh);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderMaterial.uniforms["uRez"]!.value.set(
      renderer.domElement.width,
      renderer.domElement.height,
    );
    renderMaterial.uniforms["uPixelRatio"]!.value = pixelRatio();
  }

  function updateRaycast() {
    mouse.x = (pointerX / Math.max(width, 1)) * 2 - 1;
    mouse.y = -(pointerY / Math.max(height, 1)) * 2 + 1;

    if (!mouseIsOver) {
      isIntersecting = false;
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObject(raycastPlane);

    if (intersections.length > 0) {
      intersectionPoint.copy(intersections[0]!.point);
      isIntersecting = true;
    } else {
      isIntersecting = false;
    }
  }

  function updateRingPosition() {
    const idleX =
      ((noise1D(elapsedTime * 0.66 + 94.234, idleSeedX) - 0.5) * 2) * 0.2;
    const idleY =
      ((noise1D(elapsedTime * 0.75 + 21.028, idleSeedY) - 0.5) * 2) * 0.1;
    if (isIntersecting) {
      cursorPos.set(
        intersectionPoint.x * 0.175 + idleX * 0.1,
        intersectionPoint.y * 0.175 + idleY * 0.1,
      );
      ringPos.set(
        ringPos.x + (cursorPos.x - ringPos.x) * 0.02,
        ringPos.y + (cursorPos.y - ringPos.y) * 0.02,
      );
    } else {
      cursorPos.set(idleX, idleY);
      ringPos.set(
        ringPos.x + (cursorPos.x - ringPos.x) * 0.01,
        ringPos.y + (cursorPos.y - ringPos.y) * 0.01,
      );
    }
  }

  function renderFrame() {
    animationFrameId = requestAnimationFrame(renderFrame);

    const dt = clock.getDelta();
    elapsedTime += dt;

    updateRaycast();
    updateRingPosition();

    const ringRadius =
      0.175 + Math.sin(elapsedTime * 1.0) * 0.03 + Math.cos(elapsedTime * 3.0) * 0.02;
    const particleScale =
      (renderer.domElement.width / pixelRatio() / 2000) * CONFIG.particlesScale;

    simMaterial.uniforms["uPosition"]!.value = everRendered ? rt1.texture : posTex;
    simMaterial.uniforms["uTime"]!.value = elapsedTime;
    simMaterial.uniforms["uDeltaTime"]!.value = dt;
    simMaterial.uniforms["uRingRadius"]!.value = ringRadius;
    simMaterial.uniforms["uRingPos"]!.value.copy(ringPos);
    simMaterial.uniforms["uRingWidth"]!.value = CONFIG.ringWidth;
    simMaterial.uniforms["uRingWidth2"]!.value = CONFIG.ringWidth2;
    simMaterial.uniforms["uRingDisplacement"]!.value = CONFIG.ringDisplacement;

    renderer.setRenderTarget(rt2);
    renderer.clear();
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget(null);
    renderer.clear();

    renderMaterial.uniforms["uPosition"]!.value = everRendered ? rt2.texture : posTex;
    renderMaterial.uniforms["uTime"]!.value = elapsedTime;
    renderMaterial.uniforms["uRingPos"]!.value.copy(ringPos);
    renderMaterial.uniforms["uParticleScale"]!.value = particleScale;

    renderer.render(scene, camera);

    const temp = rt1;
    rt1 = rt2;
    rt2 = temp;
    everRendered = true;
  }

  function onPointerMove(event: MouseEvent) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    mouseIsOver = true;
  }

  function onPointerLeave() {
    mouseIsOver = false;
    isIntersecting = false;
  }

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("mouseleave", onPointerLeave);

  resize();
  clock.start();
  renderFrame();

  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", resize);
    document.removeEventListener("mousemove", onPointerMove);
    document.removeEventListener("mouseleave", onPointerLeave);
    geometry.dispose();
    renderMaterial.dispose();
    simMaterial.dispose();
    (simScene.children[0] as THREE.Mesh).geometry.dispose();
    posTex.dispose();
    rt1.dispose();
    rt2.dispose();
    raycastPlane.geometry.dispose();
    (raycastPlane.material as THREE.Material).dispose();
    renderer.dispose();
  };
}
