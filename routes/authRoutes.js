const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Models (assuming these paths/models exist in the project)
const User = require('../models/User');
const Student = require('../models/Student');

// Middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { loginValidation, studentLoginValidation, handleValidationErrors } = require('../middleware/validate');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// POST /register - Admin creates new users
router.post('/register', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const { username, password, name, email, mobile, role } = req.body;
        
        // Basic validation
        if (!username || !password || !name || !role) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check duplicate
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Create user (assuming User schema hashes password pre-save)
        const newUser = new User({
            username,
            password,
            name,
            email,
            mobile,
            role
        });

        await newUser.save();

        const userObj = newUser.toObject();
        delete userObj.password;

        return res.status(201).json({ success: true, message: 'User created successfully', data: userObj });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// POST /login - User login
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Assuming User schema has a comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        const payload = { id: user._id, role: user.role, name: user.name };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            data: { token, user: payload } 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// POST /student-login - Student login
router.post('/student-login', studentLoginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { appNo, mobile, password } = req.body;

        const student = await Student.findOne({
            $or: [{ appNo }, { registrationNo: appNo }]
        });

        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // If password is provided and student has a password set
        if (password && student.password) {
            const isMatch = await student.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }
        } 
        // Fallback to mobile match if password not used/present
        else if (mobile) {
            if (student.mobile !== mobile) {
                return res.status(401).json({ success: false, message: 'Invalid mobile number' });
            }
        } else {
            return res.status(401).json({ success: false, message: 'Invalid login attempt' });
        }

        const payload = { id: student._id, studentId: student._id, role: 'student', name: student.name };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).json({ 
            success: true, 
            message: 'Student login successful', 
            data: { token, student: { id: student._id, name: student.name, appNo: student.appNo } } 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// GET /me - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const student = await Student.findById(req.user.id).select('-password');
            if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
            return res.status(200).json({ success: true, message: 'Profile retrieved', data: student });
        } else {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            return res.status(200).json({ success: true, message: 'Profile retrieved', data: user });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// POST /change-password - Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        if (req.user.role === 'student') {
            const student = await Student.findById(req.user.id);
            if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

            const isMatch = await student.comparePassword(currentPassword);
            if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

            student.password = newPassword; // Will be hashed pre-save
            await student.save();
        } else {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

            user.password = newPassword;
            await user.save();
        }

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router;
