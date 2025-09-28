import React, { useState, useEffect } from 'react'
import { UserButton, useUser, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react'
import { Navigate, useNavigate } from 'react-router-dom'
import BackendStatus from './BackendStatus'
import { uploadBook, getUserBooks, deleteBook } from '../utils/api'
import { useAuthSync } from '../hooks/useAuthSync'

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
          <UserButton 
            afterSignOutUrl="/" 
          />
        </nav>
      </div>
    </header>
  )
}

function BookUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const { getToken } = useAuth()

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
    // Reset the input value so the same file can be selected again
    e.target.value = ''
  }

  const handleFile = async (file) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF file')
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size must be less than 50MB')
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    // Upload to backend
    setUploadStatus('uploading')
    setErrorMessage('')
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const result = await uploadBook(file, token)
      setUploadStatus('success')
      
      // Notify parent component about successful upload
      if (onUploadSuccess) {
        onUploadSuccess(result)
      }
      
      setTimeout(() => setUploadStatus('idle'), 3000)
    } catch (error) {
      setErrorMessage(error.message || 'Upload failed')
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 5000)
    }
  }

  const getUploadMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading your book...'
      case 'success':
        return '✅ Book uploaded successfully!'
      case 'error':
        return `❌ ${errorMessage || 'Upload failed'}`
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

function BookCard({ id, title, uploadDate, size, onDelete, onOpen }) {
  return (
    <div 
      className="vr-book-card"
      onClick={() => onOpen(id)}
      style={{ cursor: 'pointer' }}
    >
      <div className="vr-book-icon">📖</div>
      <div className="vr-book-info">
        <div className="vr-book-title">{title}</div>
        <div className="vr-book-meta">
          <span className="vr-book-date">{uploadDate}</span>
          <span className="vr-book-size">{size}</span>
        </div>
      </div>
      <button 
        className="vr-book-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        title="Delete book"
      >
        🗑️
      </button>
    </div>
  )
}

function BookLibrary({ books, onDeleteBook, refreshBooks }) {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  
  const handleOpenBook = (bookId) => {
    navigate(`/book/${bookId}`)
  }
  
  const handleDeleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return
    }
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }
      
      await deleteBook(bookId, token)
      
      // Refresh the books list
      if (refreshBooks) {
        refreshBooks()
      }
    } catch (error) {
      alert('Failed to delete book: ' + error.message)
    }
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatUploadDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="vr-library-section">
      <h2 className="vr-library-title">Your Books ({books.length})</h2>
      {books.length > 0 ? (
        <div className="vr-library-grid">
          {books.map(book => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              uploadDate={formatUploadDate(book.upload_date)}
              size={formatFileSize(book.file_size)}
              onDelete={handleDeleteBook}
              onOpen={handleOpenBook}
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
  const { getToken } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch books when component mounts
  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        return
      }
      
      const userBooks = await getUserBooks(token)
      setBooks(userBooks)
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = (newBook) => {
    // Add the new book to the list
    setBooks(prevBooks => [newBook, ...prevBooks])
  }

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
            <BookUpload onUploadSuccess={handleUploadSuccess} />
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                Loading your books...
              </div>
            ) : (
              <BookLibrary 
                books={books} 
                refreshBooks={fetchBooks}
              />
            )}
          </div>
        </main>
      </div>
    </>
  )
}