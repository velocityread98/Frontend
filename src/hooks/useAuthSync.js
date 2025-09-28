import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { notifyBackendLogin } from '../utils/api'

/**
 * Custom hook to handle login events and sync with backend
 */
export function useAuthSync() {
  // All hooks must be called unconditionally
  const { isSignedIn, getToken, isLoaded } = useAuth()
  const { user } = useUser()
  const previousSignedIn = useRef(null)
  const loginNotified = useRef(false)

  useEffect(() => {
    // Don't handle auth changes if Clerk isn't loaded yet
    if (!isLoaded) {
      return
    }

    const handleAuthStateChange = async () => {
      try {
        // User just signed in (state changed from false to true)
        if (isSignedIn && previousSignedIn.current === false && !loginNotified.current) {
          const token = await getToken()
          if (token) {
            await notifyBackendLogin(token)
            loginNotified.current = true
          }
        }
        
        // User just signed out (state changed from true to false)
        if (!isSignedIn && previousSignedIn.current === true) {
          loginNotified.current = false
        }

        // User signed in for the first time (initial load with existing session)
        if (isSignedIn && previousSignedIn.current === null && !loginNotified.current) {
          const token = await getToken()
          if (token) {
            await notifyBackendLogin(token)
            loginNotified.current = true
          }
        }

        // Update previous state
        previousSignedIn.current = isSignedIn
      } catch (error) {
        // Silent error handling
      }
    }

    // Only run if we have a definitive auth state (not null/undefined)
    if (isSignedIn !== null && isSignedIn !== undefined) {
      handleAuthStateChange()
    }
  }, [isSignedIn, getToken, user, isLoaded])

  // Reset login notification flag when user changes
  useEffect(() => {
    if (!isLoaded) {
      return
    }
    
    if (user) {
      loginNotified.current = false
    }
  }, [user?.id, isLoaded])
}