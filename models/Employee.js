const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin','user'],
    required: true,
   
  },
  joiningDate: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['Active','Inactive'],
    default:'Active'

  },
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  ifscCode: {
    type: String,
    required: true,
    trim: true
  },
  dob:{
    type:Date
  },
  image:{
    type: String, 
  },
  leavestaken:{
    type: String, 
    default:'0',
  },
  salary:{
    type: String
  },
  positionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    // required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    // required: true,
  },
  salary:{
    type:String
  },
  projectId:{
    type:mongoose.Schema.Types.ObjectId, 
    ref:'Projects'
  },
  shift:{type: String,
  
  enum: ['Onsite','Remote','Hybrid'],
  default:'Onsite'},
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  documentUrl:{
    type:String
  },
  resetPasswordToken:{
    type:String
  },
  resetPasswordExpire:{
    type:String
  }

});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
