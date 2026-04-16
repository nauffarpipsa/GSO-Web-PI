import { GsoConexion } from "../../helper/env.js"

export class UnidadInventarioService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/InventoryUnit/Get");
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/InventoryUnit/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/InventoryUnit/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/InventoryUnit/Delete/${id}`);
    return response.data;
  }

  async getCompanies() {
    const response = await this.api.get("/Company/Get");
    return response.data;
  }
}