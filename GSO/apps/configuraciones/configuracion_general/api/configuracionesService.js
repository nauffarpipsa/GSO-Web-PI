export class ConfiguracionesService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
    });
  }

  async get(endpoint) {
    const response = await this.api.get(endpoint);
    return response.data;
  }

  async post(endpoint, data) {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  async put(endpoint, data) {
    const response = await this.api.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    const response = await this.api.delete(endpoint);
    return response.data;
  }
}
