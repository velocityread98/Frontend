import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getChatSessions, createChatSession, deleteChatSession } from '../utils/api'

function ChatSessionManager({ book, currentChatId, onChatSelect, onChatCreate, onCloseSidebar, onSessionsFetched, refreshTrigger, hasNoChats, createDefaultChat }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const { getToken } = useAuth()

  useEffect(() => {
    if (book) {
      fetchChatSessions()
    }
  }, [book])

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0 && book) {
      fetchChatSessions()
    }
  }, [refreshTrigger, book])

  const fetchChatSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const response = await getChatSessions(book.id, token)
      const sessionsList = response.sessions || []
      setSessions(sessionsList)
      
      // Notify parent component with fetched sessions
      if (onSessionsFetched) {
        onSessionsFetched(sessionsList)
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err)
      setError('Failed to load chat sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChat = async () => {
    try {
      setCreating(true)
      const token = await getToken()
      if (!token) return

      const newSession = await createChatSession(book.id, 'New Chat', token)
      setSessions(prev => [newSession, ...prev])
      onChatCreate(newSession)
      
      // Close sidebar to take user back to chat interface
      if (onCloseSidebar) {
        onCloseSidebar()
      }
    } catch (err) {
      console.error('Failed to create chat session:', err)
      setError('Failed to create new chat')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteChat = async (sessionId, e) => {
    e.stopPropagation()
    
    try {
      const token = await getToken()
      if (!token) return

      await deleteChatSession(book.id, sessionId, token)
      setSessions(prev => prev.filter(session => session.id !== sessionId))
      
      // If we deleted the current session, clear it
      if (currentChatId === sessionId) {
        onChatSelect(null)
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err)
      setError('Failed to delete chat session')
    }
  }

  // Method to refresh sessions (to be called when titles are updated)
  const refreshSessions = () => {
    fetchChatSessions()
  }

  const formatDate = (dateString) => {
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

  if (loading) {
    return (
      <div className="vr-chat-sessions">
        <div className="vr-chat-sessions-header">
          <h3>Chat Sessions</h3>
        </div>
        <div className="vr-chat-sessions-loading">
          <div className="vr-loading-spinner"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="vr-chat-sessions">
      <div className="vr-chat-sessions-header">
        <h4>Chat Sessions</h4>
        <div className="vr-sessions-header-buttons">
          <button
            onClick={handleCreateChat}
            disabled={creating}
            className="vr-new-chat-button"
            title="Create new chat"
          >
            +
          </button>
          <button
            onClick={onCloseSidebar}
            className="vr-close-sidebar-button"
            title="Close sessions"
          >
            ×
          </button>
        </div>
      </div>      {error && (
        <div className="vr-chat-error">
          <p>{error}</p>
          <button onClick={fetchChatSessions} className="vr-retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="vr-chat-sessions-list">
        {sessions.length > 0 && (
          <div className="vr-new-chat-section">
            <button
              onClick={handleCreateChat}
              disabled={creating}
              className="vr-new-chat-full-button"
            >
              <span className="vr-new-chat-icon">+</span>
              <span>New Chat</span>
            </button>
          </div>
        )}
        
        {sessions.length === 0 && !currentChatId ? (
          <div className="vr-no-chats">
            <p>Loading your chats...</p>
          </div>
        ) : sessions.length === 0 && currentChatId ? (
          <div className="vr-no-chats">
            <p>Start chatting to see your conversation history here</p>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`vr-chat-session-item ${currentChatId === session.id ? 'active' : ''}`}
              onClick={() => {
                onChatSelect(session);
                if (onCloseSidebar) onCloseSidebar();
              }}
            >
              <div className="vr-chat-session-content">
                <div className="vr-chat-session-title">
                  {session.title}
                </div>
                <div className="vr-chat-session-meta">
                  <span className="vr-chat-session-date">
                    {formatDate(session.updated_at)}
                  </span>
                  {session.message_count > 0 && (
                    <span className="vr-chat-session-count">
                      {session.message_count} messages
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(session.id, e)}
                className="vr-chat-session-delete"
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatSessionManager