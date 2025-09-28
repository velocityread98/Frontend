import React, { useState } from 'react'
import { UserButton, useUser, SignedOut, SignInButton } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import BackendStatus from './BackendStatus'

function DashboardHeader() {
  return (
    <header className="vr-header">
      <div className="vr-container vr-header-inner">
        <a href="/" className="vr-brand" aria-label="VelocityRead home">
          <span className="vr-wordmark">
            <span className="vr-word-velocity">velocity</span>
            <span className="vr-word-read">read</span>
          </span>
        </a>
        <nav className="vr-nav-auth">
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  )
}

function BookUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    // Simulate upload process
    setUploadStatus('uploading')
    setTimeout(() => {
      setUploadStatus('success')
      setTimeout(() => setUploadStatus('idle'), 3000)
    }, 2000)
  }

  const getUploadMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading your book...'
      case 'success':
        return '✅ Book uploaded successfully!'
      case 'error':
        return '❌ Please upload a valid PDF file (max 50MB)'
      default:
        return 'Drag & drop a PDF here or click to browse'
    }
  }

  const getUploadSubtext = () => {
    if (uploadStatus === 'idle') {
      return 'Supports PDF files up to 50MB'
    }
    return ''
  }

  return (
    <div className="vr-upload-section">
      <h2 className="vr-upload-title">📚 Upload a Book</h2>
      <div 
        className={`vr-upload-zone ${dragActive ? 'vr-upload-zone-active' : ''} ${uploadStatus !== 'idle' ? `vr-upload-zone-${uploadStatus}` : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="vr-upload-content">
          <div className="vr-upload-message">{getUploadMessage()}</div>
          {getUploadSubtext() && <div className="vr-upload-subtext">{getUploadSubtext()}</div>}
        </div>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

function BookCard({ title, uploadDate, size }) {
  return (
    <div className="vr-book-card">
      <div className="vr-book-icon">📖</div>
      <div className="vr-book-info">
        <div className="vr-book-title">{title}</div>
        <div className="vr-book-meta">
          <span className="vr-book-date">{uploadDate}</span>
          <span className="vr-book-size">{size}</span>
        </div>
      </div>
    </div>
  )
}

function BookLibrary() {
  // Mock data - replace with API call later
  const mockBooks = [
    { id: 1, title: "The Great Gatsby", uploadDate: "2 days ago", size: "2.4 MB" },
    { id: 2, title: "To Kill a Mockingbird", uploadDate: "1 week ago", size: "3.1 MB" },
    { id: 3, title: "1984", uploadDate: "2 weeks ago", size: "2.8 MB" },
  ]

  return (
    <div className="vr-library-section">
      <h2 className="vr-library-title">Your Books ({mockBooks.length})</h2>
      {mockBooks.length > 0 ? (
        <div className="vr-library-grid">
          {mockBooks.map(book => (
            <BookCard
              key={book.id}
              title={book.title}
              uploadDate={book.uploadDate}
              size={book.size}
            />
          ))}
        </div>
      ) : (
        <div className="vr-library-empty">
          <div className="vr-empty-icon">📚</div>
          <div className="vr-empty-title">No books yet</div>
          <div className="vr-empty-desc">Upload your first book to get started!</div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useUser()

  return (
    <>
      {/* Redirect to home if not signed in */}
      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>

      {/* Show dashboard only when signed in */}
      <div className="vr-page">
        <DashboardHeader />
        
        <main className="vr-dashboard">
          <div className="vr-container">
            <BackendStatus />
            <BookUpload />
            <BookLibrary />
          </div>
        </main>
      </div>
    </>
  )
}