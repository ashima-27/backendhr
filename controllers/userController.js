const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const config = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/nodeMailer");
const crypto = require('crypto');
const ObjectId = require("mongoose").Types.ObjectId;
async function createUser(req, res) {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const highestEmp = await Employee.findOne().sort('-empId').exec();
    const newEmpId = highestEmp ? highestEmp.empId + 1 : 1916067;

    if (!email || !password) {
    
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
   
    let isUser = await Employee.findOne({ email }); 
    if (isUser) {
      return res.status(409).json("Employee Already Exists!");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10); 
      const newUser = new Employee({ email, password: hashedPassword , empId: newEmpId,role:req.body.permission,positionId:req.body.role}); 
      const result = await newUser.save();
      if (result) {
        return res
          .status(201)
          .json({ message: "Employee created successfully", Employee: result });
      } else {
        return res.status(500).json("Unable to Create Employee !");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json("Internal Server Error");
  }
}

const loginUser = async (req, res) => {
  let respObj = {
    IsSuccess: false,
    Message: "OK..",
    Data: null,
  };
  const { email, password } = req.body;

  try {
    console.log("worng")
    if (!email || !password) {
      respObj.Message = "Enter fields properly";

      return res.status(400).json(respObj);
    }
    const userData = await Employee.findOne({ email: email });
    if (!userData) {
      respObj.Message = "Please try to login with correct credentials";

      return res.status(400).json(respObj);
    }

    const isMatch = await bcrypt.compare(password, userData?.password);
    console.log(isMatch);
    if (isMatch) {
      const token = jwt.sign({ _id: userData._id }, process.env.SECRET, {
        expiresIn: 604800,
      });
      console.log("Employee .." + token);
      respObj.IsSuccess = true;
      respObj.Message = "Logged In Succefully";
      respObj.Data = {
        token: token,
        id: userData._id,
        email: userData.email,
        name: userData.firstName,
        role: userData.role,
        name:userData.name
      };

      console.log(respObj);
      return res.status(200).json(respObj);
    } else {
      respObj.Message = "Email or Password Incorrect";
      return res.status(401).json(respObj);
    }
  } catch (error) {
    console.log("er",error);
    respObj.Message = "Server Error!";
    return res.status(500).json(respObj);
  }
};

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log("req", req.body, req.params.id);
    
   
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    
    let userId = new ObjectId(req.params.id);
    console.log("id", userId);

   
    const user = await Employee.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

   
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    
    await Employee.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}


async function forgotPassword(req, res) {
  try {
    console.log("req",req.body)
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Generate a  token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    
    await Employee.findOneAndUpdate(
      { email },
      { 
        resetPasswordToken,
        resetPasswordExpire
      },
      { new: true }
    );
    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/resetPassword?id=${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: \n\n ${resetUrl}`;
    let emailData={
      fromEmail : 'duggalashima905@gmail.com',
      toEmail:user.email,
      htmlContent: message,
      subject: 'Password reset token',
    }

    await sendEmail(emailData);

    res.status(200).json({ message: 'Email sent.' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

async function resetPassword(req, res) {
  try {
    console.log(req.body)
    const { token } = req.body; // Adjust based on how you send the token in the request
    const { newPassword } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await Employee.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid token or token has expired.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user document with the new password
    await Employee.findOneAndUpdate(
      { _id: user._id },
      {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined
      },
      { new: true }
    );

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword
};
