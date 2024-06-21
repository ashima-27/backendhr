const mongoose = require('mongoose');
const { Schema } = mongoose;


const ticketSchema = new Schema({
  type: {
    type: String,
    enum: ['leave', 'task', 'emergency','other'],
    required: true,
  },
  subject:{
    type: String,
  },
  description: {
    type: String,
  
  },
  startDate: {
    type: Date,
   
  },
  endDate: {
    type: Date,
    required: function() {
      return this.type === 'leave';
    },
  },

    ticket_isDeleted:{
      type:Boolean,
      default:false
    },
    status:{
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
    }, 
    raisedBy:{
      type:mongoose.Schema.Types.ObjectId, 
      ref:'Employee'
    },
    documentUrl:{
 type:String
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
 

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
