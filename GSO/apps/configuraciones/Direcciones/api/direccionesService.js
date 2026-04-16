import { GsoConexion } from "../../helper/env.js";

export class DireccionesService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Address/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get("/Address/GetById/" + id);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/Address/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/Address/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete("/Address/Delete/" + id );
    return response.data;
  }

}
