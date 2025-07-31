const axios = require('axios')
const Transaction = require('../models/transaction');

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
    const callback_url = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:5173/payment/callback';
    const { data: { data } } = await axiosClient.post('/transaction/initialize', {
      email, amount, channels, callback_url
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
    console.log('[Paystack Polling] Checking pending transactions...');
    const pendingTxs = await Transaction.find({ status: 'pending' });
    console.log(`[Paystack Polling] Found ${pendingTxs.length} pending transactions.`);
    for (const tx of pendingTxs) {
      console.log(`[Paystack Polling] Checking transaction: reference=${tx.reference}, email=${tx.email}, status=${tx.status}`);
      try {
        const paymentData = await verifyPayment(tx.reference);
        if (paymentData.status === 'success') {
          if (tx.status !== 'success') {
            tx.status = 'success';
            await tx.save();
            console.log(`[Paystack Polling] Transaction ${tx.reference} marked as success.`);
          }
          // Also mark player as verified
          const Player = require('../models/players');
          const player = await Player.findById(tx.player);
          if (player && !player.verified) {
            player.verified = true;
            await player.save();
            console.log(`[Paystack Polling] Player ${player.email} marked as verified.`);
          }
        } else if (paymentData.status === 'failed') {
          if (tx.status !== 'failed') {
            tx.status = 'failed';
            await tx.save();
            console.log(`[Paystack Polling] Transaction ${tx.reference} marked as failed.`);
          }
        } else {
          // If status is still pending or any other, do nothing and keep monitoring
          console.log(`[Paystack Polling] Transaction ${tx.reference} is still pending. Will continue monitoring.`);
        }
      } catch (err) {
        console.error(`[Paystack Polling] Error verifying transaction ${tx.reference}:`, err);
      }
    }
    console.log('[Paystack Polling] Polling cycle complete.');
  } catch (error) {
    console.error('[Paystack Polling] Error polling transactions:', error);
  }
}

// Run poll every 5 minutes
setInterval(pollPendingTransactions, 30 * 1000);

module.exports = PaystackService;