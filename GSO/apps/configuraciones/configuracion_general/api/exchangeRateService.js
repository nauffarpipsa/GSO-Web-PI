import { GsoConexion } from "../../helper/env.js";

export class ExchangeRateService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/ExchangeRate/Get");
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/ExchangeRate/Get/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/ExchangeRate/Create", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/ExchangeRate/Update", data);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/ExchangeRate/Delete/${id}`);
    return response.data;
  }
}