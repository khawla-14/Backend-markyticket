const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { verifyToken, isClient } = require('../middleware/auth');

router.post('/recharge', [verifyToken, isClient], walletController.recharge);
router.get('/balance', [verifyToken, isClient], walletController.getBalance);

module.exports = router; 