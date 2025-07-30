const PaystackService = require('.services/paystackService');
const responseHelper = require('../utils/responseHelper');
const Player = require('../models/players');



const makePayment = async (req, res) => {
    const { lichessUsername, email, amount } = req.body;

    try {
        const paymentUrl = await PaystackService.initializePayment(lichessUsername, email, amount);
        responseHelper.sendResponse(res, 200, true, { paymentUrl }, 'Payment initialized successfully');
    } catch (error) {
        responseHelper.sendResponse(res, 500, false, null, error.message);
    }
}

