import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const features = [
  { icon: '⚡', title: 'Real-time Sync', desc: 'Every keystroke is instantly shared. Multiple users edit simultaneously with zero conflicts, powered by Yjs CRDT.' },
  { icon: '👥', title: 'Role-based Sharing', desc: 'Invite collaborators as Editors, Commenters, or Viewers. Fine-grained access control keeps your documents safe.' },
  { icon: '🕓', title: 'Version History', desc: 'Never lose work. Save named snapshots at any point and restore any version with a single click.' },
  { icon: '💬', title: 'Inline Comments', desc: 'Leave comments, reply to threads, and resolve discussions — all without leaving the editor.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get notified the moment someone shares a document or replies to your comment.' },
  { icon: '🔐', title: 'Secure Auth', desc: 'Sign in with email and password or use Google OAuth for a frictionless one-click login.' },
];

const steps = [
  { number: '01', title: 'Create a Document', desc: 'Click "New Document" from your dashboard to start from a blank page.' },
  { number: '02', title: 'Invite Collaborators', desc: 'Share via email and assign roles — Editor, Commenter, or Viewer.' },
  { number: '03', title: 'Edit Together', desc: "See each other's cursors and changes live. No refresh needed." },
];

export default function Landing() {
  const heroRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('landing-theme') || 'dark');
  const [scrolled, setScrolled] = useState(false);


  // Persist theme
  useEffect(() => {
    localStorage.setItem('landing-theme', theme);
  }, [theme]);

  // Parallax mouse effect & Scroll reset
  useEffect(() => {
    // Ensure page always starts at the top
    window.scrollTo(0, 0);

    const handleMouseMove = (e) => {
      if (!heroRef.current || window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const xPct = (clientX / window.innerWidth - 0.5) * 20;
      const yPct = (clientY / window.innerHeight - 0.5) * 20;
      heroRef.current.style.setProperty('--mouse-x', `${xPct}px`);
      heroRef.current.style.setProperty('--mouse-y', `${yPct}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll detection for sticky nav
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className={`landing landing-${theme}`}>

      {/* ── NAV ── */}
      <nav className={`landing-nav${scrolled ? ' nav-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon">✍️</span>
            <span className="landing-logo-text">SyncWrite</span>
          </div>



          <div className="landing-nav-actions">
            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/register" className="btn-primary-sm">Get started free</Link>


          </div>
        </div>


      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero" ref={heroRef}>
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Real-time collaboration · Powered by Yjs CRDT
          </div>
          <h1 className="hero-title">
            Write Together,<br />
            <span className="hero-title-gradient">Think Together.</span>
          </h1>
          <p className="hero-subtitle">
            SyncWrite is a blazing-fast collaborative document editor where your team's ideas
            come alive in real time — no lag, no conflicts, no limits.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-hero-primary">
              Start writing for free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/login" className="btn-hero-ghost">Sign in</Link>
          </div>
          <p className="hero-disclaimer">No credit card required · Free to use</p>
        </div>

        {/* ── MOCK EDITOR ── */}
        <div className="hero-editor-wrap">
          <div className="hero-editor">
            <div className="editor-titlebar">
              <div className="editor-dots">
                <span /><span /><span />
              </div>
              <span className="editor-filename">Project Proposal.doc</span>
              <div className="editor-avatars">
                <span className="avatar av-1">A</span>
                <span className="avatar av-2">B</span>
                <span className="avatar av-3">C</span>
              </div>
            </div>
            <div className="editor-toolbar">
              <span>B</span><span><em>I</em></span><span><u>U</u></span>
              <span className="tb-sep" />
              <span>H1</span><span>H2</span>
              <span className="tb-sep" />
              <span>≡</span><span>⊞</span>
            </div>
            <div className="editor-body">
              <div className="editor-line title-line">Project Proposal 2026</div>
              <div className="editor-line">
                <span className="cursor-a" />
                This document outlines the goals and roadmap for our
              </div>
              <div className="editor-line">upcoming product launch. The team agreed on:</div>
              <div className="editor-line indent">
                <span className="bullet" />Phase 1 — Research &amp; Discovery
              </div>
              <div className="editor-line indent">
                <span className="bullet" />Phase 2 — Design &amp; Prototyping
                <span className="cursor-b" />
              </div>
              <div className="editor-line indent muted">
                <span className="bullet" />Phase 3 — Development...
              </div>
              <div className="editor-comment-bubble">
                💬 &nbsp;<strong>Alex:</strong> Should we add a timeline here?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-features" id="features">
        <div className="section-header">
          <span className="section-pill">Features</span>
          <h2 className="section-title">Everything your team needs</h2>
          <p className="section-sub">From real-time editing to version control — it's all here.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-how" id="how">
        <div className="section-header">
          <span className="section-pill">How it works</span>
          <h2 className="section-title">Up and running in seconds</h2>
        </div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{s.number}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
              {i < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to write together?</h2>
        <p className="cta-sub">Join SyncWrite today — it's completely free.</p>
        <Link to="/register" className="btn-hero-primary">
          Create your account
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-logo">
          <span className="landing-logo-icon">✍️</span>
          <span className="landing-logo-text">SyncWrite</span>
        </div>
        <p className="footer-copy">© 2026 SyncWrite. Built with React, Node.js &amp; Yjs.</p>
        <div className="footer-links">
          <a
            href="https://github.com/beki255/SyncWrite"
            target="_blank"
            rel="noreferrer"
            className="footer-github-link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
