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
  const getFileUrl = () => {
    if (!book) return null
    
    // If it's already a full URL (Azure storage), use it directly
    if (book.file_path && book.file_path.startsWith('https://')) {
      return book.file_path
    }
    
    // Otherwise, use our backend endpoint to serve the file
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${baseUrl}/api/books/${book.id}/file`
  }

  return (
    <div className="vr-pdf-viewer">
      <div className="vr-pdf-container">
        {book ? (
          <iframe
            src={`${getFileUrl()}#toolbar=1&navpanes=1&scrollbar=1`}
            title={book.title}
            className="vr-pdf-iframe"
          />
        ) : (
          <div className="vr-pdf-loading">
            <div className="vr-loading-spinner"></div>
            <p>Loading PDF...</p>
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