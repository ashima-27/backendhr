let express = require("express");

let router = express.Router();
require("../config/db");
const multer = require('multer');
const { upload } = require('../config/cloudinary');

let employeeCtrl =require("../controllers/employeeController");
let userCtrl =  require("../controllers/userController");
let tokenCtrl=require("../controllers/tokenController");
let meetCtrl=require("../controllers/meetingController");
let ticketCtrl=require("../controllers/ticketController");
let templateCtrl=require("../controllers/templateController");
let recepientCtrl=require("../controllers/recepientController");
let blogCtrl =require('../controllers/blogController')

router.post("/createUser",userCtrl.createUser);
router.post('/loginUser',userCtrl.loginUser);
router.put('/:id/changePassword',userCtrl.changePassword)
router.post("/addEmployee", upload.single("image"), employeeCtrl.addEmployee);
router.get("/getAllEmployees",employeeCtrl.getAllEmployee);
router.post("/save-token",tokenCtrl.saveToken);
router.post("/notify",tokenCtrl.notify);
router.post("/:id/scheduleMeeting",meetCtrl.scheduleMeeting);
router.get("/getAllMeeting",meetCtrl.getAllMeetings);
router.post("/:id/raiseTicket",ticketCtrl.raiseTicket);
router.get("/getAllTicket",ticketCtrl.getAllTicket);
router.get("/getAllNotification",tokenCtrl.getAllNotification);
router.put("/:id/updateTicket",ticketCtrl.updateTicket);
router.put("/:id/deleteTicket",ticketCtrl.deleteTicket);
router.put("/:id/:status/makeActiveInactive",employeeCtrl.makeActiveInactive);
router.get('/:id/getEmployeeById', employeeCtrl.getEmployeeById);
router.get("/:id/getAllMeetingById",meetCtrl.getAllMeetingsById);

router.get('/getAllDepartments', employeeCtrl.getAllDepartments);
router.get('/:departmentId/getAllPositions', employeeCtrl.getAllPositions);
router.put('/:id/updateEmployee',employeeCtrl.updateEmployee);
router.put("/:id/updateMeeting",meetCtrl.updateMeeting);
router.get("/getAllProjects",employeeCtrl.getAllProjects);
router.put("/:id/updateTicketStatus",ticketCtrl.updateTicketStatus);
router.get("/:id/getAllTicketById",ticketCtrl.getAllTicketById);


router.post("/:id/createtemplate",templateCtrl.createTemplate);
router.get("/getAllTemplate",templateCtrl.getAllTemplate);
router.put("/:id/updateTemplate",templateCtrl.updateTemplate)
router.put("/:id/updateTemplateStatus",templateCtrl.updateTemplateStatus)
router.put("/:id/deleteTemplate",templateCtrl.deleteTemplate);

router.post("/:id/sendEmailTemplate",recepientCtrl.createRecepient);
router.get("/allRecepient",recepientCtrl.getAllRecepients)

router.post("/forgotPassword",userCtrl.forgotPassword)
router.post("/resetPassword",userCtrl.resetPassword)

router.post("/getAllBlogs/:page/:count",  blogCtrl.getAllBlogs);
router.get("/getBlogById/:id", blogCtrl.getBlogById);
router.post("/:id/createBlog", blogCtrl.createBlog);

router.put("/deleteBlog/:id", blogCtrl.deleteBlog);
router.put("/updateBlog/:id", blogCtrl.updateBlog);
router.get("/getAllActiveBlogs", blogCtrl.getAllActiveBlogs);
router.get("/getAllBlogsByBlogType/:blogType", blogCtrl.getAllBlogsByBlogType);
router.post("/getBlogsByUserId/:id/:page/:count", blogCtrl.getBlogsByUserId);

router.put("/makeBlogActiveInactive/:id/:status",  blogCtrl.makeBlogActiveInactive);
router.post("/duplicateBlog/:id/:blogId",  blogCtrl.duplicateBlog)

router.post("/:id/createBlogAsDraft",  blogCtrl.createBlogAsDraft);
router.get("/:id/getDraftBlogById/:page/:count",  blogCtrl.getDraftBlogById);


router.get("/", function (req, res) {
    res.json({
      API: "1.0"
    });
  });

  module.exports = router;