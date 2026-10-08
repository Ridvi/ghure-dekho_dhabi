// Saves the map image made in the browser and serves it back as a real file,
// so the Download button also works inside Facebook / Messenger / Instagram browsers.
import { getStore } from "@netlify/blobs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FILE_NAME = "ghure-dekho-dhabi.png";

export default async (req, context) => {
  const store = getStore("map-images");

  if (req.method === "POST") {
    const type = req.headers.get("content-type") || "";
    if (!type.startsWith("image/png")) {
      return new Response("PNG only", { status: 415 });
    }
    const data = await req.arrayBuffer();
    const bytes = new Uint8Array(data);
    const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (!isPng) return new Response("Not a PNG", { status: 400 });
    if (bytes.length > MAX_BYTES) return new Response("Too large", { status: 413 });

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    await store.set(id, data, { metadata: { created: Date.now() } });
    return Response.json({ url: `/img/${id}.png` });
  }

  if (req.method === "GET") {
    const id = String(context.params?.id || "").replace(/\.png$/, "");
    if (!/^[a-f0-9]{20}$/.test(id)) return new Response("Not found", { status: 404 });
    const data = await store.get(id, { type: "arrayBuffer" });
    if (!data) return new Response("Not found", { status: 404 });
    const download = new URL(req.url).searchParams.get("dl") === "1";
    return new Response(data, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${FILE_NAME}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: ["/api/image", "/img/:id"] };
