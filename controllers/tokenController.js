const Token=require("../models/token")
const Notification=require("../models/notification")
const mongoose = require("mongoose");
require('dotenv').config();
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getMessaging } = require('firebase/messaging');
const admin = require("firebase-admin");

// Read the JSON file
const configFile = fs.readFileSync('../config/serviceAccountKey.json', 'utf8');

// Parse the JSON file
let firebaseConfig = JSON.parse(configFile);

// Replace the placeholders with actual environment variables
Object.keys(firebaseConfig).forEach(key => {
  if (typeof firebaseConfig[key] === 'string' && firebaseConfig[key].startsWith('process.env.')) {
    const envVar = firebaseConfig[key].slice('process.env.'.length);
    firebaseConfig[key] = process.env[envVar];
  }
});

// Handle the private key new line characters
firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK with environment variables
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});


async function saveToken (req, res)  {
    const { token } = req.body;
    try {
      const existingToken = await Token.findOne( token.token );

    if (existingToken) {
      return res.status(200).json({ message: 'Token already exists' });
    }
      const newToken = new Token({ token });
      await newToken.save();
      res.status(200).send('Token saved successfully');
    } catch (error) {
      res.status(500).send('Error saving token');
    }
  };


// async function notify(req, res) {
//     try {
//       const { title, body } = req.body;
//       const tokens = await Token.find({}).select('token -_id').lean();
//       if (!tokens.length) {
//         console.log('No tokens found');
//         return res.status(400).json({ message: 'No tokens found' });
//       }
//       const allTokens = await Token.find();
      
//       const savenoti= new Notification(req.body);
//       await savenoti.save();
//       console.log("sv",savenoti)
//       const messages = allTokens.map(token => {
//         return {
//           notification: {
//             title,
//             body
//           },
//           token: token.token 
//         };
//       });
//  console.log("msg",messages)
  
//       // Send messages using Firebase Admin SDK
//       await admin.messaging().sendAll(messages).then(function(response) {
// 		    console.log('Successfully sent message:', response);
//         res.status(200).send('Notifications sent successfully');
//         const failedMessages = response.responses.filter((resp) => !resp.success);
// if (failedMessages.length > 0) {
// failedMessages.forEach((resp, idx) => {
// console.error(Error sending message to token ${messages[idx].token}:, resp.error);
// });
// return res.status(500).json({
// message: 'Some notifications failed to send',
// errors: failedMessages.map((resp, idx) => ({
// token: messages[idx].token,
// error: resp.error.message
// }))
// });
// }
// 		  })
// 		  .catch(function(error) {
// 		    console.log('Error sending message:', error);
//         throw(error)
// 		  });
  
   
  
     
//     } catch (error) {
//       console.error('Error sending notifications:', error);
//       res.status(500).send('Error sending notifications');
//     }
//   }
async function notify(req, res) {
  try {
    const { title, body } = req.body;
    const tokens = await Token.find({}).select('token -_id').lean();
    if (!tokens.length) {
      console.log('No tokens found');
      return res.status(400).json({ message: 'No tokens found' });
    }

    const savenoti = new Notification(req.body);
    await savenoti.save();
    console.log("Saved Notification:", savenoti);

    const messages = tokens.map(token => ({
      notification: { title, body },
      token: token.token
    }));

    console.log("Messages:", messages);

    // Send messages using Firebase Admin SDK
    const response = await admin.messaging().sendAll(messages);

    // Log the detailed response
    console.log('Successfully sent messages:', response);

    // Check for any failed messages and handle them appropriately
    const failedMessages = response.responses.filter(resp => !resp.success);
    if (failedMessages.length > 0) {
      failedMessages.forEach((resp, idx) => {
        console.error(`Error sending message to token ${messages[idx].token}:`, resp.error);
      });
      return res.status(500).json({
        message: 'Some notifications failed to send',
        errors: failedMessages.map((resp, idx) => ({
          token: messages[idx].token,
          error: resp.error.message
        }))
      });
    }

    res.status(200).send('Notifications sent successfully');
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).send('Error sending notifications');
  }
}

async function getAllNotification(req, res) {
  try {
    const query = req.query.searchQuery || "";
    const page = parseInt(req.query.pageNumber) || 1;
    const ITEMS_PER_PAGE = parseInt(req.query.pageCount) || 10;
    const offset = (page - 1) * ITEMS_PER_PAGE;
    let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : moment().startOf('month').toDate();
    let toDate = req.query.toDate ? new Date(req.query.toDate + " 23:59:59") : moment().endOf('month').toDate();
    console.log(fromDate,toDate)
  
    console.log("query", req.query);
    let matchStage = {
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    };
    
    const searchCriteria = {
      $and: [
        matchStage,
        {
          $or: [
            { title: { $regex: query, $options: "i" } }, // Case-insensitive search
            // { body: { $regex: query, $options: "i" } },
          ],
        },
      ],
    };


    const allNoti = await Notification.find(searchCriteria)
      .skip(offset)
      .limit(ITEMS_PER_PAGE);

    const totalCount = await Notification.countDocuments(searchCriteria);

    res.status(200).json({
      Data: allNoti,
      total: totalCount,
    
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

  module.exports={
    saveToken,
    notify,
    getAllNotification
  }