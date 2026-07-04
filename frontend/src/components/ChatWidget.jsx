import { useEffect, useRef, useState } from "react";
import { Headphones, Star } from "lucide-react";
import ChatInput from "./ChatInput.jsx";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { apiRequest } from "../services/api.js";
import { socket } from "../services/socket.js";

const welcomeMessage = {
  id: "welcome",
  senderType: "bot",
  message:
    "Hi! What are you here for today: services, business hours, booking an appointment, refund policy, language support, or human support?",
  confidence: 1
};

const ChatWidget = () => {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleIncoming = (message) => {
      if (!message || message.conversationId !== conversationId || message.senderType === "customer") {
        return;
      }
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    };

    socket.on("receive_message", handleIncoming);
    return () => {
      socket.off("receive_message", handleIncoming);
    };
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (conversationId) {
      socket.emit("join_conversation", conversationId);
    }
  }, [conversationId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();

    if (!message) {
      return;
    }

    setDraft("");
    setNotice("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: `customer-${Date.now()}`,
        senderType: "customer",
        message
      }
    ]);

    try {
      const data = await apiRequest("/chat/message", {
        method: "POST",
        body: {
          conversationId: conversationId || undefined,
          message
        }
      });
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          senderType: "bot",
          message: data.reply,
          confidence: data.confidence
        }
      ]);
      if (data.escalated) {
        setNotice("Escalated to human support");
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          senderType: "bot",
          message: error.message
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const requestHandoff = async () => {
    if (!conversationId) {
      setDraft("I want to speak to a human agent");
      return;
    }

    try {
      await apiRequest("/chat/escalate", {
        method: "POST",
        body: {
          conversationId,
          reason: "Customer clicked human support"
        }
      });
      setNotice("Escalated to human support");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const rateConversation = async (rating) => {
    if (!conversationId) {
      return;
    }

    try {
      await apiRequest(`/chat/conversations/${conversationId}/resolve`, {
        method: "POST",
        body: { satisfactionRating: rating }
      });
      setNotice(`Rated ${rating}/5`);
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <section className="chat-panel">
      <div className="panel-heading">
        <div>
          <h2>Customer Chat</h2>
          <span>{conversationId ? `#${conversationId.slice(0, 8)}` : "New session"}</span>
        </div>
        <button type="button" className="icon-button" onClick={requestHandoff} title="Human support">
          <Headphones size={18} />
        </button>
      </div>

      <div className="messages">
        {messages.map((message) => (
          <MessageBubble key={message.id || `${message.senderType}-${message.createdAt}-${message.message}`} message={message} />
        ))}
        {loading ? <TypingIndicator /> : null}
        <div ref={endRef} />
      </div>

      {notice ? <div className="notice">{notice}</div> : null}

      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button type="button" key={rating} className="rating-button" onClick={() => rateConversation(rating)} title={`${rating} stars`}>
            <Star size={15} />
          </button>
        ))}
      </div>

      <ChatInput value={draft} onChange={setDraft} onSubmit={sendMessage} disabled={loading} />
    </section>
  );
};

export default ChatWidget;
