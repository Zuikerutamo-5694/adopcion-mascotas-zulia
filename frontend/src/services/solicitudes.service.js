import api from './api';

const solicitudesService = {
  crear: async (solicitudData) => {
    const response = await api.post('/solicitudes', solicitudData);
    return response.data;
  },

  listar: async (params = {}) => {
    const response = await api.get('/solicitudes', { params });
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/solicitudes/${id}`);
    return response.data;
  },

  evaluar: async (id, evaluacion) => {
    const response = await api.patch(`/solicitudes/${id}/evaluar`, evaluacion);
    return response.data;
  },

  agendarCita: async (id, citaData) => {
    const response = await api.post(`/solicitudes/${id}/citas`, citaData);
    return response.data;
  },

  actualizarEstadoCita: async (idSolicitud, idCita, estado) => {
    const response = await api.patch(`/solicitudes/${idSolicitud}/citas/${idCita}`, { estado });
    return response.data;
  },
};

export default solicitudesService;
