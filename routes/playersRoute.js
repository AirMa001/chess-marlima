const express = require('express');

const Players = require('../controllers/userRg');
const routeGuard = require('../middle_ware/routeGuard');
const router = express.Router();

router.get('/getVerifiedPlayers', Players.getVerifiedPlayers);
router.post('/register', Players.createPlayer);

router.get('/getPlayers', Players.getPlayers);
router.post('/verifyPlayer', Players.verifyPlayer);
router.post('/deletePlayer', Players.deletePlayer);
router.post('/initializePayment', Players.initializePayment);
router.post('/paystack/webhook', Players.paystackWebhook);
router.get('/transactions', Players.getAllTransactions);

module.exports = router;
