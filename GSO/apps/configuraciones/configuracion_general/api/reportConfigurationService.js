import { GsoConexion } from "../../helper/env.js";

export class ReportConfigurationService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/ReportConfiguration");
    return response.data;
  }

  async getReportNames() {
    const response = await this.api.get("/ReportConfiguration/ReportNames");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/ReportConfiguration/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/ReportConfiguration", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/ReportConfiguration", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/ReportConfiguration/${id}`);
    return response.data;
  }
}
