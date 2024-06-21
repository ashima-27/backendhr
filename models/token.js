
const mongoose = require("mongoose");
const tokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true , unique: true},
    createdAt: { type: Date, default: Date.now }
  },
  
);

const token = mongoose.model(
  "token",
  tokenSchema 
);
module.exports = token;