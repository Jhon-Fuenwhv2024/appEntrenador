import http from '../../../shared/api/http.js';

export function getProgramPresets() {
  return http.get('/programs/presets');
}

export function getPrograms() {
  return http.get('/programs');
}

export function getProgramById(id) {
  return http.get(`/programs/${id}`);
}

export function createProgram(payload) {
  return http.post('/programs', payload);
}

export function updateProgram(id, payload) {
  return http.patch(`/programs/${id}`, payload);
}

export function deleteProgram(id) {
  return http.delete(`/programs/${id}`);
}

export function addProgramPhase(programId, payload) {
  return http.post(`/programs/${programId}/phases`, payload);
}

export function propagatePhase(programId, phaseId) {
  return http.post(`/programs/${programId}/phases/${phaseId}/propagate`);
}

export function upsertWeekDays(programId, weekId, payload) {
  return http.put(`/programs/${programId}/weeks/${weekId}/days`, payload);
}

export function assignProgram(programId, payload) {
  return http.post(`/programs/${programId}/assign`, payload);
}

export function getClientProgramAssignments(clientId) {
  return http.get(`/clients/${clientId}/program-assignments`);
}

export function advanceProgramWeek(assignmentId) {
  return http.post(`/program-assignments/${assignmentId}/advance-week`);
}

export function getClientLastLifts(clientId, names) {
  const params = names?.length ? { names: names.join(',') } : undefined;
  return http.get(`/clients/${clientId}/last-lifts`, { params });
}
