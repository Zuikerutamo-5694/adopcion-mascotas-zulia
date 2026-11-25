import api from './api';

const mascotasService = {
  listar: async (params = {}) => {
    const response = await api.get('/mascotas', { params });
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/mascotas/${id}`);
    return response.data;
  },

  crear: async (mascotaData) => {
    const response = await api.post('/mascotas', mascotaData);
    return response.data;
  },

  actualizar: async (id, mascotaData) => {
    const response = await api.patch(`/mascotas/${id}`, mascotaData);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/mascotas/${id}`);
    return response.data;
  },

  subirFotos: async (id, formDataOrPayload) => {
    const response = await api.post(`/mascotas/${id}/fotos`, formDataOrPayload);
    return response.data;
  },

  marcarFotoPrincipal: async (id, fotoId) => {
    const response = await api.patch(`/mascotas/${id}/fotos/${fotoId}/principal`);
    return response.data;
  },

  eliminarFoto: async (id, fotoId) => {
    const response = await api.delete(`/mascotas/${id}/fotos/${fotoId}`);
    return response.data;
  },
};

export default mascotasService;
