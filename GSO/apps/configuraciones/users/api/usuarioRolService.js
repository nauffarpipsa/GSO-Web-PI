import { GsoConexion } from "../../helper/env.js";

export class UsuarioRolService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/UserRol/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/UserRol/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/UserRol/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/UserRol/Update", data);
    return response.data;
  }

    async delete(id) {
    const response = await this.api.delete("/UserRol/Delete/"+id);
    return response.data;
  }

}
