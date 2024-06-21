const mongoose = require("mongoose");
const departmentSchema = new mongoose.Schema({
  departmentName: { type: String, required: true },
 
  createdAt: { type: Date, default: Date.now },
});

const department = mongoose.model("department", departmentSchema);
module.exports = department;
