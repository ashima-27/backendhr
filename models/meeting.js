
const mongoose = require("mongoose");
const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startTime:{type: Date},
    endTime:{type: Date},
    date:{type:Date},
    meetLink:{type:String},
    createdBy:{  type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'},
    createdAt: { type: Date, default: Date.now },
    sendTo:{type:[String]},
    from :{
      type:String
    }
  },
  
);

const meeting = mongoose.model(
  "meeting",
  meetingSchema 
);
module.exports = meeting;