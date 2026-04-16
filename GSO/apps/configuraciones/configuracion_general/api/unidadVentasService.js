import { GsoConexion } from "../../helper/env.js";

export class UnidadVentaService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/SalesUnit/Get");
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/SalesUnit/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/SalesUnit/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/SalesUnit/Delete/${id}`);
    return response.data;
  }

  async getCompanies() {
    const response = await this.api.get("/Company/Get");
    return response.data;
  }
}
