import { GsoConexion } from "../../helper/env.js";

export class UsuarioService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    const response = await this.api.get("/User/Get");
    return response.data;
  }

    async getById(Id) {
    const response = await this.api.get("/User/Get/" + Id);
    return response.data;
  }

  async create(data) {
    const response = await this.api.post("/User/Add", data);
    return response.data;
  }

  async update(data) {
    const response = await this.api.put("/User/Update", data);
    return response.data;
  }

      async getByCompanyId (Id) {
    const response = await this.api.get("/UsersByCompany/GetUserByCompany/" + Id);
    return response.data;
  }

  async getSessionData() {
  try {
    const res = await fetch("apps/configuraciones/helper/sessionData.php");
    const data = await res.json();
    return data;
 
  } catch (err) {
    console.error("Error obteniendo la sesión:", err);
  }
}
}
