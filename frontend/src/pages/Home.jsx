import { Clock3, Languages, ShieldCheck, UsersRound } from "lucide-react";
import ChatWidget from "../components/ChatWidget.jsx";

const Home = () => (
  <div className="workspace-grid">
    <ChatWidget />
    <section className="side-panel">
      <div className="panel-heading">
        <h2>Live Queue</h2>
        <span className="status-dot">Online</span>
      </div>
      <div className="metric-list">
        <div>
          <Clock3 size={18} />
          <span>2.4s average reply</span>
        </div>
        <div>
          <UsersRound size={18} />
          <span>Human handoff ready</span>
        </div>
        <div>
          <Languages size={18} />
          <span>Multilingual detection</span>
        </div>
        <div>
          <ShieldCheck size={18} />
          <span>Server-side AI keys</span>
        </div>
      </div>
      <div className="mini-transcript">
        <span>Recent topics</span>
        <p>Business hours</p>
        <p>Booking request</p>
        <p>Refund policy</p>
      </div>
    </section>
  </div>
);

export default Home;
