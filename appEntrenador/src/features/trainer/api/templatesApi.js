import http from '../../../shared/api/http.js';

export function getTemplates() {
  return http.get('/templates');
}

export function getTemplateById(id) {
  return http.get(`/templates/${id}`);
}

export function createTemplate(payload) {
  return http.post('/templates', payload);
}

export function updateTemplate(id, payload) {
  return http.patch(`/templates/${id}`, payload);
}

export function appendExerciseToTemplate(id, payload) {
  return http.post(`/templates/${id}/exercises`, payload);
}

export function deleteTemplate(id) {
  return http.delete(`/templates/${id}`);
}

export function assignTemplate(id, payload) {
  return http.post(`/templates/${id}/assign`, payload);
}
