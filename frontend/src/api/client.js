import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

export function getBusinessId() {
  return localStorage.getItem('businessId');
}

export function setBusinessId(id) {
  localStorage.setItem('businessId', id);
}

export function uploadTransactions(file) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/transactions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function computeMetrics(businessId) {
  return api.post('/metrics/compute', { businessId });
}

export function generateReport(businessId) {
  return api.post('/report/generate', { businessId });
}

export function getMetricsSnapshot(businessId) {
  return api.get('/metrics/snapshot', { params: { businessId } });
}

export function getMetricsHistory(businessId) {
  return api.get('/metrics/history', { params: { businessId } });
}

export function getForecast(businessId) {
  return api.get('/forecast', { params: { businessId } });
}

export function getRiskScore(businessId) {
  return api.get('/risk/score', { params: { businessId } });
}

export function getLatestReport(businessId) {
  return api.get('/report/latest', { params: { businessId } });
}

export default api;
