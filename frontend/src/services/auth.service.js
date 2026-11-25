import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      correo: email,
      password,
    });
    return response.data;
  },

  register: async (userData) => {
    const payload = {
      ...userData,
      correo: userData.correo || userData.email,
      numero_licencia: userData.numero_licencia || userData.licencia,
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateMe: async (profileData) => {
    const response = await api.put('/auth/me', profileData);
    return response.data;
  },
};

export default authService;
