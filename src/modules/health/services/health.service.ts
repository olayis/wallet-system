import { injectable } from "tsyringe";
import { getKnexInstance } from "../../../db";

@injectable()
export class HealthService {
  async checkLiveness() {
    return { status: "ok" };
  }

  async checkReadiness() {
    const checks: Record<string, "ok" | "fail"> = {};
    try {
      await getKnexInstance().raw("select 1");
      checks.database = "ok";
    } catch {
      checks.database = "fail";
    }
    const status = Object.values(checks).every((v) => v === "ok") ? "ok" : "degraded";
    return { status, checks };
  }
}
