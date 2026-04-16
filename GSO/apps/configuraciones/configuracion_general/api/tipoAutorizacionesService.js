import { GsoConexion } from "../../helper/env.js";

export class TipoAutorizacionesService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  // --- Endpoints propios de TipoTransacciones ---
  async getAll() {
    const response = await this.api.get("/AuthorizationType/Get");
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/AuthorizationType/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/AuthorizationType/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/AuthorizationType/Delete/${id}`);
    return response.data;
  }
}
