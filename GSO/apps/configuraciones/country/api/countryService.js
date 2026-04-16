import { GsoConexion } from "../../helper/env.js";

export class CountryService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/Country/Get/");
    return response.data;
  }

  async getByUserCompany(UserId) {
    const response = await this.api.get(`/Country/GetByUserCompany/${UserId}`);
    return response.data;
  }

}
