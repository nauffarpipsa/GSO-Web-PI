import { GsoConexion } from "../../helper/env.js";

export class ModeloAutorizacionUsuario {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/UserAuthorizationModel/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/UserAuthorizationModel/GetById/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/UserAuthorizationModel/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/UserAuthorizationModel/Update", data);
    return response.data;
  }

}
