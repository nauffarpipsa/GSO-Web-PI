import { GsoConexion } from "../../helper/env.js";

export class MunicipalityService {
  constructor() {
    const conexion = new GsoConexion();
    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getById(countryId, departmentId) {
    const response = await this.api.get(
      `/Municipality/Get/${countryId}/${departmentId}`
    );
    return response.data;
  }
}
