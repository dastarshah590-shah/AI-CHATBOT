import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";

const emptyFaq = {
  question: "",
  answer: "",
  category: "General",
  language: "en",
  isActive: true
};

const AdminDashboard = () => {
  const auth = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyFaq);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");

  const token = auth.token;

  const loadData = async () => {
    setStatus("");
    const [analyticsData, faqData, bookingData] = await Promise.all([
      apiRequest("/analytics/dashboard", { token }),
      apiRequest("/faqs?includeInactive=true"),
      apiRequest("/bookings", { token })
    ]);

    setAnalytics(analyticsData.data);
    setFaqs(faqData.faqs);
    setBookings(bookingData.bookings);
  };

  useEffect(() => {
    loadData().catch((error) => setStatus(error.message));
  }, [token]);

  const stats = useMemo(
    () => [
      ["Conversations", analytics?.totalConversations ?? 0, "teal"],
      ["AI resolved", analytics?.resolvedByAI ?? 0, "blue"],
      ["Escalated", analytics?.escalatedToHuman ?? 0, "orange"],
      ["Bookings", analytics?.bookingRequests ?? bookings.length, "green"]
    ],
    [analytics, bookings.length]
  );

  const submitFAQ = async (event) => {
    event.preventDefault();
    const path = editingId ? `/faqs/${editingId}` : "/faqs";
    const method = editingId ? "PUT" : "POST";

    try {
      await apiRequest(path, {
        method,
        token,
        body: form
      });
      setForm(emptyFaq);
      setEditingId("");
      await loadData();
      setStatus(editingId ? "FAQ updated" : "FAQ added");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteFAQ = async (id) => {
    try {
      await apiRequest(`/faqs/${id}`, {
        method: "DELETE",
        token
      });
      await loadData();
      setStatus("FAQ deleted");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const updateBooking = async (id, nextStatus) => {
    try {
      await apiRequest(`/bookings/${id}/status`, {
        method: "PUT",
        token,
        body: { status: nextStatus }
      });
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="dashboard-stack">
      <section className="stats-grid">
        {stats.map(([label, value, tone]) => (
          <StatCard key={label} label={label} value={value} tone={tone} />
        ))}
      </section>

      {status ? <div className="notice">{status}</div> : null}

      <section className="management-grid">
        <div className="tool-panel">
          <div className="panel-heading">
            <div>
              <h2>FAQs</h2>
              <span>{faqs.length} items</span>
            </div>
            <button type="button" className="icon-button" onClick={() => loadData()} title="Refresh">
              <RefreshCw size={17} />
            </button>
          </div>

          <form className="faq-form" onSubmit={submitFAQ}>
            <input
              value={form.question}
              onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
              placeholder="Question"
              required
            />
            <textarea
              value={form.answer}
              onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
              placeholder="Answer"
              required
            />
            <div className="form-row">
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
              />
              <input
                value={form.language}
                onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                placeholder="Language"
              />
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Active
              </label>
            </div>
            <button type="submit" className="primary-button">
              {editingId ? <Check size={17} /> : <Plus size={17} />}
              {editingId ? "Update FAQ" : "Add FAQ"}
            </button>
          </form>

          <div className="faq-list">
            {faqs.map((faq) => (
              <article className="faq-item" key={faq.id}>
                <div>
                  <span>{faq.category}</span>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
                <div className="item-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Edit"
                    onClick={() => {
                      setEditingId(faq.id);
                      setForm({
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category,
                        language: faq.language,
                        isActive: faq.isActive
                      });
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button type="button" className="icon-button danger" title="Delete" onClick={() => deleteFAQ(faq.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          <div className="panel-heading">
            <div>
              <h2>Bookings</h2>
              <span>{bookings.length} requests</span>
            </div>
          </div>

          <div className="booking-list">
            {bookings.length === 0 ? <p className="empty-state">No booking requests yet.</p> : null}
            {bookings.map((booking) => (
              <article className="booking-item" key={booking.id}>
                <div>
                  <h3>{booking.name}</h3>
                  <p>
                    {booking.serviceType} on {String(booking.preferredDate).slice(0, 10)} at {booking.preferredTime}
                  </p>
                  <span>{booking.email}</span>
                </div>
                <select value={booking.status} onChange={(event) => updateBooking(booking.id, event.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
