import { GsoConexion } from "../../helper/env.js";

export class SociedadService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Company/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/Company/GetById/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/Company/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/Company/Update", data);
    return response.data;
  }

}
