export default function Navbar({ tabs, activeTab, onSelect }) {
  return (
    <nav id="tool-navigation" className="unified-nav" aria-label="Tool navigation" role="tablist">
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          id={`${id}-tab`}
          className={`nav-tab${activeTab === id ? " active" : ""}`}
          type="button"
          role="tab"
          aria-controls={id}
          aria-selected={activeTab === id}
          onClick={() => onSelect(id)}
          onKeyDown={(event) => {
            const currentIndex = tabs.findIndex((tab) => tab.id === id);
            let nextIndex;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              nextIndex = (currentIndex + 1) % tabs.length;
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            } else if (event.key === "Home") {
              nextIndex = 0;
            } else if (event.key === "End") {
              nextIndex = tabs.length - 1;
            } else {
              return;
            }
            event.preventDefault();
            onSelect(tabs[nextIndex].id);
            document.getElementById(`${tabs[nextIndex].id}-tab`)?.focus();
          }}
        >
          <span className="nav-tab-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
