import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getChatMessages, sendChatMessage } from '../utils/api'

function ChatInterface({ book, currentChatSession, onSessionUpdate }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const { getToken } = useAuth()

  // Load messages when chat session changes
  useEffect(() => {
    if (currentChatSession) {
      loadMessages()
    } else {
      // Show welcome message when no chat is selected
      setMessages([{
        id: 'welcome',
        sender_type: 'assistant',
        content: `Welcome! I'm here to help you understand "${book?.title || 'this book'}". Create a new chat session to start asking questions about the content, characters, themes, or concepts.`,
        created_at: new Date().toISOString()
      }])
    }
  }, [currentChatSession, book])

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

      const response = await sendChatMessage(book.id, currentChatSession.id, inputMessage.trim(), token)
      
      // Add both user and assistant messages to the UI
      setMessages(prev => [...prev, response.user_message, response.assistant_message])
      setInputMessage('')
      
      // Notify parent component that session was updated
      if (onSessionUpdate) {
        onSessionUpdate(currentChatSession.id)
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
        <h3>AI Reading Assistant</h3>
        <div className="vr-chat-status">
          <span className={`vr-status-dot ${currentChatSession ? 'active' : 'inactive'}`}></span>
          {currentChatSession ? 'Connected' : 'Select or create a chat'}
        </div>
      </div>

      {error && (
        <div className="vr-chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="vr-dismiss-error">
            ×
          </button>
        </div>
      )}

      <div className="vr-chat-messages">
        {loadingMessages ? (
          <div className="vr-messages-loading">
            <div className="vr-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="vr-message-group">
                <div className="vr-message-date-separator">
                  <span>{formatDate(group.date)}</span>
                </div>
                {group.messages.map(message => (
                  <div key={message.id} className={`vr-message vr-message-${message.sender_type}`}>
                    <div className="vr-message-content">
                      {message.content}
                    </div>
                    <div className="vr-message-time">
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                ))}
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
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="vr-chat-input">
        <div className="vr-input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentChatSession ? "Ask me anything about this book..." : "Create a chat session to start messaging"}
            className="vr-message-input"
            rows="1"
            disabled={isLoading || !currentChatSession}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !currentChatSession}
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

export default ChatInterface