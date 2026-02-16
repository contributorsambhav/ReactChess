import React, { useCallback, useEffect, useRef, useState } from "react";

import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import MobileToggle from "../MobileToggle";
import boardbg from "../../assets/images/bgboard.jpeg";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import moveSoundFile from "../../assets/sounds/move.mp3";
import pieceImages from "../pieceImages";

const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

// Engine presets
const ALL_ENGINE_PRESETS = [
  { id: 'stockfish-ultra', name: 'Ultra', depth: 25, description: 'Maximum Strength' },
  { id: 'stockfish-master', name: 'Master', depth: 22, description: 'Grandmaster Level' },
  { id: 'stockfish-expert', name: 'Expert', depth: 20, description: 'Expert Level' },
  { id: 'stockfish-strong', name: 'Strong', depth: 18, description: 'Strong Player' },
  { id: 'stockfish-advanced', name: 'Advanced', depth: 16, description: 'Advanced' },
  { id: 'stockfish-medium', name: 'Medium', depth: 15, description: 'Intermediate' },
  { id: 'stockfish-balanced', name: 'Balanced', depth: 13, description: 'Balanced' },
  { id: 'stockfish-fast', name: 'Fast', depth: 12, description: 'Quick Games' },
  { id: 'stockfish-casual', name: 'Casual', depth: 10, description: 'Casual Play' },
  { id: 'stockfish-blitz', name: 'Blitz', depth: 8, description: 'Rapid Games' },
  { id: 'stockfish-rapid', name: 'Rapid', depth: 6, description: 'Very Fast' },
  { id: 'stockfish-beginner', name: 'Beginner', depth: 5, description: 'Easy' },
  { id: 'stockfish-easy', name: 'Easy', depth: 3, description: 'Very Easy' },
];

