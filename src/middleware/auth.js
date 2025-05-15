const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

exports.isAdmin = async (req, res, next) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Requires admin role' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error checking admin role' });
    }
};

exports.isClient = async (req, res, next) => {
    try {
        if (req.userRole !== 'client') {
            return res.status(403).json({ message: 'Requires client role' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error checking client role' });
    }
};

exports.isReceiver = async (req, res, next) => {
    try {
        if (req.userRole !== 'receiver') {
            return res.status(403).json({ message: 'Requires receiver role' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error checking receiver role' });
    }
}; 