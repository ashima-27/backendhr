const Meet = require("../models/meeting");
const mongoose = require("mongoose");
// const moment = require('moment');
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
    const { title, startTime, endTime, link, date } = req.body;
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
 
    let emailData={
      fromEmail :req.body.from,
      toEmail:req.body.sendTo,
      htmlContent:`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${req.body.title}</title>
</head>
<body>
    <p><strong>Subject:</strong> ${req.body.title}</p>

    <p>Dear ${req.body.sendTo},</p>

    <p>You are invited to attend the <strong>${req.body.title}</strong> </p>

    <p>
     <strong>Date:</strong> ${moment(req.body.date).format('YYYY-MM-DD')}<br>
    <strong>Start Time:</strong> ${moment(req.body.startTime).format('HH:mm')}<br>
    <strong>End Time:</strong> ${moment(req.body.endTime).format('HH:mm')}<br>
    <strong>Location:</strong> ${req.body.link}</p>

    <h3>Action Required:</h3>
  <p>
    If you cannot attend, please inform <strong>Contact Person</strong> at <a href="mailto:${req.body.from}">${req.body.from}</a>.</p>

    <p>Best regards,<br>
   ${req.body.from}
 
</body>
</html>
`,
      subject: `Meeting for ${req.body.title}`
    }
    await sendEmail(emailData);
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
        { $set: { ...req.body ,meetLink:req.body.link } }, // Update the image field in the database
        { new: true }
      );
      console.log("up",respObj)
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
    const ITEMS_PER_PAGE = parseInt(req.query.pageCount)  // Default to 10 items per page if not specified
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

    // Fetch paginated meetings
    const allmeet = await Meet.find(matchStage)
      .skip(offset)
      .limit(ITEMS_PER_PAGE);

    // Calculate total number of meetings for pagination
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

module.exports = {
  scheduleMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting
};
