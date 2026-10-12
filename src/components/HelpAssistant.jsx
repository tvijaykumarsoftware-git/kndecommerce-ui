import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';

const starterMessage = {
  role: 'assistant',
  text: 'Hi! I can help you find products, understand shopping steps, or point you to order support. What can I help with?'
};

const HelpAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([starterMessage]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen]);

  const sendMessage = async (value = question) => {
    const text = value.trim();
    if (!text || isSending) return;

    setQuestion('');
    setIsSending(true);
    setMessages((current) => [...current, { role: 'user', text }]);

    try {
      const response = await API.post('/chat', { question: text });
      const answer = response.data;

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: answer.text,
          links: answer.links,
          products: answer.products
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'Sorry, I am having trouble connecting right now. Please try again or browse the catalog.',
          links: [{ to: '/catalog', label: 'Browse catalog' }]
        }
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="help-assistant">
      {isOpen && (
        <section className="assistant-panel" role="dialog" aria-label="KN Commerce help assistant">
          <header className="assistant-header">
            <span className="assistant-avatar" aria-hidden="true">K</span>
            <div>
              <strong>Store assistant</strong>
              <small>Product and shopping help</small>
            </div>
            <button className="assistant-close" type="button" aria-label="Close assistant" onClick={() => setIsOpen(false)}>×</button>
          </header>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`assistant-message is-${message.role}`} key={`${message.role}-${index}`}>
                <p>{message.text}</p>
                {message.products?.map((product) => (
                  <div className="assistant-product" key={product.id}>
                    {product.imageUrl && <img src={product.imageUrl} alt="" />}
                    <span>
                      <strong>{product.name}</strong>
                      <small>${product.price.toFixed(2)}</small>
                    </span>
                    <Link to="/catalog" aria-label={`View ${product.name}`} onClick={() => setIsOpen(false)}>View</Link>
                  </div>
                ))}
                {message.links?.length > 0 && (
                  <nav className="assistant-links" aria-label="Suggested pages">
                    {message.links.map((link) => (
                      <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)}>{link.label}</Link>
                    ))}
                  </nav>
                )}
              </article>
            ))}
            {isSending && <p className="assistant-typing" role="status">Finding a helpful answer...</p>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="assistant-prompts" aria-label="Suggested questions">
              <button type="button" onClick={() => sendMessage('Show me products under $50')}>Products under $50</button>
              <button type="button" onClick={() => sendMessage('How do I track my order?')}>Track an order</button>
              <button type="button" onClick={() => sendMessage('What is the return and refund process?')}>Returns and refunds</button>
            </div>
          )}

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="assistant-sr-only" htmlFor="assistant-question">Ask a question</label>
            <input
              id="assistant-question"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question..."
              autoComplete="off"
            />
            <button type="submit" aria-label="Send message" disabled={!question.trim() || isSending}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9" /></svg>
            </button>
          </form>
        </section>
      )}

      <button
        className={`assistant-launcher${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close help assistant' : 'Open help assistant'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <span aria-hidden="true">×</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.6-.9L4 20l1.4-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg>
            <span>Need help?</span>
          </>
        )}
      </button>
    </div>
  );
};

export default HelpAssistant;