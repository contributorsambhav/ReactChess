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

  const getGridClass = (itemCount) => {
    if (itemCount === 1) {
      return "grid-cols-1 max-w-md mx-auto";
    } else if (itemCount === 2) {
      return "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
    } else if (itemCount === 3) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto";
    } else {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
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
    <div className="flex h-screen items-center justify-center w-screen overflow-hidden">
      <div
        className="w-full h-screen bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <style>
          {`
            /* Hide scrollbar for Chrome, Safari and Opera */
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            /* Hide scrollbar for Firefox */
            .hide-scrollbar {
              scrollbar-width: none;
            }
            /* Hide scrollbar for IE and Edge */
            .hide-scrollbar {
              -ms-overflow-style: none;
            }
          `}
        </style>

        <div className="flex flex-col h-full w-full">
          <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6 text-center text-white z-10 animate-fade-in px-4">
            Select a Puzzle
          </h1>

          {/* Vertical scroll container with grid layout */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-4 sm:px-6 md:px-8 lg:px-12 pb-8"
          >
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
              {sortedCategories.map((category, categoryIndex) => (
                <div
                  key={category}
                  className={`${animate ? `animate-slide-in ${getDelayClass(categoryIndex)}` : ""
                    }`}
                >
                  {/* Category Header */}
                  <div className="mb-3 sm:mb-4 md:mb-5">
                    <h3 className="text-white text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold animate-fade-in drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      {category.toUpperCase()}
                    </h3>
                    {getCategoryDescription(category) && (
                      <p className="text-center text-xs sm:text-sm md:text-base text-gray-200 font-normal mt-1 drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                        {getCategoryDescription(category)}
                      </p>
                    )}
                  </div>

                  {/* Grid of puzzles */}
                  <div className={`grid ${getGridClass(groupedPuzzles[category].length)} gap-3 sm:gap-4 md:gap-5 lg:gap-6`}>
                    {groupedPuzzles[category].map((puzzle, index) => (
                      <div
                        key={puzzle.id}
                        className="w-full"
                      >
                        <div className="group h-full min-h-[100px] sm:min-h-[110px] md:min-h-[120px] flex flex-col justify-center transition-all duration-300 border-2 border-white/20 hover:border-cyan-400/80 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-600/20 transform hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-500/30 bg-gray-900/70 backdrop-filter backdrop-blur-xl p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl cursor-pointer">
                          <Link
                            to={`/puzzle/${puzzle.id}`}
                            className="text-white group-hover:text-cyan-300 text-sm sm:text-base md:text-lg lg:text-xl text-center block font-bold drop-shadow-md transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                          >
                            {category === "Mate in One"
                              ? puzzle.difficulty.toUpperCase()
                              : puzzle.name}
                          </Link>
                          {puzzle.composer &&
                            puzzle.composer !== 'Unknown' &&
                            puzzle.composer !== 'Training Puzzle' &&
                            category !== "Mate in One" && (
                              <p className="text-gray-300 group-hover:text-gray-100 text-xs sm:text-sm text-center mt-2 drop-shadow-sm transition-colors duration-300" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>
                                by {puzzle.composer}
                              </p>
                            )}
                          {puzzle.year &&
                            puzzle.year !== 'Unknown' &&
                            puzzle.year !== 'Modern' &&
                            category !== "Mate in One" && (
                              <p className="text-gray-400 group-hover:text-gray-200 text-xs text-center mt-1 drop-shadow-sm transition-colors duration-300" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>
                                ({puzzle.year})
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {puzzles.length === 0 && (
            <div className="text-white text-center text-lg sm:text-xl md:text-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              No puzzles available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Puzzles;