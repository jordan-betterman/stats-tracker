import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Download, Save, RotateCcw } from "lucide-react";
import "../styles/SoccerStatsTracker.css";

// Type definitions
type GameState = "stopped" | "running" | "paused";

type ActionType =
  | "goal"
  | "substitution"
  | "red_card"
  | "final_thrid_entry"
  | "open_play_first_contact"
  | "open_play_second_contact"
  | "set_piece_first_contact"
  | "set_piece_second_contact"
  | "pass_into_seam_3"
  | "attack_won"
  | "attack_lost";

interface GameAction {
  id: number;
  timestamp: number;
  gameMinute: number;
  gameSecond: number;
  type: ActionType;
  player: string;
  team: string;
  description: string;
}

interface GameData {
  gameState: GameState;
  startTime: number | null;
  currentTime: number;
  actions: GameAction[];
  opponent: string;
  northwesternScore: number;
  opponentScore: number;
  pausedTime: number;
}

interface ExportGameInfo {
  id: string;
  date: string;
  duration: number;
  teams: {
    northwestern: string;
    opponent: string;
  };
  finalScore: {
    northwestern: number;
    opponent: number;
  };
}

interface ExportGameData {
  gameInfo: ExportGameInfo;
  actions: (Omit<GameAction, "timestamp"> & { timestamp: string })[];
}

interface ActionCounts {
  [key: string]: {
    northwestern: number;
    opponent: number;
  };
}

interface ActionButton {
  type: ActionType;
  label: string;
  className: string;
}

