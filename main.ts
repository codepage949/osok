import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { serveStatic } from "@hono/hono/deno";
import cryptoRandomString from "crypto-random-string";

const app = new Hono();
const port = Number(Deno.env.get("HTTP_PORT") ?? "8000");
const ss = new Map<string, ((res: Response) => void) | null>();

if (Deno.env.get("DENO_ENV") === "production") {
  app.use(async (c, next) => {
    const protocol = c.req.header("X-Forwarded-Proto") || "http";

    if (protocol === "http") {
      const url = new URL(c.req.url);
      url.protocol = "https:";
      return c.redirect(url.toString());
    }

    await next();
  });
}
app.use("*", cors());
app.use("/static/*", serveStatic({ root: "./public", rewriteRequestPath: (path) => path.replace(/^\/static/, "") }));
app.get("/", async (c) => {
  const html = await Deno.readTextFile("./public/index.html");
  return c.html(html);
});
app.get("/new-session", (c) => {
  const key = (cryptoRandomString({ length: 8, type: "url-safe" }) as string).toLowerCase();

  ss.set(key, null);
  return c.json({ result: key });
});
app.get("/status", (c) => {
  const key = c.req.query("key");

  return c.json({ result: !!ss.get(key!) });
});
app.get("/:key", (c) => {
  const key = c.req.param("key");

  if (ss.has(key)) {
    let resolve: (res: Response) => void;
    const p = new Promise<Response>((r) => {
      resolve = r;
    });
    ss.set(key, resolve!);
    return p;
  } else {
    return c.text("no matching key", 404);
  }
});
app.post("/upload", async (c) => {
  const key = c.req.query("key");
  let result = false;

  if (key && ss.has(key)) {
    const resolve = ss.get(key);
    const isTxt = (c.req.query("isTxt") !== undefined);

    ss.delete(key);

    if (resolve) {
      try {
        const headers = new Headers({
          "content-type": isTxt
            ? "text/plain; charset=utf-8"
            : "application/octet-stream",
        });
        
        const cl = c.req.header("content-length");
        if (cl) headers.set("content-length", cl);

        if (!isTxt) {
          const fileName = c.req.query("fileName") || "";
          headers.set("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)};`);
        }

        if (c.req.raw.body) {
          const { readable, writable } = new TransformStream();
          resolve(new Response(readable, {
            headers,
          }));
          await c.req.raw.body.pipeTo(writable);
        } else {
          resolve(new Response(null, { headers }));
        }
        result = true;
      } catch (e) {
        console.log(e);
      }
    }
  }

  return c.json({ result });
});
Deno.serve({ port }, app.fetch);
