import React, { useState, useCallback } from "react";

const ExportPGN = ({ gameRef, event, white, black, site }) => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showPGNModal, setShowPGNModal] = useState(false);
    const [pgnText, setPgnText] = useState("");

    const generatePGN = useCallback(() => {
        const game = gameRef?.current || gameRef;
        if (!game) return "";

        // Build PGN header
        const headers = [];
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

        headers.push(`[Event "${event || "Casual Game"}"]`);
        headers.push(`[Site "${site || "ReactChess"}"]`);
        headers.push(`[Date "${dateStr}"]`);
        headers.push(`[White "${white || "Player 1"}"]`);
        headers.push(`[Black "${black || "Player 2"}"]`);

        // Determine result
        let result = "*"; // ongoing
        if (game.isCheckmate()) {
            result = game.turn() === "w" ? "0-1" : "1-0";
        } else if (game.isDraw()) {
            result = "1/2-1/2";
        } else if (game.isStalemate()) {
            result = "1/2-1/2";
        }
        headers.push(`[Result "${result}"]`);

        // Get moves from chess.js pgn
        const rawPgn = game.pgn({ newline: "\n" });

        // Combine headers with moves
        const fullPgn = headers.join("\n") + "\n\n" + rawPgn + (rawPgn ? " " + result : result);

        return fullPgn;
    }, [gameRef, event, white, black, site]);

    const handleCopyPGN = useCallback(() => {
        const pgn = generatePGN();
        if (!pgn || pgn.trim() === "") {
            setToastMessage("No moves to export!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
            return;
        }

        navigator.clipboard
            .writeText(pgn)
            .then(() => {
                setToastMessage("✅ PGN copied to clipboard!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2500);
            })
            .catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement("textarea");
                textarea.value = pgn;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                setToastMessage("✅ PGN copied to clipboard!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2500);
            });
    }, [generatePGN]);

    const handleDownloadPGN = useCallback(() => {
        const pgn = generatePGN();
        if (!pgn || pgn.trim() === "") {
            setToastMessage("No moves to export!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
            return;
        }

        const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
        link.href = url;
        link.download = `chess_game_${timestamp}.pgn`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToastMessage("📥 PGN file downloaded!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    }, [generatePGN]);

    const handleViewPGN = useCallback(() => {
        const pgn = generatePGN();
        setPgnText(pgn);
        setShowPGNModal(true);
    }, [generatePGN]);

    return (
        <>
            {/* Export PGN Button Group */}
            <div className="mt-3 p-3 rounded-xl shadow-lg bg-gray-400 bg-opacity-30 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-base font-bold">📄 Export PGN</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyPGN}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        title="Copy PGN to clipboard"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        Copy
                    </button>
                    <button
                        onClick={handleDownloadPGN}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        title="Download PGN file"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download
                    </button>
                    <button
                        onClick={handleViewPGN}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        title="View PGN text"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        View
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce"
                    style={{ animation: "slideUp 0.3s ease-out" }}
                >
                    <div className="bg-gray-900 bg-opacity-95 text-white px-6 py-3 rounded-xl shadow-2xl border border-gray-600 text-sm font-medium backdrop-blur-sm">
                        {toastMessage}
                    </div>
                </div>
            )}

            {/* PGN View Modal */}
            {showPGNModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
                    onClick={() => setShowPGNModal(false)}
                >
                    <div
                        className="bg-gray-900 bg-opacity-95 rounded-2xl shadow-2xl border border-gray-600 p-6 mx-4 max-w-lg w-full max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-lg font-bold">📄 PGN Notation</h3>
                            <button
                                onClick={() => setShowPGNModal(false)}
                                className="text-gray-400 hover:text-white text-2xl font-bold leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4">
                            <pre className="bg-black bg-opacity-50 text-green-300 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap break-words border border-gray-700 min-h-[120px]">
                                {pgnText || "No moves yet."}
                            </pre>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(pgnText).then(() => {
                                        setToastMessage("✅ PGN copied to clipboard!");
                                        setShowToast(true);
                                        setTimeout(() => setShowToast(false), 2500);
                                    });
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={() => setShowPGNModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExportPGN;
