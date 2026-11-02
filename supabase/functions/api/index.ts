// Supabase Edge Function entry point. Server-side logic runs with the service-role key.
import * as H from "./handlers.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  // Supabase JS may send these headers during the browser's CORS preflight.
  "Access-Control-Allow-Headers": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "x-supabase-api-version",
    "x-supabase-client-platform",
    "x-supabase-client-platform-version",
    "x-supabase-client-runtime",
    "x-supabase-client-runtime-version",
  ].join(", "),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { fn, data } = await req.json();
    const handler = (H as Record<string, unknown>)[fn];
    if (typeof handler !== "function") throw new Error("Unknown function");
    const result = await (handler as (a: { data: unknown; req: Request }) => Promise<unknown>)({ data, req });
    return new Response(JSON.stringify({ result: result ?? null }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
