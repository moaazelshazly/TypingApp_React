import React from "react";

function Header({
  highest,
  soundEnabled,
  onToggleSound,
  onResetHighScore,
  activeTheme,
  onChangeTheme,
}) {
  const themes = [
    { id: "theme-indigo", label: "Midnight Indigo", color: "#9697e1ff" },
    { id: "theme-cyber", label: "Cyber Neon", color: "#78cedeff" },
    { id: "theme-emerald", label: "Matrix Emerald", color: "#46deabff" },
    { id: "theme-amber", label: "Sunset Amber", color: "#e3b362ff" },
  ];

  return (
    <header className="header-comp">
      <div className="brand-group">
        <div className="brand-logo">
          <svg
            className="brand-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">
            Type<span>Pulse</span>
          </div>
          <span className="brand-tagline">Typing Speed Test</span>
        </div>
      </div>

      <div className="header-controls">
        {/* Sound toggle button */}
        <button
          type="button"
          className={`control-pill sound-pill ${soundEnabled ? "sound-active" : ""}`}
          onClick={onToggleSound}
          title={soundEnabled ? "Mute typing sound" : "Enable mechanical switch sounds"}
          aria-label="Toggle mechanical keyboard sound"
        >
          {soundEnabled ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pill-icon">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <span>SFX: ON</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pill-icon">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <span>SFX: OFF</span>
            </>
          )}
        </button>

        {/* Theme selector */}
        <div className="theme-selector" title="Choose color accent">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-dot ${activeTheme === t.id ? "active-theme" : ""}`}
              style={{ "--theme-dot-color": t.color }}
              onClick={() => onChangeTheme(t.id)}
              aria-label={`Switch to ${t.label}`}
              title={t.label}
            />
          ))}
        </div>

        {/* High score badge */}
        <div className="highscore-badge" title="Your highest WPM recorded">
          <div className="trophy-wrapper">
          </div>
          <div className="highscore-details">
            <span className="highscore-label">Personal Best</span>
            <div className="highscore-value-row">
              <span className="highscore-value">{highest}</span>
              <span className="highscore-unit">WPM</span>
              {highest > 0 && (
                <button
                  type="button"
                  className="reset-score-btn"
                  onClick={onResetHighScore}
                  title="Reset personal best"
                  aria-label="Reset high score"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;