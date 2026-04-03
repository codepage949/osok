import * as THREE from "three";
import { CONFIG } from "./config";
import { remap } from "./utils";

export function createPointsData() {
  const shape = 500;
  const minDistance = remap(CONFIG.density, 0, 300, 10, 2);
  const maxDistance = remap(CONFIG.density, 0, 300, 11, 3);
  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(shape / cellSize);
  const gridHeight = Math.ceil(shape / cellSize);
  const grid = new Array<number>(gridWidth * gridHeight).fill(-1);
  const samples: [number, number][] = [];
  const active: [number, number][] = [];

  function gridIndex(x: number, y: number) {
    return x + y * gridWidth;
  }

  function isValid(x: number, y: number) {
    if (x < 0 || x >= shape || y < 0 || y >= shape) return false;
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    for (
      let yy = Math.max(0, gy - 2);
      yy <= Math.min(gridHeight - 1, gy + 2);
      yy += 1
    ) {
      for (
        let xx = Math.max(0, gx - 2);
        xx <= Math.min(gridWidth - 1, gx + 2);
        xx += 1
      ) {
        const sampleIndex = grid[gridIndex(xx, yy)]!;
        if (sampleIndex === -1) continue;
        const sample = samples[sampleIndex]!;
        const dx = sample[0] - x;
        const dy = sample[1] - y;
        if (dx * dx + dy * dy < minDistance * minDistance) return false;
      }
    }
    return true;
  }

  function addSample(x: number, y: number) {
    const sample: [number, number] = [x, y];
    samples.push(sample);
    active.push(sample);
    grid[gridIndex(Math.floor(x / cellSize), Math.floor(y / cellSize))] =
      samples.length - 1;
  }

  addSample(Math.random() * shape, Math.random() * shape);

  while (active.length > 0 && samples.length < CONFIG.size * CONFIG.size) {
    const activeIndex = Math.floor(Math.random() * active.length);
    const origin = active[activeIndex]!;
    let found = false;

    for (let i = 0; i < 20; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minDistance + Math.random() * (maxDistance - minDistance);
      const x = origin[0] + Math.cos(angle) * radius;
      const y = origin[1] + Math.sin(angle) * radius;
      if (!isValid(x, y)) continue;
      addSample(x, y);
      found = true;
      break;
    }

    if (!found) active.splice(activeIndex, 1);
  }

  const points: number[] = [];
  for (const [x, y] of samples) {
    points.push(x - 250, y - 250);
  }
  return points;
}

export function createPositionTexture(pointsData: number[], length: number) {
  const data = new Float32Array(length * 4);
  const count = pointsData.length / 2;
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    data[offset] = pointsData[i * 2]! / 250;
    data[offset + 1] = pointsData[i * 2 + 1]! / 250;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
  }
  const texture = new THREE.DataTexture(
    data,
    CONFIG.size,
    CONFIG.size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createRenderTarget(renderer: THREE.WebGLRenderer) {
  return new THREE.WebGLRenderTarget(CONFIG.size, CONFIG.size, {
    format: THREE.RGBAFormat,
    type: renderer.capabilities.isWebGL2
      ? THREE.FloatType
      : THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}
