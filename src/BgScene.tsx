import { useEffect, useRef } from "react";
import { initBackground } from "./lib/background";

export default function BgScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (window.matchMedia("(max-width: 640px)").matches) return;

    const cleanup = initBackground(canvasRef.current);
    return cleanup;
  }, []);

  return (
    <div className="bg-scene" aria-hidden="true">
      <canvas ref={canvasRef} id="bg-canvas" />
    </div>
  );
}
