import { GsoConexion } from "../../helper/env.js";

export class RolXAccessService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/RolAccess/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/RolAccess/GetById/${id}`);
    return response.data;
  }

  async getByRol(id) {
    const response = await this.api.get(`/RolAccess/Get/${id}`);
    return response.data;
  }

  async getByRolAccess(rolId,accessId) {
    const response = await this.api.get(`/RolAccess/GetByRolAccess/${rolId}/${accessId}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("RolAccess/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/RolAccess/Update", data);
    return response.data;
  }

    async delete(Id) {
    const response = await this.api.delete(`/RolAccess/Delete/${Id}`);
    return response.data;
  }

}
