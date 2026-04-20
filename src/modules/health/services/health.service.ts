import { injectable } from "tsyringe";

@injectable()
class HealthService {
  public checkHealth(): { status: string } {
    return { status: "ok" };
  }
}

export default HealthService;
