// Counts visitors: each browser is counted once (the page remembers it in localStorage).
// The number shown on the site starts at 3000; the real count is stored separately.
import { getStore } from "@netlify/blobs";

const START = 3000;

export default async (req) => {
  const store = getStore({ name: "site-stats", consistency: "strong" });
  let real = Number(await store.get("visitors")) || 0;
  if (req.method === "POST") {
    real += 1;
    await store.set("visitors", String(real));
  } else if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  return Response.json({ count: START + real }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/visits" };
