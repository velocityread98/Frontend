import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { notifyBackendLogin, notifyBackendLogout } from '../utils/api'

/**
 * Custom hook to handle authentication events and sync with backend
 */
export function useAuthSync() {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const previousSignedIn = useRef(null)
  const loginNotified = useRef(false)

  useEffect(() => {
    const handleAuthStateChange = async () => {
      try {
        // User just signed in
        if (isSignedIn && previousSignedIn.current === false && !loginNotified.current) {
          console.log('User signed in, notifying backend...')
          const token = await getToken()
          if (token) {
            await notifyBackendLogin(token)
            loginNotified.current = true
          }
        }
        
        // User just signed out
        if (!isSignedIn && previousSignedIn.current === true) {
          console.log('User signed out, notifying backend...')
          // We can't get a token after logout, but we'll try to notify anyway
          // The backend should handle this gracefully
          await notifyBackendLogout(null)
          loginNotified.current = false
        }

        // Update previous state
        previousSignedIn.current = isSignedIn
      } catch (error) {
        console.error('Error handling auth state change:', error)
      }
    }

    // Only run if we have a definitive auth state (not null/undefined)
    if (isSignedIn !== null && isSignedIn !== undefined) {
      handleAuthStateChange()
    }
  }, [isSignedIn, getToken])

  // Reset login notification flag when user changes
  useEffect(() => {
    if (user) {
      loginNotified.current = false
    }
  }, [user?.id])

  return {
    isSignedIn,
    user,
    getToken
  }
}