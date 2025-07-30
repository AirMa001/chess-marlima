const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  lichessUsername: {
    type: String,
    required: false
 
  },
  rating: {
    type: Number,
    required: true,
  },
  Department: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    required: true
  }
}, {timestamps: true});

module.exports = mongoose.model('Player', userSchema);
