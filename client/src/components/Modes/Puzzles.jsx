import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import PuzzleService from "../../services/puzzleService";
import bg from "../../assets/images/bgpuzzle.jpeg";

const Puzzles = () => {
  const [animate, setAnimate] = useState(false);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setAnimate(true);
    fetchPuzzles();
  }, []);

  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const response = await PuzzleService.getAllPuzzles();
      
      if (response.success) {
        setPuzzles(response.puzzles);
      } else {
        setError('Failed to load puzzles');
      }
    } catch (err) {
      console.error('Error fetching puzzles:', err);
      setError('Failed to load puzzles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Group puzzles by category dynamically
  const groupedPuzzles = puzzles.reduce((acc, puzzle) => {
    const category = puzzle.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(puzzle);
    return acc;
  }, {});

  // Define category order (optional - for better UX)
  const categoryOrder = [
    "The Big Three",
    "Mate in One",
    "Famous Games",
    "Mating Patterns",
    "Endgame Studies",
    "Tactical Motifs",
    "Opening Traps"
  ];

  // Sort categories by the defined order
  const sortedCategories = Object.keys(groupedPuzzles).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    
    // If both are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A is in the list, it comes first
    if (indexA !== -1) return -1;
    // If only B is in the list, it comes first
    if (indexB !== -1) return 1;
    // Otherwise, sort alphabetically
    return a.localeCompare(b);
  });

  const getDelayClass = (index) => {
    const delays = ["delay-100", "delay-200", "delay-300"];
    return delays[index % delays.length];
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      "The Big Three": "Hardest puzzles",
      "Mate in One": "Find checkmate in one move",
      "Famous Games": "Legendary games from chess history",
      "Mating Patterns": "Classic checkmate patterns",
      "Endgame Studies": "Master endgame techniques",
      "Tactical Motifs": "Essential tactical patterns",
      "Opening Traps": "Common opening pitfalls"
    };
    return descriptions[category] || "";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center w-screen">
        <div className="text-white text-2xl">Loading puzzles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center w-screen">
        <div className="text-red-500 text-2xl">{error}</div>
      </div>
    );
  }

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
          <h1 className="text-5xl lg:text-5xl md:text-4xl sm:text-3xl xs:text-2xl font-bold mb-10 lg:mt-2 mt-16 text-center text-white z-10 animate-fade-in">
            Select a Puzzle
          </h1>
          <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto overflow-y-auto max-h-[70vh] px-4 pb-8">
            {sortedCategories.map((category) => (
              <div key={category} className="mb-6">
                <h3 className="text-white text-center lg:text-2xl md:text-xl sm:text-lg xs:text-base mb-4 font-semibold animate-fade-in">
                  {category.toUpperCase()}
                  {getCategoryDescription(category) && (
                    <span className="block text-sm text-gray-300 font-normal mt-1">
                      ({getCategoryDescription(category)})
                    </span>
                  )}
                </h3>
                {groupedPuzzles[category].map((puzzle, index) => (
                  <div
                    key={puzzle.id}
                    className={`w-11/12 mx-auto mb-3 game-mode ${
                      animate ? `animate-slide-in ${getDelayClass(index)}` : ""
                    }`}
                  >
                    <div className="transition duration-300 border border-white hover:bg-gray-300 transform transition duration-300 hover:scale-105 bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-xl border border-gray-500 p-4 rounded-xl shadow-lg w-full">
                      <Link
                        to={`/puzzle/${puzzle.id}`}
                        className="text-gray-100 lg:text-2xl md:text-xl sm:text-lg xs:text-base text-center block hover:text-green-200"
                      >
                        {category === "Mate in One" 
                          ? puzzle.difficulty.toUpperCase() 
                          : puzzle.name}
                      </Link>
                      {puzzle.composer && 
                       puzzle.composer !== 'Unknown' && 
                       puzzle.composer !== 'Training Puzzle' &&
                       category !== "Mate in One" && (
                        <p className="text-gray-400 text-sm text-center mt-1">
                          by {puzzle.composer}
                        </p>
                      )}
                      {puzzle.year && 
                       puzzle.year !== 'Unknown' && 
                       puzzle.year !== 'Modern' && 
                       category !== "Mate in One" && (
                        <p className="text-gray-500 text-xs text-center mt-1">
                          ({puzzle.year})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {puzzles.length === 0 && (
              <div className="text-white text-center text-xl">
                No puzzles available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Puzzles;