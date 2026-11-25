import api from './api';

const expedientesService = {
  listarResumen: async (params = {}) => {
    const response = await api.get('/expedientes', { params });
    return response.data;
  },

  obtener: async (mascotaId) => {
    const response = await api.get(`/mascotas/${mascotaId}/expediente`);
    return response.data;
  },

  crear: async (mascotaId, expedienteData) => {
    const response = await api.post(`/mascotas/${mascotaId}/expediente`, expedienteData);
    return response.data;
  },

  actualizar: async (expedienteId, expedienteData) => {
    const response = await api.put(`/expedientes/${expedienteId}`, expedienteData);
    return response.data;
  },
};

export default expedientesService;
