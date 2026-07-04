import api from './axios';
export const adminApi = {
  createDoctor: (data: object)                                  => api.post('/admin/doctors', data),
  getDoctors:   ()                                              => api.get('/admin/doctors'),
  updateDoctor: (id: string, data: object)                     => api.put(`/admin/doctors/${id}`, data),
  markLeave:    (id: string, data: object)                     => api.post(`/admin/doctors/${id}/leave`, data),
  getLeaves:    (id: string)                                    => api.get(`/admin/doctors/${id}/leaves`),
};
