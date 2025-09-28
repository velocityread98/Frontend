import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './styles.css'

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const MissingClerkKey = () => (
  <div style={{
    minHeight: '100vh',
    background: '#0b0f17',
    color: '#e6ebf3',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    textAlign: 'center'
  }}>
    <div>
      <h1 style={{margin: 0, marginBottom: 8}}>Missing Clerk configuration</h1>
      <p style={{opacity: .8, maxWidth: 640, margin: '0 auto'}}>
        Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in a <code>.env.local</code> file at the project root and restart the dev server.
      </p>
      <pre style={{
        marginTop: 16,
        textAlign: 'left',
        background: '#0f1522',
        padding: 12,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>{`# .env.local
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY`}</pre>
    </div>
  </div>
)

const root = createRoot(document.getElementById('root'))

if (!PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY. Create .env.local and restart.')
  root.render(<MissingClerkKey />)
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  )
}
