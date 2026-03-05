import React, { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import MobileToggle from "../MobileToggle";
import ExportPGN from "../ExportPGN";
import boardbg from "../../assets/images/bgboard.jpeg";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import moveSoundFile from "../../assets/sounds/move.mp3";
import pieceImages from "../pieceImages";
import { ALL_ENGINE_PRESETS, getPresetById } from "./enginePresets";

const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

// ---------------------------------------------------------------------------
const EnginePlay = () => {
    // Board
    const chessRef = useRef(null);
    const boardRef = useRef(null);
    const gameRef = useRef(new Chess());

    // UI state
    const [currentStatus, setCurrentStatus] = useState("White to move");
    const [moves, setMoves] = useState([]);
    const [isTableCollapsed, setIsTableCollapsed] = useState(false);
    const [promotionPiece, setPromotionPiece] = useState("q");
    const [mobileMode, setMobileMode] = useState(window.innerWidth <= 1028);

    // Play mode
    const [playMode, setPlayMode] = useState("vs-engine");   // "vs-engine" | "engine-battle"
    const [humanColor, setHumanColor] = useState("white");
    const [gameActive, setGameActive] = useState(false);
    const [gamePaused, setGamePaused] = useState(false);

    // Sync refs for callbacks
    const playModeRef = useRef("vs-engine");
    const humanColorRef = useRef("white");
    const gamePausedRef = useRef(false);
    useEffect(() => { playModeRef.current = playMode; }, [playMode]);
    useEffect(() => { humanColorRef.current = humanColor; }, [humanColor]);
    useEffect(() => { gamePausedRef.current = gamePaused; }, [gamePaused]);

    // Engines
    const whiteEngineRef = useRef(null);
    const blackEngineRef = useRef(null);
    const analyzerEngineRef = useRef(null);

    const [whitePresetId, setWhitePresetId] = useState("stockfish-medium");
    const [blackPresetId, setBlackPresetId] = useState("stockfish-fast");
    const [analyzerPresetId, setAnalyzerPresetId] = useState("stockfish-ultra");

    const [whiteDepth, setWhiteDepth] = useState(15);
    const [blackDepth, setBlackDepth] = useState(12);
    const [analyzerDepth, setAnalyzerDepth] = useState(25);

    const [whiteCustom, setWhiteCustom] = useState(false);
    const [blackCustom, setBlackCustom] = useState(false);
    const [analyzerCustom, setAnalyzerCustom] = useState(false);

    const [whiteEngineLoaded, setWhiteEngineLoaded] = useState(false);
    const [blackEngineLoaded, setBlackEngineLoaded] = useState(false);
    const [analyzerEngineLoaded, setAnalyzerEngineLoaded] = useState(false);

    const [engineThinking, setEngineThinking] = useState(false);
    const [analyzerThinking, setAnalyzerThinking] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const previousEvalRef = useRef(0);

    // Scrollbar style
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const removeGreySquares = () =>
        document.querySelectorAll(".square-55d63").forEach(s => (s.style.background = ""));

    const greySquare = (sq) => {
        const el = document.querySelector(`.square-${sq}`);
        if (el) el.style.background = el.classList.contains("black-3c85d") ? "#696969" : "#a9a9a9";
    };

    const updateStatus = useCallback(() => {
        const g = gameRef.current;
        if (g.isGameOver()) { setCurrentStatus("Game over"); setGameActive(false); setGamePaused(false); return; }
        const mc = g.turn() === "b" ? "Black" : "White";
        let s = `${mc} to move`;
        if (g.isCheckmate()) { s += `, ${mc} is in checkmate`; checkmateSound.play(); }
        else if (g.inCheck()) { s += `, ${mc} is in check`; checkSound.play(); }
        setCurrentStatus(s);
    }, []);

    // ── Analyzer ───────────────────────────────────────────────────────────────
    const parseEngineAnalysis = useCallback((message) => {
        try {
            const depthM = message.match(/depth (\d+)/);
            const scoreM = message.match(/score cp (-?\d+)/);
            const mateM = message.match(/score mate (-?\d+)/);
            const pvM = message.match(/\bpv\s+(.+)/);
            const nodesM = message.match(/nodes (\d+)/);
            const depth = depthM ? parseInt(depthM[1]) : 0;
            const nodes = nodesM ? parseInt(nodesM[1]) : 0;
            if (!pvM || depth < 10 || nodes <= 5000) return;

            let evaluation = 0, evalText = "0.0";
            if (mateM) {
                const mateIn = parseInt(mateM[1]);
                const abs = gameRef.current.turn() === "w" ? mateIn : -mateIn;
                evaluation = abs > 0 ? 10000 : -10000;
                evalText = `M${Math.abs(mateIn)}`;
            } else if (scoreM) {
                const raw = parseInt(scoreM[1]) / 100;
                const abs = gameRef.current.turn() === "w" ? raw : -raw;
                const prev = previousEvalRef.current;
                const maxΔ = 0.8;
                evaluation = Math.abs(abs - prev) > maxΔ ? prev + (abs > prev ? maxΔ : -maxΔ) : abs;
                previousEvalRef.current = evaluation;
                evalText = evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
            }
            const pvMoves = pvM[1].trim().split(/\s+/);
            setCurrentAnalysis({ depth, evaluation, evalText, bestMove: pvMoves[0], pv: pvMoves.slice(0, 8).join(" "), nodes });
        } catch { }
    }, []);

    const analyzePosition = useCallback(() => {
        if (!analyzerEngineRef.current) return;
        const preset = getPresetById(analyzerPresetId);
        if (!preset) return;
        const depth = analyzerCustom && analyzerDepth ? analyzerDepth : preset.depth;
        setAnalyzerThinking(true);
        analyzerEngineRef.current.postMessage(`position fen ${gameRef.current.fen()}`);
        analyzerEngineRef.current.postMessage(`go depth ${depth}`);
        setTimeout(() => {
            if (analyzerEngineRef.current) { analyzerEngineRef.current.postMessage("stop"); setAnalyzerThinking(false); }
        }, 8000);
    }, [analyzerPresetId, analyzerDepth, analyzerCustom]);

    // ── Engine loading ─────────────────────────────────────────────────────────
    const loadEngine = useCallback((presetId, engineRef, onLoad) => {
        const preset = getPresetById(presetId);
        if (!preset) return;
        try {
            const worker = new Worker("/stockfish.js");
            let ready = false, tid;
            worker.onmessage = (e) => {
                const msg = e.data;
                if (typeof msg === "string" && msg.trim() === "uciok") {
                    ready = true; if (tid) clearTimeout(tid); if (onLoad) onLoad();
                }
                // Route messages
                if (typeof msg === "string") {
                    if (msg.startsWith("bestmove") && (engineRef === whiteEngineRef || engineRef === blackEngineRef)) {
                        const m = msg.match(/bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
                        if (m) setTimeout(() => makeEngineMove(m[1], m[2], m[3] || "q"), 500);
                        setEngineThinking(false);
                    }
                    if (msg.startsWith("info") && msg.includes("pv") && engineRef === analyzerEngineRef)
                        parseEngineAnalysis(msg);
                }
            };
            worker.onerror = () => setEngineThinking(false);
            engineRef.current = worker;
            worker.postMessage("uci");
            tid = setTimeout(() => { if (!ready) setEngineThinking(false); }, 10000);
        } catch { }
    }, [parseEngineAnalysis]); // eslint-disable-line

    // Analyzer
    useEffect(() => {
        loadEngine(analyzerPresetId, analyzerEngineRef, () => setAnalyzerEngineLoaded(true));
        return () => { analyzerEngineRef.current?.terminate(); analyzerEngineRef.current = null; };
    }, [analyzerPresetId, loadEngine]);

    useEffect(() => {
        if (analyzerEngineLoaded) setTimeout(() => analyzePosition(), 300);
    }, [analyzerEngineLoaded, analyzePosition]);

    // White engine
    useEffect(() => {
        loadEngine(whitePresetId, whiteEngineRef, () => setWhiteEngineLoaded(true));
        return () => { whiteEngineRef.current?.terminate(); whiteEngineRef.current = null; };
    }, [whitePresetId, loadEngine]);

    // Black engine
    useEffect(() => {
        loadEngine(blackPresetId, blackEngineRef, () => setBlackEngineLoaded(true));
        return () => { blackEngineRef.current?.terminate(); blackEngineRef.current = null; };
    }, [blackPresetId, loadEngine]);

    // ── Engine move dispatch ───────────────────────────────────────────────────
    const requestEngineMove = useCallback((color) => {
        const game = gameRef.current;
        if (engineThinking || gamePausedRef.current || game.isGameOver()) return;
        const engineRef = color === "white" ? whiteEngineRef : blackEngineRef;
        const presetId = color === "white" ? whitePresetId : blackPresetId;
        const depth = color === "white" ? whiteDepth : blackDepth;
        const isCustom = color === "white" ? whiteCustom : blackCustom;
        if (!engineRef.current) return;
        const preset = getPresetById(presetId);
        if (!preset) return;
        setEngineThinking(true);
        const finalDepth = isCustom && depth ? depth : preset.depth;
        engineRef.current.postMessage(`position fen ${game.fen()}`);
        engineRef.current.postMessage(`go depth ${finalDepth}`);
    }, [engineThinking, whitePresetId, blackPresetId, whiteDepth, blackDepth, whiteCustom, blackCustom]);

    const makeEngineMove = useCallback((from, to, promotion) => {
        if (gamePausedRef.current) { setEngineThinking(false); return; }
        const game = gameRef.current;
        try {
            const move = game.move({ from, to, promotion });
            if (move) {
                boardRef.current?.position(game.fen());
                setMoves(prev => [...prev, { from: move.from, to: move.to }]);
                updateStatus();
                move.captured ? captureSound.play() : moveSound.play();
                setTimeout(() => analyzePosition(), 500);
                const pm = playModeRef.current;
                if (pm === "engine-battle" && !game.isGameOver() && !gamePausedRef.current) {
                    const next = game.turn() === "w" ? "white" : "black";
                    setTimeout(() => requestEngineMove(next), 1000);
                }
                if (pm === "vs-engine" && !game.isGameOver() && !gamePausedRef.current) {
                    const hc = humanColorRef.current;
                    const isEng = (hc === "white" && game.turn() === "b") || (hc === "black" && game.turn() === "w");
                    if (isEng) setTimeout(() => requestEngineMove(hc === "white" ? "black" : "white"), 1000);
                }
            }
        } catch { setEngineThinking(false); }
    }, [updateStatus, analyzePosition, requestEngineMove]);

    // ── Eval bar ──────────────────────────────────────────────────────────────
    const getEvalBarHeight = () => {
        if (!currentAnalysis) return 50;
        const clamped = Math.max(-10, Math.min(10, currentAnalysis.evaluation));
        return ((clamped + 10) / 20) * 100;
    };

    // ── Board initialization ───────────────────────────────────────────────────
    useEffect(() => {
        const game = gameRef.current;
        const onDragStart = (_, piece) => {
            if (mobileMode || game.isGameOver() || engineThinking || gamePaused) return false;
            if (playMode === "engine-battle") return false;
            if (playMode === "vs-engine") {
                if (humanColor === "white" && piece.search(/^b/) !== -1) return false;
                if (humanColor === "black" && piece.search(/^w/) !== -1) return false;
            }
            if ((game.turn() === "w" && piece.search(/^b/) !== -1) ||
                (game.turn() === "b" && piece.search(/^w/) !== -1)) return false;
        };
        const onDrop = (source, target) => {
            if (mobileMode || engineThinking || gamePaused) return "snapback";
            removeGreySquares();
            const move = game.move({ from: source, to: target, promotion: promotionPiece });
            if (!move) return "snapback";
            setMoves(prev => [...prev, { from: move.from, to: move.to }]);
            updateStatus();
            move.captured ? captureSound.play() : moveSound.play();
            setTimeout(() => analyzePosition(), 500);
            if (playMode === "vs-engine" && !game.isGameOver() && !gamePaused) {
                const isEng = (humanColor === "white" && game.turn() === "b") ||
                    (humanColor === "black" && game.turn() === "w");
                if (isEng) setTimeout(() => requestEngineMove(humanColor === "white" ? "black" : "white"), 800);
            }
        };
        const onMouseoverSquare = (sq) => {
            if (mobileMode) return;
            const ms = game.moves({ square: sq, verbose: true }); if (!ms.length) return;
            greySquare(sq); ms.forEach(m => greySquare(m.to));
        };
        const onMouseoutSquare = () => { if (!mobileMode) removeGreySquares(); };
        const onSnapEnd = () => { boardRef.current?.position(game.fen()); };

        boardRef.current?.destroy();
        boardRef.current = Chessboard(chessRef.current, {
            draggable: !mobileMode && playMode !== "engine-battle",
            position: game.fen(),
            onDragStart, onDrop, onMouseoverSquare, onMouseoutSquare, onSnapEnd,
            pieceTheme: (p) => pieceImages[p],
            snapbackSpeed: 500, snapSpeed: 100,
        });
        return () => { boardRef.current?.destroy(); boardRef.current = null; };
    }, [mobileMode, playMode, humanColor, promotionPiece, gamePaused, engineThinking, updateStatus, analyzePosition, requestEngineMove]);

    // ── Game controls ──────────────────────────────────────────────────────────
    const handleNewGame = () => {
        gameRef.current.reset(); boardRef.current?.start();
        setMoves([]); setCurrentStatus("White to move"); setCurrentAnalysis(null);
        previousEvalRef.current = 0; removeGreySquares();
        setEngineThinking(false); setGameActive(true); setGamePaused(false);
        setTimeout(() => analyzePosition(), 500);
        if (playMode === "engine-battle" && whiteEngineLoaded)
            setTimeout(() => requestEngineMove("white"), 600);
        if (playMode === "vs-engine" && humanColor === "black" && blackEngineLoaded)
            setTimeout(() => requestEngineMove("white"), 600);
    };

    const handlePauseResume = () => {
        const nextPaused = !gamePaused;
        setGamePaused(nextPaused);
        if (!nextPaused) {
            if (playMode === "engine-battle" && !gameRef.current.isGameOver()) {
                const next = gameRef.current.turn() === "w" ? "white" : "black";
                setTimeout(() => requestEngineMove(next), 500);
            } else if (playMode === "vs-engine" && !gameRef.current.isGameOver()) {
                const isEng = (humanColor === "white" && gameRef.current.turn() === "b") ||
                    (humanColor === "black" && gameRef.current.turn() === "w");
                if (isEng) setTimeout(() => requestEngineMove(humanColor === "white" ? "black" : "white"), 500);
            }
        }
    };

    // ── Preset change handlers ─────────────────────────────────────────────────
    const handleWhitePresetChange = (id) => {
        whiteEngineRef.current?.terminate(); whiteEngineRef.current = null;
        setWhiteEngineLoaded(false); setWhitePresetId(id); setWhiteCustom(false);
        const p = getPresetById(id); if (p) setWhiteDepth(p.depth || 15);
    };
    const handleBlackPresetChange = (id) => {
        blackEngineRef.current?.terminate(); blackEngineRef.current = null;
        setBlackEngineLoaded(false); setBlackPresetId(id); setBlackCustom(false);
        const p = getPresetById(id); if (p) setBlackDepth(p.depth || 12);
    };
    const handleAnalyzerPresetChange = (id) => {
        analyzerEngineRef.current?.terminate(); analyzerEngineRef.current = null;
        setAnalyzerEngineLoaded(false); setAnalyzerPresetId(id); setAnalyzerCustom(false);
        const p = getPresetById(id); if (p) setAnalyzerDepth(p.depth || 16);
    };

    const whitePreset = getPresetById(whitePresetId);
    const blackPreset = getPresetById(blackPresetId);
    const boardSize = window.innerWidth > 1028 ? "28vw" : "90vw";

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="lg:mt-0 mt-16 flex lg:h-screen min-h-screen w-screen lg:overflow-hidden"
            style={{ backgroundImage: `url(${boardbg})`, backgroundSize: "cover" }}
        >
            <div className="w-full flex flex-col lg:flex-row mx-auto">

                {/* ── CENTER: Board + engine player badges ── */}
                <div className="lg:mx-16 w-full mx-auto lg:w-2/5 flex flex-col items-center justify-center px-2 py-4 mt-16 lg:mt-6 lg:overflow-hidden lg:h-screen">

                    {/* Black badge */}
                    <div className="mb-2 w-full max-w-lg bg-gray-900 bg-opacity-60 rounded-lg p-2 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-lg">⬛</div>
                                <span className="text-white font-bold text-sm">
                                    {playMode === "vs-engine" && humanColor === "black" ? "You" : (blackPreset?.name || "Black")}
                                </span>
                                <span className="text-gray-400 text-xs">(D{blackDepth})</span>
                            </div>
                            {!blackEngineLoaded && playMode !== "human" && <span className="text-blue-400 text-xs animate-pulse">⏳ Loading...</span>}
                            {blackEngineLoaded && engineThinking && gameRef.current.turn() === "b" && !gamePaused && <span className="text-yellow-400 text-xs animate-pulse">⚡ Thinking...</span>}
                            {blackEngineLoaded && !(engineThinking && gameRef.current.turn() === "b" && !gamePaused) && <span className="text-green-400 text-xs">● Ready</span>}
                        </div>
                    </div>

                    {/* Chessboard + eval bar */}
                    <div className="relative flex items-center">
                        <div className="relative bg-gray-800 rounded-l shadow-2xl mr-1" style={{ width: "14px", height: boardSize }}>
                            <div className="absolute top-0 left-0 right-0 bg-gray-900 transition-all duration-500 ease-in-out" style={{ height: `${100 - getEvalBarHeight()}%` }} />
                            <div className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-500 ease-in-out" style={{ height: `${getEvalBarHeight()}%` }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-gray-700 bg-opacity-95 px-1 py-3 rounded text-white font-bold transform -rotate-90 whitespace-nowrap" style={{ fontSize: "11px" }}>
                                    {currentAnalysis ? currentAnalysis.evalText : "0.0"}
                                </div>
                            </div>
                        </div>
                        <div ref={chessRef} style={{ width: boardSize }} />
                    </div>

                    {/* White badge */}
                    <div className="mt-2 w-full max-w-lg bg-gray-100 bg-opacity-90 rounded-lg p-2 border border-gray-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg border-2 border-gray-300">⬜</div>
                                <span className="text-gray-900 font-bold text-sm">
                                    {playMode === "vs-engine" && humanColor === "white" ? "You" : (whitePreset?.name || "White")}
                                </span>
                                <span className="text-gray-600 text-xs">(D{whiteDepth})</span>
                            </div>
                            {!whiteEngineLoaded && <span className="text-blue-600 text-xs animate-pulse">⏳ Loading...</span>}
                            {whiteEngineLoaded && engineThinking && gameRef.current.turn() === "w" && !gamePaused && <span className="text-yellow-600 text-xs animate-pulse">⚡ Thinking...</span>}
                            {whiteEngineLoaded && !(engineThinking && gameRef.current.turn() === "w" && !gamePaused) && <span className="text-green-600 text-xs">● Ready</span>}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:mx-4 w-full mx-2 lg:w-2/5 mt-8 lg:mt-16 lg:h-screen lg:overflow-y-auto lg:pb-8 scrollbar-hide">
                    <MobileToggle mobileMode={mobileMode} onChange={() => setMobileMode(!mobileMode)} className="mb-4 mt-16 lg:mt-0" />

                    {/* Status */}
                    <div className="mb-3 rounded-xl shadow-lg text-center p-4 text-lg lg:text-xl bg-gray-400 bg-opacity-30 text-white border border-gray-200">
                        {gamePaused ? "⏸️ Game Paused" : currentStatus}
                    </div>

                    {/* Game Setup */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <h3 className="text-white text-lg font-bold mb-2">⚙️ Game Setup</h3>

                        <div className="mb-2">
                            <label className="text-white text-sm block mb-1">Mode:</label>
                            <select value={playMode} onChange={(e) => { if (!gameActive) setPlayMode(e.target.value); }} disabled={gameActive}
                                className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <option value="vs-engine" className="bg-blue-900 text-white">Human vs Engine</option>
                                <option value="engine-battle" className="bg-blue-900 text-white">Engine Battle</option>
                            </select>
                            {gameActive && <div className="text-yellow-300 text-xs mt-1">🔒 Finish or reset to change mode</div>}
                        </div>

                        {playMode === "vs-engine" && (
                            <div className="mb-2">
                                <label className="text-white text-sm block mb-1">Play as:</label>
                                <select value={humanColor} onChange={(e) => { if (!gameActive) setHumanColor(e.target.value); }} disabled={gameActive}
                                    className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50">
                                    <option value="white" className="bg-blue-900 text-white">White</option>
                                    <option value="black" className="bg-blue-900 text-white">Black</option>
                                </select>
                            </div>
                        )}

                        {/* White engine */}
                        <div className="mb-2">
                            <label className="text-white text-sm block mb-1">⬜ White Engine:</label>
                            <select value={whitePresetId} onChange={(e) => handleWhitePresetChange(e.target.value)}
                                disabled={engineThinking && gameRef.current.turn() === "w"}
                                className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {ALL_ENGINE_PRESETS.map(p => <option key={p.id} value={p.id} className="bg-blue-900 text-white">{p.name} (D{p.depth})</option>)}
                            </select>
                        </div>

                        {/* Black engine */}
                        <div className="mb-2">
                            <label className="text-white text-sm block mb-1">⬛ Black Engine:</label>
                            <select value={blackPresetId} onChange={(e) => handleBlackPresetChange(e.target.value)}
                                disabled={engineThinking && gameRef.current.turn() === "b"}
                                className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {ALL_ENGINE_PRESETS.map(p => <option key={p.id} value={p.id} className="bg-blue-900 text-white">{p.name} (D{p.depth})</option>)}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleNewGame}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transition-all">
                                🎮 New Game
                            </button>
                            {gameActive && (
                                <button onClick={handlePauseResume}
                                    className={`flex-1 ${gamePaused ? "bg-blue-600 hover:bg-blue-700" : "bg-yellow-600 hover:bg-yellow-700"} text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transition-all`}>
                                    {gamePaused ? "▶️ Resume" : "⏸️ Pause"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Analysis */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <h3 className="text-white text-lg font-bold mb-2">🔍 Analysis</h3>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-white text-sm">Analyzer Strength:</label>
                            {analyzerEngineLoaded
                                ? <span className="text-green-400 text-xs">● Ready (D{analyzerDepth})</span>
                                : <span className="text-blue-400 text-xs animate-pulse">⏳ Loading...</span>}
                        </div>
                        <select value={analyzerPresetId} onChange={(e) => handleAnalyzerPresetChange(e.target.value)}
                            className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm mb-2">
                            {ALL_ENGINE_PRESETS.map(p => <option key={p.id} value={p.id} className="bg-blue-900 text-white">{p.name} (D{p.depth})</option>)}
                        </select>
                        {currentAnalysis && (
                            <div className="bg-black bg-opacity-30 p-3 rounded-lg border border-gray-300 text-white text-sm space-y-1">
                                <div className="flex justify-between"><span>Evaluation:</span><span className="font-bold text-lg">{currentAnalysis.evalText}</span></div>
                                <div className="flex justify-between"><span>Best Move:</span><span className="font-mono text-yellow-300">{currentAnalysis.bestMove}</span></div>
                                <div className="flex justify-between"><span>Depth:</span><span>{currentAnalysis.depth} / {analyzerDepth}</span></div>
                                <div className="flex justify-between"><span>Nodes:</span><span className="text-xs">{currentAnalysis.nodes?.toLocaleString()}</span></div>
                                <div className="mt-1">
                                    <div className="text-xs opacity-75 mb-1">Principal Variation:</div>
                                    <div className="font-mono text-xs bg-black bg-opacity-50 p-2 rounded border border-gray-600">{currentAnalysis.pv}</div>
                                </div>
                            </div>
                        )}
                        {analyzerThinking && <div className="text-blue-300 text-sm text-center mt-2 animate-pulse">🔍 Analyzing...</div>}
                    </div>

                    {/* Move history */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white text-lg font-bold">📋 Moves</h3>
                            <button onClick={() => setIsTableCollapsed(!isTableCollapsed)} className="text-white text-sm hover:text-gray-300 font-bold">
                                {isTableCollapsed ? "▼ Show" : "▲ Hide"}
                            </button>
                        </div>
                        <div style={{ maxHeight: isTableCollapsed ? "0" : "20vh", transition: "max-height 0.3s ease-in-out", overflow: "hidden" }}>
                            {moves.length > 0 ? (
                                <div style={{ maxHeight: "20vh", overflowY: "auto" }}>
                                    <table className="w-full border-collapse border border-gray-400 rounded-lg bg-gray-600 bg-opacity-30 text-white">
                                        <thead className="sticky top-0">
                                            <tr className="bg-gray-800 bg-opacity-50 text-center">
                                                <th className="border border-gray-400 px-3 py-1.5 text-sm">#</th>
                                                <th className="border border-gray-400 px-3 py-1.5 text-sm">From</th>
                                                <th className="border border-gray-400 px-3 py-1.5 text-sm">To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {moves.map((m, i) => (
                                                <tr key={i} className={i % 2 === 0 ? "bg-gray-700 bg-opacity-40 text-white text-center" : "bg-gray-600 bg-opacity-40 text-gray-200 text-center"}>
                                                    <td className="border border-gray-400 px-3 py-2 text-sm">{i + 1}</td>
                                                    <td className="border border-gray-400 px-3 py-2 font-mono text-sm">{m.from}</td>
                                                    <td className="border border-gray-400 px-3 py-2 font-mono text-sm">{m.to}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-gray-300 text-sm text-center py-4 bg-black bg-opacity-20 rounded-lg border border-gray-500">No moves yet</div>
                            )}
                        </div>
                    </div>

                    {/* Promotion */}
                    <div className="mb-3">
                        <label className="text-white text-sm block mb-1">Promotion Piece:</label>
                        <select value={promotionPiece} onChange={(e) => setPromotionPiece(e.target.value)}
                            className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm">
                            <option value="q" className="bg-blue-900 text-white">♕ Promote to Queen</option>
                            <option value="r" className="bg-blue-900 text-white">♖ Promote to Rook</option>
                            <option value="b" className="bg-blue-900 text-white">♗ Promote to Bishop</option>
                            <option value="n" className="bg-blue-900 text-white">♘ Promote to Knight</option>
                        </select>
                    </div>

                    {/* Export PGN */}
                    <ExportPGN
                        gameRef={gameRef}
                        event="Engine Play"
                        white={playMode === "vs-engine" && humanColor === "white" ? "Human" : (whitePreset?.name || "White Engine")}
                        black={playMode === "vs-engine" && humanColor === "black" ? "Human" : (blackPreset?.name || "Black Engine")}
                    />
                </div>
            </div>
        </div>
    );
};

export default EnginePlay;
