import { useState, useEffect } from "react";
import Header from "./component/Header";
import Content from "./component/Content";
function App() {
  // Difficulty selection
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem("typepulse_difficulty") || "easy";
  });

  // Highest WPM (Personal Best)
  const [highest, setHighest] = useState(() => {
    const saved = localStorage.getItem("typepulse_highest_wpm");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sound effects state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("typepulse_sound");
    return saved !== null ? saved === "true" : true;
  });

  // Theme selection
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("typepulse_theme") || "theme-indigo";
  });

  // Save difficulty changes
  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    localStorage.setItem("typepulse_difficulty", newDiff);
  };

  // Toggle audio
  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("typepulse_sound", String(next));
      return next;
    });
  };

  // Change theme
  const handleChangeTheme = (newTheme) => {
    setActiveTheme(newTheme);
    localStorage.setItem("typepulse_theme", newTheme);
  };

  // High score update
  const handleNewHighScore = (newScore) => {
    if (newScore > highest) {
      setHighest(newScore);
      localStorage.setItem("typepulse_highest_wpm", String(newScore));
    }
  };

  // Reset high score
  const handleResetHighScore = () => {
    if (window.confirm("Are you sure you want to reset your personal best score?")) {
      setHighest(0);
      localStorage.removeItem("typepulse_highest_wpm");
    }
  };

  // Apply theme class to document element
  useEffect(() => {
    document.documentElement.className = activeTheme;
  }, [activeTheme]);

  return (
    <div className="app-shell">
      <div className="app-layout">
        <Header
          highest={highest}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onResetHighScore={handleResetHighScore}
          activeTheme={activeTheme}
          onChangeTheme={handleChangeTheme}
        />

        {/* Difficulty Bar */}
        <div className="difficulty-container">
          <div className="difficulty-label-group">
            <span className="difficulty-title">Difficulty</span>
            <span className="difficulty-desc">
              {difficulty === "easy" && "Short, relaxed sentences"}
              {difficulty === "medium" && "Standard paragraphs with flow"}
              {difficulty === "hard" && "Complex syntax, quotes & punctuation"}
            </span>
          </div>

          <div className="difficulty-pills">
            <button
              type="button"
              className={`diff-pill ${difficulty === "easy" ? "active" : ""}`}
              onClick={() => handleDifficultyChange("easy")}
            >
              <span className="pill-dot"></span>
              Easy
            </button>
            <button
              type="button"
              className={`diff-pill ${difficulty === "medium" ? "active" : ""}`}
              onClick={() => handleDifficultyChange("medium")}
            >
              <span className="pill-dot"></span>
              Medium
            </button>
            <button
              type="button"
              className={`diff-pill ${difficulty === "hard" ? "active" : ""}`}
              onClick={() => handleDifficultyChange("hard")}
            >
              <span className="pill-dot"></span>
              Hard
            </button>
          </div>
        </div>

        {/* Content Typing Area */}
        <Content
          difficulty={difficulty}
          soundEnabled={soundEnabled}
          highest={highest}
          onNewHighScore={handleNewHighScore}
        />

        {/* Sleek Modern Footer */}
        <footer className="app-footer">
          <div className="footer-links">
            <span>
              TypePulse — Designed for speed, precision, and tactile typing
            </span>
          </div>
          <div className="footer-tips">
            <span>Tip: Keep your hands relaxed and focus on accuracy before speed</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
export default App;
