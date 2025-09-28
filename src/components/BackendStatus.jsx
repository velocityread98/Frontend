import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getCurrentUserInfo } from '../utils/api'

/**
 * Component to test backend connectivity and show user info from backend
 */
export default function BackendStatus() {
  const { getToken, isSignedIn } = useAuth()
  const [backendUser, setBackendUser] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking') // checking, connected, error
  const [error, setError] = useState(null)

  useEffect(() => {
    const testBackendConnection = async () => {
      if (!isSignedIn) {
        setBackendStatus('not-signed-in')
        return
      }

      try {
        setBackendStatus('checking')
        const token = await getToken()
        
        if (!token) {
          setBackendStatus('no-token')
          return
        }

        const userInfo = await getCurrentUserInfo(token)
        setBackendUser(userInfo.user)
        setBackendStatus('connected')
        setError(null)
      } catch (err) {
        console.error('Backend connection test failed:', err)
        setBackendStatus('error')
        setError(err.message)
      }
    }

    testBackendConnection()
  }, [isSignedIn, getToken])

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return '#22c55e'
      case 'checking': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return '✅ Backend Connected'
      case 'checking': return '🔄 Checking Backend...'
      case 'error': return '❌ Backend Error'
      case 'no-token': return '⚠️ No Auth Token'
      case 'not-signed-in': return '🔐 Not Signed In'
      default: return '❓ Unknown Status'
    }
  }

  return (
    <div className="vr-backend-status" style={{
      padding: '16px',
      margin: '16px 0',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      backgroundColor: 'rgba(0,0,0,0.2)'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Backend Connection Status</h3>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        color: getStatusColor()
      }}>
        {getStatusText()}
      </div>

      {backendUser && (
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Backend User ID:</strong> {backendUser.id}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Email:</strong> {backendUser.email}
          </p>
          {backendUser.first_name && (
            <p style={{ margin: '4px 0' }}>
              <strong>Name:</strong> {backendUser.first_name} {backendUser.last_name}
            </p>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          fontSize: '12px', 
          color: '#ef4444', 
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <button 
        onClick={() => window.location.reload()} 
        style={{
          marginTop: '12px',
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Refresh Status
      </button>
    </div>
  )
}