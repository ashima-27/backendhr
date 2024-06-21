const mongoose = require('mongoose');
const { Schema } = mongoose;


const notificationSchema = new Schema({
  
    title:{
        type: String,
        required: true,
    },
  body: {
    type: String,
    required: true,
  },
  
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
 

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