const NorthwesternStatsTracker: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("stopped");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [opponent, setOpponent] = useState<string>("");
  const [northwesternScore, setNorthwesternScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [actionCounts, setActionCounts] = useState<ActionCounts>({
    goal: { northwestern: 0, opponent: 0 },
    substitution: { northwestern: 0, opponent: 0 },
    red_card: { northwestern: 0, opponent: 0 },
    final_thrid_entry: { northwestern: 0, opponent: 0 },
    open_play_first_contact: { northwestern: 0, opponent: 0 },
    open_play_second_contact: { northwestern: 0, opponent: 0 },
    set_piece_first_contact: { northwestern: 0, opponent: 0 },
    set_piece_second_contact: { northwestern: 0, opponent: 0 },
    pass_into_seam_3: { northwestern: 0, opponent: 0 },
    attack_won: { northwestern: 0, opponent: 0 },
    attack_lost: { northwestern: 0, opponent: 0 },
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Update timer every second when game is running
  useEffect(() => {
    if (gameState === "running" && startTime !== null) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startTime - pausedTimeRef.current) / 1000
        );
        setCurrentTime(Math.max(0, elapsed)); // Ensure time is never negative
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState, startTime]);

  // Auto-save to memory whenever actions change
  useEffect(() => {
    const gameData: GameData = {
      gameState,
      startTime,
      currentTime,
      actions,
      opponent,
      northwesternScore,
      opponentScore,
      pausedTime: pausedTimeRef.current,
    };
    // Store in memory instead of localStorage
    (window as any).northwesternGameData = gameData;
  }, [
    gameState,
    startTime,
    currentTime,
    actions,
    opponent,
    northwesternScore,
    opponentScore,
  ]);

  // Load saved game on component mount
  useEffect(() => {
    const savedData = (window as any).northwesternGameData;
    if (savedData) {
      try {
        const data: GameData = savedData;
        setGameState(data.gameState || "stopped");
        setStartTime(data.startTime || null);
        setCurrentTime(data.currentTime || 0);
        setActions(data.actions || []);
        setOpponent(data.opponent || "");
        setNorthwesternScore(data.northwesternScore || 0);
        setOpponentScore(data.opponentScore || 0);
        pausedTimeRef.current = data.pausedTime || 0;
      } catch (error) {
        console.error("Error loading saved game data:", error);
      }
    }
  }, []);

  const startGame = (): void => {
    // Validate opponent name before starting
    if (opponent.trim() === "") {
      return;
    }

    const now = Date.now();
    setStartTime(now);
    setGameState("running");
    pausedTimeRef.current = 0;
  };

  const pauseGame = (): void => {
    if (startTime !== null) {
      setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      setGameState("paused");
    }
  };

  const resumeGame = (): void => {
    if (startTime !== null) {
      // Instead of adjusting pausedTimeRef manually,
      // shift startTime forward so elapsed stays consistent
      setStartTime(Date.now() - currentTime * 1000);
      setGameState("running");
    }
  };

  const stopGame = (): void => {
    setGameState("stopped");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetGame = (): void => {
    setGameState("stopped");
    setStartTime(null);
    setCurrentTime(0);
    setActions([]);
    setNorthwesternScore(0);
    setOpponentScore(0);
    setActionCounts({
      goal: { northwestern: 0, opponent: 0 },
      substitution: { northwestern: 0, opponent: 0 },
      red_card: { northwestern: 0, opponent: 0 },
      final_thrid_entry: { northwestern: 0, opponent: 0 },
      open_play_first_contact: { northwestern: 0, opponent: 0 },
      open_play_second_contact: { northwestern: 0, opponent: 0 },
      set_piece_first_contact: { northwestern: 0, opponent: 0 },
      set_piece_second_contact: { northwestern: 0, opponent: 0 },
      pass_into_seam_3: { northwestern: 0, opponent: 0 },
      attack_won: { northwestern: 0, opponent: 0 },
      attack_lost: { northwestern: 0, opponent: 0 },
    });
    pausedTimeRef.current = 0;
    delete (window as any).northwesternGameData;
  };

  const addActionForTeam = (
    actionType: ActionType,
    team: "northwestern" | "opponent",
    description: string = ""
  ): void => {
    if (gameState !== "running") return;

    const newAction: GameAction = {
      id: Date.now(),
      timestamp: Date.now(),
      gameMinute: Math.floor(currentTime / 60),
      gameSecond: currentTime % 60,
      type: actionType,
      player: selectedPlayer,
      team: team === "northwestern" ? "Northwestern" : opponent,
      description: description || actionType.replace("_", " ").toUpperCase(),
    };

    setActions((prev) => [...prev, newAction]);
    setActionCounts((prev) => ({
      ...prev,
      [actionType]: {
        ...prev[actionType],
        [team]: prev[actionType][team] + 1,
      },
    }));

    // Update scores for goals
    if (actionType === "goal") {
      if (team === "northwestern") {
        setNorthwesternScore((prev) => prev + 1);
      } else {
        setOpponentScore((prev) => prev + 1);
      }
    }
  };

  const removeLastAction = (): void => {
    if (actions.length === 0) return;

    const lastAction = actions[actions.length - 1];
    const team =
      lastAction.team === "Northwestern" ? "northwestern" : "opponent";

    // Update action counts
    setActionCounts((prev) => ({
      ...prev,
      [lastAction.type]: {
        ...prev[lastAction.type],
        [team]: Math.max(0, prev[lastAction.type][team] - 1),
      },
    }));

    // Adjust score if removing a goal
    if (lastAction.type === "goal") {
      if (lastAction.team === "Northwestern") {
        setNorthwesternScore((prev) => Math.max(0, prev - 1));
      } else {
        setOpponentScore((prev) => Math.max(0, prev - 1));
      }
    }

    setActions((prev) => prev.slice(0, -1));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const downloadFile = (
    content: string,
    filename: string,
    contentType: string
  ): void => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = (): void => {
    // Export match events
    const gameData: ExportGameData = {
      gameInfo: {
        id: `northwestern_game_${Date.now()}`,
        date: new Date().toISOString(),
        duration: currentTime,
        teams: {
          northwestern: "Northwestern",
          opponent: opponent,
        },
        finalScore: {
          northwestern: northwesternScore,
          opponent: opponentScore,
        },
      },
      actions: actions.map((action) => ({
        ...action,
        timestamp: new Date(action.timestamp).toISOString(),
      })),
    };

    const eventsDataStr = JSON.stringify(gameData, null, 2);
    const eventsFilename = `northwestern-vs-${opponent
      .toLowerCase()
      .replace(/\s+/g, "-")}-events-${
      new Date().toISOString().split("T")[0]
    }.json`;
    downloadFile(eventsDataStr, eventsFilename, "application/json");

    // Export statistics
    const statsData = {
      gameInfo: {
        id: `northwestern_game_${Date.now()}`,
        date: new Date().toISOString(),
        teams: {
          northwestern: "Northwestern",
          opponent: opponent,
        },
        finalScore: {
          northwestern: northwesternScore,
          opponent: opponentScore,
        },
      },
      statistics: actionCounts,
    };

    const statsDataStr = JSON.stringify(statsData, null, 2);
    const statsFilename = `northwestern-vs-${opponent
      .toLowerCase()
      .replace(/\s+/g, "-")}-totals-${
      new Date().toISOString().split("T")[0]
    }.json`;
    downloadFile(statsDataStr, statsFilename, "application/json");
  };

  const exportToCSV = (): void => {
    // Export game actions CSV
    const actionHeaders: string[] = [
      "Game Minute",
      "Game Second",
      "Timestamp",
      "Action Type",
      "Player",
      "Team",
      "Description",
    ];
    const actionData: string[][] = actions.map((action) => [
      action.gameMinute.toString(),
      action.gameSecond.toString(),
      new Date(action.timestamp).toISOString(),
      action.type,
      action.player || "Unknown",
      action.team,
      action.description,
    ]);

    const actionContent = [actionHeaders, ...actionData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const eventsFilename = `northwestern-vs-${opponent
      .toLowerCase()
      .replace(/\s+/g, "-")}-events-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(actionContent, eventsFilename, "text/csv");

    // Export statistics CSV
    const statsHeaders = ["Action Type", "Northwestern", "Opponent", "Total"];
    const statsData = Object.entries(actionCounts).map(([type, counts]) => [
      type,
      counts.northwestern.toString(),
      counts.opponent.toString(),
      (counts.northwestern + counts.opponent).toString(),
    ]);

    const statsContent = [statsHeaders, ...statsData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const statsFilename = `northwestern-vs-${opponent
      .toLowerCase()
      .replace(/\s+/g, "-")}-totals-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(statsContent, statsFilename, "text/csv");
  };

  const actionButtons: ActionButton[] = [
    { type: "goal", label: "Goal", className: "btn-goal" },
    { type: "substitution", label: "Substitution", className: "btn-yellow" },
    { type: "red_card", label: "Red Card", className: "btn-red" },
    {
      type: "final_thrid_entry",
      label: "Final 3rd Entry",
      className: "btn-gray",
    },
    {
      type: "open_play_first_contact",
      label: "1st Contact",
      className: "btn-gray",
    },
    {
      type: "open_play_second_contact",
      label: "2nd Contact",
      className: "btn-gray",
    },
    {
      type: "set_piece_first_contact",
      label: "Set Piece 1st Contact",
      className: "btn-gray",
    },
    {
      type: "set_piece_second_contact",
      label: "Set Piece 2nd Contact",
      className: "btn-gray",
    },
    { type: "pass_into_seam_3", label: "Pass Seam 3", className: "btn-gray" },
    { type: "attack_won", label: "Attack Won", className: "btn-gray" },
    { type: "attack_lost", label: "Attack Lost", className: "btn-gray" },
  ];

  const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedPlayer(e.target.value);
  };

  const handleOpponentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setOpponent(e.target.value);
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="header-card">
          <div className="title-section">
            <h1 className="main-title">Northwestern Wildcats</h1>
            <h2 className="sub-title">In-Game Stats Tracker</h2>
          </div>

          {gameState === "stopped" && (
            <div className="game-setup">
              <h2 className="setup-title">Game Setup</h2>
              <p className="setup-description">
                Enter opponent name to start tracking
              </p>

              <div className="opponent-input-container">
                <div className="form-group">
                  <label className="form-label">
                    🏆 Northwestern vs. Opponent
                  </label>
                  <input
                    type="text"
                    value={opponent}
                    onChange={handleOpponentChange}
                    placeholder="Enter opponent team name"
                    className="opponent-input"
                  />
                </div>

                {opponent.trim() === "" && (
                  <div className="validation-warning">
                    ⚠️ Please enter the opponent team name to start the game
                  </div>
                )}

                {opponent.trim() !== "" && (
                  <div className="match-preview">
                    <h3 className="preview-title">Today's Match</h3>
                    <div className="preview-teams">
                      <span className="team-northwestern">Northwestern</span>
                      <span className="team-vs">VS</span>
                      <span className="team-opponent">{opponent}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState !== "stopped" && (
            <div className="current-match">
              <div className="current-match-content">
                <div className="current-match-teams">
                  <span className="team-northwestern">Northwestern</span>
                  <span className="team-vs">VS</span>
                  <span className="team-opponent">{opponent}</span>
                </div>
              </div>
            </div>
          )}

          {/* Score and Timer */}
          <div className="score-timer-section">
            <div className="score-display">
              {northwesternScore} - {opponentScore}
            </div>
            <div className="timer-display">{formatTime(currentTime)}</div>
            <div className="game-status">
              {gameState === "running" && "⏱️ Game Running"}
              {gameState === "paused" && "⏸️ Game Paused"}
              {gameState === "stopped" && "⏹️ Game Stopped"}
            </div>
          </div>

          {/* Game Controls */}
          <div className="controls">
            {gameState === "stopped" && (
              <button
                onClick={startGame}
                className={`btn btn-start`}
                disabled={opponent.trim() === ""}
              >
                <Play size={20} />
                <span>Start Game</span>
              </button>
            )}
            {gameState === "running" && (
              <button onClick={pauseGame} className="btn btn-pause">
                <Pause size={20} />
                <span>Pause</span>
              </button>
            )}
            {gameState === "paused" && (
              <button onClick={resumeGame} className="btn btn-start">
                <Play size={20} />
                <span>Resume</span>
              </button>
            )}
            <button onClick={stopGame} className="btn btn-stop">
              <Square size={20} />
              <span>Stop</span>
            </button>
            <button onClick={resetGame} className="btn btn-reset">
              <RotateCcw size={20} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        {gameState === "running" && (
          <div className="action-controls">
            <h2 className="action-controls-title">Record Action</h2>

            <div className="player-input-section">
              <label className="form-label">Player Name (Optional)</label>
              <input
                type="text"
                value={selectedPlayer}
                onChange={handlePlayerChange}
                placeholder="Enter player name (optional)"
                className="player-input"
              />
            </div>

            <div className="teams-actions">
              {/* Northwestern Actions */}
              <div className="northwestern-actions">
                <h3 className="team-title team-title-northwestern">
                  Northwestern
                </h3>
                <div className="action-grid">
                  {actionButtons.map(({ type, label, className }) => (
                    <button
                      key={`northwestern-${type}`}
                      onClick={() => addActionForTeam(type, "northwestern")}
                      className={`action-btn ${className}`}
                    >
                      <div>
                        {label}
                        <span className="action-count-badge">
                          {actionCounts[type].northwestern}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent Actions */}
              <div className="opponent-actions">
                <h3 className="team-title team-title-opponent">{opponent}</h3>
                <div className="action-grid">
                  {actionButtons.map(({ type, label, className }) => (
                    <button
                      key={`opponent-${type}`}
                      onClick={() => addActionForTeam(type, "opponent")}
                      className={`action-btn ${className}`}
                    >
                      <div>
                        {label}
                        <span className="action-count-badge">
                          {actionCounts[type].opponent}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-footer">
              <button
                onClick={removeLastAction}
                disabled={actions.length === 0}
                className="undo-btn"
              >
                Undo Last Action
              </button>
              <span className="action-count">
                Total Actions: {actions.length}
              </span>
            </div>
          </div>
        )}

        {/* Recent Actions */}
        <div className="recent-actions">
          <h2 className="recent-actions-title">Recent Actions</h2>
          <div>
            {actions.length === 0 ? (
              <p className="no-actions">No actions recorded yet</p>
            ) : (
              actions
                .slice()
                .reverse()
                .slice(0, 10)
                .map((action: GameAction) => (
                  <div
                    key={action.id}
                    className={`action-item ${
                      action.team === "Northwestern"
                        ? "action-item-northwestern"
                        : "action-item-opponent"
                    }`}
                  >
                    <div className="action-content">
                      <div className="action-details">
                        <span className="action-time">
                          {action.gameMinute}:
                          {action.gameSecond.toString().padStart(2, "0")}
                        </span>
                        <span className="action-description">
                          {action.description}
                        </span>
                        {action.player && (
                          <span className="action-player">
                            {action.player} ({action.team})
                          </span>
                        )}
                      </div>
                      <span className="action-timestamp">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="export-section">
          <h2 className="export-title">
            <Download size={24} />
            Export Game Data
          </h2>
          <div className="export-buttons">
            <button
              onClick={exportToJSON}
              disabled={actions.length === 0}
              className="btn-export btn-export-json"
            >
              <Save size={20} />
              <span>Export JSON Files</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={actions.length === 0}
              className="btn-export btn-export-csv"
            >
              <Save size={20} />
              <span>Export CSV Files</span>
            </button>
          </div>
          <p className="export-note">
            Game data is automatically saved during your session. Export buttons
            will create separate files for match events and totals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NorthwesternStatsTracker;
