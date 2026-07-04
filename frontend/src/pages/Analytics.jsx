import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";

const Analytics = () => {
  const auth = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setError("");
    try {
      const response = await apiRequest("/analytics/dashboard", { token: auth.token });
      setData(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [auth.token]);

  const maxVolume = useMemo(() => Math.max(...(data?.chatVolume || []).map((item) => item.count), 1), [data]);

  return (
    <div className="dashboard-stack">
      <div className="panel-heading">
        <div>
          <h2>Analytics</h2>
          <span>{data?.ticketReductionRate || "0%"} ticket reduction</span>
        </div>
        <button type="button" className="icon-button" onClick={loadAnalytics} title="Refresh">
          <RefreshCw size={17} />
        </button>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard label="Total" value={data?.totalConversations ?? 0} tone="teal" />
        <StatCard label="Resolved" value={data?.resolvedByAI ?? 0} tone="green" />
        <StatCard label="Escalated" value={data?.escalatedToHuman ?? 0} tone="orange" />
        <StatCard label="CSAT" value={data?.customerSatisfaction ?? "4.6"} tone="blue" />
      </section>

      <section className="analytics-grid">
        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Volume</h2>
          </div>
          <div className="volume-chart">
            {(data?.chatVolume || []).map((item) => (
              <div className="volume-column" key={item.date}>
                <span style={{ height: `${Math.max((item.count / maxVolume) * 100, 8)}%` }} />
                <small>{item.date}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          <div className="panel-heading">
            <h2>Languages</h2>
          </div>
          <div className="language-bars">
            {(data?.languagesUsed || []).map((item) => (
              <div className="bar-row" key={item.language}>
                <span>{item.language.toUpperCase()}</span>
                <div>
                  <b style={{ width: `${Math.min(item.count * 18, 100)}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="tool-panel wide">
          <div className="panel-heading">
            <h2>Top Questions</h2>
          </div>
          <div className="question-list">
            {(data?.topQuestions || []).length === 0 ? <p className="empty-state">No customer questions yet.</p> : null}
            {(data?.topQuestions || []).map((item) => (
              <div className="question-row" key={item.question}>
                <p>{item.question}</p>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
