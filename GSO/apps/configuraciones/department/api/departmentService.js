import { GsoConexion } from "../../helper/env.js";

export class DepartmentService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getById(countryId) {
    const response = await this.api.get("/Department/Get/" + countryId);
    return response.data;
  }

}
