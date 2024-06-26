const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const moment = require("moment");
const Position = require("../models/Position");
const Department = require("../models/Department");
const Projects =require("../models/Projects");
const { upload ,destroyImage } = require("../config/cloudinary");
const ObjectId = require('mongoose').Types.ObjectId;

async function addEmployee(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: "OK..",
    Data: null,
  };
  try {
    console.log(req.body, req.file);
    const { email, role, department } = req.body;
    let isUser = await Employee.findOne({ email });
    const highestEmp = await Employee.findOne().sort('-empId').exec();
    const newEmpId = highestEmp ? highestEmp.empId + 1 : 1916067;

    if (isUser) {
      return res.status(409).json(respObj.Message="Employee Already Exists!");
    } else {
      const picname = req.file ? req.file.path : null;
      const newEmployee = new Employee({
        ...req.body,
        image: picname,
        positionId: role,
        departmentId: department,
        empId: newEmpId,role:req.body.permission,positionId:req.body.role
      });

      const savedEmployee = await newEmployee.save();
     respObj = {
        IsSuccess: false,
        Message: "Employee Added.",
        Data: savedEmployee,
      };
      res.status(200).json(respObj);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getAllEmployee(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: "OK..",
    Data: null,
  };
  try {
    let query = req.query.searchQuery || "";
    let page = parseInt(req.query.pageNumber) || "";
    let ITEMS_PER_PAGE = parseInt(req.query.pageCount) || "";
    let offset = (page - 1) * ITEMS_PER_PAGE;
    const lastMonth = moment().subtract(1, "months").toDate();
    console.log("query", req.query);
    const employeesAggregation = await Employee.aggregate([
      {
        $facet: {
          employees: [
            {
              $match: {
                $or: [
                  { name: { $regex: query, $options: "i" } },
                  { email: { $regex: query, $options: "i" } },
                ],
              },
            },
            { $sort: { empId: 1 } },
            { $skip: offset },
            { $limit: ITEMS_PER_PAGE },
          ],
          totalEmployees: [{ $count: "total" }],
          MaleEmployees: [{ $match: { gender: "Male" } }, { $count: "count" }],
          FemaleEmployees: [
            { $match: { gender: "Female" } },
            { $count: "count" },
          ],
          newEmployees: [
            { $match: { joiningDate: { $gte: lastMonth } } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const employees = employeesAggregation[0].employees;
    const totalEmployees =
      employeesAggregation[0].totalEmployees[0]?.total || 0;
    const MaleEmployees = employeesAggregation[0].MaleEmployees[0]?.count || 0;
    const FemaleEmployees =
      employeesAggregation[0].FemaleEmployees[0]?.count || 0;
    const newEmployees = employeesAggregation[0].newEmployees[0]?.count || 0;

    // Fetch department, position, and project details based on IDs
    const departmentPromises = employees.map(employee =>
      Department.findById(employee.departmentId)
    );
    const positionPromises = employees.map(employee =>
      Position.findById(employee.positionId)
    );
    const projectPromises = employees.map(employee =>
      Projects.findById(employee.projectId)
    );

    const departments = await Promise.all(departmentPromises);
    const positions = await Promise.all(positionPromises);
    const projects = await Promise.all(projectPromises);

    employees.forEach((employee, index) => {
      employee.department = departments[index]?.departmentName;
      employee.position = positions[index]?.title;
      employee.project = projects[index]?.projectName;
    });

    respObj.count = totalEmployees;
    respObj.Data = employees;
    respObj.maleEmployees = MaleEmployees;
    respObj.femaleEmployees = FemaleEmployees;
    respObj.newEmployees = newEmployees;

    res.status(200).json(respObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getEmployeeById(req, res) {
  let respObj={
    Data:null
  }
  try {
    let id = new ObjectId(req.params.id);
    const employeeId = id;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const department=await Department.findById(employee.departmentId)
    const position =await Position.findById(employee.positionId)
    const project =await Projects.findById(employee.projectId)
    
    respObj.department=department?.departmentName
    respObj.position=position?.title
    respObj.project=project?.projectName
    respObj.Data=employee
    res.status(200).json(respObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function makeActiveInactive(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: "OK.",
    Data: null,
  };
  try {
    let result = await Employee.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          status: req.params.status,
        },
      },
      { new: true }
    );

    respObj.IsSuccess = true;
    respObj.Message = "Employee Status Changed!";
    respObj.Data = result;
    res.status(200).json(respObj);
  } catch (err) {
    respObj.error = err;
    (respObj.Message = err.message || "Error while processing db query"),
      res.status(500).json(respObj);
  }
}

async function getAllDepartments(req, res) {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getAllProjects(req, res) {
  try {
    const project = await Projects.find();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function getAllPositions(req, res) {
  try {
    const departmentId = req.params.departmentId;
    console.log("dep", departmentId);
    const positions = await Position.find({ departmentId: departmentId });
    console.log("pos", positions);
    if (positions.length > 0) {
      console.log("Positions for department:");
      console.log(positions); // Array of position objects
    } else {
      console.log("No positions found for the department");
    }
    res.status(200).json(positions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateEmployee(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: "OK.",
    Data: null,
  };
  try {
    console.log("req",req)

    
    let id = new ObjectId(req.params.id);
    let projectId=new ObjectId(req.body.projectId); 
    let departmentId=new ObjectId(req.body.departmentId); 
    let positionId=new ObjectId(req.body.positionId); 
  
    let result = await Employee.findOneAndUpdate(
      { _id: id },
      { $set: { ...req.body,projectId:projectId,positionId:positionId,departmentId:departmentId } }, // Update the image field in the database
      { new: true }
    );

    result = await Employee.aggregate([
      {
        $match: {
          _id: result._id,
        },
      },
    ]);
    console.log("up",respObj)
    respObj.IsSuccess = true;
    respObj.Data = result;
    respObj.Message = "Employee Updated Successfully ";
    res.status(200).json(respObj);
  } catch (err) {
    respObj.error = err;
    respObj.Message = err.message || "Error while processing db query";
    res.status(500).json(respObj);
  }
}


module.exports = {
  addEmployee,
  getAllEmployee,
  getEmployeeById,
  makeActiveInactive,
  getAllDepartments,
  getAllPositions,
  updateEmployee,
  getAllProjects
};
