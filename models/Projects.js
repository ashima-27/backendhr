const mongoose = require("mongoose");
const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  skilsRequired:{ type: [String]},
  description:{type:String},
  createdAt: { type: Date, default: Date.now },
});

const project = mongoose.model("project", ProjectSchema);
module.exports = project;
