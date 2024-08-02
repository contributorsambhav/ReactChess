import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import socketIOClient from "socket.io-client";
import { useSelector } from "react-redux";
import WaitQueue from "../WaitQueue";
import { useNavigate } from "react-router-dom";
import pieceImages from "../pieceImages";
import axios from "axios";
import { Howl } from "howler";
import moveSoundFile from "../../assets/sounds/move.mp3";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import boardbg from "../../assets/images/bgboard.jpeg";

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
        `https://reactchess.onrender.com/user/${userId}/match-history`,
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
  const navigate = useNavigate();

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const handleCheckboxChange = () => {
    setMobileMode(!mobileMode);
  };

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    const newSocket = socketIOClient("https://reactchess.onrender.com", {
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
        draggable: true,
        position: game.fen() || "start",
        onDrop: onDrop,
        onMouseoverSquare: onMouseoverSquare,
        onMouseoutSquare: onMouseoutSquare,
        onSnapEnd: onSnapEnd,
        pieceTheme: (piece) => pieceImages[piece],
        snapbackSpeed: 500,
        snapSpeed: 100,
        orientation: playerColor,
      });
    }
  }, [socket, gameCreated, game, playerColor, promotionPiece]);

  const onDrop = (source, target) => {
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
    const moves = game.moves({ square, verbose: true });
    if (moves.length > 0) {
      greySquare(square);
      moves.forEach((move) => greySquare(move.to));
    }
  };

  const onMouseoutSquare = () => {
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
          className={`flex min-h-screen  overflow-scroll items-center justify-center w-screen`}
          style={{
            backgroundImage: `url(${boardbg})`,
            backgroundSize: "cover",
          }}
        >
          <div className="w-screen mt-16 flex flex-col lg:flex-row mx-auto my-auto">
            <div className="lg:mx-16 w-full lg:w-1/2">
              {opponent && (
                <div className="flex justify-between text-center mr-8 text-lg lg:text-xl xl:text-2xl">
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
                <div className="flex text-lg lg:text-xl xl:text-2xl justify-between text-center text-xl mr-8 mb-4">
                  <p>You ({user.username})</p>
                  <p>
                    Rating: {calculateRating(user.wins, user.loses, user.draws)}
                  </p>
                </div>
              )}

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
            {(!mobileMode) && (
              <div className={`w-11/12 mx-auto lg:w-1/3 `}>
                <div className="flex flex-col justify-between text-center text-xl">
                  <label className="mt-2 text-gray-100 ">Promotion piece</label>
                  <select
                    className="mt-2 text-gray-800 py-2 w-full text-center text-xl bg-gray-200 border border-gray-400 rounded"
                    value={promotionPiece}
                    onChange={handlePromotionChange}
                  >
                    <option value="q">Queen</option>
                    <option value="r">Rook</option>
                    <option value="b">Bishop</option>
                    <option value="n">Knight</option>
                  </select>
                </div>
                <div className="text-center text-2xl mb-4 mt-8">
                  {currentStatus ? currentStatus : "White to move"}
                </div>
                <button
                  onClick={toggleTable}
                  className="mb-4 w-full bg-gray-200 text-black py-2 px-4 rounded shadow-md hover:bg-gray-200"
                >
                  {isTableCollapsed ? "Show Moves" : "Hide Moves"}
                </button>
                {!isTableCollapsed && (
                  <table className="table-auto text-lg font-semibold w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Move #</th>
                        <th className="px-4 py-2">From</th>
                        <th className="px-4 py-2">To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moves.map((move, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">{index + 1}</td>
                          <td className="border px-4 py-2">{move.from}</td>
                          <td className="border px-4 py-2">{move.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalMultiplayer;
