import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  MessageSquare, 
  RefreshCw, 
  Mail, 
  FileCheck, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { InvoiceData, ChatMessage } from '../types';

interface InvoiceChatAssistantProps {
  invoice: InvoiceData;
}

export const InvoiceChatAssistant: React.FC<InvoiceChatAssistantProps> = ({ invoice }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I've analyzed **${invoice.vendor?.name || 'this invoice'}** (Invoice #${invoice.invoiceNumber}) totaling **${invoice.currency} ${invoice.grandTotal.toFixed(2)}**. How can I help you review or take action on this document?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickPrompts = [
    { label: 'Draft Approval Memo', text: `Draft a concise internal approval memo for this invoice ${invoice.invoiceNumber} from ${invoice.vendor?.name} for the finance team.` },
    { label: 'Check Payment Terms', text: `Summarize the exact payment terms, due date, and any early-payment discount or late penalty options for this invoice.` },
    { label: 'Draft Vendor Tax ID Inquiry', text: `Draft a polite email to ${invoice.vendor?.name} requesting their verified W-9 / Tax ID and bank routing confirmation.` },
    { label: 'Line-Item Tax Breakdown', text: `Explain how the taxes were calculated on these line items and if any items appear exempt.` },
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuestion;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceData: invoice,
          question: textToSend,
          conversationHistory: messages.slice(-6),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate answer');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I could not generate an answer for that question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error**: ${err.message || 'Could not communicate with Gemini AI assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Invoice Intelligence Copilot</h4>
            <p className="text-[10px] text-slate-400">Contextual Q&A on {invoice.invoiceNumber}</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
          Gemini 3.7 Flash
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
            )}

            <div
              className={`relative group max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>

              {msg.sender === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  title="Copy response"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Gemini is analyzing invoice context...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.text)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          id="chat-invoice-input"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask anything about this invoice (e.g. 'Draft payment email', 'Verify tax calculations')..."
          disabled={isSending}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          id="btn-send-chat"
          disabled={!inputQuestion.trim() || isSending}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
