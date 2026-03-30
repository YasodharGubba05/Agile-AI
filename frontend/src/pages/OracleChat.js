import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import './OracleChat.css';

const SUGGESTED_QUERIES = [
  "Who is overloaded?",
  "What are the bottlenecks?",
  "What's the project risk?",
  "Show me the velocity trend",
  "Which tasks are overdue?",
  "Who should I assign next?",
  "Give me a project health summary",
];

const OracleChat = ({ projectId, projectName }) => {
  const [messages, setMessages] = useState([
    {
      role: 'oracle',
      content: `⚡ **NEXUS Online**\n\nI'm the **NEXUS Intelligence Engine** for **${projectName || 'this project'}**. I analyze live project data to give you deep insights on risk, workload, velocity, deadlines, and team performance.\n\nAsk me anything — I'm always learning.`,
      type: 'general',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (queryText) => {
    const q = queryText || input.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/ai/oracle/${projectId}`, { query: q });
      const oracleMsg = {
        role: 'oracle',
        content: res.data.response.content,
        type: res.data.response.type,
        timestamp: res.data.response.timestamp,
      };
      setMessages(prev => [...prev, oracleMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'oracle',
        content: '❌ Unable to process your query. Please check your connection and try again.',
        type: 'error',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let tableBuffer = [];
    let inTable = false;

    const flushTable = (key) => {
      if (tableBuffer.length < 2) {
        tableBuffer.forEach((row, i) =>
          elements.push(<p key={`tr-${key}-${i}`} dangerouslySetInnerHTML={{ __html: applyInline(row) }} />)
        );
      } else {
        const headers = tableBuffer[0].split('|').filter(h => h.trim()).map(h => h.trim());
        const body = tableBuffer.slice(2).map(row =>
          row.split('|').filter(c => c.trim() !== undefined).map(c => c.trim())
        );

        elements.push(
          <table key={`table-${key}`} className="oracle-table">
            <thead>
              <tr>{headers.map((h, i) => <th key={i} dangerouslySetInnerHTML={{ __html: applyInline(h) }} />)}</tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} dangerouslySetInnerHTML={{ __html: applyInline(cell) }} />)}</tr>
              ))}
            </tbody>
          </table>
        );
      }
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, i) => {
      const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');

      if (isTableRow) {
        inTable = true;
        tableBuffer.push(line.trim());
        return;
      }

      if (inTable && !isTableRow) {
        flushTable(i);
      }

      if (!line.trim()) {
        elements.push(<div key={i} className="oracle-spacer" />);
        return;
      }

      if (line.startsWith('---')) {
        elements.push(<hr key={i} className="oracle-hr" />);
        return;
      }

      if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
        elements.push(
          <div key={i} className="oracle-section-heading" dangerouslySetInnerHTML={{ __html: applyInline(line) }} />
        );
        return;
      }

      if (line.startsWith('• ') || line.startsWith('  • ') || line.startsWith('- ')) {
        const indent = line.startsWith('  ') ? 'oracle-list-item indented' : 'oracle-list-item';
        elements.push(
          <div key={i} className={indent} dangerouslySetInnerHTML={{ __html: applyInline(line.replace(/^[•\- ]+/, '')) }} />
        );
        return;
      }

      elements.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: applyInline(line) }} />
      );
    });

    if (inTable) flushTable('end');
    return elements;
  };

  const applyInline = (text) =>
    (text || '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>');


  return (
    <div className="oracle-container">
      <div className="oracle-header">
        <div className="oracle-avatar">
          <span className="oracle-pulse" />
          ⚡
        </div>
        <div>
          <h2>NEXUS Intelligence Engine</h2>
          <span className="oracle-status">● Adaptive AI · Live Data Analysis</span>
        </div>
      </div>

      <div className="oracle-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`oracle-message ${msg.role}`}>
            {msg.role === 'oracle' && (
              <div className={`oracle-bubble type-${msg.type || 'general'}`}>
                <div className="oracle-content">{formatContent(msg.content)}</div>
                <div className="oracle-ts">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            )}
            {msg.role === 'user' && (
              <div className="user-bubble">
                <div className="oracle-content">{msg.content}</div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="oracle-message oracle">
            <div className="oracle-bubble type-general oracle-thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="oracle-suggestions">
        {SUGGESTED_QUERIES.slice(0, 4).map((q, i) => (
          <button key={i} className="suggestion-chip" onClick={() => sendQuery(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="oracle-input-area">
        <textarea
          className="oracle-input"
          placeholder="Ask NEXUS anything about your project..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button
          className={`oracle-send ${loading ? 'sending' : ''}`}
          onClick={() => sendQuery()}
          disabled={loading || !input.trim()}
        >
          {loading ? '⏳' : '🚀'}
        </button>
      </div>
    </div>
  );
};

export default OracleChat;
