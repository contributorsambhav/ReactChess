import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

class PuzzleService {
  // Get all active puzzles
  static async getAllPuzzles(filters = {}) {
    try {
      const config = {};
      if (Object.keys(filters).length > 0) {
        config.params = filters;
      }
      
      const response = await axios.get(`${API_URL}/api/puzzles`, config);
      console.log('Fetched puzzles:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      throw error;
    }
  }

  // Get single puzzle by ID
  static async getPuzzleById(puzzleId) {
    try {
      const response = await axios.get(`${API_URL}/api/puzzles/${puzzleId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching puzzle ${puzzleId}:`, error);
      throw error;
    }
  }

  // Get puzzles by category
  static async getPuzzlesByCategory(category) {
    try {
      const response = await axios.get(`${API_URL}/api/puzzles/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching puzzles for category ${category}:`, error);
      throw error;
    }
  }

  // Record puzzle attempt
  static async recordAttempt(puzzleId, success) {
    try {
      const response = await axios.patch(`${API_URL}/api/puzzles/${puzzleId}/attempt`, {
        success
      });
      return response.data;
    } catch (error) {
      console.error(`Error recording attempt for puzzle ${puzzleId}:`, error);
      throw error;
    }
  }
}

export default PuzzleService;