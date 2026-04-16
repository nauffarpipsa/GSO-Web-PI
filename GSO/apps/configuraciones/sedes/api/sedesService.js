import { GsoConexion } from "../../helper/env.js";

export class SedeService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Brach/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/Brach/GetById/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/Brach/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/Brach/Update", data);
    return response.data;
  }

}
