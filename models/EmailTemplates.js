const mongoose = require("mongoose");
const emailTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
 template:{ type: String, required: true },
 
 placeholder:{
    type:[String],
 },
 status: {
    type:Boolean,
   
    default:true

  },
 createdBy :{type: mongoose.Schema.Types.ObjectId,
    ref:'Employee'},
    Template_isDeleted:{
           type:Boolean,
           default:false
    }, 
  createdAt: { type: Date, default: Date.now },
});

const emailTemplate = mongoose.model("emailTemplate", emailTemplateSchema);
module.exports = emailTemplate;
