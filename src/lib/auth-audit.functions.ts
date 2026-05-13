import { createServerFn } from "@tanstack/react-start";
import { runAuthAudit } from "@/server/auth-audit.server";

export const auditAuthSystem = createServerFn({ method: "GET" })
  .handler(async () => {
    return runAuthAudit();
  });
