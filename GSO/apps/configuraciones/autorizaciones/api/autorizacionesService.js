import { GsoConexion } from "../../helper/env.js";

export class ModeloAutorizacionesService {
  constructor() {
    const conexion = new GsoConexion();

    this.api = axios.create({
      baseURL: conexion.gsoUrl,
      headers: conexion.headers,
    });
  }

  async getAll() {
    try {
      const response = await this.api.get("/AuthorizationModel/Get");
      return response.data;
    } catch (error) {
      console.error("Error en getAll:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await this.api.get(`/AuthorizationModel/GetById/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error en getById:", error);
      throw error;
    }
  }

  async create(data) {
    try {
      const response = await this.api.post("/AuthorizationModel/Create", data);
      return response.data;
    } catch (error) {
      console.error("Error en create:", error);
      throw error;
    }
  }

  async update(data) {
    try {
      const response = await this.api.put("/AuthorizationModel/Update", data);
      return response.data;
    } catch (error) {
      console.error("Error en update:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await this.api.delete(`/AuthorizationModel/Delete/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error en delete:", error);
      throw error;
    }
  }
}