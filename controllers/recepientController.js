const Recepient = require("../models/TemplateRecepient");
const Template =require("../models/EmailTemplates")
const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;
const sendEmail = require("../config/nodeMailer");// Adjust the path according to your structure
const Employee = require("../models/Employee");
const moment = require('moment');


async function createRecepient(req, res) {
    try {
      console.log("req.body", req.body);
      
      let id = new ObjectId(req.params.id); 
  
     
      let templateId = new ObjectId(req.body.templateId);
      let employeeId = new ObjectId(req.body.employeeId);
  
      let obj = {
        senderEmail: req.body.fromEmail,
        templateId: templateId,
        employeeId: employeeId,
        senderId: id,
        senderName: req.body.senderName,
        status:'Failed',
      };

      let emailData={
        fromEmail :req.body.fromEmail,
        toEmail:req.body.recipientEmail,
        htmlContent:req.body.template,
        subject:req.body.subject
      }
    
     await sendEmail(emailData);
     obj.status='Sent'
      const newRecepient = new Recepient(obj);
      const savedRecepient = await newRecepient.save();
  
      res.status(200).json(savedRecepient);
    } catch (error) {
    
      console.log("error", error);
      res.status(500).json({ message: error.message });
    }
  }
 // Make sure you have moment.js installed

 async function getAllRecepients(req, res) {
    try {
      const query = req.query.searchQuery || "";
      const page = parseInt(req.query.pageNumber) || 1;
      const ITEMS_PER_PAGE = parseInt(req.query.pageCount) || 10;
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let fromDate = req.query.fromDate
        ? new Date(req.query.fromDate)
        : moment().startOf("month").toDate();
      let toDate = req.query.toDate
        ? new Date(req.query.toDate + " 23:59:59")
        : moment().endOf("month").toDate();
      console.log(fromDate, toDate);
  
      console.log("query", req.query);
  
      const searchCriteria = {
        $and: [
          {
            $or: [
              { senderEmail: { $regex: query, $options: "i" } },
            ],
          },
          { createdAt: { $gte: fromDate, $lte: toDate } },
        ],
      };
  
      const templates = await Recepient.aggregate([
        { $match: searchCriteria },
        { $skip: offset },
        { $limit: ITEMS_PER_PAGE },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
      
        {
          $lookup: {
            from: 'emailtemplates',
            localField: 'templateId',
            foreignField: '_id',
            as: 'template'
          }
        },
    
       
        {
          $project: {
            employeeName: '$employee.name',
            employeeId:'$employee._id',
            employeeEmail: '$employee.email',
            templateName:'$template.title',
            createdAt: 1 ,
            status:1,
            senderId:1,
            senderName:1,
            senderEmail:1
        }
        }
      ]);
  
      console.log("Aggregation result:", templates); // Log the result for debugging
      const totalCount = await Recepient.countDocuments(searchCriteria);
  
      const respObj = { Data: templates, totalCount };
      res.status(200).json(respObj); // Send response with status 200
    } catch (error) {
      console.error("Error during aggregation:", error); // Log error for debugging
      res.status(500).json({ error: "Internal Server Error" }); // Send error response
    }
  }
  
module.exports={
    createRecepient,
    getAllRecepients
}