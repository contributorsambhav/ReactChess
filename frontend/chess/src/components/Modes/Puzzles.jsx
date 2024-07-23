import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bg from "../../assets/bgpuzzle.jpg";

const Puzzles = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const puzzles = [
    { path: "/puzzle1", label: "Puzzle 1", delay: "delay-100" },
    { path: "/puzzle2", label: "Puzzle 2", delay: "delay-200" },
    { path: "/puzzle3", label: "Puzzle 3", delay: "delay-300" },
    { path: "/puzzle4", label: "EASY", delay: "delay-400" },
    { path: "/puzzle5", label: "NORMAL", delay: "delay-500" },
    { path: "/puzzle6", label: "HARD", delay: "delay-600" }
  ];

  return (
    <div className="flex h-screen items-center justify-center w-screen">
      <div
        className="w-full h-screen bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "100% auto",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full w-full">
          <h1 className="text-5xl font-bold mb-10 text-center text-white  animate-fade-in"
          >
            Select a Puzzle
          </h1>
          <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
            <h3 className="text-white text-center text-2xl mb-4 font-semibold animate-fade-in">
              THE BIG THREE (Hardest puzzles)
            </h3>
            {puzzles.slice(0, 3).map(({ path, label, delay }) => (
              <div key={path} className={`w-full game-mode ${animate ? `animate-slide-in ${delay}` : ''}`}>
                <div className="bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-xl border border-gray-500 p-4 rounded-xl shadow-lg w-full">
                  <Link to={path} className="text-gray-100 text-2xl text-center block hover:text-white">
                    {label}
                  </Link>
                </div>
              </div>
            ))}
            <h3 className="text-white text-center text-2xl mt-6 mb-4 font-semibold animate-fade-in">
              Mate in one move
            </h3>
            {puzzles.slice(3).map(({ path, label, delay }) => (
              <div key={path} className={`w-full game-mode ${animate ? `animate-slide-in ${delay}` : ''}`}>
                <div className="bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-xl border border-gray-500 p-4 rounded-xl shadow-lg w-full">
                  <Link to={path} className="text-gray-100 text-2xl text-center block hover:text-white">
                    {label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Puzzles;
