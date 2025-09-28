import React from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

function Header() {
  return (
    <header className="vr-header">
      <div className="vr-container vr-header-inner">
        <a href="#top" className="vr-brand" aria-label="VelocityRead home">
          <span className="vr-wordmark">
            <span className="vr-word-velocity">velocity</span>
            <span className="vr-word-read">read</span>
          </span>
        </a>
        <nav className="vr-nav-auth">
          <SignInButton mode="modal">
            <button className="vr-btn vr-btn-primary">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="vr-btn vr-btn-ghost">Sign up</button>
          </SignUpButton>
        </nav>
      </div>
    </header>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div className="vr-feature">
      <div className="vr-feature-icon" aria-hidden>{icon}</div>
      <div>
        <div className="vr-feature-title">{title}</div>
        <div className="vr-feature-desc">{desc}</div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      {/* If user is signed in, redirect to dashboard */}
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
      
      {/* Show landing page only when signed out */}
      <SignedOut>
        <div className="vr-page">
          <Header />

          <main className="vr-hero">
            <div className="vr-container">
              <span className="vr-pill vr-accent">Better than ChatGPT for reading books</span>
              <h1 className="vr-title">
                Read Books Efficiently <br />
                with LLMs
              </h1>
              <p className="vr-subtitle">ChatGPT answers single questions but isn't designed for structured learning. Velocity Read breaks books into chapters and topics, letting you chat with individual sections for deep learning.</p>

              <div className="vr-cta">
                <SignInButton mode="modal">
                  <button className="vr-btn vr-btn-accent">Try Velocity Read →</button>
                </SignInButton>
              </div>

              <div className="vr-features">
                <Feature icon="📚" title="Auto-parse chapters, topics & subsections" desc="Import or paste a book and we structure it for you." />
                <Feature icon="💬" title="Chat with individual book sections" desc="Stay focused by chatting at the right granularity." />
                <Feature icon="🧠" title="Structured learning, not just Q&A" desc="Turn reading into a guided learning journey." />
              </div>
            </div>
          </main>
        </div>
      </SignedOut>
    </>
  )
}