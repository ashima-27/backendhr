"use strict";
const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    mobileNumber: String,
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true
    },
    alternateEmail: {
      type: String
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    createdAt:{
      type: Date,
      default: Date.now
    },
    updatedAt:{
      type: Date,
      default: Date.now
    },
    role:{
      type: String
    }

  },
  { versionKey: false,
    timestamp: true,
    autoIndex: true,
  
  }
);

const user = (module.exports = mongoose.model(
  "user",
  userSchema 
));
