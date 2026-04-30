const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to determine faculty from student ID
const determineFaculty = (studentId) => {
    if (!studentId) return 'Other';
    const id = studentId.toUpperCase();
    if (id.startsWith('IT')) return 'Computer Science';
    if (id.startsWith('EN')) return 'Engineering';
    if (id.startsWith('BM')) return 'Business';
    if (id.startsWith('AR')) return 'Architecture';
    return 'Other';
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, studentId, password } = req.body;

        // Check if user exists by email or student ID
        const userExists = await User.findOne({ $or: [{ email }, { studentId }] });

        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ status: 'error', message: 'User with email or student ID already exists.' });
            } else {
                // If user started registration but didn't verify, we remove the stale entry 
                // to allow them to re-register and get a new code.
                await User.deleteOne({ _id: userExists._id });
            }
        }

        const faculty = determineFaculty(studentId);

        // Create user
        const user = await User.create({
            fullName,
            email,
            studentId,
            password,
            faculty,
            isVerified: false // Needs dummy Verification
        });

        if (user) {
            res.status(201).json({
                status: 'success',
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    studentId: user.studentId,
                    role: user.role,
                    avatar: user.avatar,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                studentId: user.studentId,
                role: user.role,
                isVerified: user.isVerified,
                avatar: user.avatar,
                token: generateToken(user._id),
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Verify OTP for user account
// @route   POST /api/auth/verify
// @access  Public
exports.verifyUser = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Dummy verification (Accepting 1234 for testing purposes)
        if (otp === "1234") {
            const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
            if (!user) {
                 return res.status(404).json({ status: 'error', message: 'User not found' });
            }
            res.status(200).json({ status: 'success', message: 'Account successfully verified' });
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid Verification Code' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.status(200).json({
                status: 'success',
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    studentId: user.studentId,
                    role: user.role,
                    isVerified: user.isVerified,
                    avatar: user.avatar
                }
            });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.status(200).json({
                status: 'success',
                data: {
                    _id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    studentId: updatedUser.studentId,
                    role: updatedUser.role,
                    avatar: updatedUser.avatar,
                    token: generateToken(updatedUser._id),
                }
            });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
