const express = require('express');
const router = express.Router();
const Puzzle = require('../models/Puzzle');

// GET all active puzzles
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, isActive = true } = req.query;
    const filter = { isActive };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const puzzles = await Puzzle.find(filter)
      .select('-__v')
      .sort({ category: 1, difficulty: 1, createdAt: 1 });
    
    res.json({
      success: true,
      count: puzzles.length,
      puzzles
    });
  } catch (error) {
    console.error('Error fetching puzzles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching puzzles',
      error: error.message
    });
  }
});

// GET single puzzle by ID
router.get('/:puzzleId', async (req, res) => {
  try {
    const puzzle = await Puzzle.findOne({
      id: req.params.puzzleId,
      isActive: true
    }).select('-__v');
    
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: 'Puzzle not found'
      });
    }
    
    res.json({
      success: true,
      puzzle
    });
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching puzzle',
      error: error.message
    });
  }
});

// GET puzzles by category
router.get('/category/:category', async (req, res) => {
  try {
    const puzzles = await Puzzle.find({
      category: req.params.category,
      isActive: true
    })
      .select('-__v')
      .sort({ difficulty: 1, createdAt: 1 });
    
    res.json({
      success: true,
      category: req.params.category,
      count: puzzles.length,
      puzzles
    });
  } catch (error) {
    console.error('Error fetching puzzles by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching puzzles by category',
      error: error.message
    });
  }
});

// POST - Create new puzzle (admin only - add auth middleware as needed)
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.fen) {
      return res.status(400).json({
        success: false,
        message: 'Name and FEN notation are required'
      });
    }

    const puzzle = new Puzzle(req.body);
    await puzzle.save();
    
    res.status(201).json({
      success: true,
      message: 'Puzzle created successfully',
      puzzle
    });
  } catch (error) {
    console.error('Error creating puzzle:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating puzzle',
      error: error.message
    });
  }
});

// POST - Create multiple puzzles with duplicate handling
router.post('/bulk', async (req, res) => {
  try {
    // Validate that request body is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be an array of puzzles'
      });
    }

    // Validate each puzzle has required fields
    const invalidPuzzles = req.body.filter(p => !p.name || !p.fen);
    if (invalidPuzzles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All puzzles must have name and fen fields',
        invalidCount: invalidPuzzles.length
      });
    }

    // Get existing puzzles to check for duplicates
    const existingIds = await Puzzle.find({ 
      id: { $in: req.body.filter(p => p.id).map(p => p.id) } 
    }).select('id');
    
    const existingIdSet = new Set(existingIds.map(p => p.id));
    
    const existingFens = await Puzzle.find({ 
      fen: { $in: req.body.map(p => p.fen) } 
    }).select('fen id name');
    
    const existingFenSet = new Set(existingFens.map(p => p.fen));

    // Separate puzzles into valid and duplicates
    const validPuzzles = [];
    const skippedDuplicates = [];

    for (const puzzle of req.body) {
      const isDuplicateId = puzzle.id && existingIdSet.has(puzzle.id);
      const isDuplicateFen = existingFenSet.has(puzzle.fen);
      
      if (isDuplicateId || isDuplicateFen) {
        const reason = [];
        if (isDuplicateId) reason.push(`duplicate ID: ${puzzle.id}`);
        if (isDuplicateFen) reason.push('duplicate FEN');
        
        skippedDuplicates.push({
          name: puzzle.name,
          id: puzzle.id || 'N/A',
          reason: reason.join(' and ')
        });
      } else {
        validPuzzles.push(puzzle);
      }
    }

    // Insert valid puzzles
    let insertedPuzzles = [];
    if (validPuzzles.length > 0) {
      insertedPuzzles = await Puzzle.insertMany(validPuzzles, { ordered: false });
    }

    // Prepare response
    const response = {
      success: true,
      message: `Bulk upload completed`,
      totalReceived: req.body.length,
      inserted: insertedPuzzles.length,
      skipped: skippedDuplicates.length
    };

    if (insertedPuzzles.length > 0) {
      response.insertedPuzzles = insertedPuzzles;
    }

    if (skippedDuplicates.length > 0) {
      response.skippedDuplicates = skippedDuplicates;
      response.message += `. ${skippedDuplicates.length} duplicate(s) skipped`;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating puzzles:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating puzzles',
      error: error.message
    });
  }
});

// PUT - Update puzzle (admin only - add auth middleware as needed)
router.put('/:puzzleId', async (req, res) => {
  try {
    const puzzle = await Puzzle.findOneAndUpdate(
      { id: req.params.puzzleId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: 'Puzzle not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Puzzle updated successfully',
      puzzle
    });
  } catch (error) {
    console.error('Error updating puzzle:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating puzzle',
      error: error.message
    });
  }
});

// DELETE - Soft delete puzzle (admin only - add auth middleware as needed)
router.delete('/:puzzleId', async (req, res) => {
  try {
    const puzzle = await Puzzle.findOneAndUpdate(
      { id: req.params.puzzleId },
      { isActive: false },
      { new: true }
    );
    
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: 'Puzzle not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Puzzle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting puzzle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting puzzle',
      error: error.message
    });
  }
});

// PATCH - Increment attempts counter
router.patch('/:puzzleId/attempt', async (req, res) => {
  try {
    const { success } = req.body;
    const puzzle = await Puzzle.findOne({ id: req.params.puzzleId });
    
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: 'Puzzle not found'
      });
    }
    
    puzzle.attempts += 1;
    
    if (success && puzzle.attempts > 0) {
      // Recalculate success rate
      const successCount = Math.round((puzzle.successRate / 100) * (puzzle.attempts - 1));
      puzzle.successRate = ((successCount + 1) / puzzle.attempts) * 100;
    }
    
    await puzzle.save();
    
    res.json({
      success: true,
      message: 'Attempt recorded',
      attempts: puzzle.attempts,
      successRate: puzzle.successRate
    });
  } catch (error) {
    console.error('Error recording attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording attempt',
      error: error.message
    });
  }
});

module.exports = router;