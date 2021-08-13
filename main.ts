import {
  opine,
  Request,
  serveStatic,
} from "https://deno.land/x/opine@1.7.1/mod.ts";
import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.0.0/mod.ts";

const app = opine();
const port = Number(Deno.env.get("PORT") ?? "8000");
const ss = new Map<string, Request | null>();

app.use("/static", serveStatic("./public"));
app.get("/", (req, res) => {
  res.sendFile("/public/index.html", { root: "." });
});
app.get("/new-session", (req, res) => {
  const key = (cryptoRandomString({ length: 8, type: "url-safe" }) as string)
    .toLowerCase();

  ss.set(key, null);
  res.json({ result: key });
});
app.get("/status", (req, res) => {
  const key = req.query.key;

  res.json({ result: !!ss.get(key) });
});
app.get("/:key", (req, res) => {
  const key = req.params.key;

  if (ss.has(key)) {
    ss.set(key, req);
  } else {
    res.setStatus(404).end("no matching key");
  }
});
app.post("/upload", async (req, res) => {
  const key = req.query.key;
  let result = false;

  if (ss.has(key)) {
    const clientReq = ss.get(key)!;
    const isTxt = (req.query.isTxt !== undefined);

    ss.delete(key);

    try {
      await clientReq.respond({
        headers: new Headers({
          "content-type": isTxt ? "text/plain" : "application/octet-stream",
          "content-length": req.headers.get("content-length")!,
          ...(isTxt) ? {} : {
            "content-disposition": `attachment; filename*=UTF-8''${
              encodeURIComponent(req.query.fileName)
            };`,
          },
        }),
        body: req.body,
      });

      result = true;
    } catch (e) {
      console.log(e);
    }
  }

  res.json({ result });
});
app.listen(
  port,
  () => console.log(`server has started on ${port}`),
);
