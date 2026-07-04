const Sidebar = ({ views, activeView, onChange }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">
      <span>SB</span>
    </div>
    <nav className="sidebar-nav" aria-label="Primary">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            type="button"
            key={view.id}
            className={activeView === view.id ? "nav-button active" : "nav-button"}
            onClick={() => onChange(view.id)}
            title={view.label}
          >
            <Icon size={19} />
            <span>{view.label}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);

export default Sidebar;
