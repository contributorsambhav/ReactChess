import React, { useEffect, useRef, useState } from "react";

import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import MobileToggle from "../MobileToggle";
import axios from "axios";
import bg from "../../assets/images/bgprofile.jpg";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import moveSoundFile from "../../assets/sounds/move.mp3";
import pieceImages from "../pieceImages";

const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const AgainstStockfish = () => {
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

  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const gameRef = useRef(new Chess());
  const [isTableCollapsed, setIsTableCollapsed] = useState(true);
  const [promotionPiece, setPromotionPiece] = useState("q");
  const [mobileMode, setMobileMode] = useState(false);
  
  // State for touch/click mode
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
  };

  // Function to handle square clicks in mobile mode
  const handleSquareClick = async (square) => {
    if (!mobileMode) return;
    
    const game = gameRef.current;
    
    if (game.isGameOver() || isThinking) {
      console.log("Game over or computer is thinking");
      return;
    }
    
    if (game.turn() === "b") {
      console.log("It's not White's turn");
      return;
    }

    if (!selectedSquare) {
      // First click - select piece
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
        // Highlight square
        const squareEl = document.querySelector(`.square-${square}`);
        if (squareEl) {
          squareEl.style.boxShadow = "inset 0 0 0 4px #22c55e";
        }
        
        // Highlight possible moves
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(move => {
          const targetEl = document.querySelector(`.square-${move.to}`);
          if (targetEl) {
            const isBlack = targetEl.classList.contains("black-3c85d");
            targetEl.style.background = isBlack ? "#696969" : "#a9a9a9";
          }
        });
      }
    } else {
      // Second click - check if clicking same square to deselect
      if (square === selectedSquare) {
        removeGreySquares();
        setSelectedSquare(null);
        return;
      }

      // Try to make the move
      let move = game.move({
        from: selectedSquare,
        to: square,
        promotion: promotionPiece,
      });

      if (move === null) {
        // Invalid move - check if clicking another white piece to select it
        const piece = game.get(square);
        if (piece && piece.color === 'w') {
          // Clear previous highlights
          removeGreySquares();
          
          // Select new piece
          setSelectedSquare(square);
          const squareEl = document.querySelector(`.square-${square}`);
          if (squareEl) {
            squareEl.style.boxShadow = "inset 0 0 0 4px #22c55e";
          }
          
          // Highlight new piece's possible moves
          const moves = game.moves({ square: square, verbose: true });
          moves.forEach(m => {
            const targetEl = document.querySelector(`.square-${m.to}`);
            if (targetEl) {
              const isBlack = targetEl.classList.contains("black-3c85d");
              targetEl.style.background = isBlack ? "#696969" : "#a9a9a9";
            }
          });
        } else {
          // Clicked empty square or black piece - just deselect
          removeGreySquares();
          setSelectedSquare(null);
        }
        return;
      }

      // Valid move made - clear highlights and update game
      removeGreySquares();
      setSelectedSquare(null);
      setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
      boardRef.current.position(game.fen());
      updateStatus();

      // Play sound based on move type
      if (move.captured) {
        captureSound.play();
      } else {
        moveSound.play();
      }

      // Stockfish's turn
      if (game.turn() === "b" && !game.isGameOver()) {
        setIsThinking(true);
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
              promotion: bestMove[4] || promotionPiece,
            });

            if (move !== null) {
              setMoves((prevMoves) => [
                ...prevMoves,
                { from: move.from, to: move.to },
              ]);
              boardRef.current.position(game.fen());
              updateStatus();
              
              if (move.captured) {
                captureSound.play();
              } else {
                moveSound.play();
              }
            }
          }
        } catch (error) {
          console.error("Error fetching move from stockfish:", error);
        } finally {
          setIsThinking(false);
        }
      }
    }
  };

  const removeGreySquares = () => {
    const squares = document.querySelectorAll(".square-55d63");
    squares.forEach((square) => {
      square.style.background = "";
      square.style.boxShadow = "";
    });
  };

  const greySquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    if (squareEl) {
      const isBlack = squareEl.classList.contains("black-3c85d");
      squareEl.style.background = isBlack ? "#696969" : "#a9a9a9";
    }
  };

  const updateStatus = debounce(() => {
    const game = gameRef.current;
    let status = "";
    let moveColor = "White";

    if (game.turn() === "b") {
      moveColor = "Black";
    }

    if (game.isGameOver()) {
      status = "Game over";
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
  }, 100);

  useEffect(() => {
    const game = gameRef.current;

    const onDragStart = (source, piece, position, orientation) => {
      // Disable drag in mobile mode
      if (mobileMode) return false;
      
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
      // Only allow drag in non-mobile mode
      if (mobileMode) return "snapback";
      
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

      if (game.turn() === "b") {
        setIsThinking(true);
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
              promotion: bestMove[4] || promotionPiece,
            });

            if (move !== null) {
              setMoves((prevMoves) => [
                ...prevMoves,
                { from: move.from, to: move.to },
              ]);
              boardRef.current.position(game.fen());
              updateStatus();
            }
          }
        } catch (error) {
          console.error("Error fetching move from stockfish:", error);
        } finally {
          setIsThinking(false);
        }
      }
    };

    const onMouseoverSquare = (square, piece) => {
      // Disable hover in mobile mode
      if (mobileMode) return;
      
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
      if (mobileMode) return;
      removeGreySquares();
    };

    const onSnapEnd = () => {
      boardRef.current.position(game.fen());
    };

    const config = {
      draggable: !mobileMode,
      position: "start",
      onDragStart: onDragStart,
      onDrop: onDrop,
      onMouseoverSquare: onMouseoverSquare,
      onMouseoutSquare: onMouseoutSquare,
      onSnapEnd: onSnapEnd,
      pieceTheme: (piece) => pieceImages[piece],
      snapbackSpeed: 500,
      snapSpeed: 100,
    };

    // Only create board if it doesn't exist
    if (!boardRef.current) {
      boardRef.current = Chessboard(chessRef.current, config);
    } else {
      // Update config without recreating board
      boardRef.current.destroy();
      boardRef.current = Chessboard(chessRef.current, config);
    }

    // Add click listeners for mobile mode
    const addMobileListeners = () => {
      const squares = document.querySelectorAll(".square-55d63");
      squares.forEach((square) => {
        const squareId = square.getAttribute("data-square");
        if (squareId) {
          const clickHandler = () => {
            console.log("Clicked:", squareId);
            handleSquareClick(squareId);
          };
          const touchHandler = (e) => {
            e.preventDefault();
            console.log("Touched:", squareId);
            handleSquareClick(squareId);
          };
          
          square.addEventListener("click", clickHandler, true);
          square.addEventListener("touchend", touchHandler, { passive: false });
          
          // Store handlers for cleanup
          square._clickHandler = clickHandler;
          square._touchHandler = touchHandler;
        }
      });
    };

    if (mobileMode) {
      setTimeout(addMobileListeners, 100);
    }

    return () => {
      // Cleanup event listeners
      const squares = document.querySelectorAll(".square-55d63");
      squares.forEach((square) => {
        if (square._clickHandler) {
          square.removeEventListener("click", square._clickHandler, true);
          square.removeEventListener("touchend", square._touchHandler);
        }
      });
    };
  }, [promotionPiece, mobileMode]);

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  return (
    <div
      className="w-full flex flex-col items-center min-h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="w-screen mt-32 flex lg:flex-row flex-col mx-auto my-auto">
        <div className="lg:mx-16 w-full lg:w-1/2">
          <div
            ref={chessRef}
            style={{ width: window.innerWidth > 1028 ? "40vw" : "100vw" }}
          ></div>
        </div>

        <div className="lg:mx-4 w-fit mx-2 lg:w-1/3 mt-4 lg:mt-0">
          <MobileToggle 
            mobileMode={mobileMode} 
            onChange={handleCheckboxChange}
            className="mb-4"
          />
          
          {!mobileMode && (
            <>
              <div className="rounded-xl shadow-lg text-center p-6 px-12 lg:w-full text-xl lg:text-2xl bg-gray-400 bg-opacity-30 text-white border border-gray-200 flex-shrink-0">
                Current Status: {currentStatus ? currentStatus : "White to move"}
                {/* Show thinking indicator */}
                {isThinking && (
                  <div className="mt-2 text-sm animate-pulse">
                    Stockfish is thinking...
                  </div>
                )}
                {/* Show selected square in mobile mode */}
                {mobileMode && selectedSquare && (
                  <div className="mt-2 text-sm bg-green-600 rounded px-3 py-1 inline-block">
                    Selected: {selectedSquare.toUpperCase()}
                  </div>
                )}
              </div>

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

              {/* Mobile mode instructions */}
              {mobileMode && (
                <div className="mx-2 mt-3 text-center text-sm text-blue-300 bg-blue-900 bg-opacity-30 border border-blue-700 p-3 rounded-lg">
                  Tap a piece to select it, then tap the destination square to move.
                </div>
              )}

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

              <div className="mt-4 text-white text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-4 py-2 rounded-lg w-full text-base lg:text-lg hover:bg-opacity-40 transition-all"
                >
                  Restart Game
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgainstStockfish;