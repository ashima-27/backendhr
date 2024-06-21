const mongoose = require("mongoose");
const positionSchema = new mongoose.Schema({
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        // required: true,
      },
  title:{ type: String, required: true },
  highSalary:{type:String},
  lowSalary:{type:String},
  createdAt: { type: Date, default: Date.now },
});

const position = mongoose.model("position", positionSchema);
module.exports = position;
