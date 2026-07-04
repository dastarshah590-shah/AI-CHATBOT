const StatCard = ({ label, value, tone = "teal" }) => (
  <article className={`stat-card ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

export default StatCard;
