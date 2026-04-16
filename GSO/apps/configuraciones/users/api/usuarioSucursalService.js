import { GsoConexion } from "../../helper/env.js";

export class UsuarioSucursalService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/UsersByCompany/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/UsersByCompany/GetById/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/UsersByCompany/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/UsersByCompany/Update", data);
    return response.data;
  }

    async delete(Id) {
    const response = await this.api.delete("/UsersByCompany/Delete/"+Id);
    return response.data;
  }

}
