// API utilities for Velocity Read frontend

/**
 * Get the appropriate backend URL based on environment
 */
function getApiBaseUrl() {
  const hostname = window.location.hostname
  
  // If we're in production (deployed to Azure Static Web Apps)
  if (hostname.includes('azurestaticapps.net')) {
    console.log('🌐 Production environment detected - using linked backend')
    // Use relative URLs - the backend is linked to the static web app
    return ''
  }
  
  // For local development, use environment variable or localhost
  const localUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  console.log('🏠 Local environment detected - using:', localUrl)
  return localUrl
}

const API_BASE_URL = getApiBaseUrl()
console.log('🔧 API Base URL:', API_BASE_URL || 'relative URLs')

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
    
    console.log('Backend login notification sent:', response)
    return response
  } catch (error) {
    console.error('Failed to notify backend of login:', error)
    throw error
  }
}

/**
 * Call the backend logout endpoint when user logs out
 * @param {string} token - Clerk JWT token
 */
export async function notifyBackendLogout(token) {
  try {
    const response = await authenticatedFetch('/api/auth/logout', {
      method: 'POST',
    }, token)
    
    console.log('Backend logout notification sent:', response)
    return response
  } catch (error) {
    console.error('Failed to notify backend of logout:', error)
    // Don't throw error for logout - it's not critical if backend notification fails
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
    console.error('Failed to get user info from backend:', error)
    throw error
  }
}