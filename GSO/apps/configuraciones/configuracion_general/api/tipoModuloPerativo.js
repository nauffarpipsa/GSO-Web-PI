import { GsoConexion } from "../../helper/env.js";
export class TipoModuloOperativoService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/OperationalModuleType/Get");
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/OperationalModuleType/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/OperationalModuleType/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(
      `/OperationalModuleType/Delete/${id}`
    );
    return response.data;
  }
}
