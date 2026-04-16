import { GsoConexion } from "../../helper/env.js";


export class AccionesService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Action/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/Action/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/Action/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/Action/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/Action/Delete/${id}`);
    return response.data;
  }
}
