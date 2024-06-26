const Meet = require("../models/meeting");
const mongoose = require("mongoose");
const moment2 = require('moment');
const Employees=require("../models/Employee")
//generate google link
const sendEmail = require("../config/nodeMailer");
const moment = require("moment-timezone");
const { google } = require("googleapis");
const ObjectId = require('mongoose').Types.ObjectId;
async function createMeeting(title, startTime, endTime) {
  try {
    // Load credentials from environment variables or service account file
    const auth = new google.auth.GoogleAuth({
      // Specify credentials here
      // ...
    });

    // Create a new Calendar API client
    const calendar = google.calendar({ version: "v3", auth });

    // Set up meeting details with provided startTime and endTime
    const event = {
      summary: title, // Use provided meeting title
      start: {
        dateTime: startTime,
        timeZone: "America/New_York", // Update timeZone as needed
      },
      end: {
        dateTime: endTime,
        timeZone: "America/New_York", // Update timeZone as needed
      },
      // Add any other event details as needed
    };

    // Create the event/meeting
    const response = await calendar.events.insert({
      calendarId: "primary", // Use 'primary' for the user's primary calendar
      requestBody: event,
    });

    // Get the meeting link from the response
    const meetingLink = response.data.hangoutLink;

    console.log("Meeting Link:", meetingLink);
    return meetingLink;
  } catch (error) {
    console.error("Error creating meeting:", error);
    throw error;
  }
}

async function scheduleMeeting(req, res) {
  try {
    const { title, startTime, endTime, link, date ,from ,sendTo } = req.body;
    console.log("1", req.body);

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }


    const meeting = new Meet({
      title: title,
      startTime: startTime,
      endTime: endTime,
      meetLink: link,
      date: date,
      from :req.body.from,
      sendTo:req.body.sendTo,
      createdBy:req.params.id
    });
 
    const attendeeIds = req.body.sendTo.map(id => new ObjectId(id));
    const attendees = await Employees.find({ _id: { $in: attendeeIds } }).select('email -_id').lean();
    
    if (!attendees.length) {
      return res.status(400).json({ message: 'No attendees found' });
    }
     // Send emails to all attendees
     const emailPromises = attendees.map(attende => {
      const emailData = {
        fromEmail: req.body.from,
        toEmail: attende.email,
        htmlContent: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body>
            <p><strong>Subject:</strong> ${title}</p>
            <p>Dear ${attende.email},</p>
            <p>You are invited to attend the <strong>${title}</strong> meeting.</p>
            <p>
            <strong>Date:</strong> ${moment2(date).format('YYYY-MM-DD')}<br>
            <strong>Start Time:</strong> ${moment2(startTime).format('HH:mm')}<br>
            <strong>End Time:</strong> ${moment2(endTime).format('HH:mm')}<br>
            <strong>Location:</strong> <a href="${link}">${link}</a></p>
            <h3>Action Required:</h3>
            <p>If you cannot attend, please inform <strong>${from}</strong> at <a href="mailto:${from}">${from}</a>.</p>
            <p>Best regards,<br>
            ${from}</p>
        </body>
        </html>
        `,
        subject: `Meeting Invitation: ${title}`
      };
      return sendEmail(emailData);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    await meeting.save();
    console.log("4", meeting.startTime);

    return res.status(200).json({ meeting });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateMeeting(req,res){
  let respObj = {
    Data: null,
  };
  try{
    console.log("im",req.body);
  

    let id = new ObjectId(req.params.id);
  
      let result = await Meet.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body ,meetLink:req.body.link } },
        { new: true }
      );
      console.log("up",respObj)
      const sendTo = result.sendTo;
      const emailPromises = sendTo.map(email => {
        const emailData = {
          fromEmail: result.from,
          toEmail: email,
          htmlContent: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${result.title}</title>
          </head>
          <body>
              <p><strong>Subject:</strong> ${result.title}</p>
              <p>Dear ${email},</p>
              <p>The details for the meeting <strong>${result.title}</strong> have been updated.</p>
              <p>
              <strong>Date:</strong> ${moment2(result.date).format('YYYY-MM-DD')}<br>
              <strong>Start Time:</strong> ${moment2(result.startTime).format('HH:mm')}<br>
              <strong>End Time:</strong> ${moment2(result.endTime).format('HH:mm')}<br>
              <strong>Location:</strong> <a href="${result.meetLink}">${result.meetLink}</a></p>
              <h3>Action Required:</h3>
              <p>If you cannot attend, please inform <strong>${result.from}</strong> at <a href="mailto:${result.from}">${result.from}</a>.</p>
              <p>Best regards,<br>
              ${result.from}</p>
          </body>
          </html>
          `,
          subject: `Updated Meeting Invitation: ${result.title}`
        };
        return sendEmail(emailData);
      });
  
      await Promise.all(emailPromises);
      respObj.IsSuccess = true;
      respObj.Data = result;
      respObj.Message = "Meeting Details Updated Successfully ";
      console.log("up",respObj)
      res.status(200).json(respObj);
  }catch(error){
    console.log("er",error)
    return res.status(500).json({error: "Internal server error" })
  }
}

