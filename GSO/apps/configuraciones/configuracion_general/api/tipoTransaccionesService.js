// import { GsoConexion } from "apps/configuraciones/helper/env.js";
import { GsoConexion } from "../../helper/env.js";

export class TipoTransaccionesService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  // --- Endpoints propios de TipoTransacciones ---
  async getAll() {
    const response = await this.api.get("/TransactionType/Get");
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/TransactionType/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/TransactionType/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/TransactionType/Delete/${id}`);
    return response.data;
  }
}
