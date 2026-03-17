import { Link, NavLink } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-title">playbackgammon.net</Link>
          <nav aria-label="Primary navigation" className="site-nav">
            <NavLink to="/" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/rules" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>Rules</NavLink>
            <NavLink to="/strategy" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>Strategy</NavLink>
            <NavLink to="/faq" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>FAQ</NavLink>
          </nav>
        </div>
      </header>

      <main id="main-content" className="site-main">{children}</main>

      <footer className="site-footer">
        <nav aria-label="Footer navigation" className="site-footer-nav">
          <NavLink to="/glossary">Glossary</NavLink>
          <NavLink to="/single-player-backgammon">Single Player</NavLink>
          <NavLink to="/free-backgammon-online">Free Backgammon</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/terms">Terms of Service</NavLink>
          <NavLink to="/privacy">Privacy</NavLink>
        </nav>
      </footer>
    </div>
  );
}