async function getAllMeetings(req, res) {
  let respObj = {
    Data: null,
    totalMeeting: 0,
  };

  try {
    const ITEMS_PER_PAGE = parseInt(req.query.pageCount)  || 10// Default to 10 items per page if not specified
    const page = parseInt(req.query.pageNumber) || 1;
    const offset = (page - 1) * ITEMS_PER_PAGE;
    let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : moment().startOf('month').toDate();
    let toDate = req.query.toDate ? new Date(req.query.toDate + " 23:59:59") : moment().endOf('month').toDate();
    console.log(fromDate,toDate)
    console.log(req.query,"allData")
    let matchStage = {
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

 
    const allmeet = await Meet.aggregate([
      {
        $match: matchStage // Assuming matchStage is defined elsewhere
      },
      {
        $unwind: "$sendTo" // Unwind the sendTo array to prepare for lookup
      },
      {
        $lookup: {
          from: 'employees', 
          localField: 'sendTo',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: "$userDetails" // Unwind the userDetails array to handle multiple employee matches
      },
      {
        $project: {
          _id: 1,
          title: 1,
          startTime: 1,
          endTime: 1,
          meetLink: 1,
          date: 1,
          from: 1,
          sendTo: 1,
          userEmails: "$userDetails.email"
        }
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          startTime: { $first: "$startTime" },
          endTime: { $first: "$endTime" },
          meetLink: { $first: "$meetLink" },
          date: { $first: "$date" },
          from: { $first: "$from" },
          sendTo: { $addToSet: "$sendTo" }, // Collect sendTo values into a set to avoid duplicates
          userEmails: { $addToSet: "$userEmails" }, // Collect emails into a set to avoid duplicates
          createdBy: { $first: "$createdBy" },
          createdAt: { $first: "$createdAt" }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE }
    ]);
    
    console.log(allmeet); // Output the result to check if userDetails are populated
    
   
    const totalMeetingResult = await Meet.aggregate([
      {
        $match: matchStage,
      },
      {
        $count: "totalMeeting",
      },
    ]);

    const totalMeeting = totalMeetingResult.length > 0 ? totalMeetingResult[0].totalMeeting : 0;

    respObj.Data = allmeet;
    respObj.totalMeeting = totalMeeting;

    res.status(200).json(respObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


async function deleteMeeting(req,res){
  let respObj = {
    Data: null,
  };
  try{
    console.log("im",req.body);

    let id = new ObjectId(req.params.id);
    const deletedMeeting = await Meet.findByIdAndDelete(id);
    
    if (!deletedMeeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

}

async function getAllMeetingsById(req, res) {
  let respObj = {
    Data: null,
    totalMeeting: 0,
  };

  try {
    const ITEMS_PER_PAGE = parseInt(req.query.pageCount)  || 10// Default to 10 items per page if not specified
    const page = parseInt(req.query.pageNumber) || 1;
    const offset = (page - 1) * ITEMS_PER_PAGE;
    let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : moment().startOf('month').toDate();
    let toDate = req.query.toDate ? new Date(req.query.toDate + " 23:59:59") : moment().endOf('month').toDate();
    console.log(fromDate,toDate)
    console.log(req.query,"allData")
    let matchStage = {
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

   let id=  new ObjectId(req.params.id);
    const allmeet = await Meet.aggregate([
      {
        $match: matchStage, // Assuming matchStage is defined elsewhere
     sendTo: { $elemMatch: { $eq: id } }
      },
      {
        
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE }
    ]);
    
    console.log(allmeet); // Output the result to check if userDetails are populated
    
   
    const totalMeetingResult = await Meet.aggregate([
      {
        $match: matchStage,
      },
      {
        $count: "totalMeeting",
      },
    ]);

    const totalMeeting = totalMeetingResult.length > 0 ? totalMeetingResult[0].totalMeeting : 0;

    respObj.Data = allmeet;
    respObj.totalMeeting = totalMeeting;

    res.status(200).json(respObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  scheduleMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  getAllMeetingsById
};
