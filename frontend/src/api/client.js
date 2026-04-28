import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - redirect to login only when not on auth routes
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Slots ────────────────────────────────────────────────────────────────────
export const slotsAPI = {
  getAll: (params) => api.get('/slots', { params }),
}

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  getMyReservations: () => api.get('/reservations/me'),
  cancel: (id) => api.delete(`/reservations/${id}`),
}

// ─── Restaurant ───────────────────────────────────────────────────────────────
export const restaurantAPI = {
  getInfo: () => api.get('/restaurant'),
}

export default api
