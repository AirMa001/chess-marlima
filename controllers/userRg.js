
const Player = require('../models/players');
const responseHelper = require('../utils/responseHelper');
const emailService = require('../services/email');
const lichessService = require("../services/lichessService")
const Transaction = require('../models/transaction')

const Players = {
  // async getTransactionStatus(req, res) {
  //   try {
  //     const { reference } = req.query;
  //     if (!reference) {
  //       return res.status(400).json({ status: 'error', message: 'Reference is required' });
  //     }
  //     const transaction = await Transaction.findOne({ reference });
  //     if (!transaction) {
  //       return res.status(404).json({ status: 'error', message: 'Transaction not found' });
  //     }
  //     return res.status(200).json({ status: transaction.status });
  //   } catch (error) {
  //     console.error('Error fetching transaction status:', error);
  //     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  //   }
  // },
  async getTransactionStatus(req, res) {
    try {
      const { reference } = req.query;
      if (!reference) {
        return res.status(400).json({ status: 'error', message: 'Reference is required' });
      }
      // Use PaystackService.verifyPayment to get live status
      const paystackService = require('../services/paystackService');
      const paymentData = await paystackService.verifyPayment(reference);
      if (!paymentData || !paymentData.status) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found or no status returned' });
      }
      console.log(`[Paystack Polling] Transaction status for reference ${reference}: ${paymentData}`);
      return res.status(200).json({ status: paymentData.status });
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },
  async createPlayer(req, res) {
    try {
      const { fullName, email, lichessUsername, Department, phoneNumber } = req.body;

      // Check if the player already exists
      const existingPlayer = await Player.findOne({ email });

      if (existingPlayer) {
        return responseHelper.error(res, 'Player with this email already exists', 400);
      }

     
      const rating = await lichessService.getLichessRating(lichessUsername);
      if (rating === undefined) {
        return responseHelper.error(res, 'Invalid Lichess username or unable to fetch rating', 400);
      }
      

      // Create a new player
      const newPlayer = new Player({
        fullName,
        email,
        lichessUsername,
        rating,
        Department,
        phoneNumber,
      });

      await newPlayer.save();

      // Send confirmation email with signup template
      await emailService.sendEmail({
        email: newPlayer.email,
        userName: newPlayer.fullName
      });

      // Initialize payment with Paystack (channels: transfer/bank, card)
      const paystackChannels = ['bank', 'card', 'bank_transfer'];
      const amount = 100000; // Set your registration fee here
      const paymentData = await require('../services/paystackService').initializePayment(
        newPlayer.lichessUsername,
        newPlayer.email,
        amount,
        paystackChannels
      );

      // Redirect user to payment page
      return res.status(201).json({
        status: 'success',
        message: 'Registration successful. Please complete your payment.',
        data: newPlayer,
        paymentUrl: paymentData.authorization_url
      });
    } catch (error) {
      console.error('Error creating player:', error);
      return responseHelper.error(res, error, error.status);
    }
  },
  async getPlayers(req, res) {
    try {
      const players = await Player.find();
      return responseHelper.success(res, players);
    } catch (error) {
      console.error('Error fetching players:', error);
      return responseHelper.error(res, 'Internal Server Error', 500);
    }
  },
  async  verifyPlayer(req, res) {
    try {
      const { email } = req.body;

      // Find the player by email
      const player = await Player.findOne({ email });
      if (!player) {
        return responseHelper.error(res, 'Player not found', 404);
      }

      // Verify the player
      player.verified = true;
      await player.save();

      return responseHelper.success(res, player);
    } catch (error) {
      console.error('Error verifying player:', error);
      return responseHelper.error(res, 'Internal Server Error', 500);
    }
  },
  async getVerifiedPlayers(req, res) {
    try {
      const verifiedPlayers = await Player.find({ verified: true });
      return responseHelper.success(res, verifiedPlayers);
    } catch (error) {
      console.error('Error fetching verified players:', error);
      return responseHelper.error(res, 'Internal Server Error', 500);
    }
  },
  async deletePlayer(req, res) {
    try {
      const { email } = req.body;

      // Find the player by email
      const player = await Player.findOne ({ email });
      if (!player) {
        return responseHelper.error(res, 'Player not found', 404);
      } 
        // Delete the player
        await Player.deleteOne({ email });
        return responseHelper.success(res, 'Player deleted successfully');
    } catch (error) {
      console.error('Error deleting player:', error);
      return responseHelper.error(res, 'Internal Server Error', 500);
    }
  },
  async initializePayment(req, res) {
    try {
      const { lichessUsername } = req.body;
      if (!lichessUsername) {
        return responseHelper.error(res, 'Lichess username is required', 400);
      }
      const player = await Player.findOne({ lichessUsername });
      if (!player) {
        return responseHelper.error(res, 'Player not found', 404);
      }
      const paystackChannels = ['bank', 'card', 'bank_transfer'];
      const amount = 1000;
      const paymentData = await require('../services/paystackService').initializePayment(
        player.lichessUsername,
        player.email,
        amount,
        paystackChannels
      );
      return res.status(200).json({
        status: 'success',
        message: 'Payment initialized successfully.',
        paymentUrl: paymentData.authorization_url
      });
    } catch (error) {
      console.error('Error initializing payment:', error);
      return responseHelper.error(res, error, error.status);
    }
  },
 
  async getAllTransactions(req, res) {
    try {
      const allTxs = await Transaction.find({}).populate('player');
      return res.status(200).json({
        status: 'success',
        data: allTxs
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  },
  async paystackWebhook(req, res) {
    try {
      // Paystack sends event data in req.body
      const event = req.body;
      if (!event || !event.event) return res.status(400).send('Invalid webhook');

      // Only handle successful charge events
      if (event.event === 'charge.success') {
        const reference = event.data.reference;
        // Find transaction by reference
        const transaction = await Transaction.findOne({ reference }).populate('player');
        if (transaction) {
          if (transaction.status !== 'success') {
            transaction.status = 'success';
            await transaction.save();
          }
          // Mark player as verified if not already
          if (transaction.player && !transaction.player.verified) {
            transaction.player.verified = true;
            await transaction.player.save();
          }
        }
      }
      // You can handle other events (e.g., failed) similarly
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error handling Paystack webhook:', error);
      res.status(500).send('Webhook error');
    }
  },
  
};

module.exports = Players;