const EngineAnalysis = () => {
  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const gameRef = useRef(new Chess());
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [promotionPiece, setPromotionPiece] = useState("q");
  const [mobileMode, setMobileMode] = useState(window.innerWidth <= 1028);

  // Add style to hide scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Engine refs
  const whiteEngineRef = useRef(null);
  const blackEngineRef = useRef(null);
  const analyzerEngineRef = useRef(null);

  // Selected presets
  const [whitePresetId, setWhitePresetId] = useState('stockfish-medium');
  const [blackPresetId, setBlackPresetId] = useState('stockfish-fast');
  const [analyzerPresetId, setAnalyzerPresetId] = useState('stockfish-advanced');

  // Custom depth
  const [whiteDepth, setWhiteDepth] = useState(15);
  const [blackDepth, setBlackDepth] = useState(12);
  const [analyzerDepth, setAnalyzerDepth] = useState(16);

  const [whiteCustom, setWhiteCustom] = useState(false);
  const [blackCustom, setBlackCustom] = useState(false);
  const [analyzerCustom, setAnalyzerCustom] = useState(false);

  // Play mode
  const [playMode, setPlayMode] = useState("human");
  const [humanColor, setHumanColor] = useState("white");
  const [gameActive, setGameActive] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);

  // Refs for current values
  const playModeRef = useRef("human");
  const humanColorRef = useRef("white");
  const gamePausedRef = useRef(false);

  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);

  useEffect(() => {
    humanColorRef.current = humanColor;
  }, [humanColor]);

  useEffect(() => {
    gamePausedRef.current = gamePaused;
  }, [gamePaused]);

  // Engine status
  const [engineThinking, setEngineThinking] = useState(false);
  const [whiteEngineLoaded, setWhiteEngineLoaded] = useState(false);
  const [blackEngineLoaded, setBlackEngineLoaded] = useState(false);
  const [analyzerEngineLoaded, setAnalyzerEngineLoaded] = useState(false);
  const [analyzerThinking, setAnalyzerThinking] = useState(false);

  // Analysis display - with smoothing
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const previousEvalRef = useRef(0);

  const [engineStatus, setEngineStatus] = useState({});

  // Helper functions
  const getPresetById = (presetId) => {
    return ALL_ENGINE_PRESETS.find(p => p.id === presetId);
  };

  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
  };

  const removeGreySquares = () => {
    const squares = document.querySelectorAll(".square-55d63");
    squares.forEach((square) => (square.style.background = ""));
  };

  const greySquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    if (squareEl) {
      const isBlack = squareEl.classList.contains("black-3c85d");
      squareEl.style.background = isBlack ? "#696969" : "#a9a9a9";
    }
  };

  const updateStatus = useCallback(() => {
    const game = gameRef.current;
    let status = "";
    let moveColor = game.turn() === "b" ? "Black" : "White";

    if (game.isGameOver()) {
      status = "Game over";
      setGameActive(false);
      setGamePaused(false);
    } else {
      status = moveColor + " to move";
      if (game.isCheckmate()) {
        status += ", " + moveColor + " is in checkmate";
        checkmateSound.play();
      } else if (game.inCheck()) {
        status += ", " + moveColor + " is in check";
        checkSound.play();
      }
    }
    setCurrentStatus(status);
  }, []);

  // Load engine
  const loadEngine = useCallback((presetId, engineRef, onLoadCallback) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    const workerPath = '/stockfish.js';
    setEngineStatus(prev => ({ ...prev, [presetId]: 'Loading...' }));

    try {
      const worker = new Worker(workerPath);
      let isReady = false;
      let timeoutId;

      worker.onmessage = (event) => {
        const message = event.data;

        if (typeof message === 'string' && message.trim() === 'uciok') {
          isReady = true;
          setEngineStatus(prev => ({ ...prev, [presetId]: 'Ready' }));
          if (timeoutId) clearTimeout(timeoutId);
          if (onLoadCallback) onLoadCallback();
        }

        handleEngineMessage(presetId, message, engineRef);
      };

      worker.onerror = (error) => {
        setEngineStatus(prev => ({ ...prev, [presetId]: 'Failed' }));
        setEngineThinking(false);
        if (timeoutId) clearTimeout(timeoutId);
      };

      engineRef.current = worker;
      worker.postMessage('uci');

      timeoutId = setTimeout(() => {
        if (!isReady) {
          setEngineStatus(prev => ({ ...prev, [presetId]: 'Timeout' }));
          setEngineThinking(false);
        }
      }, 10000);

    } catch (error) {
      setEngineStatus(prev => ({ ...prev, [presetId]: 'Error' }));
      setEngineThinking(false);
    }
  }, []);

  const handleEngineMessage = useCallback((presetId, message, engineRef) => {
    if (typeof message === 'string') {
      if (message.startsWith('bestmove')) {
        const match = message.match(/bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
        if (match) {
          const from = match[1];
          const to = match[2];
          const promotion = match[3] || 'q';

          if (engineRef === whiteEngineRef || engineRef === blackEngineRef) {
            setTimeout(() => makeEngineMove(from, to, promotion), 500);
          }
        }
        setEngineThinking(false);
      }

      if (message.startsWith('info') && message.includes('pv') && engineRef === analyzerEngineRef) {
        parseEngineAnalysis(message);
      }
    }
  }, []);

  const parseEngineAnalysis = useCallback((message) => {
    try {
      const depthMatch = message.match(/depth (\d+)/);
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const mateMatch = message.match(/score mate (-?\d+)/);
      const pvMatch = message.match(/pv (.+)/);
      const nodesMatch = message.match(/nodes (\d+)/);

      // Only update if we have sufficient depth and nodes for stability
      const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
      const nodes = nodesMatch ? parseInt(nodesMatch[1]) : 0;

      if (pvMatch && depth >= 12 && nodes > 5000) {
        let evaluation = 0;
        let evalText = '0.0';

        if (mateMatch) {
          const mateIn = parseInt(mateMatch[1]);
          evaluation = mateIn > 0 ? 10000 : -10000;
          evalText = `M${mateIn}`;
        } else if (scoreMatch) {
          const rawEval = parseInt(scoreMatch[1]) / 100;

          // Smooth evaluation changes to prevent rapid fluctuations
          const previousEval = previousEvalRef.current;
          const maxChange = 0.8; // Maximum change per update

          if (Math.abs(rawEval - previousEval) > maxChange) {
            evaluation = previousEval + (rawEval > previousEval ? maxChange : -maxChange);
          } else {
            evaluation = rawEval;
          }

          previousEvalRef.current = evaluation;
          evalText = evaluation.toFixed(1);
        }

        const moves = pvMatch[1].split(' ');
        const pv = moves.slice(0, 8).join(' ');

        setCurrentAnalysis({
          depth,
          evaluation,
          evalText,
          bestMove: moves[0],
          pv,
          nodes,
        });
      }
    } catch (error) {
      console.error('Error parsing analysis:', error);
    }
  }, []);

  const analyzePosition = useCallback(() => {
    if (!analyzerEngineRef.current) return;

    const game = gameRef.current;
    const fen = game.fen();
    const preset = getPresetById(analyzerPresetId);

    if (!preset) return;

    const depth = analyzerCustom && analyzerDepth ? analyzerDepth : preset.depth;

    setAnalyzerThinking(true);

    analyzerEngineRef.current.postMessage(`position fen ${fen}`);
    analyzerEngineRef.current.postMessage(`go depth ${depth}`);

    setTimeout(() => {
      if (analyzerEngineRef.current) {
        analyzerEngineRef.current.postMessage('stop');
        setAnalyzerThinking(false);
      }
    }, 8000);
  }, [analyzerPresetId, analyzerDepth, analyzerCustom]);

  const requestEngineMove = useCallback((color) => {
    const game = gameRef.current;

    if (engineThinking || gamePausedRef.current) return;

    let engineRef, presetId, depth, isCustom;

    if (color === 'white') {
      engineRef = whiteEngineRef;
      presetId = whitePresetId;
      depth = whiteDepth;
      isCustom = whiteCustom;
    } else {
      engineRef = blackEngineRef;
      presetId = blackPresetId;
      depth = blackDepth;
      isCustom = blackCustom;
    }

    if (!engineRef.current || game.isGameOver()) return;

    const preset = getPresetById(presetId);
    if (!preset) return;

    setEngineThinking(true);
    const fen = game.fen();
    const finalDepth = isCustom && depth ? depth : preset.depth;

    engineRef.current.postMessage(`position fen ${fen}`);
    engineRef.current.postMessage(`go depth ${finalDepth}`);
  }, [engineThinking, whitePresetId, blackPresetId, whiteDepth, blackDepth, whiteCustom, blackCustom]);

  const makeEngineMove = useCallback((from, to, promotion) => {
    const currentPlayMode = playModeRef.current;
    const currentHumanColor = humanColorRef.current;
    const isPaused = gamePausedRef.current;

    if (isPaused) {
      setEngineThinking(false);
      return;
    }

    const game = gameRef.current;

    try {
      const move = game.move({ from, to, promotion });

      if (move) {
        if (boardRef.current) {
          boardRef.current.position(game.fen());
        }
        setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
        updateStatus();

        if (move.captured) {
          captureSound.play();
        } else {
          moveSound.play();
        }

        setTimeout(() => analyzePosition(), 500);

        if (currentPlayMode === 'engine-battle' && !game.isGameOver() && !isPaused) {
          const nextColor = game.turn() === 'w' ? 'white' : 'black';
          setTimeout(() => requestEngineMove(nextColor), 1000);
        }

        if (currentPlayMode === 'vs-engine' && !game.isGameOver() && !isPaused) {
          const currentTurn = game.turn();
          const isEngineTurn = (currentHumanColor === 'white' && currentTurn === 'b') ||
            (currentHumanColor === 'black' && currentTurn === 'w');

          if (isEngineTurn) {
            const engineColor = currentHumanColor === 'white' ? 'black' : 'white';
            setTimeout(() => requestEngineMove(engineColor), 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error making move:', error);
      setEngineThinking(false);
    }
  }, [updateStatus, analyzePosition, requestEngineMove]);

  const handleWhitePresetChange = (presetId) => {
    setWhitePresetId(presetId);
    setWhiteCustom(false);
    const preset = getPresetById(presetId);
    if (preset) {
      setWhiteDepth(preset.depth || 15);
    }
  };

  const handleBlackPresetChange = (presetId) => {
    setBlackPresetId(presetId);
    setBlackCustom(false);
    const preset = getPresetById(presetId);
    if (preset) {
      setBlackDepth(preset.depth || 12);
    }
  };

  const handleAnalyzerPresetChange = (presetId) => {
    setAnalyzerPresetId(presetId);
    setAnalyzerCustom(false);
    const preset = getPresetById(presetId);
    if (preset) {
      setAnalyzerDepth(preset.depth || 16);
    }
  };

  const handleWhiteDepthChange = (newDepth) => {
    setWhiteDepth(newDepth);
    setWhiteCustom(true);
  };

  const handleBlackDepthChange = (newDepth) => {
    setBlackDepth(newDepth);
    setBlackCustom(true);
  };

  const handleAnalyzerDepthChange = (newDepth) => {
    setAnalyzerDepth(newDepth);
    setAnalyzerCustom(true);
  };

  // Engine loading effects
  useEffect(() => {
    loadEngine(analyzerPresetId, analyzerEngineRef, () => setAnalyzerEngineLoaded(true));
    return () => {
      if (analyzerEngineRef.current) {
        analyzerEngineRef.current.terminate();
        analyzerEngineRef.current = null;
      }
    };
  }, [analyzerPresetId, loadEngine]);

  useEffect(() => {
    if (playMode !== 'human') {
      loadEngine(whitePresetId, whiteEngineRef, () => setWhiteEngineLoaded(true));
    } else {
      setWhiteEngineLoaded(false);
    }
    return () => {
      if (whiteEngineRef.current) {
        whiteEngineRef.current.terminate();
        whiteEngineRef.current = null;
      }
    };
  }, [whitePresetId, playMode, loadEngine]);

  useEffect(() => {
    if (playMode === 'engine-battle' || playMode === 'vs-engine') {
      loadEngine(blackPresetId, blackEngineRef, () => setBlackEngineLoaded(true));
    } else {
      setBlackEngineLoaded(false);
    }
    return () => {
      if (blackEngineRef.current) {
        blackEngineRef.current.terminate();
        blackEngineRef.current = null;
      }
    };
  }, [blackPresetId, playMode, loadEngine]);

  // Board initialization
  useEffect(() => {
    const game = gameRef.current;

    const onDragStart = (source, piece) => {
      if (mobileMode || game.isGameOver() || engineThinking || gamePaused) return false;
      if (playMode === 'vs-engine') {
        if (humanColor === 'white' && piece.search(/^b/) !== -1) return false;
        if (humanColor === 'black' && piece.search(/^w/) !== -1) return false;
      }
      if (playMode === 'engine-battle') return false;
      if ((game.turn() === "w" && piece.search(/^b/) !== -1) ||
        (game.turn() === "b" && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    const onDrop = async (source, target) => {
      if (mobileMode || engineThinking || gamePaused) return "snapback";

      removeGreySquares();
      let move = game.move({ from: source, to: target, promotion: promotionPiece });
      if (move === null) return "snapback";

      setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
      updateStatus();

      if (move.captured) {
        captureSound.play();
      } else {
        moveSound.play();
      }

      setTimeout(() => analyzePosition(), 500);

      if (playMode === 'vs-engine' && !game.isGameOver() && !gamePaused) {
        const currentTurn = game.turn();
        const isEngineTurn = (humanColor === 'white' && currentTurn === 'b') ||
          (humanColor === 'black' && currentTurn === 'w');

        if (isEngineTurn) {
          const engineColor = humanColor === 'white' ? 'black' : 'white';
          setTimeout(() => requestEngineMove(engineColor), 800);
        }
      }
    };

    const onMouseoverSquare = (square) => {
      if (mobileMode) return;
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) return;
      greySquare(square);
      moves.forEach(m => greySquare(m.to));
    };

    const onMouseoutSquare = () => {
      if (mobileMode) return;
      removeGreySquares();
    };

    const onSnapEnd = () => {
      if (boardRef.current) {
        boardRef.current.position(game.fen());
      }
    };

    const config = {
      draggable: !mobileMode && playMode !== 'engine-battle',
      position: game.fen(),
      onDragStart,
      onDrop,
      onMouseoverSquare,
      onMouseoutSquare,
      onSnapEnd,
      pieceTheme: (piece) => pieceImages[piece],
      snapbackSpeed: 500,
      snapSpeed: 100,
    };

    if (!boardRef.current) {
      boardRef.current = Chessboard(chessRef.current, config);
    }

    return () => {
      if (boardRef.current) {
        boardRef.current.destroy();
        boardRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (boardRef.current) {
      const isDraggable = !mobileMode && playMode !== 'engine-battle';
      const game = gameRef.current;
      const currentFen = game.fen();

      boardRef.current.destroy();

      const onDragStart = (source, piece) => {
        if (mobileMode || game.isGameOver() || engineThinking || gamePaused) return false;
        if (playMode === 'vs-engine') {
          if (humanColor === 'white' && piece.search(/^b/) !== -1) return false;
          if (humanColor === 'black' && piece.search(/^w/) !== -1) return false;
        }
        if (playMode === 'engine-battle') return false;
        if ((game.turn() === "w" && piece.search(/^b/) !== -1) ||
          (game.turn() === "b" && piece.search(/^w/) !== -1)) {
          return false;
        }
      };

      const onDrop = async (source, target) => {
        if (mobileMode || engineThinking || gamePaused) return "snapback";

        removeGreySquares();
        let move = game.move({ from: source, to: target, promotion: promotionPiece });
        if (move === null) return "snapback";

        setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
        updateStatus();

        if (move.captured) {
          captureSound.play();
        } else {
          moveSound.play();
        }

        setTimeout(() => analyzePosition(), 500);

        if (playMode === 'vs-engine' && !game.isGameOver() && !gamePaused) {
          const currentTurn = game.turn();
          const isEngineTurn = (humanColor === 'white' && currentTurn === 'b') ||
            (humanColor === 'black' && currentTurn === 'w');

          if (isEngineTurn) {
            const engineColor = humanColor === 'white' ? 'black' : 'white';
            setTimeout(() => requestEngineMove(engineColor), 800);
          }
        }
      };

      const onMouseoverSquare = (square) => {
        if (mobileMode) return;
        const moves = game.moves({ square, verbose: true });
        if (moves.length === 0) return;
        greySquare(square);
        moves.forEach(m => greySquare(m.to));
      };

      const onMouseoutSquare = () => {
        if (mobileMode) return;
        removeGreySquares();
      };

      const onSnapEnd = () => {
        if (boardRef.current) {
          boardRef.current.position(game.fen());
        }
      };

      const config = {
        draggable: isDraggable,
        position: currentFen,
        onDragStart,
        onDrop,
        onMouseoverSquare,
        onMouseoutSquare,
        onSnapEnd,
        pieceTheme: (piece) => pieceImages[piece],
        snapbackSpeed: 500,
        snapSpeed: 100,
      };

      boardRef.current = Chessboard(chessRef.current, config);
    }
  }, [mobileMode, playMode, humanColor, promotionPiece, gamePaused]);

  const handleNewGame = () => {
    gameRef.current.reset();
    if (boardRef.current) {
      boardRef.current.start();
    }
    setMoves([]);
    setCurrentStatus("White to move");
    setCurrentAnalysis(null);
    previousEvalRef.current = 0;
    removeGreySquares();
    setEngineThinking(false);
    setGameActive(true);
    setGamePaused(false);

    setTimeout(() => analyzePosition(), 500);

    if (playMode === 'engine-battle' && whiteEngineLoaded) {
      setTimeout(() => requestEngineMove('white'), 500);
    }
  };

  const handlePauseResume = () => {
    setGamePaused(!gamePaused);

    if (gamePaused) {
      // Resuming
      if (playMode === 'engine-battle' && !gameRef.current.isGameOver()) {
        const nextColor = gameRef.current.turn() === 'w' ? 'white' : 'black';
        setTimeout(() => requestEngineMove(nextColor), 500);
      } else if (playMode === 'vs-engine' && !gameRef.current.isGameOver()) {
        const currentTurn = gameRef.current.turn();
        const isEngineTurn = (humanColor === 'white' && currentTurn === 'b') ||
          (humanColor === 'black' && currentTurn === 'w');

        if (isEngineTurn) {
          const engineColor = humanColor === 'white' ? 'black' : 'white';
          setTimeout(() => requestEngineMove(engineColor), 500);
        }
      }
    }
  };

  // Evaluation bar calculation
  const getEvalBarHeight = () => {
    if (!currentAnalysis) return 50;

    const eval_num = currentAnalysis.evaluation;

    // Clamp between -10 and +10
    const clamped = Math.max(-10, Math.min(10, eval_num));

    // Convert to percentage (0-100)
    // -10 = 0%, 0 = 50%, +10 = 100%
    const percentage = ((clamped + 10) / 20) * 100;

    return percentage;
  };

  const whitePreset = getPresetById(whitePresetId);
  const blackPreset = getPresetById(blackPresetId);
  const boardSize = window.innerWidth > 1028 ? '28vw' : '90vw';

  return (
    <div
      className="lg:mt-0 mt-16 flex lg:h-screen min-h-screen w-screen lg:overflow-hidden"
      style={{ backgroundImage: `url(${boardbg})`, backgroundSize: "cover" }}
    >
      <div className="w-full flex flex-col lg:flex-row mx-auto">

        {/* CENTER - BOARD AND ENGINE INFO */}
        <div className="lg:mx-16 w-full mx-auto lg:w-2/5 flex flex-col items-center justify-center px-2 py-4 mt-16 lg:mt-6 lg:overflow-hidden lg:h-screen">

          {/* BLACK ENGINE INFO (TOP) */}
          {(playMode === 'engine-battle' || playMode === 'vs-engine') && (
            <div className="mb-2 w-full max-w-lg bg-gray-900 bg-opacity-60 rounded-lg p-2 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-lg">
                    ⬛
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{blackPreset?.name || 'Black'}</span>
                    <span className="text-gray-400 text-xs">(D{blackDepth})</span>
                  </div>
                </div>
                {engineThinking && gameRef.current.turn() === 'b' && !gamePaused && (
                  <div className="text-yellow-400 text-xs animate-pulse">⚡ Thinking...</div>
                )}
              </div>
            </div>
          )}

          {/* CHESSBOARD WITH ATTACHED EVAL BAR */}
          <div className="relative flex items-center">
            {/* Evaluation bar - attached to left side */}
            <div className="relative bg-gray-800 rounded-l shadow-2xl mr-1"
              style={{ width: '14px', height: boardSize }}>
              {/* White advantage (top) */}
              <div
                className="absolute top-0 left-0 right-0 bg-white transition-all duration-500 ease-in-out"
                style={{ height: `${100 - getEvalBarHeight()}%` }}
              ></div>
              {/* Black advantage (bottom) */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gray-900 transition-all duration-500 ease-in-out"
                style={{ height: `${getEvalBarHeight()}%` }}
              ></div>
              {/* Evaluation text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gray-700 bg-opacity-95 px-1 py-3 rounded text-white font-bold transform -rotate-90 whitespace-nowrap"
                  style={{ fontSize: '11px' }}>
                  {currentAnalysis ? currentAnalysis.evalText : '0.0'}
                </div>
              </div>
            </div>

            {/* Chessboard */}
            <div ref={chessRef} style={{ width: boardSize }}></div>
          </div>

          {/* WHITE ENGINE INFO (BOTTOM) */}
          {(playMode === 'engine-battle' || playMode === 'vs-engine') && (
            <div className="mt-2 w-full max-w-lg bg-gray-100 bg-opacity-90 rounded-lg p-2 border border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg border-2 border-gray-300">
                    ⬜
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-sm">{whitePreset?.name || 'White'}</span>
                    <span className="text-gray-600 text-xs">(D{whiteDepth})</span>
                  </div>
                </div>
                {engineThinking && gameRef.current.turn() === 'w' && !gamePaused && (
                  <div className="text-yellow-600 text-xs animate-pulse">⚡ Thinking...</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - CONTROLS AND ANALYSIS */}
        <div className="lg:mx-4 w-full  mx-2 lg:w-2/5 mt-8 lg:mt-16 lg:h-screen lg:overflow-y-auto lg:pb-8 scrollbar-hide">

          <MobileToggle mobileMode={mobileMode} onChange={handleCheckboxChange} className="mb-4 mt-16 lg:mt-0" />

          {/* GAME STATUS */}
          <div className="mb-3 rounded-xl shadow-lg text-center p-4 text-lg lg:text-xl bg-gray-400 bg-opacity-30 text-white border border-gray-200">
            {gamePaused ? "⏸️ Game Paused" : (currentStatus || "White to move")}
          </div>

          {/* GAME CONTROLS */}
          <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
            <h3 className="text-white text-lg font-bold mb-2">⚙️ Game Setup</h3>

            <div className="mb-2">
              <label className="text-white text-base block mb-1">Play Mode:</label>
              <select
                value={playMode}
                onChange={(e) => {
                  if (!gameActive) setPlayMode(e.target.value);
                }}
                disabled={gameActive}
                className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option className="bg-blue-900 bg-opacity-50 text-white" value="human">Human vs Human</option>
                <option className="bg-blue-900 bg-opacity-50 text-white" value="vs-engine">Human vs Engine</option>
                <option className="bg-blue-900 bg-opacity-50 text-white" value="engine-battle">Engine Battle</option>
              </select>
              {gameActive && (
                <div className="text-yellow-300 text-xs mt-1">🔒 Finish or reset game to change</div>
              )}
            </div>

            {playMode === 'vs-engine' && (
              <div className="mb-2">
                <label className="text-white text-base block mb-1">Play as:</label>
                <select
                  value={humanColor}
                  onChange={(e) => {
                    if (!gameActive) setHumanColor(e.target.value);
                  }}
                  disabled={gameActive}
                  className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50"
                >
                  <option className="bg-blue-900 bg-opacity-50 text-white" value="white">White</option>
                  <option className="bg-blue-900 bg-opacity-50 text-white" value="black">Black</option>
                </select>
              </div>
            )}

            {(playMode === 'engine-battle' || playMode === 'vs-engine') && (
              <>
                <div className="mb-2">
                  <label className="text-white text-base block mb-1">⬜ White Engine:</label>
                  <select
                    value={whitePresetId}
                    onChange={(e) => {
                      if (!gameActive) handleWhitePresetChange(e.target.value);
                    }}
                    disabled={gameActive}
                    className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50"
                  >
                    {ALL_ENGINE_PRESETS.map(p => (
                      <option key={p.id} value={p.id} className="bg-blue-900 bg-opacity-50 text-white">{p.name} (D{p.depth})</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-white text-base block mb-1">⬛ Black Engine:</label>
                  <select
                    value={blackPresetId}
                    onChange={(e) => {
                      if (!gameActive) handleBlackPresetChange(e.target.value);
                    }}
                    disabled={gameActive}
                    className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50"
                  >
                    {ALL_ENGINE_PRESETS.map(p => (
                      <option key={p.id} value={p.id} className="bg-blue-900 bg-opacity-50 text-white">{p.name} (D{p.depth})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleNewGame}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold text-base shadow-lg"
              >
                🎮 New Game
              </button>

              {gameActive && (playMode === 'engine-battle' || playMode === 'vs-engine') && (
                <button
                  onClick={handlePauseResume}
                  className={`flex-1 ${gamePaused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-3 py-2 rounded-lg font-bold text-base shadow-lg`}
                >
                  {gamePaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              )}
            </div>
          </div>

          {/* ANALYSIS */}
          <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
            <h3 className="text-white text-lg font-bold mb-2">🔍 Analysis (Auto-enabled)</h3>

            <div className="mb-2">
              <label className="text-white text-base block mb-1">Analyzer Strength:</label>
              <select
                value={analyzerPresetId}
                onChange={(e) => handleAnalyzerPresetChange(e.target.value)}
                className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm"
              >
                {ALL_ENGINE_PRESETS.map(p => (
                  <option key={p.id} value={p.id} className="bg-blue-900 bg-opacity-50 text-white">{p.name} (Depth {p.depth})</option>
                ))}
              </select>
            </div>

            {currentAnalysis && (
              <div className="bg-black bg-opacity-30 p-3 rounded-lg border border-gray-300">
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Evaluation:</span>
                    <span className="font-bold text-lg">{currentAnalysis.evalText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Move:</span>
                    <span className="font-mono text-yellow-300">{currentAnalysis.bestMove}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depth:</span>
                    <span>{currentAnalysis.depth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nodes:</span>
                    <span className="text-xs">{currentAnalysis.nodes?.toLocaleString()}</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs opacity-75 mb-1">Principal Variation:</div>
                    <div className="font-mono text-xs bg-black bg-opacity-50 p-2 rounded border border-gray-600">
                      {currentAnalysis.pv}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analyzerThinking && (
              <div className="text-blue-300 text-sm text-center mt-2 animate-pulse">
                🔍 Analyzing...
              </div>
            )}
          </div>

          {/* MOVE HISTORY */}
          <div className="p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-lg font-bold">📋 Moves</h3>
              <button
                onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                className="text-white text-base hover:text-gray-300 font-bold"
              >
                {isTableCollapsed ? '▼ Show' : '▲ Hide'}
              </button>
            </div>

            <div
              style={{
                maxHeight: isTableCollapsed ? "0" : "20vh",
                transition: "max-height 0.3s ease-in-out",
                overflow: "hidden",
              }}
            >
              {moves.length > 0 && (
                <div style={{ maxHeight: "20vh", overflowY: "auto" }}>
                  <table className="w-full border-collapse border border-gray-400 rounded-lg bg-gray-600 bg-opacity-30 text-white">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-800 bg-opacity-50 text-center text-white">
                        <th className="border border-gray-400 px-3 py-1.5 text-sm">#</th>
                        <th className="border border-gray-400 px-3 py-1.5 text-sm">From</th>
                        <th className="border border-gray-400 px-3 py-1.5 text-sm">To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moves.map((move, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-gray-700 bg-opacity-40 text-white text-center"
                              : "bg-gray-600 bg-opacity-40 text-gray-200 text-center"
                          }
                        >
                          <td className="border border-gray-400 px-3 py-2 text-sm">{idx + 1}</td>
                          <td className="border border-gray-400 px-3 py-2 font-mono text-sm">{move.from}</td>
                          <td className="border border-gray-400 px-3 py-2 font-mono text-sm">{move.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {moves.length === 0 && (
                <div className="text-gray-300 text-sm text-center py-4 bg-black bg-opacity-20 rounded-lg border border-gray-500">
                  No moves yet
                </div>
              )}
            </div>
          </div>

          {/* PROMOTION */}
          <div className="mt-3">
            <label className="text-white text-base block mb-1">Promotion Piece:</label>
            <select
              value={promotionPiece}
              onChange={(e) => setPromotionPiece(e.target.value)}
              className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm"
            >
              <option className="bg-blue-900 bg-opacity-50 text-white" value="q">♕ Promote to Queen</option>
              <option className="bg-blue-900 bg-opacity-50 text-white" value="r">♖ Promote to Rook</option>
              <option className="bg-blue-900 bg-opacity-50 text-white" value="b">♗ Promote to Bishop</option>
              <option className="bg-blue-900 bg-opacity-50 text-white" value="n">♘ Promote to Knight</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineAnalysis;