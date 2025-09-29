import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getChatMessages, sendChatMessage, createChatSession } from '../utils/api'

function ChatInterface({ book, currentChatSession, onSessionUpdate, isSidebarExpanded, onToggleSidebar, onChatCreate, createDefaultChat }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const { getToken } = useAuth()

  // Load messages when chat session changes
  useEffect(() => {
    if (currentChatSession && !currentChatSession.is_temporary) {
      loadMessages()
    } else if (currentChatSession && currentChatSession.is_temporary) {
      // Show welcome message for temporary chat
      setMessages([{
        id: 'welcome',
        sender_type: 'assistant',
        content: `Welcome! I'm here to help you understand "${book?.title || 'this book'}". Start by asking me anything about the content, characters, themes, or concepts.`,
        created_at: new Date().toISOString()
      }])
    } else if (!currentChatSession && createDefaultChat) {
      // Create default chat if none exist
      createDefaultChat()
    }
  }, [currentChatSession, book, createDefaultChat])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!currentChatSession) return

    try {
      setLoadingMessages(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const response = await getChatMessages(book.id, currentChatSession.id, token)
      setMessages(response.messages || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentChatSession) return

    try {
      setIsLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      let sessionId = currentChatSession.id
      
      let isFirstMessage = false
      
      // If this is a temporary chat, create a real chat session first
      if (currentChatSession.is_temporary) {
        const newSession = await createChatSession(book.id, 'New Chat', token)
        sessionId = newSession.id
        isFirstMessage = true // This will be the first message in the new session
        
        // Update the current session to the real one
        if (onChatCreate) {
          onChatCreate(newSession)
        }
      } else {
        // Check if this is the first message in an existing session
        isFirstMessage = messages.length <= 1 // Only welcome message exists
      }

      const response = await sendChatMessage(book.id, sessionId, inputMessage.trim(), token)
      
      // Add both user and assistant messages to the UI
      setMessages(prev => [...prev, response.user_message, response.assistant_message])
      setInputMessage('')
      
      // Only refresh sessions list if this was the first message (to update title)
      if (onSessionUpdate) {
        onSessionUpdate(sessionId, isFirstMessage)
      }

    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = []
    let currentGroup = null
    let lastDate = null

    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toDateString()
      
      if (messageDate !== lastDate) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = {
          date: messageDate,
          messages: [message]
        }
        lastDate = messageDate
      } else {
        currentGroup.messages.push(message)
      }
    })

    if (currentGroup) {
      groups.push(currentGroup)
    }

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="vr-chat-interface">
      <div className="vr-chat-header">
        <div className="vr-chat-header-left">
          <h3>AI Reading Assistant</h3>
          <div className="vr-chat-status">
            <span className={`vr-status-dot ${currentChatSession ? 'active' : 'inactive'}`}></span>
            {currentChatSession ? 'Connected' : 'Select or create a chat'}
          </div>
        </div>
        <button 
          className="vr-sessions-toggle-icon"
          onClick={onToggleSidebar}
          title={isSidebarExpanded ? 'Hide chat sessions' : 'Show chat sessions'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {error && (
        <div className="vr-chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="vr-dismiss-error">
            ×
          </button>
        </div>
      )}

      <div className="vr-messages-area">
        {loadingMessages ? (
          <div className="vr-messages-loading">
            <div className="vr-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="vr-chat-empty-state">
            <div className="vr-empty-icon">💬</div>
            <h4>Start a conversation</h4>
            <p>Ask me anything about "{book?.title}". I can help you understand characters, themes, plot points, and more!</p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="vr-message-group">
                <div className="vr-message-date-separator">
                  <span>{formatDate(group.date)}</span>
                </div>
                {group.messages.map(message => (
                  <div key={message.id} className={`vr-chat-message vr-message-${message.sender_type}`}>
                    <div className="vr-message-content">
                      {message.content}
                      <div className="vr-message-timestamp">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {isLoading && (
              <div className="vr-chat-message vr-message-assistant">
                <div className="vr-message-content">
                  <div className="vr-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="vr-chat-input-area">
        <div className="vr-chat-input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentChatSession ? "Ask me anything about this book..." : "Loading..."}
            className="vr-chat-input"
            rows="1"
            disabled={isLoading || !currentChatSession}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !currentChatSession}
            className="vr-send-button"
            title="Send message"
          >
            ➤
          </button>
        </div>
        {!currentChatSession && (
          <div className="vr-input-hint">
            Preparing your chat session...
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface