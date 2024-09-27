const Template = require("../models/EmailTemplates");
const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

async function createTemplate(req, res) {
  try {
    console.log("req.body", req.body);
    let id = new ObjectId(req.params.id);

    const newTemplate = new Template({ ...req.body, createdBy: id });
    const savedTemplate = await newTemplate.save();
    res.status(200).json(savedTemplate);
  } catch (error) {
    console.log("errpr", error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllTemplate(req, res) {
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

    console.log('fromDate:', fromDate, 'toDate:', toDate);

    const searchCriteria = {
      $and: [
        {
          $or: [
            { title: { $regex: query, $options: "i" } }
          ]
        },
        { createdAt: { $gte: fromDate, $lte: toDate } } 
      ]
    };

    console.log('searchCriteria:', JSON.stringify(searchCriteria));


    const templates = await Template.find(searchCriteria)
      .populate('createdBy') 
      .skip(offset)         
      .limit(ITEMS_PER_PAGE);

    console.log('Fetched templates:', templates);

    
    const totalCount = await Template.countDocuments(searchCriteria);
    console.log('Total count:', totalCount);


    const respObj = { Data: templates, totalCount };
    res.status(200).json(respObj);

  } catch (error) {
    console.error('Error during aggregation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateTemplate(req,res){
    let respObj = {
      IsSuccess: false,
      Message: 'OK.',
      Data: null
    }
    try {
      
      let id=new ObjectId(req.params.id);
      console.log('id',id)
      let result = await Template.findOneAndUpdate(
        { _id:id },
        { $set: req.body },
        { new: true } 
        
      )
      let result2=await Template.aggregate([
        { $match: { _id: new ObjectId(req.params.id)} },
        {
          $lookup: {
            from: 'employees',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $project: {
            employeeName: '$employee.name',
            employeeId:'$employee._id',
            employeeEmail: '$employee.email',
            templateName:'$template.title',
            createdAt: 1 ,
            status:1,
            title:1,
            template:1,
            description:1,
            placeholder:1,
            

        }
        },
      ])
      respObj.IsSuccess = true
      respObj.Data = result2
      respObj.Message='Template Updated Successfully '
     res.status(200).json(respObj)
    } catch (err) {
      respObj.error = err
      console.log('r',err)
      ;(respObj.Message = err.message || 'Error while processing db query'),
        res.status(500).json(respObj)
    }
  }
  
  async function deleteTemplate(req,res){
    let respObj = {
      IsSuccess: false,
      Message: 'OK.',
      Data: null
    }
    try {
      let id=new ObjectId(req.params.id);
      let result = await Template.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            Template_isDeleted: 'true'
          }
        }
      )
      respObj.IsSuccess = true
      respObj.Message='Template Deleted Successfully '
      respObj.Data = result._id
      res.status(200).json(respObj)
    } catch (err) {
      respObj.error = err
      ;(respObj.Message = err.message || 'Error while processing db query'),
        res.status(500).json(respObj)
    }
  }
  async function updateTemplateStatus(req,res){
    let respObj = {
      IsSuccess: false,
      Message: 'OK.',
      Data: null
    }
    try {
      let obj = {
       status: !req.body.status    
      }
      let id=new ObjectId(req.params.id);
      console.log('id',id)
      let result = await Template.findOneAndUpdate(
        { _id:id },
        { $set: obj },
        { new: true } 
        
      )
      let result2=await Template.aggregate([
        { $match: { _id: new ObjectId(req.params.id)} },
        {
          $lookup: {
            from: 'employees',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $project: {
            employeeName: '$employee.name',
            employeeId:'$employee._id',
            employeeEmail: '$employee.email',
            templateName:'$template.title',
            createdAt: 1 ,
            status:1,
            title:1,
            template:1,
            description:1,
            placeholder:1,
            

        }
        },
      ])
      respObj.IsSuccess = true
      respObj.Data = result2
      respObj.Message='Template Updated Successfully '
     res.status(200).json(respObj)
    } catch (err) {
      respObj.error = err
      console.log('r',err)
      ;(respObj.Message = err.message || 'Error while processing db query'),
        res.status(500).json(respObj)
    }
  }
module.exports = {
  createTemplate,
  getAllTemplate,
  updateTemplate,
  deleteTemplate,
  updateTemplateStatus
};
