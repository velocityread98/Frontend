import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getChatSessions, createChatSession, deleteChatSession } from '../utils/api'

function ChatSessionManager({ book, currentChatId, onChatSelect, onChatCreate }) {
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

  const fetchChatSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const response = await getChatSessions(book.id, token)
      setSessions(response.sessions || [])
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
    } catch (err) {
      console.error('Failed to create chat session:', err)
      setError('Failed to create new chat')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getToken()
      if (!token) return

      await deleteChatSession(book.id, chatId, token)
      setSessions(prev => prev.filter(session => session.id !== chatId))
      
      // If the deleted chat was selected, clear selection
      if (currentChatId === chatId) {
        onChatSelect(null)
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err)
      setError('Failed to delete chat')
    }
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
        <h3>Chat Sessions</h3>
        <button
          onClick={handleCreateChat}
          disabled={creating}
          className="vr-new-chat-button"
          title="Start new chat"
        >
          {creating ? '...' : '+'}
        </button>
      </div>

      {error && (
        <div className="vr-chat-error">
          <p>{error}</p>
          <button onClick={fetchChatSessions} className="vr-retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="vr-chat-sessions-list">
        {sessions.length === 0 ? (
          <div className="vr-no-chats">
            <p>No chat sessions yet</p>
            <button
              onClick={handleCreateChat}
              disabled={creating}
              className="vr-create-first-chat"
            >
              Start your first chat
            </button>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`vr-chat-session-item ${currentChatId === session.id ? 'active' : ''}`}
              onClick={() => onChatSelect(session)}
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