import React, { useState } from 'react';
import axios from 'axios';

export default function AIChat({ selectedProblem }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !selectedProblem) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      setLoading(true);
      const response = await axios.post('/api/chat', {
        message: input,
        problem_id: selectedProblem.id,
      });

      const aiMsg = {
        role: 'assistant',
        content: response.data.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
  };

  const headerStyle = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const headerTitleStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const messageStyle = (isUser) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyle = (isUser) => ({
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: isUser ? '#2563eb' : 'white',
    color: isUser ? 'white' : '#111827',
    border: isUser ? 'none' : '1px solid #e5e7eb',
    boxShadow: isUser ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
  });

  const inputContainerStyle = {
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'white',
    display: 'flex',
    gap: '0.5rem',
  };

  const inputStyle = {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  };

  const buttonStyle = {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={headerTitleStyle}>💬 AI Assistant</h3>
        <p style={subtitleStyle}>
          {selectedProblem
            ? `Discussing: ${selectedProblem.id}`
            : 'Select a problem to chat'}
        </p>
      </div>

      <div style={messagesStyle}>
        {messages.length === 0 && selectedProblem && (
          <div style={{ textAlign: 'center', color: '#6b7280', margin: 'auto' }}>
            <p style={{ fontSize: '0.875rem' }}>👋 Ask me about this problem!</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              E.g., "What should we check?", "How long to fix?"
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={messageStyle(msg.role === 'user')}>
            <div style={messageBubbleStyle(msg.role === 'user')}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={messageStyle(false)}>
            <div style={messageBubbleStyle(false)}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#9ca3af',
                  animation: 'bounce 1.4s infinite',
                }}></div>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#9ca3af',
                  animation: 'bounce 1.4s infinite 0.2s',
                }}></div>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#9ca3af',
                  animation: 'bounce 1.4s infinite 0.4s',
                }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={inputContainerStyle}>
        {!selectedProblem ? (
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, textAlign: 'center', flex: 1 }}>
            👈 Select a problem to start chatting
          </p>
        ) : (
          <>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question..."
              disabled={loading}
              style={{
                ...inputStyle,
                backgroundColor: loading ? '#f3f4f6' : 'white',
                opacity: loading ? 0.6 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                ...buttonStyle,
                backgroundColor: loading || !input.trim() ? '#9ca3af' : '#2563eb',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              ↑
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}