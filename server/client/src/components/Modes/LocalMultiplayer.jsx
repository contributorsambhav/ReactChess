import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import Chessboard from "chessboardjs";
import { Howl } from "howler";
import moveSoundFile from "../../assets/sounds/move.mp3";
import captureSoundFile from "../../assets/sounds/capture.mp3";
import checkSoundFile from "../../assets/sounds/check.mp3";
import checkmateSoundFile from "../../assets/sounds/checkmate.mp3";
import pieceImages from "../pieceImages";
import boardbg from "../../assets/images/bgboard.jpeg";

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

  useEffect(() => {
    const game = gameRef.current;

    const onDragStart = (source, piece, position, orientation) => {
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
      removeGreySquares();

      let move = game.move({
        from: source,
        to: target,
        promotion: promotionPiece, // Use the selected promotion piece
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
  }, [promotionPiece]);

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center w-screen"
      style={{ backgroundImage: `url(${boardbg})`, backgroundSize: "cover" }}
    >
      <div className="w-screen flex flex-col lg:flex-row lg:flex-row mx-auto my-auto">
        <div className="lg:mx-16 w-full mx-auto  lg:w-1/2">
          <div
            ref={chessRef}
            style={{ width: window.innerWidth > 1028 ? "40vw" : "100vw" }}
          ></div>
        </div>
        <div className="lg:mx-4  w-fit mx-2 lg:w-1/3 mt-4 lg:mt-0">
          <div className="rounded-xl shadow-lg text-center p-8 px-16 lg:w-full text-xl lg:text-2xl lg:text-3xl xl:text-4xl bg-gray-400 bg-opacity-30 text-white border border-gray-200 flex-shrink-0">
            Current Status: {currentStatus ? currentStatus : "White to move"}
          </div>

          <div className="mt-4 ">
            <label className="mr-2 text-white text-lg lg:text-xl">Promotion Piece:</label>
            <select
              value={promotionPiece}
              onChange={handlePromotionChange}
              className="bg-gray-400 bg-opacity-30 text-white px-4 py-2 rounded-lg w-full text-base lg:text-lg"
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
          <div className="mx-2 mt-3 text-center border border-gray-800 text-lg lg:text-xl text-white bg-black bg-opacity-20 p-4 rounded-lg">
            If the game goes to start after promotion piece change, just attempt
            an illegal move, it will get OK so relax
          </div>
          <button
            onClick={toggleTable}
            className="mt-4 bg-gray-400 bg-opacity-30 text-white border border-gray-200 px-6 py-3 rounded-lg w-full text-lg lg:text-xl"
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
                    <th className="border border-gray-400 px-6 py-3 text-lg lg:text-xl">
                      Move
                    </th>
                    <th className="border border-gray-400 px-6 py-3 text-lg lg:text-xl">
                      From
                    </th>
                    <th className="border border-gray-400 px-6 py-3 text-lg lg:text-xl">
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
                      <td className="border border-gray-400 px-6 py-4 text-lg lg:text-xl">
                        {index + 1}
                      </td>
                      <td className="border border-gray-400 px-6 py-4 text-lg lg:text-xl">
                        {move.from}
                      </td>
                      <td className="border border-gray-400 px-6 py-4 text-lg lg:text-xl">
                        {move.to}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalMultiplayer;
