import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, SendHorizontal } from "lucide-react";
import MessageBubble from "../components/MessageBubble.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import { socket } from "../services/socket.js";

const AgentDashboard = () => {
  const auth = useAuth();
  const [filter, setFilter] = useState("escalated");
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId]
  );

  const loadConversations = async () => {
    setNotice("");
    const query = filter === "all" ? "" : `?status=${filter}`;
    const data = await apiRequest(`/chat/conversations${query}`, { token: auth.token });
    setConversations(data.conversations);
    if (!selectedId && data.conversations[0]) {
      setSelectedId(data.conversations[0].id);
    }
  };

  const loadHistory = async (conversationId) => {
    if (!conversationId) {
      return;
    }

    const data = await apiRequest(`/chat/conversations/${conversationId}`);
    setMessages(data.conversation.messages);
    socket.emit("join_conversation", conversationId);
  };

  useEffect(() => {
    loadConversations().catch((error) => setNotice(error.message));
  }, [filter, auth.token]);

  useEffect(() => {
    loadHistory(selectedId).catch((error) => setNotice(error.message));
  }, [selectedId]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleMessage = (message) => {
      if (message?.conversationId !== selectedId) {
        return;
      }
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    };

    const handleEscalation = () => {
      loadConversations().catch(() => {});
    };

    socket.on("receive_message", handleMessage);
    socket.on("bot_reply", handleMessage);
    socket.on("conversation_escalated", handleEscalation);

    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("bot_reply", handleMessage);
      socket.off("conversation_escalated", handleEscalation);
    };
  }, [selectedId, filter, auth.token]);

  const sendReply = async (event) => {
    event.preventDefault();
    const message = draft.trim();

    if (!message || !selectedId) {
      return;
    }

    setDraft("");
    try {
      const data = await apiRequest(`/chat/conversations/${selectedId}/agent-reply`, {
        method: "POST",
        token: auth.token,
        body: { message }
      });
      setMessages((current) => (current.some((item) => item.id === data.data.id) ? current : [...current, data.data]));
      await loadConversations();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const resolve = async () => {
    if (!selectedId) {
      return;
    }

    try {
      await apiRequest(`/chat/conversations/${selectedId}/resolve`, {
        method: "POST",
        body: {}
      });
      await loadConversations();
      setNotice("Conversation resolved");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <div className="agent-grid">
      <section className="conversation-list tool-panel">
        <div className="panel-heading">
          <div>
            <h2>Inbox</h2>
            <span>{conversations.length} conversations</span>
          </div>
          <button type="button" className="icon-button" onClick={loadConversations} title="Refresh">
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="segmented-row">
          {["escalated", "active", "all"].map((item) => (
            <button type="button" key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        {conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            className={selectedId === conversation.id ? "conversation-item selected" : "conversation-item"}
            onClick={() => setSelectedId(conversation.id)}
          >
            <span>{conversation.status}</span>
            <strong>#{conversation.id.slice(0, 8)}</strong>
            <p>{conversation.lastMessage?.message || "No messages"}</p>
          </button>
        ))}
      </section>

      <section className="agent-thread tool-panel">
        <div className="panel-heading">
          <div>
            <h2>Conversation</h2>
            <span>{selectedConversation ? `#${selectedConversation.id.slice(0, 8)}` : "Select a chat"}</span>
          </div>
          <button type="button" className="icon-button" onClick={resolve} title="Resolve">
            <CheckCircle2 size={18} />
          </button>
        </div>

        {notice ? <div className="notice">{notice}</div> : null}

        <div className="messages agent-messages">
          {messages.length === 0 ? <p className="empty-state">No messages selected.</p> : null}
          {messages.map((message) => (
            <MessageBubble key={message.id || `${message.senderType}-${message.createdAt}-${message.message}`} message={message} />
          ))}
        </div>

        <form className="agent-reply" onSubmit={sendReply}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Reply as agent..."
            disabled={!selectedId}
          />
          <button type="submit" className="icon-button primary" disabled={!draft.trim() || !selectedId} title="Send">
            <SendHorizontal size={18} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default AgentDashboard;
