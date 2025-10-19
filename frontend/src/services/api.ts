import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

/**
 * API Configuration
 * Works for both On-Prem and AWS Amplify deployments
 */

// Get API URL from environment variable
// For On-Prem: http://localhost:5000
// For AWS Amplify: https://your-amplify-url.amplifyapp.com
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

console.log('🌐 API Base URL:', API_BASE_URL)

/**
 * Create Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request Interceptor
 * Automatically adds JWT token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data || '')
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * Handles errors globally and token expiration
 */
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const message = (error.response?.data as any)?.error || error.message

    // Handle different error scenarios
    switch (status) {
      case 401:
        // Unauthorized - Token expired or invalid
        console.error('🔒 Unauthorized - Logging out')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')

        // Redirect to login only if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        break

      case 403:
        // Forbidden - Insufficient permissions
        toast.error('You do not have permission to perform this action')
        break

      case 404:
        // Not found
        if (import.meta.env.DEV) {
          toast.error(`Resource not found: ${error.config?.url}`)
        }
        break

      case 500:
        // Server error
        toast.error('Server error. Please try again later.')
        break

      case 503:
        // Service unavailable
        toast.error('Service temporarily unavailable')
        break

      default:
        // Network error or other errors
        if (!error.response) {
          toast.error('Network error. Please check your connection.')
        } else {
          toast.error(message || 'An error occurred')
        }
    }

    console.error('❌ Response Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method
    })

    return Promise.reject(error)
  }
)

/**
 * API Health Check
 * Useful for testing connectivity in both environments
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/health')
    console.log('✅ API Health Check:', response.data)
    return true
  } catch (error) {
    console.error('❌ API Health Check Failed:', error)
    return false
  }
}

/**
 * Get API Configuration Info
 */
export const getApiInfo = () => ({
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
})

export default api
