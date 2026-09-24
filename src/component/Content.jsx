import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import data from "../data.json";
import { getRandomQuote, formatTime, getRankBadge } from "../functions/function";
import { playKeySound, playErrorSound, playSuccessSound } from "../functions/sound";
import { fireConfetti } from "../functions/confetti";

function Content({
    difficulty = "easy",
    diffuculty, // for backward compatibility
    soundEnabled = true,
    onNewHighScore,
    highest = 0,
}) {
    const currentDiff = difficulty || diffuculty || "easy";

    // Passage quote state
    const [currentQuote, setCurrentQuote] = useState(() =>
        getRandomQuote(currentDiff, data)
    );
    const targetText = currentQuote?.text || "";

    // Typing inputs and tracking
    const [userInput, setUserInput] = useState("");
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [mistakesCount, setMistakesCount] = useState(0);

    // Timing state
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTestActive, setIsTestActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
    const [copiedNotification, setCopiedNotification] = useState(false);

    // Focus state
    const [isFocused, setIsFocused] = useState(true);

    // Refs
    const inputRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const arenaRef = useRef(null);
    const activeCharRef = useRef(null);

    // Helper to start fresh test
    const resetTest = useCallback(
        (newQuote = null) => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setUserInput("");
            setTotalKeystrokes(0);
            setMistakesCount(0);
            setStartTime(null);
            setElapsedTime(0);
            setIsTestActive(false);
            setIsCompleted(false);
            setIsNewPersonalBest(false);
            setCopiedNotification(false);

            if (newQuote) {
                setCurrentQuote(newQuote);
            } else {
                const nextQuote = getRandomQuote(currentDiff, data, currentQuote?.id);
                setCurrentQuote(nextQuote);
            }

            // Refocus input
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
        },
        [currentDiff, currentQuote]
    );

    // When difficulty changes, load appropriate quote and reset
    useEffect(() => {
        const nextQuote = getRandomQuote(currentDiff, data);
        resetTest(nextQuote);
    }, [currentDiff]);

    // Keep caret smoothly in view on long passages
    useEffect(() => {
        if (activeCharRef.current && arenaRef.current) {
            activeCharRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        }
    }, [userInput.length]);

    // Handle focus
    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus();
            setIsFocused(true);
        }
    };

    // Global key listener: autofocus on printable keypress and Tab/Esc shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Prevent browser default tab navigation if user wants to restart test
            if (e.key === "Tab") {
                e.preventDefault();
                resetTest();
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                resetTest();
                return;
            }

            if (isCompleted) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    resetTest();
                }
                return;
            }

            // If typing outside input, refocus automatically
            if (document.activeElement !== inputRef.current) {
                if (e.key.length === 1 || e.key === "Backspace") {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isCompleted, resetTest]);

    // Timer runner
    useEffect(() => {
        if (isTestActive && !isCompleted && startTime) {
            timerIntervalRef.current = setInterval(() => {
                const now = Date.now();
                setElapsedTime((now - startTime) / 1000);
            }, 100);
        } else if (!isTestActive && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isTestActive, isCompleted, startTime]);

    // Compute correct and incorrect characters
    const { correctChars, incorrectChars } = useMemo(() => {
        let correct = 0;
        let incorrect = 0;
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] === targetText[i]) {
                correct++;
            } else {
                incorrect++;
            }
        }
        return { correctChars: correct, incorrectChars: incorrect };
    }, [userInput, targetText]);

    // Calculate live WPM & Accuracy
    const liveWPM = useMemo(() => {
        if (elapsedTime <= 0.5) return 0;
        const minutes = elapsedTime / 60;
        return Math.max(0, Math.round((correctChars / 5) / minutes));
    }, [correctChars, elapsedTime]);

    const rawWPM = useMemo(() => {
        if (elapsedTime <= 0.5) return 0;
        const minutes = elapsedTime / 60;
        return Math.max(0, Math.round((userInput.length / 5) / minutes));
    }, [userInput.length, elapsedTime]);

    const liveAccuracy = useMemo(() => {
        if (totalKeystrokes === 0) return 100;
        return Math.max(0, Math.min(100, Math.round((correctChars / totalKeystrokes) * 100)));
    }, [correctChars, totalKeystrokes]);

    const progressPercent = useMemo(() => {
        if (!targetText.length) return 0;
        return Math.min(100, Math.round((userInput.length / targetText.length) * 100));
    }, [userInput.length, targetText.length]);

    // Finish test handler
    const handleFinishTest = useCallback(
        (finalCorrect, finalTime, finalKeystrokes) => {
            setIsCompleted(true);
            setIsTestActive(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }

            const totalTimeSec = Math.max(0.5, finalTime);
            const minutes = totalTimeSec / 60;
            const finalWpmCalc = Math.max(0, Math.round((finalCorrect / 5) / minutes));

            // Check high score
            if (finalWpmCalc > highest) {
                setIsNewPersonalBest(true);
                if (onNewHighScore) {
                    onNewHighScore(finalWpmCalc);
                }
            }

            // Audio & Confetti
            playSuccessSound(soundEnabled);
            fireConfetti();
        },
        [highest, onNewHighScore, soundEnabled]
    );

    // Handle Input Changes
    const handleInputChange = (e) => {
        if (isCompleted) return;

        const val = e.target.value;
        const prevLen = userInput.length;
        const newLen = val.length;

        // Start timer on first keystroke
        if (!isTestActive && newLen === 1) {
            setIsTestActive(true);
            setStartTime(Date.now());
        }

        // Determine sound and stats
        if (newLen > prevLen) {
            const addedChar = val[val.length - 1];
            const targetChar = targetText[val.length - 1];
            setTotalKeystrokes((prev) => prev + 1);

            if (addedChar === targetChar) {
                if (addedChar === " ") {
                    playKeySound(true, false, soundEnabled);
                } else {
                    playKeySound(false, false, soundEnabled);
                }
            } else {
                setMistakesCount((prev) => prev + 1);
                playErrorSound(soundEnabled);
            }
        } else if (newLen < prevLen) {
            // Backspace
            playKeySound(false, true, soundEnabled);
        }

        // Restrict input length to target text
        if (val.length <= targetText.length) {
            setUserInput(val);

            if (val.length === targetText.length && targetText.length > 0) {
                let finalCorrect = 0;
                for (let i = 0; i < val.length; i++) {
                    if (val[i] === targetText[i]) finalCorrect++;
                }
                const now = Date.now();
                const finalTime = startTime ? (now - startTime) / 1000 : elapsedTime;
                handleFinishTest(finalCorrect, finalTime, totalKeystrokes + 1);
            }
        }
    };

    // Copy results summary
    const handleCopyScore = () => {
        const textToCopy = `⚡ TypePulse Speed Test Result:\n` +
            `Speed: ${liveWPM} WPM (Raw: ${rawWPM} WPM)\n` +
            `Accuracy: ${liveAccuracy}%\n` +
            `Difficulty: ${currentDiff.toUpperCase()}\n` +
            `Time: ${formatTime(elapsedTime)}\n` +
            `Errors: ${mistakesCount}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedNotification(true);
            setTimeout(() => setCopiedNotification(false), 2500);
        });
    };

    // Split target text into words so words wrap cleanly
    const words = useMemo(() => {
        const wordsList = [];
        let currentWord = [];
        let globalIndex = 0;

        for (let i = 0; i < targetText.length; i++) {
            const char = targetText[i];
            currentWord.push({ char, index: globalIndex });
            globalIndex++;

            if (char === " " || i === targetText.length - 1) {
                wordsList.push([...currentWord]);
                currentWord = [];
            }
        }
        return wordsList;
    }, [targetText]);

    const rank = getRankBadge(liveWPM, liveAccuracy);

    return (
        <div className="content-container">
            {/* Realtime Stats Bar */}
            <div className="stats-dashboard">
                <div className="stat-card">
                    <span className="stat-label">WPM</span>
                    <div className="stat-value-group">
                        <span className="stat-number">{liveWPM}</span>
                        {rawWPM > 0 && <span className="stat-sub">raw {rawWPM}</span>}
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Accuracy</span>
                    <div className="stat-value-group">
                        <span
                            className={`stat-number ${liveAccuracy < 90 ? "accuracy-warning" : "accuracy-good"
                                }`}
                        >
                            {liveAccuracy}%
                        </span>
                        <span className="stat-sub">{mistakesCount} errors</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Time</span>
                    <div className="stat-value-group">
                        <span className="stat-number">{formatTime(elapsedTime)}</span>
                        <span className="stat-sub">
                            {isTestActive ? "typing..." : isCompleted ? "finished" : "ready"}
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Progress</span>
                    <div className="stat-value-group">
                        <span className="stat-number">{progressPercent}%</span>
                        <span className="stat-sub">
                            {userInput.length}/{targetText.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            {/* Main Interactive Typing Arena */}
            <div
                className={`typing-arena ${!isFocused ? "unfocused" : ""} ${isCompleted ? "test-finished" : ""
                    }`}
                ref={arenaRef}
                onClick={focusInput}
                tabIndex={0}
            >
                {/* Unfocused overlay prompt */}
                {!isFocused && !isCompleted && (
                    <div className="focus-overlay" onClick={focusInput}>
                        <div className="focus-indicator">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="focus-icon"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Click or start typing to focus</span>
                        </div>
                    </div>
                )}

                {/* Hidden but accessible capture input */}
                <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onPaste={(e) => e.preventDefault()}
                    className="hidden-input"
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    disabled={isCompleted}
                    aria-label="Typing input area"
                />

                {/* Rendered Text with Character-by-Character Styling & Caret */}
                <div className="text-display">
                    {words.map((word, wordIdx) => (
                        <span key={`w-${wordIdx}`} className="text-word">
                            {word.map(({ char, index }) => {
                                const isCurrent = index === userInput.length;
                                let statusClass = "char-pending";

                                if (index < userInput.length) {
                                    statusClass =
                                        userInput[index] === char
                                            ? "char-correct"
                                            : "char-incorrect";
                                }

                                return (
                                    <span
                                        key={`c-${index}`}
                                        ref={isCurrent ? activeCharRef : null}
                                        className={`text-char ${statusClass} ${isCurrent ? "char-current" : ""
                                            }`}
                                    >
                                        {isCurrent && <span className="custom-caret" />}
                                        {char === " " ? (
                                            statusClass === "char-incorrect" ? (
                                                <span className="space-error">_</span>
                                            ) : (
                                                " "
                                            )
                                        ) : (
                                            char
                                        )}
                                    </span>
                                );
                            })}
                        </span>
                    ))}
                    {/* Caret at the very end when last character is reached */}
                    {userInput.length >= targetText.length && !isCompleted && (
                        <span className="custom-caret end-caret" />
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="left-actions">
                    <button
                        type="button"
                        className="action-btn primary-action"
                        onClick={() => resetTest()}
                        title="Restart current test (Tab or Esc)"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="action-icon"
                        >
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <polyline points="23 20 23 14 17 14"></polyline>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                        </svg>
                        <span>Restart</span>
                    </button>

                    <button
                        type="button"
                        className="action-btn secondary-action"
                        onClick={() => {
                            const next = getRandomQuote(currentDiff, data, currentQuote?.id);
                            resetTest(next);
                        }}
                        title="Load a new passage quote"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="action-icon"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span>Next Passage</span>
                    </button>
                </div>

                <div className="keyboard-hints">
                    <span className="hint-pill">
                        <kbd>Tab</kbd> / <kbd>Esc</kbd> Restart
                    </span>
                    <span className="hint-pill">
                        <kbd>Enter</kbd> Next Text
                    </span>
                </div>
            </div>

            {/* Completion & Results Modal Card */}
            {isCompleted && (
                <div className="results-backdrop">
                    <div className="results-card">
                        {isNewPersonalBest && (
                            <div className="new-best-banner">
                                <span className="crown-icon">👑</span>
                                <span>NEW PERSONAL BEST!</span>
                                <span className="crown-icon">👑</span>
                            </div>
                        )}

                        <div className="results-header">
                            <div className="rank-indicator" style={{ borderColor: rank.color }}>
                                <span className="rank-icon">{rank.icon}</span>
                                <div className="rank-details">
                                    <span className="rank-tier" style={{ color: rank.color }}>
                                        Tier {rank.tier}
                                    </span>
                                    <span className="rank-title">{rank.title}</span>
                                </div>
                            </div>

                            <div className="results-badge-difficulty">
                                Mode: {currentDiff.toUpperCase()}
                            </div>
                        </div>

                        <div className="results-grid">
                            <div className="result-metric-card highlight-metric">
                                <span className="metric-label">Net Speed</span>
                                <div className="metric-value-row">
                                    <span className="metric-number">{liveWPM}</span>
                                    <span className="metric-unit">WPM</span>
                                </div>
                                <span className="metric-foot">Raw: {rawWPM} WPM</span>
                            </div>

                            <div className="result-metric-card">
                                <span className="metric-label">Accuracy</span>
                                <div className="metric-value-row">
                                    <span className="metric-number">{liveAccuracy}%</span>
                                </div>
                                <span className="metric-foot">
                                    {correctChars} correct / {incorrectChars} errors
                                </span>
                            </div>

                            <div className="result-metric-card">
                                <span className="metric-label">Duration</span>
                                <div className="metric-value-row">
                                    <span className="metric-number">
                                        {formatTime(elapsedTime)}
                                    </span>
                                </div>
                                <span className="metric-foot">
                                    {totalKeystrokes} keystrokes
                                </span>
                            </div>

                            <div className="result-metric-card">
                                <span className="metric-label">Precision Rate</span>
                                <div className="metric-value-row">
                                    <span className="metric-number">
                                        {targetText.length > 0
                                            ? Math.round(
                                                (correctChars / targetText.length) * 100
                                            )
                                            : 100}
                                        %
                                    </span>
                                </div>
                                <span className="metric-foot">completed</span>
                            </div>
                        </div>

                        <div className="results-actions">
                            <button
                                type="button"
                                className="results-btn primary-results-btn"
                                onClick={() => {
                                    const next = getRandomQuote(
                                        currentDiff,
                                        data,
                                        currentQuote?.id
                                    );
                                    resetTest(next);
                                }}
                            >
                                <span>Next Passage</span>
                                <kbd className="btn-key-hint">Enter ↵</kbd>
                            </button>

                            <button
                                type="button"
                                className="results-btn secondary-results-btn"
                                onClick={() => resetTest(currentQuote)}
                            >
                                <span>Try Again</span>
                            </button>

                            <button
                                type="button"
                                className="results-btn share-results-btn"
                                onClick={handleCopyScore}
                            >
                                {copiedNotification ? (
                                    <span>✓ Copied to clipboard!</span>
                                ) : (
                                    <>
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="btn-icon"
                                        >
                                            <rect
                                                x="9"
                                                y="9"
                                                width="13"
                                                height="13"
                                                rx="2"
                                                ry="2"
                                            ></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        <span>Share Score</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Content;