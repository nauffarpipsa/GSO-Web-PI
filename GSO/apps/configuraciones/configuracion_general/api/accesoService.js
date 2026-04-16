import { GsoConexion } from "../../helper/env.js";

export class AccesoService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Access/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/Access/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/Access/Create", data);
    return response.data;
  }

  async update(data) {
    data.applicationId = 4;
    const response = await this.api.put("/Access/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/Access/Delete/${id}`);
    return response.data;
  }
}
