const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, isClient, isReceiver } = require('../middleware/auth');

// Client routes
router.post('/buy', [verifyToken, isClient], ticketController.buyTicket);
router.get('/status/:ticketCode', verifyToken, ticketController.getTicketStatus);

// Receiver routes
router.post('/validate', [verifyToken, isReceiver], ticketController.validateTicket);
router.get('/generate-onbus-qr', [verifyToken, isReceiver], ticketController.createOnBusTicket);
router.post('/process-onbus', [verifyToken, isReceiver], ticketController.processOnBusTicket);

module.exports = router; 