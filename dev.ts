import { startServer } from "./server.ts";

const apiPort = Number(Deno.env.get("HTTP_PORT") ?? "8000");
const server = startServer(apiPort);

const vite = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "npm:vite"],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    vite.kill("SIGTERM");
  } catch {
    // Ignore child termination errors during shutdown.
  }

  await Promise.allSettled([
    server.shutdown(),
    vite.status,
  ]);

  Deno.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  Deno.addSignalListener(signal, () => {
    void shutdown(0);
  });
}

const viteStatus = await vite.status;
await shutdown(viteStatus.success ? 0 : viteStatus.code);
