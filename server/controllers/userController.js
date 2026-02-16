const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client((process.env.GOOGLE_CLIENT_ID || '').trim());

const register = async (req, res) => {
  const { username, password, email } = req.body
  // Convert to lowercase
  const lowerCaseUsername = username.toLowerCase();
  const lowerCaseEmail = email.toLowerCase();

  try {
    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: lowerCaseUsername,
      password: hashedPassword,
      email: lowerCaseEmail
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Convert to lowercase
  const lowerCaseEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      userId: user._id,
      username: user.username,
      email: user.email,
      matchHistory: user.matchHistory,
      wins: user.wins,
      loses: user.loses,
      draws: user.draws
    }, process.env.JWT_SECRET, {
    });

    // Persist the cookie until the user explicitly logs out.
    // Use secure cookies only in production (HTTPS). Set a long maxAge so the
    // cookie survives browser restarts until logout.
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    };

    res.cookie('token', token, cookieOptions);
    res.status(200).json({
      token,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const lowerCaseEmail = email.toLowerCase();

    // Check if a user with this Google ID or email already exists
    let user = await User.findOne({ $or: [{ googleId }, { email: lowerCaseEmail }] });

    if (user) {
      // If user exists by email but hasn't linked Google yet, link it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create a new user (no password needed for Google auth)
      user = new User({
        username: name.toLowerCase(),
        email: lowerCaseEmail,
        googleId,
      });
      await user.save();
    }

    // Generate JWT token same as normal login
    const token = jwt.sign({
      userId: user._id,
      username: user.username,
      email: user.email,
      matchHistory: user.matchHistory,
      wins: user.wins,
      loses: user.loses,
      draws: user.draws
    }, process.env.JWT_SECRET, {});

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    };

    res.cookie('token', token, cookieOptions);
    res.status(200).json({ token });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
};

const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMatchToHistory = async (req, res) => {
  const { userId } = req.params;
  const { opponent, status } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.matchHistory.push({ opponent, status });

    if (status === 'win') {
      user.wins++;
    } else if (status === 'lose') {
      user.loses++;
    } else if (status === 'draw') {
      user.draws++;
    }

    await user.save();

    res.status(201).json({ message: 'Match history added successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMatchHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ matchHistory: user.matchHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  };

  res.clearCookie('token', cookieOptions);
  res.status(200).json({ message: 'Logged out' });
};

module.exports = {
  register,
  login,
  googleLogin,
  getUserById,
  addMatchToHistory,
  getMatchHistory,
  logout
};

