import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import PuzzleService from "../../services/puzzleService";
import axios from "axios";
import boardbg from "../../assets/images/bgboard.jpeg";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import moveSoundFile from "../../assets/sounds/move.mp3";
import pieceImages from "../pieceImages";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Initialize sound effects
const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

const Puzzle = () => {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const gameRef = useRef(null);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);
  const [promotionPiece, setPromotionPiece] = useState("q");
  const [mobileMode, setMobileMode] = useState(false);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);

  // Fetch puzzle data from API
  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        const response = await PuzzleService.getPuzzleById(puzzleId);
        
        if (response.success) {
          setPuzzle(response.puzzle);
          gameRef.current = new Chess(response.puzzle.fen);
        } else {
          setError('Puzzle not found');
          setTimeout(() => navigate("/puzzle"), 2000);
        }
      } catch (err) {
        console.error('Error fetching puzzle:', err);
        setError('Failed to load puzzle');
        setTimeout(() => navigate("/puzzle"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [puzzleId, navigate]);


  
  const fetchBestMove = async (FEN) => {
    try {
      const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/stockfish`,
          {
            params: {
              fen: FEN,
              depth: 10,
            },
          }
        );
      console.log("Response from server:", response.data);
      return response.data.bestMove;
    } catch (error) {
      console.error("Error fetching move from stockfish:", error);
      return null;
    }
  };

  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
  };

  const recordPuzzleAttempt = async (success) => {
    if (puzzleCompleted) return; // Only record once
    
    try {
      await PuzzleService.recordAttempt(puzzleId, success);
      setPuzzleCompleted(true);
    } catch (error) {
      console.error('Error recording puzzle attempt:', error);
    }
  };

  useEffect(() => {
    if (!puzzle || !puzzle.fen) return;

    const game = gameRef.current;

    const onDragStart = (source, piece, position, orientation) => {
      if (game.isGameOver()) {
        console.log("Start a new game from the menu");
        return false;
      }

      if (game.turn() === "b") {
        console.log("It's not White's turn");
        return false;
      }

      if (
        (game.turn() === "w" && piece.search(/^b/) !== -1) ||
        (game.turn() === "b" && piece.search(/^w/) !== -1)
      ) {
        return false;
      }
    };

    const onDrop = async (source, target) => {
      removeGreySquares();

      let move = game.move({
        from: source,
        to: target,
        promotion: promotionPiece,
      });

      if (move === null) return "snapback";

      setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
      updateStatus();

      // Play sound based on move type
      if (move.captured) {
        captureSound.play();
      } else {
        moveSound.play();
      }

      // Check if puzzle is solved (game over and white wins or checkmate)
      if (game.isGameOver()) {
        if (game.isCheckmate() && game.turn() === 'b') {
          // White delivered checkmate - puzzle solved!
          recordPuzzleAttempt(true);
        }
      }

      if (game.turn() === "b") {
        try {
          const fen = game.fen();
          console.log(fen);

          const bestMoveResponse = await fetchBestMove(fen);

          if (bestMoveResponse) {
            console.log(bestMoveResponse);
            const bestMove = bestMoveResponse.split(" ")[1].trim();

            move = game.move({
              from: bestMove.slice(0, 2),
              to: bestMove.slice(2, 4),
              promotion: promotionPiece,
            });

            if (move !== null) {
              setMoves((prevMoves) => [
                ...prevMoves,
                { from: move.from, to: move.to },
              ]);
              boardRef.current.position(game.fen());
              updateStatus();

              // Play sound based on move type
              if (move.captured) {
                captureSound.play();
              } else {
                moveSound.play();
              }
            }
          }
        } catch (error) {
          console.error("Error fetching move from stockfish:", error);
        }
      }
    };

    const onMouseoverSquare = (square, piece) => {
      const moves = game.moves({
        square: square,
        verbose: true,
      });

      if (moves.length === 0) return;

      greySquare(square);

      for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
      }
    };

    const onMouseoutSquare = (square, piece) => {
      removeGreySquares();
    };

    const onSnapEnd = () => {
      boardRef.current.position(game.fen());
    };

    const updateStatus = debounce(() => {
      let status = "";
      let moveColor = "White";

      if (game.turn() === "b") {
        moveColor = "Black";
      }

      if (game.isGameOver()) {
        status = "Game over";
        checkmateSound.play();
      } else {
        status = moveColor + " to move";

        if (game.isCheckmate()) {
          status += ", " + moveColor + " is in check";
          checkSound.play();
        }
      }

      setCurrentStatus(status);
    }, 100);

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

    const config = {
      draggable: true,
      position: puzzle.fen,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onMouseoverSquare: onMouseoverSquare,
      onMouseoutSquare: onMouseoutSquare,
      onSnapEnd: onSnapEnd,
      pieceTheme: (piece) => pieceImages[piece],
      snapbackSpeed: 500,
      snapSpeed: 100,
    };

    boardRef.current = Chessboard(chessRef.current, config);

    return () => {
      if (boardRef.current) {
        boardRef.current.destroy();
      }
    };
  }, [puzzle, promotionPiece]);

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const toggleSolution = () => {
    setIsSolutionCollapsed(!isSolutionCollapsed);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white text-2xl">Loading puzzle...</div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500 text-2xl">{error || 'Puzzle not found'}</div>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col items-center min-h-screen"
      style={{
        backgroundImage: `url(${boardbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {!mobileMode && (
        <>
          <h1 className="text-3xl font-bold mt-16 lg:mt-4 z-10 text-white drop-shadow-lg">
            {puzzle.name}
          </h1>
          <div className="w-[80%] p-4 text-lg text-white">
            <p className="drop-shadow-md">{puzzle.description}</p>
            {puzzle.composer && (
              <p className="mt-2 text-gray-200 drop-shadow-md">
                <span className="font-semibold">Composer:</span> {puzzle.composer}
                {puzzle.year && ` (${puzzle.year})`}
              </p>
            )}
            {puzzle.attempts > 0 && (
              <p className="mt-2 text-gray-300 text-sm drop-shadow-md">
                Attempted {puzzle.attempts} times • {puzzle.successRate.toFixed(1)}% success rate
              </p>
            )}
          </div>
        </>
      )}

      <div className="w-screen flex lg:flex-row flex-col mx-auto my-auto">
        <div className="lg:mx-16 w-full lg:w-1/2">
          <div
            ref={chessRef}
            style={{ width: window.innerWidth > 1028 ? "40vw" : "100vw" }}
          ></div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={mobileMode}
                onChange={handleCheckboxChange}
              />
              Mobile Mode
            </label>
          </div>
        </div>

        {!mobileMode && (
          <div className="lg:mx-4 w-fit mx-2 lg:w-1/3 mt-4 lg:mt-0">
            <div className="rounded-xl shadow-lg text-center p-6 px-12 lg:w-full text-xl lg:text-2xl bg-gray-400 bg-opacity-30 text-white border border-gray-200 flex-shrink-0">
              Current Status: {currentStatus ? currentStatus : "White to move"}
            </div>
            
            {puzzleCompleted && (
              <div className="mt-4 p-4 bg-green-600 bg-opacity-80 text-white rounded-lg text-center border border-green-400 shadow-lg">
                🎉 Puzzle Solved! Great job!
              </div>
            )}

            <div className="mt-4">
              <label className="mr-2 text-white text-lg lg:text-xl">
                Promotion Piece:
              </label>
              <select
                value={promotionPiece}
                onChange={handlePromotionChange}
                className="bg-gray-400 bg-opacity-30 text-white px-4 py-2 rounded-lg w-full text-base lg:text-lg border border-gray-200"
              >
                <option
                  className="bg-blue-900 bg-opacity-50 bg-transparent text-white"
                  value="q"
                >
                  Queen
                </option>
                <option
                  className="bg-blue-900 bg-opacity-50 bg-transparent text-white"
                  value="r"
                >
                  Rook
                </option>
                <option
                  className="bg-blue-900 bg-opacity-50 bg-transparent text-white"
                  value="b"
                >
                  Bishop
                </option>
                <option
                  className="bg-blue-900 bg-opacity-50 bg-transparent text-white"
                  value="n"
                >
                  Knight
                </option>
              </select>
            </div>

            <div className="mx-2 mt-3 text-center border border-gray-800 text-base lg:text-lg text-white bg-black bg-opacity-20 p-4 rounded-lg">
              If board position changes to original after promotion, just
              attempt an illegal move
            </div>

            <button
              onClick={toggleTable}
              className="mt-4 bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-4 py-2 rounded-lg w-full text-base lg:text-lg"
            >
              {isTableCollapsed ? "Show Moves" : "Hide Moves"}
            </button>
            <div
              style={{
                maxHeight: isTableCollapsed ? "0" : "40vh",
                transition: "max-height 0.3s ease-in-out",
                overflow: "scroll",
              }}
            >
              <div style={{ height: "100%", overflowY: "auto" }}>
                <table className="w-full border-collapse border border-gray-700 rounded-lg bg-gray-400 bg-opacity-30 text-white">
                  <thead>
                    <tr className="bg-gray-800 bg-opacity-30 text-center text-white">
                      <th className="border border-gray-400 px-6 py-3 text-base lg:text-lg">
                        Move
                      </th>
                      <th className="border border-gray-400 px-6 py-3 text-base lg:text-lg">
                        From
                      </th>
                      <th className="border border-gray-400 px-6 py-3 text-base lg:text-lg">
                        To
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.map((move, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-gray-700 bg-opacity-30 text-white text-center"
                            : "bg-gray-600 bg-opacity-30 text-gray-200 text-center"
                        }
                      >
                        <td className="border border-gray-400 px-6 py-4 text-base lg:text-lg">
                          {index + 1}
                        </td>
                        <td className="border border-gray-400 px-6 py-4 text-base lg:text-lg">
                          {move.from}
                        </td>
                        <td className="border border-gray-400 px-6 py-4 text-base lg:text-lg">
                          {move.to}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <button
              onClick={toggleSolution}
              className="mt-4 bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-4 py-2 rounded-lg w-full text-base lg:text-lg"
            >
              {isSolutionCollapsed ? "Hide Solution" : "Show Solution"}
            </button>
            {isSolutionCollapsed && (
              <>
                {puzzle.solutionType === "video" && puzzle.videoUrl ? (
                  <iframe
                    width="100%"
                    height="360"
                    src={puzzle.videoUrl}
                    title={puzzle.videoTitle || "Puzzle Solution"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="mt-4 mx-auto rounded-lg border border-gray-200"
                  ></iframe>
                ) : puzzle.solutionType === "text" && puzzle.solution ? (
                  <div className="text-base lg:text-lg mt-4 text-center text-white bg-gray-400 bg-opacity-30 p-4 rounded-lg border border-gray-200">
                    {puzzle.solution}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Puzzle;