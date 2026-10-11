const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// 1. authenticateToken(req, res, next)
const authenticateToken = (req, res, next) => {
    try {
        let token;
        
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } 
        // Check cookies if token not in header
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role, name, ... }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// 2. authorizeRoles(...roles)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// 3. optionalAuth(req, res, next)
const optionalAuth = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } else {
            req.user = null;
        }
    } catch (error) {
        req.user = null;
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuth
};
