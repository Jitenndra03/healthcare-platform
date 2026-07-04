import api from './axios';
export const appointmentsApi = {
  holdSlot:           (slotId: string)                               => api.post(`/appointments/slots/${slotId}/hold`),
  book:               (data: { slot_id: string; symptoms: string }) => api.post('/appointments', data),
  myAppointments:     ()                                             => api.get('/appointments/my'),
  doctorAppointments: ()                                             => api.get('/appointments/doctor'),
  submitNotes:        (id: string, data: object)                    => api.put(`/appointments/${id}/notes`, data),
  cancel:             (id: string)                                   => api.delete(`/appointments/${id}`),
};
