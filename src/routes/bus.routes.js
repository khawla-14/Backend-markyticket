const express = require('express');
const router = express.Router();
const busController = require('../controllers/bus.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Apply authentication middleware to all bus routes
router.use(verifyToken);

// Create a new bus (Admin only)
router.post('/', isAdmin, busController.create);

// Retrieve all buses
router.get('/', busController.findAll);

// Retrieve a single bus
router.get('/:matricule', busController.findOne);

// Update a bus (Admin only)
router.put('/:matricule', isAdmin, busController.update);

// Delete a bus (Admin only)
router.delete('/:matricule', isAdmin, busController.delete);

// Change bus status (Admin only)
router.patch('/:matricule/status', isAdmin, busController.changeStatus);

module.exports = router; 