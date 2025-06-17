const Player = require('../models/players');
const responseHelper = require('../utils/responseHelper');
const emailService = require('../services/email');


const Players = {
  async createPlayer(req, res) {
    try {
      const { fullName, email, lichessUsername, rating, Department, level } = req.body;

      // Check if the player already exists
      const existingPlayer = await Player.findOne({ email });
      if (existingPlayer) {
        return responseHelper.error(res, 'Player with this email already exists', 400);
      }

      // Create a new player
      const newPlayer = new Player({
        fullName,
        email,
        lichessUsername,
        rating,
        Department,
        level
      });

      await newPlayer.save();

      // Send confirmation email
      const emailData = {
        email: newPlayer.email,
        subject: 'Registration Successful',
        html: `<p>Dear ${newPlayer.fullName},</p><p>Your registration was successful!</p>`
      };
      await emailService.sendEmail(emailData);

      return responseHelper.success(res, newPlayer, 201);
    } catch (error) {
      console.error('Error creating player:', error);
      return responseHelper.error(res, 'Internal Server Error', 500);
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
  }
};

module.exports = Players;