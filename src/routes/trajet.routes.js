const express = require('express');
const router = express.Router();
const trajetController = require('../controllers/trajet.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Apply authentication middleware to all trajet routes
router.use(verifyToken);

// Create a new trajet (Admin only)
router.post('/', isAdmin, trajetController.create);

// Retrieve all trajets
router.get('/', trajetController.findAll);

// Retrieve a single trajet
router.get('/:id', trajetController.findOne);

// Update trajet status (Admin only)
router.patch('/:id/status', isAdmin, trajetController.updateStatus);

// Delete a trajet (Admin only)
router.delete('/:id', isAdmin, trajetController.delete);

module.exports = router; 