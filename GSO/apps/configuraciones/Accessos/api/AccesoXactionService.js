import { GsoConexion } from "../../helper/env.js";

export class AccessXActionService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/AccessXAction/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/AccessXAction/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/AccessXAction/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/AccessXAction/Update", data);
    return response.data;
  }

}
