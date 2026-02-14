const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    sparse: true // Allows multiple documents with null/undefined id
  },
  name: {
    type: String,
    required: [true, 'Puzzle name is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'legendary'],
    default: 'normal'
  },
  category: {
    type: String,
    trim: true
  },
  fen: {
    type: String,
    required: [true, 'FEN notation is required'],
    trim: true
  },
  turn: {
    type: Boolean,
    required: [true, 'Turn is required (true for white, false for black)'],
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  composer: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  videoTitle: {
    type: String,
    trim: true
  },
  solution: {
    type: String,
    trim: true
  },
  solutionType: {
    type: String,
    enum: ['text', 'video', 'both'],
    default: 'text'
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  hint: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save hook to auto-generate id if not provided
puzzleSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `puzzle${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Index for better query performance
puzzleSchema.index({ category: 1, difficulty: 1 });
puzzleSchema.index({ isActive: 1 });
puzzleSchema.index({ id: 1 });

const Puzzle = mongoose.model('Puzzle', puzzleSchema);

module.exports = Puzzle;
