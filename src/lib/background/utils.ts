export function smoothstep01(t: number) {
  return t * t * (3 - 2 * t);
}

export function hash1D(n: number) {
  return (Math.sin(n * 127.1) * 43758.5453123) % 1;
}

export function noise1D(x: number, seed: number) {
  const p = x + seed;
  const i = Math.floor(p);
  const f = p - i;
  const a = hash1D(i);
  const b = hash1D(i + 1);
  return a + (b - a) * smoothstep01(f);
}

export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
