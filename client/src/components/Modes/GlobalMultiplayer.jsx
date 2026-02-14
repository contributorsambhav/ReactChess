import React, { useEffect, useRef, useState } from "react";

import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import MobileToggle from "../MobileToggle";
import WaitQueue from "../WaitQueue";
import axios from "axios";
import boardbg from "../../assets/images/bgboard.jpeg";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import moveSoundFile from "../../assets/sounds/move.mp3";
import pieceImages from "../pieceImages";
import socketIOClient from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Initialize sound effects
const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

const GlobalMultiplayer = () => {
  const addMatchToHistory = async (userId, opponentName, status) => {
    try {
      console.log("Sending data:", { userId, opponentName, status });
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/user/${userId}/match-history`,
        {
          opponent: opponentName,
          status,
        }
      );
      console.log("Match history added:", response.data);
    } catch (error) {
      console.error(
        "Error adding match to history:",
        error.response?.data || error.message
      );
    }
  };

  const user = useSelector((state) => state.auth.userData);
  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [gameCreated, setGameCreated] = useState(false);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [promotionPiece, setPromotionPiece] = useState("q");
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [mobileMode, setMobileMode] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const navigate = useNavigate();

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
    setSelectedSquare(null);
    removeGreySquares();
  };

  // Helper functions
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
      squareEl.style.background = "#ffff00";
    }
  };

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    const newSocket = socketIOClient(import.meta.env.VITE_BACKEND_URL, {
      query: { user: JSON.stringify(user) },
    });
    setSocket(newSocket);

    newSocket.on("color", (color) => {
      setPlayerColor(color);
      setGameCreated(true);
    });

    newSocket.on("opponent", (obtainedOpponent) => {
      console.log(obtainedOpponent);
      setOpponent(obtainedOpponent);
    });

    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    if (opponent) {
      console.log(opponent);
    }
  }, [opponent]);

  useEffect(() => {
    if (socket && gameCreated) {
      socket.on("move", ({ from, to, obtainedPromotion }) => {
        try {
          const move = game.move({ from, to, promotion: obtainedPromotion });
          if (move) {
            boardRef.current.position(game.fen());
            updateStatus();
            setMoves((prevMoves) => [
              ...prevMoves,
              { from: move.from, to: move.to, promotion: obtainedPromotion },
            ]);

            // Play sound based on move type
            if (move.captured) {
              captureSound.play();
            } else {
              moveSound.play();
            }
          }
        } catch (error) {
          console.error("Invalid move received:", error);
        }
      });

      socket.on("opponentDisconnected", () => {
        alert("Opponent has been disconnected");
        navigate("/modeselector");
      });

      boardRef.current = Chessboard(chessRef.current, {
        draggable: !mobileMode,
        position: game.fen() || "start",
        onDrop: onDrop,
        onMouseoverSquare: mobileMode ? undefined : onMouseoverSquare,
        onMouseoutSquare: mobileMode ? undefined : onMouseoutSquare,
        onSnapEnd: onSnapEnd,
        pieceTheme: (piece) => pieceImages[piece],
        snapbackSpeed: 500,
        snapSpeed: 100,
        orientation: playerColor,
      });
    }
  }, [socket, gameCreated, game, playerColor, promotionPiece, mobileMode]);

  // Handle touch/click on squares for mobile mode
  useEffect(() => {
    if (!mobileMode || !chessRef.current || !gameCreated) return;

    const timer = setTimeout(() => {
      if (!boardRef.current) return;

      const handleSquareClick = (e) => {
        if (!game) return;
        if (game.isGameOver()) return;

        // Find the clicked square element
        let squareEl = e.target;
        let attempts = 0;
        while (squareEl && !squareEl.classList.contains("square-55d63")) {
          squareEl = squareEl.parentElement;
          attempts++;
          if (attempts > 10 || squareEl === chessRef.current || !squareEl) return;
        }

        if (!squareEl) return;

        const classList = Array.from(squareEl.classList);
        const squareClass = classList.find((cls) => cls.match(/^square-([a-h][1-8])$/));
        if (!squareClass) return;

        const clickedSquare = squareClass.replace("square-", "");
        const position = boardRef.current.position();
        const piece = position[clickedSquare];

        // Check if it's player's turn
        const isPlayerTurn = (playerColor === "white" && game.turn() === "w") || 
                             (playerColor === "black" && game.turn() === "b");
        
        if (!isPlayerTurn && !selectedSquare) return;

        if (!selectedSquare) {
          if (!piece) return;

          // Check if it's the correct color
          if (
            (game.turn() === "w" && piece.search(/^b/) !== -1) ||
            (game.turn() === "b" && piece.search(/^w/) !== -1)
          ) {
            return;
          }

          const legalMoves = game.moves({ square: clickedSquare, verbose: true });
          if (legalMoves.length === 0) return;

          setSelectedSquare(clickedSquare);
          removeGreySquares();
          highlightSquare(clickedSquare);
          legalMoves.forEach((move) => greySquare(move.to));
        } else {
          if (clickedSquare === selectedSquare) {
            setSelectedSquare(null);
            removeGreySquares();
            return;
          }

          // Check if clicking another piece of same color (reselect)
          if (piece) {
            const selectedPiece = position[selectedSquare];
            if (
              (selectedPiece[0] === "w" && piece[0] === "w") ||
              (selectedPiece[0] === "b" && piece[0] === "b")
            ) {
              const legalMoves = game.moves({ square: clickedSquare, verbose: true });
              if (legalMoves.length > 0) {
                setSelectedSquare(clickedSquare);
                removeGreySquares();
                highlightSquare(clickedSquare);
                legalMoves.forEach((move) => greySquare(move.to));
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
              boardRef.current.position(game.fen());
              updateStatus();
              socket.emit("move", {
                from: selectedSquare,
                to: clickedSquare,
                obtainedPromotion: promotionPiece,
              });
              setMoves((prevMoves) => [
                ...prevMoves,
                { from: move.from, to: move.to, promotion: promotionPiece },
              ]);

              if (move.captured) {
                captureSound.play();
              } else {
                moveSound.play();
              }

              setSelectedSquare(null);
              removeGreySquares();
            } else {
              setSelectedSquare(null);
              removeGreySquares();
            }
          } catch (error) {
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

    return () => clearTimeout(timer);
  }, [mobileMode, selectedSquare, promotionPiece, gameCreated, game, playerColor, socket]);

  const onDrop = (source, target) => {
    if (mobileMode) return "snapback";

    if (
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b")
    ) {
      try {
        const move = game.move({
          from: source,
          to: target,
          promotion: promotionPiece,
        });
        if (move) {
          boardRef.current.position(game.fen());
          updateStatus();
          socket.emit("move", {
            from: source,
            to: target,
            obtainedPromotion: promotionPiece,
          });
          setMoves((prevMoves) => [
            ...prevMoves,
            { from: move.from, to: move.to, promotion: promotionPiece },
          ]);

          // Play sound based on move type
          if (move.captured) {
            captureSound.play();
          } else {
            moveSound.play();
          }
        } else {
          console.log("Invalid move:", source, target);
        }
      } catch (error) {
        console.error("Error making move:", error);
      }
    } else {
      console.log("Not your turn");
    }
  };

  const onMouseoverSquare = (square, piece) => {
    if (mobileMode) return;
    const moves = game.moves({ square, verbose: true });
    if (moves.length > 0) {
      greySquare(square);
      moves.forEach((move) => greySquare(move.to));
    }
  };

  const onMouseoutSquare = () => {
    if (mobileMode) return;
    removeGreySquares();
  };

  const onSnapEnd = () => {
    boardRef.current.position(game.fen());
  };

  const updateStatus = () => {
    let status = "";
    let turn = "White";

    if (game.turn() === "b") {
      turn = "Black";
    }

    if (game.isCheckmate()) {
      if (turn === "White") {
        status = "Game over, Black wins by checkmate.";
        checkmateSound.play();
        if (playerColor === "white") {
          addMatchToHistory(user.userId, opponent?.username, "lose");
        } else {
          addMatchToHistory(user.userId, opponent?.username, "win");
        }
      } else {
        status = "Game over, White wins by checkmate.";
        checkmateSound.play();
        if (playerColor === "black") {
          addMatchToHistory(user.userId, opponent?.username, "lose");
        } else {
          addMatchToHistory(user.userId, opponent?.username, "win");
        }
      }
    } else if (game.isDraw()) {
      status = "Game over, draw.";
      checkSound.play();
      if (opponent) {
        addMatchToHistory(user.userId, opponent?.username, "draw");
      }
    } else {
      status = `${turn} to move`;
      if (game.inCheck()) {
        checkSound.play();
      }
    }

    setCurrentStatus(status);
  };

  const calculateRating = (wins, loses, draws) => {
    const totalGames = wins + loses + draws;
    if (totalGames === 0) return 0;
    const winRatio = wins / totalGames;
    const baseRating = 900;
    return Math.round(baseRating + winRatio * 2100);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  return (
    <>
      {!gameCreated ? (
        <WaitQueue />
      ) : (
        <div
          className="w-full flex flex-col items-center min-h-screen"
          style={{
            backgroundImage: `url(${boardbg})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="w-screen flex mt-16 lg:flex-row flex-col mx-auto my-auto">
            <div className="lg:mx-16 w-full lg:w-1/2">
              {opponent && (
                <div className="flex justify-between text-center mr-8 text-white text-base lg:text-lg mb-2">
                  <p>Opponent: {opponent.username.split(" ")[0]}</p>
                  <p>
                    Rating:{" "}
                    {calculateRating(
                      opponent.wins,
                      opponent.loses,
                      opponent.draws
                    )}
                  </p>
                </div>
              )}
              <div
                ref={chessRef}
                style={{ width: window.innerWidth > 1028 ? "40vw" : "100vw" }}
              ></div>

              {user && (
                <div className="flex text-white text-base lg:text-lg justify-between text-center mr-8 mt-2 mb-4">
                  <p>You ({user.username})</p>
                  <p>
                    Rating: {calculateRating(user.wins, user.loses, user.draws)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="lg:mx-4 w-fit mx-2 lg:w-1/3 mt-4 lg:mt-0">
              <MobileToggle 
                mobileMode={mobileMode} 
                onChange={handleCheckboxChange}
                className="mb-4"
              />
              
              {(!mobileMode) && (
                <>
                  <div className="rounded-xl shadow-lg text-center p-6 px-12 lg:w-full text-xl lg:text-2xl bg-gray-400 bg-opacity-30 text-white border border-gray-200 flex-shrink-0">
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalMultiplayer;