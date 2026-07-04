import api from './axios';
export const authApi = {
  register: (data: object) => api.post('/auth/register', data),
  login:    (data: object) => api.post('/auth/login', data),
  me:       ()             => api.get('/auth/me'),
};
