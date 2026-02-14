import React, { useEffect, useRef, useState } from "react";

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

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const LocalMultiplayer = () => {
  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const gameRef = useRef(new Chess());
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [promotionPiece, setPromotionPiece] = useState("q");
  const [mobileMode, setMobileMode] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  
  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
    setSelectedSquare(null);
    removeGreySquares();
  };

  // Helper functions defined outside useEffect
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

  const highlightSquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    if (squareEl) {
      squareEl.style.background = "#ffff00"; // Yellow for selected piece
    }
  };
  
  useEffect(() => {
    const game = gameRef.current;

    const onDragStart = (source, piece, position, orientation) => {
      // Disable drag in mobile mode
      if (mobileMode) return false;

      if (game.isGameOver()) {
        console.log("Start a new game from the menu");
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
    };

    const onMouseoverSquare = (square, piece) => {
      // Skip hover highlighting in mobile mode
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

    const updateStatus = debounce(() => {
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

    boardRef.current = Chessboard(chessRef.current, config);

    return () => {
      if (boardRef.current) {
        boardRef.current.destroy();
      }
    };
  }, [promotionPiece, mobileMode]);

  // Handle touch/click on squares for mobile mode
  useEffect(() => {
    console.log("Touch handler effect running. Mobile mode:", mobileMode, "Board ref exists:", !!boardRef.current);
    
    if (!mobileMode || !chessRef.current) return;

    // Wait a bit to ensure the board is fully rendered
    const timer = setTimeout(() => {
      if (!boardRef.current) {
        console.log("Board still not ready");
        return;
      }

      const handleSquareClick = (e) => {
        console.log("=== CLICK DETECTED ===");
        const game = gameRef.current;
        if (!game) {
          console.log("Game not initialized");
          return;
        }
        
        if (game.isGameOver()) {
          console.log("Game is over");
          return;
        }

        // Find the clicked square element
        let squareEl = e.target;
        
        // Traverse up to find the square div
        let attempts = 0;
        while (squareEl && !squareEl.classList.contains("square-55d63")) {
          squareEl = squareEl.parentElement;
          attempts++;
          if (attempts > 10 || squareEl === chessRef.current || !squareEl) {
            return;
          }
        }

        if (!squareEl) return;

        // Extract square name from class
        const classList = Array.from(squareEl.classList);
        const squareClass = classList.find((cls) => {
          const match = cls.match(/^square-([a-h][1-8])$/);
          return match !== null;
        });
        
        if (!squareClass) return;

        const clickedSquare = squareClass.replace("square-", "");
        console.log("Clicked square:", clickedSquare);

        // Get the piece on the clicked square
        const position = boardRef.current.position();
        const piece = position[clickedSquare];

        if (!selectedSquare) {
          // No piece selected yet
          if (!piece) return;

          // Check if it's the correct color's turn
          if (
            (game.turn() === "w" && piece.search(/^b/) !== -1) ||
            (game.turn() === "b" && piece.search(/^w/) !== -1)
          ) {
            return;
          }

          // Get legal moves for this piece
          const legalMoves = game.moves({
            square: clickedSquare,
            verbose: true,
          });

          if (legalMoves.length === 0) return;

          // Select this square
          setSelectedSquare(clickedSquare);
          removeGreySquares();
          highlightSquare(clickedSquare);

          // Highlight legal move destinations
          legalMoves.forEach((move) => {
            greySquare(move.to);
          });
        } else {
          // A piece is already selected
          if (clickedSquare === selectedSquare) {
            // Clicked the same square - deselect
            setSelectedSquare(null);
            removeGreySquares();
            return;
          }

          // Check if clicking on another piece of the same color (reselect)
          if (piece) {
            const selectedPiece = position[selectedSquare];
            if (
              (selectedPiece[0] === "w" && piece[0] === "w") ||
              (selectedPiece[0] === "b" && piece[0] === "b")
            ) {
              // Reselect the new piece
              const legalMoves = game.moves({
                square: clickedSquare,
                verbose: true,
              });

              if (legalMoves.length > 0) {
                setSelectedSquare(clickedSquare);
                removeGreySquares();
                highlightSquare(clickedSquare);
                legalMoves.forEach((move) => {
                  greySquare(move.to);
                });
              }
              return;
            }
          }

          // Try to make the move
          try {
            const move = game.move({
              from: selectedSquare,
              to: clickedSquare,
              promotion: promotionPiece,
            });

            if (move) {
              // Move successful
              boardRef.current.position(game.fen());

              // Play sound based on move type
              if (move.captured) {
                captureSound.play();
              } else {
                moveSound.play();
              }

              // Update moves state
              setMoves((prevMoves) => [
                ...prevMoves,
                { from: move.from, to: move.to },
              ]);

              // Clear selection and highlights
              setSelectedSquare(null);
              removeGreySquares();

              // Update status
              let status = "";
              let moveColor = game.turn() === "w" ? "White" : "Black";

              if (game.isCheckmate()) {
                status = "Game over, " + moveColor + " is in checkmate.";
                checkmateSound.play();
              } else if (game.inCheck()) {
                status = moveColor + " to move, " + moveColor + " is in check";
                checkSound.play();
              } else {
                status = moveColor + " to move";
              }
              setCurrentStatus(status);
            } else {
              // Illegal move - clear selection
              setSelectedSquare(null);
              removeGreySquares();
            }
          } catch (error) {
            console.log("Move error:", error);
            setSelectedSquare(null);
            removeGreySquares();
          }
        }
      };

      const boardElement = chessRef.current;
      boardElement.addEventListener("click", handleSquareClick, true);

      return () => {
        boardElement.removeEventListener("click", handleSquareClick, true);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [mobileMode, selectedSquare, promotionPiece]);

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  return (
    <div
      className="lg:mt-0 mt-16 flex h-fit pt-20 items-center justify-center w-screen"
      style={{ backgroundImage: `url(${boardbg})`, backgroundSize: "cover" }}
    >
      <div className="w-screen flex flex-col lg:flex-row lg:flex-row mx-auto my-auto">
        <div className="lg:mx-16 w-full mx-auto lg:w-1/2">
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
              <div className="rounded-xl shadow-lg text-center p-8 px-16 lg:w-full text-xl lg:text-2xl lg:text-3xl xl:text-4xl bg-gray-400 bg-opacity-30 text-white border border-gray-200 flex-shrink-0">
                Current Status: {currentStatus ? currentStatus : "White to move"}
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
                If the game goes to start after promotion piece change, just
                attempt an illegal move, it will get OK so relax
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalMultiplayer;