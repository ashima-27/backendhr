const Ticket=require("../models/ticket")
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;
const Employee =require('../models/Employee')
async function raiseTicket(req, res) {
    try {
      console.log("req.body",req.body)
      let id=new ObjectId(req.params.id)
    
    
      const newTicket = new Ticket({...req.body,raisedBy:id});
      const savedTicket = await newTicket.save();
      res.status(200).json(savedTicket);
      }
  
    catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  async function getAllTicketById(req, res) {
    let respObj = {
      IsSuccess: false,
      Message: "OK..",
      Data: null,
    };
    try {
      console.log("hii");
      const query = req.query.searchQuery || "";
      const page = parseInt(req.query.pageNumber) || 1;
      const ITEMS_PER_PAGE = parseInt(req.query.pageCount) || 10;
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : moment().startOf('month').toDate();
      let toDate = req.query.toDate ? new Date(req.query.toDate + " 23:59:59") : moment().endOf('month').toDate();
      console.log(fromDate, toDate);
  
      console.log("query", req.query);
  
      const searchCriteria = {
        $and: [
          {
            $or: [
              
              { type: { $regex: query, $options: "i" } },
              { subject: { $regex: query, $options: "i" } },
            ],
          },
          { createdAt: { $gte: fromDate, $lte: toDate } },
          { ticket_isDeleted: false },
          { raisedBy: new ObjectId(req.params.id) },
        ],
      };
  
      const employees = await Ticket.find(searchCriteria)
        .skip(offset)
        .limit(ITEMS_PER_PAGE);
      const totalCount = await Ticket.countDocuments(searchCriteria);
  
      respObj.Data = employees;
      respObj.totalCount = totalCount;
      respObj.IsSuccess = true;
      res.status(200).json(respObj);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
  
  async function getAllTicket(req, res) {
    try {
      const query = req.query.searchQuery || "";
      const page = parseInt(req.query.pageNumber) || 1;
      const ITEMS_PER_PAGE = parseInt(req.query.pageCount) || 10;
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : moment().startOf('month').toDate();
      let toDate = req.query.toDate ? new Date(req.query.toDate + " 23:59:59") : moment().endOf('month').toDate();
      console.log(fromDate, toDate);
  
      console.log("query", req.query);
      
  
      const searchCriteria = {
        $and: [
         
          {
            $or: [
              { type: { $regex: query, $options: "i" } },
              { subject: { $regex: query, $options: "i" } },
            ],
          },
          { createdAt: { $gte: fromDate, $lte: toDate } },
          { ticket_isDeleted: false },
          
        ],
      };
  
      const tickets = await Ticket.aggregate([
        {
          $match: searchCriteria,
        },
        { $skip: offset },
        { $limit: ITEMS_PER_PAGE },
        {
          $lookup: {
            from: 'employees',
            localField: 'raisedBy',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $project:{
          type:1,
          subject:1,
          description:1,
          startDate:1,
          endDate:1,
          createdAt:1,
          employeeName: '$employee.name',
          employeeId:'$employee._id',
          employeeEmail: '$employee.email',
          }
        }
        
      ]);
  
      console.log("Aggregation result:", tickets); // Log the result for debugging
      const totalCount = await Ticket.countDocuments(searchCriteria);
  
      const respObj = { Data: tickets };
      respObj.totalCount = totalCount;
      res.status(200).json(respObj); // Send response with status 200
    } catch (error) {
      console.error("Error during aggregation:", error); // Log error for debugging
      res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
  }
  
async function updateTicket(req,res){
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let obj = {
      type: req.body.type,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      subject:req.body.subject, 
    }
    let id=new ObjectId(req.params.id);
    console.log('id',id)
    let result = await Ticket.findOneAndUpdate(
      { _id:id },
      { $set: obj },
      { new: true } 
    )
    respObj.IsSuccess = true
    respObj.Data = result
    respObj.Message='Ticket Updated Successfully '
   res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    console.log('r',err)
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function deleteTicket(req,res){
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let id=new ObjectId(req.params.id);
    let result = await Ticket.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ticket_isDeleted: 'true'
        }
      }
    )
    respObj.IsSuccess = true
    respObj.Message='Ticket Deleted Successfully '
    respObj.Data = result._id
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}
async function updateTicketStatus(req,res){
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
   try {
    let obj = {
      status:req.body.status
    
     }
     let id=new ObjectId(req.params.id);
    // Step 1: Update the ticket
    let updatedTicket = await Ticket.findOneAndUpdate(
      { _id: id },
      { $set: obj },
      { new: true }
    );

    if (!updatedTicket) {
      throw new Error('Ticket not found');
    }
    console.log("res",updatedTicket)
    if (updatedTicket.status === 'Approved') {
      const employee = await Employee.findById(updatedTicket.raisedBy);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Convert leavestaken to a number, increment, and update
      const currentLeaveTaken = parseInt(employee.leavestaken, 10);
      const updatedLeaveTaken = currentLeaveTaken + 1;

      const updatedEmployee = await Employee.findOneAndUpdate(
        { _id: updatedTicket.raisedBy },
        { $set: { leavestaken: updatedLeaveTaken.toString() } },
        { new: true }
      );
      console.log("up",updatedEmployee)
      if (!updatedEmployee) {
        throw new Error('Failed to update employee leave count');
      }
    }
    // Step 2: Perform aggregation to get additional details
    let result = await Ticket.aggregate([
      { $match: { _id: new ObjectId(req.params.id)} },
      {
        $lookup: {
          from: 'employees',
          localField: 'raisedBy',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $project: {
          type: 1,
          subject: 1,
          description: 1,
          startDate: 1,
          endDate: 1,
          createdAt: 1,
          status:1,
          employeeName: '$employee.name',
          employeeId: '$employee._id',
          employeeEmail: '$employee.email',
        },
      },
    ]);

    if (!result.length) {
      throw new Error('Failed to retrieve ticket details');
    }


    const respObj = { Data: result };
  
    res.status(200).json(respObj); // Send response with status 200
  } catch (error) {
    console.error("Error during aggregation:", error); // Log error for debugging
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
}
  
module.exports={
    raiseTicket,
    getAllTicket,
    updateTicket,
    deleteTicket,
    updateTicketStatus,
    getAllTicketById
}