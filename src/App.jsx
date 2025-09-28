import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import HomePage from './components/HomePage'
import Dashboard from './components/Dashboard'
import { useAuthSync } from './hooks/useAuthSync'

// Loading component while Clerk initializes
function LoadingSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0b0f17',
      color: '#e6ebf3'
    }}>
      <div>Loading...</div>
    </div>
  )
}

export default function App() {
  const { isLoaded } = useAuth()
  
  // Always call useAuthSync, but it will handle the case when Clerk isn't loaded
  useAuthSync()

  // Show loading screen while Clerk initializes
  if (!isLoaded) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}
