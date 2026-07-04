import api from './axios';
export const doctorsApi = {
  search:   (params: object) => api.get('/doctors/search', { params }),
  getProfile: (id: string)   => api.get(`/doctors/${id}`),
  getSlots: (id: string, date: string) => api.get(`/doctors/${id}/slots/${date}`),
};
