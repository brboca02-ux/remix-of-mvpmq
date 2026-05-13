import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
 import { signPayload } from "@/lib/make-integration.server";
 import { internalUpdateJobStatus } from "@/lib/jobs.server";
import { logger } from "@/lib/logger";

// Public callback that Make can call to confirm delivery / replies.
// Security: HMAC-SHA256 signature using the user's secret_token (looked up via request_id).

export const Route = createFileRoute("/api/public/make-callback")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Lovable-Signature, X-Lovable-Timestamp",
          },
        }),

      POST: async ({ request }) => {
        try {
          const body = await request.text();
          const signature = request.headers.get("x-lovable-signature") || "";
          const timestamp = request.headers.get("x-lovable-timestamp") || "";

          // Reject stale (>5min) requests
          const ts = Number(timestamp);
          if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
            return jsonRes({ error: "stale_or_invalid_timestamp" }, 401);
          }

          let payload: any;
          try {
            payload = JSON.parse(body);
          } catch {
            return jsonRes({ error: "invalid_json" }, 400);
          }

          const requestId = payload?.request_id;
          if (!requestId) return jsonRes({ error: "missing_request_id" }, 400);

          // Find the original log to get the secret + user
          const { data: log } = await supabaseAdmin
            .from("make_send_log")
            .select("id, user_id, lead_id")
            .eq("request_id", requestId)
            .maybeSingle();

          if (!log) return jsonRes({ error: "request_not_found" }, 404);

          const { data: settings } = await supabaseAdmin
            .from("integration_settings")
            .select("secret_token")
            .eq("user_id", log.user_id)
            .eq("provider", "make")
            .maybeSingle();

          if (!settings?.secret_token) return jsonRes({ error: "no_secret" }, 401);

          const expected = `sha256=${signPayload(settings.secret_token, body)}`;
          if (signature !== expected) {
            return jsonRes({ error: "invalid_signature" }, 401);
          }

          // Update log status based on event
          const event = String(payload.event || "").toLowerCase();
          const newStatus =
            event === "delivered" ? "delivered" : event === "failed" ? "failed" : event === "replied" ? "replied" : null;

           if (newStatus) {
             await supabaseAdmin
               .from("make_send_log")
               .update({
                 status: newStatus,
                 delivered_at: newStatus === "delivered" ? new Date().toISOString() : undefined,
               })
               .eq("id", log.id);
 
             // Check if there's a corresponding job
             const { data: job } = await supabaseAdmin
               .from("jobs")
               .select("id")
               .or(`idempotency_key.eq.make_${requestId},idempotency_key.eq.${requestId}`)
               .maybeSingle();
 
             if (job) {
               const jobStatus: any = newStatus === "delivered" ? "done" : newStatus === "failed" ? "failed" : "running";
               await internalUpdateJobStatus({
                 jobId: job.id,
                 status: jobStatus,
                 result: payload,
                 error: newStatus === "failed" ? (payload.error || "Erro no callback do Make") : undefined
               });
             }
           }

          return jsonRes({ ok: true }, 200);
        } catch (err: any) {
          logger.error("Make callback error", err instanceof Error ? err : undefined, {
            requestId: (err as any)?.requestId,
          });
          return jsonRes({ error: "internal_error" }, 500);
        }
      },
    },
  },
});

function jsonRes(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
