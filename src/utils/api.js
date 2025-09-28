// API utilities for Velocity Read frontend

/**
 * Get the appropriate backend URL based on environment
 */
function getApiBaseUrl() {
  const hostname = window.location.hostname
  
  // If we're in production (deployed to Azure Static Web Apps)
  if (hostname.includes('azurestaticapps.net')) {
    // Use relative URLs - the backend is linked to the static web app
    return ''
  }
  
  // For local development, use environment variable or localhost
  const localUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  return localUrl
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Make authenticated API calls to the backend
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options
 * @param {string} token - Clerk JWT token
 */
export async function authenticatedFetch(endpoint, options = {}, token = null) {
  // Build the URL - for production use relative URLs, for dev use full URL
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Call the backend login endpoint after successful Clerk authentication
 * @param {string} token - Clerk JWT token
 */
export async function notifyBackendLogin(token) {
  try {
    const response = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
    }, token)
    
    return response
  } catch (error) {
    throw error
  }
}



/**
 * Get current user info from backend
 * @param {string} token - Clerk JWT token
 */
export async function getCurrentUserInfo(token) {
  try {
    const response = await authenticatedFetch('/api/auth/me', {
      method: 'GET',
    }, token)
    
    return response
  } catch (error) {
    throw error
  }
}