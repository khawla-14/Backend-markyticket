const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).send({
            message: 'No token provided!'
        });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).send({
            message: 'Unauthorized!'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).send({
            message: 'Require Admin Role!'
        });
    }
    next();
};

const isReceveur = (req, res, next) => {
    if (req.userRole !== 'receveur') {
        return res.status(403).send({
            message: 'Require Receveur Role!'
        });
    }
    next();
};

const isClient = (req, res, next) => {
    if (req.userRole !== 'client') {
        return res.status(403).send({
            message: 'Require Client Role!'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isReceveur,
    isClient
}; 