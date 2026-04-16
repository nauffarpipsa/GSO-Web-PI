import { GsoConexion } from "../../helper/env.js";

export class PermissionService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/UserAccessAction/GetAll");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/UserAccessAction/GetByUserId/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/UserAccessAction/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/UserAccessAction/Update", data);
    return response.data;
  }

  async Delete(Id) {
    const response = await this.api.delete("/UserAccessAction/Deactivate/" + Id);
    return response.data;
  }

}
