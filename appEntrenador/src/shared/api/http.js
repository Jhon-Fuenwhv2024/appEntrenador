import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error.response?.data;
    const message = responseData?.error
      || responseData?.message
      || error.message
      || 'Error de conexión con el servidor.';

    error.normalized = {
      success: false,
      error: message,
      message,
      code: responseData?.code || error.response?.status || 0,
      details: responseData,
    };

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Error de conexión con el servidor.') {
  return error?.normalized?.error
    || error?.response?.data?.error
    || error?.response?.data?.message
    || fallback;
}

export default http;
