import { injectable } from "tsyringe";

@injectable()
class HealthService {
  public async checkHealth(): Promise<{ status: string }> {}
}
