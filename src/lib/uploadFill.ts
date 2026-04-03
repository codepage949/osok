export interface UploadFillController {
  start(): void;
  setProgress(value: number): void;
  complete(): Promise<void>;
}

export function createUploadFillController(
  layer: HTMLElement | null,
): UploadFillController {
  if (!layer) {
    return {
      start() {},
      setProgress() {},
      complete() {
        return Promise.resolve();
      },
    };
  }

  const container = layer.parentElement;
  const liquid = document.createElement("div");
  liquid.className = "upload-fill-liquid";
  layer.appendChild(liquid);

  const MIN_VISIBLE_MS = 1700;
  const INITIAL_PROGRESS = 0.14;
  const PRIMING_MS = 260;
  const PRIMING_PROGRESS = 0.18;
  const FINISH_MS = 820;
  const FADE_MS = 260;

  let running = false;
  let animationFrameId: number | null = null;
  let lastTime = performance.now();
  let state: "idle" | "filling" | "finishing" | "fading" = "idle";
  let progress = 0;
  let targetProgress = 0;
  let startTime = 0;
  let finishReadyAt = 0;
  let finishStartAt = 0;
  let finishFromProgress = 0;
  let fadeStartAt = 0;
  let completionPromise: Promise<void> | null = null;
  let resolveCompletion: (() => void) | null = null;
  let waveSeeds: Array<{
    amplitude: number;
    frequency: number;
    phase: number;
    drift: number;
  }> = [];

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function easeInOutSine(t: number) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function createWaveSeeds() {
    waveSeeds = Array.from({ length: 6 }, (_, index) => ({
      amplitude: 1.8 + Math.random() * 3.6,
      frequency: 0.75 + Math.random() * 1.35,
      phase: Math.random() * Math.PI * 2,
      drift: 0.25 + index * 0.06 + Math.random() * 0.2,
    }));
  }

  function buildClipPath(now: number) {
    const points: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i += 1) {
      const x = (i / steps) * 100;
      let y = 6;
      for (const seed of waveSeeds) {
        y +=
          Math.sin(
            now * 0.0012 * seed.frequency + seed.phase + i * seed.drift,
          ) * seed.amplitude;
      }
      points.push(`${x}% ${clamp(y, 1.5, 12)}%`);
    }
    return `polygon(0 100%, 0 ${points[0]!.split(" ")[1]}, ${points.join(", ")}, 100% 100%)`;
  }

  function render(now: number) {
    const drift = Math.sin(now * 0.0021) * 0.8;
    const levelOffset = (1 - progress) * 104;
    liquid.style.transform = `translateY(${levelOffset + drift}%)`;
    liquid.style.clipPath = buildClipPath(now);
  }

  function reset() {
    state = "idle";
    progress = 0;
    targetProgress = 0;
    finishReadyAt = 0;
    finishStartAt = 0;
    finishFromProgress = 0;
    fadeStartAt = 0;
    layer!.classList.remove("active");
    layer!.style.opacity = "0";
    container?.classList.remove("upload-filling");
    liquid.style.transform = "translateY(108%)";
    liquid.style.clipPath = "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)";
  }

  function tick(now: number) {
    if (!running) return;
    animationFrameId = requestAnimationFrame(tick);

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (state === "filling") {
      const elapsed = now - startTime;
      const maxVisibleProgress = clamp(elapsed / MIN_VISIBLE_MS, 0, 0.985);
      const primingProgress =
        easeInOutSine(clamp(elapsed / PRIMING_MS, 0, 1)) * PRIMING_PROGRESS;
      const boundedTarget = Math.max(
        primingProgress,
        Math.min(targetProgress, maxVisibleProgress),
      );
      const smoothing = targetProgress >= 0.94 ? 5.4 : 7.2;
      progress += (boundedTarget - progress) * Math.min(1, dt * smoothing);
      if (finishReadyAt !== 0 && now >= finishReadyAt) {
        state = "finishing";
        finishStartAt = now;
        finishFromProgress = progress;
      }
    }

    if (state === "finishing") {
      const t = clamp((now - finishStartAt) / FINISH_MS, 0, 1);
      progress = finishFromProgress + (1 - finishFromProgress) * easeInOutSine(t);
      if (t >= 1) {
        state = "fading";
        fadeStartAt = now;
      }
    }

    if (state === "fading") {
      const t = clamp((now - fadeStartAt) / FADE_MS, 0, 1);
      progress = 1;
      layer!.style.opacity = `${1 - t}`;
      if (t >= 1) {
        running = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = null;
        reset();
        if (resolveCompletion) {
          resolveCompletion();
          resolveCompletion = null;
          completionPromise = null;
        }
        return;
      }
    }

    render(now);
  }

  function start() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (running) return;
    running = true;
    state = "filling";
    progress = INITIAL_PROGRESS;
    targetProgress = INITIAL_PROGRESS;
    startTime = performance.now();
    createWaveSeeds();
    finishReadyAt = 0;
    finishStartAt = 0;
    finishFromProgress = 0;
    fadeStartAt = 0;
    lastTime = performance.now();
    layer!.classList.add("active");
    layer!.style.opacity = "1";
    container?.classList.add("upload-filling");
    render(lastTime);
    animationFrameId = requestAnimationFrame(tick);
  }

  function setProgress(value: number) {
    if (!running || state !== "filling") return;
    targetProgress = Math.max(targetProgress, clamp(value, 0, 0.985));
  }

  function complete() {
    if (!running) return Promise.resolve();
    if (!completionPromise) {
      completionPromise = new Promise((resolve) => {
        resolveCompletion = resolve;
      });
    }
    targetProgress = 1;
    finishReadyAt = Math.max(performance.now(), startTime + MIN_VISIBLE_MS);
    return completionPromise;
  }

  return { start, setProgress, complete };
}
