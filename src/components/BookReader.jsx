import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { getUserBooks } from '../utils/api'

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

function ChatInterface({ book }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: `Welcome! I'm here to help you understand "${book?.title || 'this book'}". Ask me anything about the content, characters, themes, or concepts.`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I'd be happy to help you with that question about "${book?.title}". This is a placeholder response - AI integration coming soon!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="vr-chat-interface">
      <div className="vr-chat-header">
        <h3>AI Reading Assistant</h3>
        <div className="vr-chat-status">
          <span className="vr-status-dot"></span>
          Ready to help
        </div>
      </div>
      
      <div className="vr-chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`vr-message vr-message-${message.type}`}>
            <div className="vr-message-content">
              {message.content}
            </div>
            <div className="vr-message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="vr-message vr-message-assistant vr-message-loading">
            <div className="vr-message-content">
              <div className="vr-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="vr-chat-input">
        <div className="vr-input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about this book..."
            className="vr-message-input"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="vr-send-button"
            title="Send message"
          >
            <span className="vr-send-icon">➤</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookReader() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
            <ChatInterface book={book} />
          </div>
        </div>
      </main>
    </div>
  )
}