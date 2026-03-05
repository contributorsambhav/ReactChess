// Shared engine presets used by AnalyzeGame and EnginePlay
export const ALL_ENGINE_PRESETS = [
    { id: 'stockfish-ultra', name: 'Ultra', depth: 25, description: 'Maximum Strength' },
    { id: 'stockfish-master', name: 'Master', depth: 22, description: 'Grandmaster Level' },
    { id: 'stockfish-expert', name: 'Expert', depth: 20, description: 'Expert Level' },
    { id: 'stockfish-strong', name: 'Strong', depth: 18, description: 'Strong Player' },
    { id: 'stockfish-advanced', name: 'Advanced', depth: 16, description: 'Advanced' },
    { id: 'stockfish-medium', name: 'Medium', depth: 15, description: 'Intermediate' },
    { id: 'stockfish-balanced', name: 'Balanced', depth: 13, description: 'Balanced' },
    { id: 'stockfish-fast', name: 'Fast', depth: 12, description: 'Quick Games' },
    { id: 'stockfish-casual', name: 'Casual', depth: 10, description: 'Casual Play' },
    { id: 'stockfish-blitz', name: 'Blitz', depth: 8, description: 'Rapid Games' },
    { id: 'stockfish-rapid', name: 'Rapid', depth: 6, description: 'Very Fast' },
    { id: 'stockfish-beginner', name: 'Beginner', depth: 5, description: 'Easy' },
    { id: 'stockfish-easy', name: 'Easy', depth: 3, description: 'Very Easy' },
];

export const getPresetById = (id) => ALL_ENGINE_PRESETS.find(p => p.id === id);
