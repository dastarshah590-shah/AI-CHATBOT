import { useState } from "react";
import { KeyRound, LogIn, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const demoAccounts = [
  { label: "Admin demo", email: "admin@smartbot.local" },
  { label: "Agent demo", email: "agent@smartbot.local" }
];

const Login = ({ onLoggedIn }) => {
  const auth = useAuth();
  const [email, setEmail] = useState("admin@smartbot.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await auth.login(email, password);
      onLoggedIn?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h2>Sign in</h2>
            <span>SmartBot AI workspace</span>
          </div>
          <LogIn size={20} />
        </div>

        <label className="field">
          <span>Email</span>
          <div className="input-with-icon">
            <UserRound size={17} />
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-with-icon">
            <KeyRound size={17} />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </div>
        </label>

        {error ? <div className="notice error">{error}</div> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="segmented-row">
          {demoAccounts.map((account) => (
            <button
              type="button"
              key={account.email}
              onClick={() => {
                setEmail(account.email);
                setPassword("password123");
              }}
            >
              {account.label}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
};

export default Login;
