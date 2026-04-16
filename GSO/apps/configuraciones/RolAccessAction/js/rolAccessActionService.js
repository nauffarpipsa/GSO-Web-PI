import { GsoConexion } from "../../helper/env.js";

export class RolAccessActionService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/RolAccessAction/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/RolAccessAction/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/RolAccessAction/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/RolAccessAction/Update", data);
    return response.data;
  }

  async Delete(Id) {
    const response = await this.api.delete(`/RolAccessAction/Delete/${Id}`);
    return response.data;
  }

  async createBatch(items, userId) {
    const payload = { userId, items };
    const response = await this.api.post(
      "/RolAccessAction/CreateBatch",
      payload
    );
    return response.data;
  }

  async getByRol(rolId) {
    const response = await this.api.get(`/RolAccessAction/GetByRol/${rolId}`);
    return response.data;
  }

  async getByRolAccess(rolId, accessId) {
    const response = await this.api.get(
      `/RolAccessAction/GetByRolAccess/${rolId}/${accessId}`
    );
    return response.data;
  }

  async replaceActions(rolId, accessId, actionIds, userId) {
    const payload = { rolId, accessId, actionIds, userId };
    const response = await this.api.post(
      "/RolAccessAction/ReplaceActions",
      payload
    );
    return response.data;
  }
}
