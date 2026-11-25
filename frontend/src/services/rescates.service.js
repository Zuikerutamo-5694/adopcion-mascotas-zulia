import api from './api';

const rescatesService = {
  crear: async (rescateData) => {
    const response = await api.post('/rescates', rescateData);
    return response.data;
  },

  listar: async (params = {}) => {
    const response = await api.get('/rescates', { params });
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/rescates/${id}`);
    return response.data;
  },

  actualizar: async (id, rescateData) => {
    const response = await api.put(`/rescates/${id}`, rescateData);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/rescates/${id}`);
    return response.data;
  },
};

export default rescatesService;
