import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 60000 });

export const getActualsJan2026 = () => api.get('/actuals/january2026').then(r => r.data);
export const getForecastsJan2026 = () => api.get('/forecasts/january2026').then(r => r.data);
export const getDayAheadForecasts = () => api.get('/forecasts/day-ahead').then(r => r.data);
export const getLatestSnapshot = () => api.get('/forecasts/latest-snapshot').then(r => r.data);
export const getForecastsByDate = (date) => api.get(`/forecasts/by-date?target_date=${date}`).then(r => r.data);
export const getAccuracyMetrics = () => api.get('/analytics/accuracy').then(r => r.data);
export const getSummary = () => api.get('/analytics/summary').then(r => r.data);
export const getHealth = () => api.get('/health').then(r => r.data);

export default api;
