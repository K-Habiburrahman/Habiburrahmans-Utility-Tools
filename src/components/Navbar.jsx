export default function Navbar({ tabs, activeTab, onSelect }) {
  return (
    <nav className="unified-nav" aria-label="Tool navigation" role="tablist">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          id={`${id}-tab`}
          className={`nav-tab${activeTab === id ? " active" : ""}`}
          type="button"
          role="tab"
          aria-controls={id}
          aria-selected={activeTab === id}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
