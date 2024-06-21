const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true,
  },
 employeeId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  senderId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const Recipient = mongoose.model('Recipient', recipientSchema);

module.exports = Recipient;
