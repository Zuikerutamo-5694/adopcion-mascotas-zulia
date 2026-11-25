import api from './api';

const adminService = {
  obtenerReportes: async (params = {}) => {
    const response = await api.get('/admin/reportes', { params });
    return response.data;
  },

  listarUsuarios: async (params = {}) => {
    const response = await api.get('/admin/usuarios', { params });
    return response.data;
  },

  cambiarEstadoUsuario: async (userId, estadoData) => {
    const response = await api.patch(`/admin/usuarios/${userId}/estado`, estadoData);
    return response.data;
  },
};

export default adminService;
