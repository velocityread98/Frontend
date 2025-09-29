import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { getUserBooks } from '../utils/api'
import ChatSessionManager from './ChatSessionManager'
import ChatInterface from './ChatInterface'

function BookReaderHeader({ book, onBack }) {
  return (
    <header className="vr-reader-header">
      <div className="vr-reader-header-content">
        <button 
          className="vr-back-button"
          onClick={onBack}
          title="Back to Dashboard"
        >
          ← Back
        </button>
        <div className="vr-reader-title">
          <span className="vr-book-title">{book?.title || 'Loading...'}</span>
        </div>
        <div className="vr-reader-auth">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}

function PDFViewer({ book }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()

  useEffect(() => {
    if (book) {
      fetchPdfFile()
    }
  }, [book])

  const fetchPdfFile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the token and create authenticated URL
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      // Get signed URL from backend
      const hostname = window.location.hostname
      let baseUrl = ''
      
      if (hostname.includes('azurestaticapps.net')) {
        baseUrl = ''
      } else {
        baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      }
      
      const apiUrl = baseUrl ? `${baseUrl}/api/books/${book.id}/file` : `/api/books/${book.id}/file`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get file URL: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      
      // Check if response is JSON (signed URL) or PDF (direct file)
      if (contentType && contentType.includes('application/json')) {
        // Handle signed URL response
        const data = await response.json()
        if (data.url) {
          setPdfUrl(data.url)
        } else {
          throw new Error('No URL provided in response')
        }
      } else {
        // Handle direct PDF response (local files)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching PDF:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // Cleanup blob URL when component unmounts (only for blob URLs, not SAS URLs)
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <div className="vr-pdf-viewer">
      <div className="vr-pdf-container">
        {loading ? (
          <div className="vr-pdf-loading">
            <div className="vr-loading-spinner"></div>
            <p>Loading PDF...</p>
          </div>
        ) : error ? (
          <div className="vr-pdf-error">
            <p>Error loading PDF: {error}</p>
            <button onClick={fetchPdfFile} className="vr-retry-button">
              Retry
            </button>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            title={book?.title || 'PDF Viewer'}
            className="vr-pdf-iframe"
          />
        ) : (
          <div className="vr-pdf-loading">
            <div className="vr-loading-spinner"></div>
            <p>Preparing PDF...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ChatInterface component moved to separate file

export default function BookReader() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentChatSession, setCurrentChatSession] = useState(null)
  const [refreshSessions, setRefreshSessions] = useState(0)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [sessionsFetched, setSessionsFetched] = useState(false)

  useEffect(() => {
    fetchBookDetails()
  }, [bookId])

  const fetchBookDetails = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        navigate('/dashboard')
        return
      }

      // Get all user books and find the one we need
      const books = await getUserBooks(token)
      const foundBook = books.find(b => b.id === bookId)
      
      if (!foundBook) {
        setError('Book not found')
        return
      }

      setBook(foundBook)
    } catch (err) {
      console.error('Failed to fetch book details:', err)
      setError('Failed to load book')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleChatSelect = (session) => {
    setCurrentChatSession(session)
  }

  const handleChatCreate = (newSession) => {
    setCurrentChatSession(newSession)
    setRefreshSessions(prev => prev + 1)
  }

  const handleSessionsFetched = (sessions) => {
    setSessionsFetched(true)
    if (sessions.length > 0 && !currentChatSession) {
      // Select the latest chat (first in the list as they're sorted by updated_at desc)
      setCurrentChatSession(sessions[0])
    } else if (sessions.length === 0 && !currentChatSession) {
      // Create default chat if no sessions exist
      createDefaultChat()
    }
  }

  const handleSessionUpdate = (sessionId, shouldRefresh = false) => {
    // Only refresh sessions list when explicitly needed (like title updates)
    if (shouldRefresh) {
      setRefreshSessions(prev => prev + 1)
    }
  }

  const createDefaultChat = () => {
    // Create a temporary default chat that will be saved when user sends first message
    const defaultChat = {
      id: 'temp-default',
      title: 'New Chat',
      is_temporary: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0
    }
    setCurrentChatSession(defaultChat)
  }

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev)
  }

  if (loading) {
    return (
      <div className="vr-reader-loading">
        <div className="vr-loading-spinner"></div>
        <p>Loading book...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="vr-reader-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBack} className="vr-back-button">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="vr-book-reader">
      <BookReaderHeader book={book} onBack={handleBack} />
      
      <main className="vr-reader-main">
        <div className="vr-reader-content">
          <div className="vr-reader-left">
            <PDFViewer book={book} />
          </div>
          <div className="vr-reader-right">
            <div className="vr-chat-container">
              <div className="vr-chat-main">
                <ChatInterface
                  book={book}
                  currentChatSession={currentChatSession}
                  onSessionUpdate={handleSessionUpdate}
                  isSidebarExpanded={isSidebarExpanded}
                  onToggleSidebar={toggleSidebar}
                  onChatCreate={handleChatCreate}
                  createDefaultChat={createDefaultChat}
                />
              </div>
              <div className={`vr-chat-sidebar ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
                <ChatSessionManager
                  book={book}
                  currentChatId={currentChatSession?.id}
                  onChatSelect={handleChatSelect}
                  onChatCreate={handleChatCreate}
                  onCloseSidebar={() => setIsSidebarExpanded(false)}
                  onSessionsFetched={handleSessionsFetched}
                  refreshTrigger={refreshSessions}
                  hasNoChats={!currentChatSession}
                  createDefaultChat={createDefaultChat}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}