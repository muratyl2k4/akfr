import axios from 'axios';

const API_BASE_URL = 'https://kral2121benim.pythonanywhere.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCustomers = async () => {
  const response = await api.get('/customers/');
  return response.data;
};

export const getCustomer = async (id) => {
  const response = await api.get(`/customers/${id}/`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post('/customers/', data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await api.put(`/customers/${id}/`, data);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}/`);
  return response.data;
};

export const recalculateCustomer = async (id) => {
  const response = await api.post(`/customers/${id}/recalculate/`);
  return response.data;
};

export const getTransactions = async (customerId) => {
  const response = await api.get(`/transactions/?customer=${customerId}`);
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions/', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.put(`/transactions/${id}/`, data);
  return response.data;
};

export const patchTransaction = async (id, data) => {
  const response = await api.patch(`/transactions/${id}/`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}/`);
  return response.data;
};

export const getReceiptPdfUrl = (transactionId) => {
  return `${API_BASE_URL}/transactions/${transactionId}/receipt/`;
};

export const getReceiptPreviewUrl = (transactionId, mask = false) => {
  return `${API_BASE_URL}/transactions/${transactionId}/receipt-preview/?mask=${mask}`;
};

export const downloadReceiptPdf = async (transactionId, filename = 'Akbank_Dekont.pdf') => {
  const response = await api.get(`/transactions/${transactionId}/receipt/`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getStatementPdfUrl = (customerId, month, year, period = '1m') => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  if (period) params.append('period', period);
  const q = params.toString();
  return `${API_BASE_URL}/customers/${customerId}/statement/${q ? `?${q}` : ''}`;
};

export const downloadStatementPdf = async (customerId, filename = 'Akbank_Hesap_Ozeti.pdf', month, year, period = '1m') => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  if (period) params.append('period', period);
  const q = params.toString();
  const response = await api.get(`/customers/${customerId}/statement/${q ? `?${q}` : ''}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const loginCustomer = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  return response.data;
};

export default api;
