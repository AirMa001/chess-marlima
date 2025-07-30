const axios = require('axios')
const Transaction = require('../models/transaction');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()


const token = process.env.PAYSTACK_TEST_SECRET
console.log('Paystack Test Secret:', token )
const axiosClient = axios.create({
  baseURL: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET}`

  }
})

class PaystackService {
  // now takes userId; no more wallet logic
  static async initializePayment(lichessUsername, email, amount, channels = []) {
    if (!lichessUsername) throw new Error('Lichess Username is required')
    const { data: { data } } = await axiosClient.post('/transaction/initialize', {
      email, amount, channels
    })
    // record transaction
    const player = await require('../models/players').findOne({ lichessUsername });
    const newTransaction = new Transaction({
      player: player._id,
      email: player.email,
      lichessUsername: player.lichessUsername,
      amount: amount,
      status: 'pending',
      reference: data.reference,
      paymentUrl: data.authorization_url
    });

    await newTransaction.save();

    return data
  }
}

// const axiosClient = require('./axiosClient'); // Adjust path if needed
// const Transaction = require('../models/transaction');

// Function to verify payment status from Paystack
async function verifyPayment(reference) {
  try {
    const { data: { data } } = await axiosClient.get(`/transaction/verify/${reference}`);
    return data;
  } catch (error) {
    console.error('Verify payment error:', error);
    throw new Error('Failed to verify payment');
  }
}

// Periodically check and update pending transactions
async function pollPendingTransactions() {
  try {
    const pendingTxs = await Transaction.find({ status: 'pending' });
    for (const tx of pendingTxs) {
      try {
        const paymentData = await verifyPayment(tx.reference);
        if (paymentData.status === 'success') {
          tx.status = 'success';
          await tx.save();
        } else if (paymentData.status === 'failed') {
          tx.status = 'failed';
          await tx.save();
        }
      } catch (err) {
        console.error(`Error verifying transaction ${tx.reference}:`, err);
      }
    }
  } catch (error) {
    console.error('Error polling transactions:', error);
  }
}

// Run poll every 5 minutes
setInterval(pollPendingTransactions, 5 * 60 * 1000);

module.exports = PaystackService;