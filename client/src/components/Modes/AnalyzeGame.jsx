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
const AnalyzeGame = () => {
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

    // Analyzer engine
    const analyzerEngineRef = useRef(null);
    const [analyzerPresetId, setAnalyzerPresetId] = useState("stockfish-ultra");
    const [analyzerDepth, setAnalyzerDepth] = useState(25);
    const [analyzerCustom, setAnalyzerCustom] = useState(false);
    const [analyzerEngineLoaded, setAnalyzerEngineLoaded] = useState(false);
    const [analyzerThinking, setAnalyzerThinking] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const previousEvalRef = useRef(0);

    // PGN import
    const [pgnImportMode, setPgnImportMode] = useState(false);
    const [pgnInputText, setPgnInputText] = useState("");
    const [pgnMoves, setPgnMoves] = useState([]);
    const [pgnMoveIndex, setPgnMoveIndex] = useState(-1);
    const [pgnError, setPgnError] = useState("");
    const pgnGameRef = useRef(new Chess());
    const pgnFileInputRef = useRef(null);

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

    // ── Analyzer engine ────────────────────────────────────────────────────────
    const parseEngineAnalysis = useCallback((message) => {
        try {
            const depthMatch = message.match(/depth (\d+)/);
            const scoreMatch = message.match(/score cp (-?\d+)/);
            const mateMatch = message.match(/score mate (-?\d+)/);
            const pvMatch = message.match(/\bpv\s+(.+)/);
            const nodesMatch = message.match(/nodes (\d+)/);
            const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
            const nodes = nodesMatch ? parseInt(nodesMatch[1]) : 0;
            if (!pvMatch || depth < 10 || nodes <= 5000) return;

            let evaluation = 0, evalText = "0.0";
            if (mateMatch) {
                const mateIn = parseInt(mateMatch[1]);
                const abs = gameRef.current.turn() === "w" ? mateIn : -mateIn;
                evaluation = abs > 0 ? 10000 : -10000;
                evalText = `M${Math.abs(mateIn)}`;
            } else if (scoreMatch) {
                const raw = parseInt(scoreMatch[1]) / 100;
                const abs = gameRef.current.turn() === "w" ? raw : -raw;
                const prev = previousEvalRef.current;
                const maxΔ = 0.8;
                evaluation = Math.abs(abs - prev) > maxΔ ? prev + (abs > prev ? maxΔ : -maxΔ) : abs;
                previousEvalRef.current = evaluation;
                evalText = evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
            }
            const pvMoves = pvMatch[1].trim().split(/\s+/);
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
            if (analyzerEngineRef.current) {
                analyzerEngineRef.current.postMessage("stop");
                setAnalyzerThinking(false);
            }
        }, 8000);
    }, [analyzerPresetId, analyzerDepth, analyzerCustom]);

    const loadAnalyzerEngine = useCallback(() => {
        const preset = getPresetById(analyzerPresetId);
        if (!preset) return;
        try {
            const worker = new Worker("/stockfish.js");
            let ready = false, tid;
            worker.onmessage = (e) => {
                const msg = e.data;
                if (typeof msg === "string" && msg.trim() === "uciok") {
                    ready = true;
                    if (tid) clearTimeout(tid);
                    setAnalyzerEngineLoaded(true);
                }
                if (typeof msg === "string" && msg.startsWith("info") && msg.includes("pv"))
                    parseEngineAnalysis(msg);
            };
            worker.onerror = () => setAnalyzerEngineLoaded(false);
            analyzerEngineRef.current = worker;
            worker.postMessage("uci");
            tid = setTimeout(() => { if (!ready) setAnalyzerEngineLoaded(false); }, 10000);
        } catch { }
    }, [analyzerPresetId, parseEngineAnalysis]);

    useEffect(() => {
        loadAnalyzerEngine();
        return () => { analyzerEngineRef.current?.terminate(); analyzerEngineRef.current = null; };
    }, [analyzerPresetId, loadAnalyzerEngine]);

    useEffect(() => {
        if (analyzerEngineLoaded) setTimeout(() => analyzePosition(), 300);
    }, [analyzerEngineLoaded, analyzePosition]);

    const handleAnalyzerPresetChange = (id) => {
        analyzerEngineRef.current?.terminate();
        analyzerEngineRef.current = null;
        setAnalyzerEngineLoaded(false);
        setAnalyzerPresetId(id);
        setAnalyzerCustom(false);
        const p = getPresetById(id);
        if (p) setAnalyzerDepth(p.depth || 16);
    };

    // ── Eval bar ──────────────────────────────────────────────────────────────
    const getEvalBarHeight = () => {
        if (!currentAnalysis) return 50;
        const clamped = Math.max(-10, Math.min(10, currentAnalysis.evaluation));
        return ((clamped + 10) / 20) * 100;
    };

    // ── Board ─────────────────────────────────────────────────────────────────
    const updateStatus = useCallback(() => {
        const g = gameRef.current;
        if (g.isGameOver()) { setCurrentStatus("Game over"); return; }
        const mc = g.turn() === "b" ? "Black" : "White";
        let s = `${mc} to move`;
        if (g.isCheckmate()) { s += `, ${mc} is in checkmate`; checkmateSound.play(); }
        else if (g.inCheck()) { s += `, ${mc} is in check`; checkSound.play(); }
        setCurrentStatus(s);
    }, []);

    useEffect(() => {
        const game = gameRef.current;
        const onDragStart = (_, piece) => {
            if (mobileMode || game.isGameOver()) return false;
            if ((game.turn() === "w" && piece.search(/^b/) !== -1) ||
                (game.turn() === "b" && piece.search(/^w/) !== -1)) return false;
        };
        const onDrop = (source, target) => {
            if (mobileMode) return "snapback";
            removeGreySquares();
            const move = game.move({ from: source, to: target, promotion: promotionPiece });
            if (!move) return "snapback";
            setMoves(prev => [...prev, { from: move.from, to: move.to }]);
            updateStatus();
            move.captured ? captureSound.play() : moveSound.play();
            setTimeout(() => analyzePosition(), 500);
        };
        const onMouseoverSquare = (sq) => {
            if (mobileMode) return;
            const ms = game.moves({ square: sq, verbose: true });
            if (!ms.length) return;
            greySquare(sq); ms.forEach(m => greySquare(m.to));
        };
        const onMouseoutSquare = () => { if (!mobileMode) removeGreySquares(); };
        const onSnapEnd = () => { boardRef.current?.position(game.fen()); };

        boardRef.current?.destroy();
        boardRef.current = Chessboard(chessRef.current, {
            draggable: !mobileMode,
            position: game.fen(),
            onDragStart, onDrop, onMouseoverSquare, onMouseoutSquare, onSnapEnd,
            pieceTheme: (p) => pieceImages[p],
            snapbackSpeed: 500, snapSpeed: 100,
        });
        return () => { boardRef.current?.destroy(); boardRef.current = null; };
    }, [mobileMode, promotionPiece, updateStatus, analyzePosition]);

    const handleNewGame = () => {
        gameRef.current.reset();
        boardRef.current?.start();
        setMoves([]); setCurrentStatus("White to move"); setCurrentAnalysis(null);
        previousEvalRef.current = 0; removeGreySquares();
        setTimeout(() => analyzePosition(), 500);
    };

    // ── PGN import handlers ────────────────────────────────────────────────────
    const handleLoadPGN = useCallback(() => {
        setPgnError("");
        const testGame = new Chess();
        try { testGame.loadPgn(pgnInputText); }
        catch {
            try {
                const clean = pgnInputText
                    .replace(/\[.*?\]/g, "").replace(/\{.*?\}/g, "")
                    .replace(/\(.*?\)/g, "").replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/, "").trim();
                testGame.loadPgn(clean);
            } catch { setPgnError("Invalid PGN. Please check the format and try again."); return; }
        }
        const history = testGame.history({ verbose: true });
        if (!history.length) { setPgnError("No valid moves found in the PGN."); return; }
        setPgnMoves(history); setPgnMoveIndex(-1); setPgnImportMode(true);
        pgnGameRef.current = new Chess();
        gameRef.current.reset(); boardRef.current?.start();
        setMoves([]); setCurrentStatus("PGN loaded — use arrows to navigate");
        setCurrentAnalysis(null); previousEvalRef.current = 0; removeGreySquares();
        setTimeout(() => analyzePosition(), 500);
    }, [pgnInputText, analyzePosition]);

    const jumpToIndex = useCallback((idx, allMoves) => {
        const freshGame = new Chess();
        const newMoves = [];
        for (let i = 0; i <= idx; i++) {
            const m = allMoves[i];
            freshGame.move({ from: m.from, to: m.to, promotion: m.promotion || "q" });
            newMoves.push({ from: m.from, to: m.to });
        }
        gameRef.current.load(freshGame.fen());
        pgnGameRef.current = freshGame;
        boardRef.current?.position(freshGame.fen());
        setPgnMoveIndex(idx); setMoves(newMoves);
        const mc = freshGame.turn() === "w" ? "White" : "Black";
        let s = `Move ${idx + 1}/${allMoves.length} — ${mc} to move`;
        if (freshGame.isCheckmate()) s = `Move ${idx + 1}/${allMoves.length} — Checkmate!`;
        else if (freshGame.inCheck()) s += " (Check)";
        setCurrentStatus(s);
        previousEvalRef.current = 0;
        setTimeout(() => analyzePosition(), 300);
    }, [analyzePosition]);

    const handlePgnStepForward = useCallback(() => {
        if (!pgnImportMode || pgnMoveIndex >= pgnMoves.length - 1) return;
        const nextIdx = pgnMoveIndex + 1;
        const move = pgnMoves[nextIdx];
        const result = gameRef.current.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
        pgnGameRef.current.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
        if (!result) return;
        boardRef.current?.position(gameRef.current.fen());
        setPgnMoveIndex(nextIdx);
        setMoves(prev => [...prev, { from: result.from, to: result.to }]);
        result.captured ? captureSound.play() : moveSound.play();
        const mc = gameRef.current.turn() === "w" ? "White" : "Black";
        let s = `Move ${nextIdx + 1}/${pgnMoves.length} — ${mc} to move`;
        if (gameRef.current.isCheckmate()) s = `Move ${nextIdx + 1}/${pgnMoves.length} — Checkmate!`;
        else if (gameRef.current.inCheck()) s += " (Check)";
        else if (gameRef.current.isDraw()) s = `Move ${nextIdx + 1}/${pgnMoves.length} — Draw`;
        setCurrentStatus(s);
        previousEvalRef.current = 0; setTimeout(() => analyzePosition(), 300);
    }, [pgnImportMode, pgnMoveIndex, pgnMoves, analyzePosition]);

    const handlePgnStepBackward = useCallback(() => {
        if (!pgnImportMode || pgnMoveIndex < 0) return;
        const targetIdx = pgnMoveIndex - 1;
        if (targetIdx < 0) {
            gameRef.current.reset(); pgnGameRef.current = new Chess();
            boardRef.current?.start(); setPgnMoveIndex(-1); setMoves([]);
            setCurrentStatus("PGN loaded — Starting position");
        } else {
            jumpToIndex(targetIdx, pgnMoves);
        }
        moveSound.play();
        previousEvalRef.current = 0; setTimeout(() => analyzePosition(), 300);
    }, [pgnImportMode, pgnMoveIndex, pgnMoves, jumpToIndex, analyzePosition]);

    const handlePgnGoToStart = useCallback(() => {
        if (!pgnImportMode) return;
        gameRef.current.reset(); pgnGameRef.current = new Chess();
        boardRef.current?.start(); setPgnMoveIndex(-1); setMoves([]);
        setCurrentStatus("PGN loaded — Starting position"); setCurrentAnalysis(null);
        previousEvalRef.current = 0; setTimeout(() => analyzePosition(), 300);
    }, [pgnImportMode, analyzePosition]);

    const handlePgnGoToEnd = useCallback(() => {
        if (!pgnImportMode || !pgnMoves.length) return;
        jumpToIndex(pgnMoves.length - 1, pgnMoves);
    }, [pgnImportMode, pgnMoves, jumpToIndex]);

    const handleExitPgnMode = useCallback(() => {
        setPgnImportMode(false); setPgnMoves([]); setPgnMoveIndex(-1);
        setPgnInputText(""); setPgnError("");
        gameRef.current.reset(); pgnGameRef.current = new Chess();
        boardRef.current?.start(); setMoves([]);
        setCurrentStatus("White to move"); setCurrentAnalysis(null);
        previousEvalRef.current = 0;
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!pgnImportMode) return;
        const onKey = (e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); handlePgnStepForward(); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); handlePgnStepBackward(); }
            else if (e.key === "Home") { e.preventDefault(); handlePgnGoToStart(); }
            else if (e.key === "End") { e.preventDefault(); handlePgnGoToEnd(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pgnImportMode, handlePgnStepForward, handlePgnStepBackward, handlePgnGoToStart, handlePgnGoToEnd]);

    const boardSize = window.innerWidth > 1028 ? "34vw" : "90vw";

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="lg:mt-0 mt-16 flex lg:h-screen min-h-screen w-screen lg:overflow-hidden"
            style={{ backgroundImage: `url(${boardbg})`, backgroundSize: "cover" }}
        >
            <div className="w-full flex flex-col lg:flex-row mx-auto">

                {/* ── LEFT: Board + Eval bar ── */}
                <div className="lg:mx-16 w-full mx-auto lg:w-1/2 flex flex-col items-center justify-center px-2 py-4 mt-16 lg:mt-6 lg:overflow-hidden lg:h-screen">
                    <div className="relative flex items-center">
                        {/* Eval bar */}
                        <div className="relative bg-gray-800 rounded-l shadow-2xl mr-1" style={{ width: "14px", height: boardSize }}>
                            <div className="absolute top-0 left-0 right-0 bg-gray-900 transition-all duration-500 ease-in-out"
                                style={{ height: `${100 - getEvalBarHeight()}%` }} />
                            <div className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-500 ease-in-out"
                                style={{ height: `${getEvalBarHeight()}%` }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-gray-700 bg-opacity-95 px-1 py-3 rounded text-white font-bold transform -rotate-90 whitespace-nowrap" style={{ fontSize: "11px" }}>
                                    {currentAnalysis ? currentAnalysis.evalText : "0.0"}
                                </div>
                            </div>
                        </div>
                        <div ref={chessRef} style={{ width: boardSize }} />
                    </div>

                    {/* PGN nav controls below board when in pgn mode */}
                    {pgnImportMode && (
                        <div className="mt-3 flex items-center gap-2 w-full max-w-lg">
                            <button onClick={handlePgnGoToStart} disabled={pgnMoveIndex < 0}
                                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded-lg flex items-center justify-center text-lg transition-all">⏮</button>
                            <button onClick={handlePgnStepBackward} disabled={pgnMoveIndex < 0}
                                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-lg flex items-center justify-center gap-1 font-bold transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg> Back
                            </button>
                            <span className="text-white text-sm font-bold px-2">{pgnMoveIndex + 1}/{pgnMoves.length}</span>
                            <button onClick={handlePgnStepForward} disabled={pgnMoveIndex >= pgnMoves.length - 1}
                                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-lg flex items-center justify-center gap-1 font-bold transition-all">
                                Next <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <button onClick={handlePgnGoToEnd} disabled={pgnMoveIndex >= pgnMoves.length - 1}
                                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded-lg flex items-center justify-center text-lg transition-all">⏭</button>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:mx-4 w-full mx-2 lg:w-2/5 mt-8 lg:mt-16 lg:h-screen lg:overflow-y-auto lg:pb-8 scrollbar-hide">
                    <MobileToggle mobileMode={mobileMode} onChange={() => setMobileMode(!mobileMode)} className="mb-4 mt-16 lg:mt-0" />

                    {/* Status */}
                    <div className="mb-3 rounded-xl shadow-lg text-center p-4 text-lg lg:text-xl bg-gray-400 bg-opacity-30 text-white border border-gray-200">
                        {currentStatus}
                    </div>

                    {/* New Game */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <h3 className="text-white text-lg font-bold mb-2">🎮 Free Play</h3>
                        <p className="text-gray-300 text-xs mb-2">Play freely on the board. Stockfish analyzes every position automatically.</p>
                        <button onClick={handleNewGame}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transition-all">
                            🔄 Reset Board
                        </button>
                    </div>

                    {/* Analyze via PGN */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white text-lg font-bold">📥 Analyze via PGN</h3>
                            {pgnImportMode && (
                                <button onClick={handleExitPgnMode} className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
                                    ✕ Exit
                                </button>
                            )}
                        </div>

                        {!pgnImportMode ? (
                            <>
                                <input ref={pgnFileInputRef} type="file" accept=".pgn,text/plain" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => { setPgnInputText(ev.target?.result || ""); setPgnError(""); };
                                        reader.onerror = () => setPgnError("Could not read file.");
                                        reader.readAsText(file); e.target.value = "";
                                    }}
                                />
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gray-300 text-xs">Paste PGN or import a file:</span>
                                    <button onClick={() => pgnFileInputRef.current?.click()}
                                        className="ml-auto flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        Import .pgn File
                                    </button>
                                </div>
                                <textarea value={pgnInputText}
                                    onChange={(e) => { setPgnInputText(e.target.value); setPgnError(""); }}
                                    placeholder={`Paste PGN here...\n\ne.g.:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`}
                                    className="w-full bg-black bg-opacity-40 text-green-300 font-mono text-sm p-3 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none resize-y min-h-[90px] max-h-[180px] placeholder-gray-500"
                                    rows={4}
                                />
                                {pgnError && <div className="mt-1 text-red-400 text-xs">{pgnError}</div>}
                                <button onClick={handleLoadPGN} disabled={!pgnInputText.trim()}
                                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transition-all">
                                    📂 Load PGN & Analyze
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Clickable move list */}
                                <div className="bg-black bg-opacity-40 rounded-lg border border-gray-600 p-3 max-h-[150px] overflow-y-auto mb-2">
                                    <div className="flex flex-wrap gap-1">
                                        {pgnMoves.map((move, idx) => {
                                            const isWhite = idx % 2 === 0;
                                            const moveNum = Math.floor(idx / 2) + 1;
                                            return (
                                                <React.Fragment key={idx}>
                                                    {isWhite && <span className="text-gray-500 text-xs font-mono mr-0.5">{moveNum}.</span>}
                                                    <button
                                                        onClick={() => jumpToIndex(idx, pgnMoves)}
                                                        className={`text-xs font-mono px-1.5 py-0.5 rounded transition-all cursor-pointer ${idx === pgnMoveIndex ? "bg-blue-500 text-white shadow-lg scale-105"
                                                                : idx < pgnMoveIndex ? "text-gray-300 hover:bg-gray-700"
                                                                    : "text-gray-500 hover:bg-gray-700"
                                                            }`}
                                                    >{move.san}</button>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="text-gray-400 text-xs text-center">
                                    💡 Use <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 text-[10px]">←</kbd> <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 text-[10px]">→</kbd> arrow keys to navigate
                                </div>
                            </>
                        )}
                    </div>

                    {/* Analysis panel */}
                    <div className="mb-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                        <h3 className="text-white text-lg font-bold mb-2">🔍 Engine Analysis</h3>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-white text-sm">Analyzer Strength:</label>
                            {analyzerEngineLoaded
                                ? <span className="text-green-400 text-xs">● Ready (D{analyzerDepth})</span>
                                : <span className="text-blue-400 text-xs animate-pulse">⏳ Loading...</span>}
                        </div>
                        <select value={analyzerPresetId} onChange={(e) => handleAnalyzerPresetChange(e.target.value)}
                            className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-3 py-1.5 rounded-lg w-full text-sm mb-2">
                            {ALL_ENGINE_PRESETS.map(p => (
                                <option key={p.id} value={p.id} className="bg-blue-900 text-white">{p.name} (D{p.depth})</option>
                            ))}
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
                            <option value="q" className="bg-blue-900 text-white">♕ Queen</option>
                            <option value="r" className="bg-blue-900 text-white">♖ Rook</option>
                            <option value="b" className="bg-blue-900 text-white">♗ Bishop</option>
                            <option value="n" className="bg-blue-900 text-white">♘ Knight</option>
                        </select>
                    </div>

                    {/* Export PGN */}
                    <ExportPGN gameRef={gameRef} event="Analyze Game" white="Player 1" black="Player 2" />
                </div>
            </div>
        </div>
    );
};

export default AnalyzeGame;
