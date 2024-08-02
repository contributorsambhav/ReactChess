import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bg from "../../assets/images/bgpuzzle.jpeg";

const Puzzles = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const puzzles = [
    { path: "/puzzle1", label: "The Magician's Puzzle", delay: "delay-100" },
    { path: "/puzzle2", label: "The Mighty Night", delay: "delay-200" },
    { path: "/puzzle3", label: "The Enigmatic Puzzle", delay: "delay-300" },
    { path: "/puzzle4", label: "EASY", delay: "delay-100" },
    { path: "/puzzle5", label: "NORMAL", delay: "delay-200" },
    { path: "/puzzle6", label: "HARD", delay: "delay-300" },
  ];

  return (
    <div className="flex h-screen items-center justify-center w-screen">
      <div
        className="w-full h-screen bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full w-full">
          <h1 className="text-5xl lg:text-5xl md:text-4xl sm:text-3xl xs:text-2xl font-bold mb-10 lg:mt-2 mt:16 text-center text-white z-10 animate-fade-in">
            Select a Puzzle
          </h1>
          <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
            <h3 className="text-white text-center lg:text-2xl md:text-xl sm:text-lg xs:text-base mb-4 font-semibold animate-fade-in">
              THE BIG THREE (Hardest puzzles)
            </h3>
            {puzzles.slice(0, 3).map(({ path, label, delay }) => (
              <div
                key={path}
                className={`w-full mx-4 mr-8 game-mode ${
                  animate ? `animate-slide-in ${delay}` : ""
                }`}
              >
                <div className="transition duration-300 border border-white hover:bg-gray300 transform transition duration-300 hover:scale-105 bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-xl border border-gray-500 p-4 rounded-xl shadow-lg w-full">
                  <Link
                    to={path}
                    className="text-gray-100 lg:text-2xl md:text-xl sm:text-lg xs:text-base text-center block hover:text-green-200"
                  >
                    {label}
                  </Link>
                </div>
              </div>
            ))}
            <h3 className="text-white text-center lg:text-2xl md:text-xl sm:text-lg xs:text-base mt-6 mb-4 font-semibold animate-fade-in">
              Mate in one move
            </h3>
            {puzzles.slice(3).map(({ path, label, delay }) => (
              <div
                key={path}
                className={`w-full mx-4 mr-8 game-mode ${
                  animate ? `animate-slide-in ${delay}` : ""
                }`}
              >
                <div className="transition duration-300 border border-white hover:bg-gray300 transform transition duration-300 hover:scale-105 bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-xl border border-gray-500 p-4 rounded-xl shadow-lg w-full">
                  <Link
                    to={path}
                    className="text-gray-100 lg:text-2xl md:text-xl sm:text-lg xs:text-base text-center block hover:text-green-200"
                  >
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
