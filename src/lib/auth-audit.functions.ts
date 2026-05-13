import { createServerFn } from "@tanstack/react-start";
import { runAuthAudit } from "@/lib/auth-audit.server";

export const auditAuthSystem = createServerFn({ method: "GET" })
  .handler(async () => {
    return runAuthAudit();
  });
