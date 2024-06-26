const Blog = require('../models/blog')
const mongoose = require('mongoose');
const  notify = require('./tokenController');
const ObjectId = require('mongoose').Types.ObjectId;

async function getAllBlogs (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'ok',
    Data: null
  }
  try {
    console.log("body",req.body)
    let query= req.query.searchQuery || "";
    let page = parseInt(req.params.page) || 1; 
    let ITEMS_PER_PAGE = parseInt(req.params.count)
    let offset = (page -1)*ITEMS_PER_PAGE;
    let fromDate = req.body.fromDate ? new Date(req.body.fromDate) : new Date('2019-01-01');
    let toDate =  req.body.toDate ? new Date(req.body.toDate + " 23:59:59") : new Date();
   
 
let matchStage = {
  blog_isDeleted: false,
  isDraft: false,
  blog_Title: { $regex: query, $options: 'i' },
  blog_CreatedOn: {
    $gte: fromDate,
    $lte: toDate
  }
};

if (req.body.statusType === "true") {
  matchStage.blog_isActive =true
}

if (req.body.statusType === "false") {
  matchStage.blog_isActive =false
}
if(req.body.blogType){
  matchStage.blog_Type={ $regex: req.body.blogType, $options: 'i' }
}

let totalBlogs = await Blog.aggregate([
  {
    $match: matchStage
  },
  {
    $count: "totalBlogs"
  }
]);
console.log("totalBlogs",totalBlogs);
const blogs = await Blog.aggregate([
  {
    $match: matchStage
  },
  {
        $lookup: {
          from: 'employees', 
          localField: 'blog_CreatedBy',
          foreignField: '_id',
          as: 'user' 
        }
      },
      {
        $sort: { blog_CreatedOn: -1 }
      }

    
      
    ]).skip(offset).limit(ITEMS_PER_PAGE);

    // console.log("blogs",blogs)
    respObj.IsSuccess = true
    respObj.blogCount=totalBlogs
    respObj.Message='All Blogs Successfully Fetched'
    respObj.Data = blogs
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function getBlogById (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let blog = await Blog.findOne({
      _id: req.params.id
      
    },)
    let resu= await Blog.aggregate([
        {
          $match:{_id:blog._id}
        },
        {
              $lookup: {
                from: 'employees', 
                localField: 'blog_CreatedBy',
                foreignField: '_id',
                as: 'user' 
              }
            },
      ])
    console.log("res",resu)
    respObj.IsSuccess = true
    respObj.Data = resu
   return res.status(200).json(respObj)
  } catch (err) {
    
    (respObj.Message = err.message || 'Error while processing db query'),
     res.status(500).json(respObj)
  }
}
async function createBlog (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null 
  }
  try {
    console.log("body",req.body)
    const id=new ObjectId(req.params.id)
    let obj = {
      blog_Title: req.body.blog_Title,
      blog_CreatedBy:id,
      blog_Body: req.body.blog_Body,
      blog_Type: req.body.blog_Type,
      blog_description: req.body.blog_Description,
     image:req.body.image,
      blog_wordCount:req.body.wordCount ,
      blog_readingTime:req.body.readingTime ,
      tags:req.body.selectedTag,
      isDraft:false,
    }

    if (req.body.Draft === false && req.body.blogId === "") {
      let newBlog = await new Blog(obj).save()
    
      respObj.IsSuccess = true
      respObj.Message = 'Blog Created Successfully'
      respObj.Data = newBlog
      res.status(200).json(respObj)
    } else {
      if(req.body.blogId !== ""){
      const createdByObjectId = new ObjectId(req.body.blogId);
      await Blog.findOneAndUpdate(
        { _id: createdByObjectId },
        { $set: obj },
        { new: true },
      
      )}
     
     
    }
    let msg = `${req.body.blog_Title} Blog is created`;
   
    const notifyResult = await notify.notifycation(msg ,req.body.blog_Description,);
    console.log('Notify Result:', notifyResult);

    respObj.IsSuccess = true
    respObj.Message = 'Blog Created from Draft Successfully'
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function deleteBlog (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    // TODO : Hard delete
    //   let result = await Blog.findOneAndDelete({
    //     _id: req.params.id
    //   });
    // TODO : Soft delete
    let result = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          blog_isDeleted: 'true'
        }
      }
    )
    let totalBlogs =await Blog.countDocuments({
      blog_isDeleted: false,
   
    })
    respObj.totalBlogs=totalBlogs
    respObj.IsSuccess = true
    respObj.Message='Blog Deleted Successfully '
    respObj.Data = result._id
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function updateBlog (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let obj = {
     ...req.body,
      blog_description: req.body.blog_Description,
    
      tags:req.body.selectedTag,
    }
    let result = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      { $set: obj },
      { new: true } 
      
    )
   
    result = await Blog.aggregate([
      {
        $match: {
          _id: result._id 
        }
      },
      {
        $lookup: {
          from: '   employees',
          localField: 'blog_CreatedBy',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    respObj.IsSuccess = true
    respObj.Data = result
    respObj.Message='Blog Updated Successfully '
   res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function getAllActiveBlogs (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let blogs = await Blog.find({
      blog_isActive: true
      
    })

    respObj.IsSuccess = true
    respObj.Data = blogs
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function getAllBlogsByBlogType (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let blogs = await Blog.find({
      blog_Type: req.params.blogType
    })

    respObj.IsSuccess = true
    respObj.Data = blogs
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function getBlogsByUserId (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
    let query= req.query.searchQuery || "";
    const page = parseInt(req.params.page) || 1; 
    const ITEMS_PER_PAGE = parseInt(req.params.count)
    const offset = (page -1)*ITEMS_PER_PAGE;
    const createdByObjectId = new ObjectId(req.params.id);
    const fromDate = req.body.fromDate ? new Date(req.body.fromDate) : new Date('2019-01-01');
    const toDate =  req.body.toDate ? new Date(req.body.toDate  + " 23:59:59")  : new Date();;
   
    let matchStage = {
      blog_isDeleted: false,
      isDraft: false,
      blog_Title: { $regex: query, $options: 'i' },
      blog_CreatedBy: createdByObjectId,
      blog_CreatedOn: {
        $gte: fromDate,
        $lte: toDate
      }
    };
    if (req.body.statusType === "true") {
      matchStage.blog_isActive =true
    }
    
    if (req.body.statusType === "false") {
      matchStage.blog_isActive =false
    }
    if(req.body.blogType){
      matchStage.blog_Type={ $regex: req.body.blogType, $options: 'i' }
    }
    
    
    console.log("matchStage.blog_isActive:", matchStage);
    const blogs = await Blog.aggregate([
      {
        $match: matchStage
      },
      {
        $sort: { blog_CreatedOn: -1 }
      }
    ]).skip(offset).limit(ITEMS_PER_PAGE);
    let totalBlogs = await Blog.aggregate([
      {
        $match: matchStage
      },
      {
        $count: "totalBlogs"
      }
    ]);
    respObj.totalBlogs=totalBlogs
    respObj.IsSuccess = true
    respObj.Data = blogs
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function makeBlogActiveInactive(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: "OK.",
    Data: null,
  };
  try {
   
    let result = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          blog_isActive: (req.params.status),
        }
      },
      { new: true } 
    );
    
    result = await Blog.aggregate([
      {
        $match: {
          _id: result._id 
        }
      },
      {
        $lookup: {
          from: '   employees',
          localField: 'blog_CreatedBy',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);
        
    respObj.IsSuccess = true;
    respObj.Message='Blog Status Changed!'
    respObj.Data = result;
    res.status(200).json(respObj);
  } catch (err) {
    respObj.error = err;
    (respObj.Message = err.message || "Error while processing db query"),
      res.status(500).json(respObj);
  }
}

async function duplicateBlog(req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null 
  }
  try {
    let query= req.query.searchQuery;
    const createdByObjectId = new ObjectId(req.params.id);
    
     const blogId = req.params.blogId;

   
     const blogToDuplicate = await Blog.findById(blogId);
 
   
     if (!blogToDuplicate) {
       return res.status(404).json({ message: 'Blog not found' });
     }
 
      
     const duplicatedBlog = new Blog({
     
       blog_Title: blogToDuplicate.blog_Title + ' (Copy)',
      blog_CreatedBy: req.params.id,
      blog_Body: blogToDuplicate.blog_Body,
      blog_Type: blogToDuplicate.blog_Type,
      blog_description: blogToDuplicate.blog_description,
      image:blogToDuplicate.image,
      blog_wordCount:blogToDuplicate.blog_wordCount ,
      blog_readingTime:blogToDuplicate.blog_readingTime ,
      tags:blogToDuplicate.tags,
      blog_isActive :'false'
      // blog_isActive 
     });
 
   
     const savedBlog = await duplicatedBlog.save();

     const result=   await Blog.aggregate([
      {
        $match: {
          blog_isDeleted: false,
          isDraft:false,
          _id:savedBlog._id
        }
      },
      {
        $lookup: {
          from: '   employees', 
          localField: 'blog_CreatedBy',
          foreignField: '_id',
          as: 'user' 
        }
      },

    ])
    let totalBlogs = await Blog.countDocuments({
      blog_isDeleted: false,
         
    })

    let totalBlogsUser =await Blog.countDocuments({
      blog_isDeleted: false,
      blog_CreatedBy: createdByObjectId,
     
    })
     respObj.totalBlogsUser=totalBlogsUser
     respObj.blogCount=totalBlogs
    respObj.IsSuccess = true
    respObj.Message='Blog Duplicated Successfully '
    respObj.Data = result
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}
async function createBlogAsDraft (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null 
  }
  try {
    console.log("obj",req.body)
    let obj = {
      blog_Title: req.body.blog_Title,
      blog_CreatedBy: req.params.id,
      blog_Body: req.body.blog_Body,
      blog_Type: req.body.blog_Type,
      blog_description: req.body.blog_Description,
      smallImage: req.body.SmallImage,
      thumbNail: req.body.thumbnail,
      blog_wordCount:req.body.wordCount ,
      blog_readingTime:req.body.readingTime ,
      tags:req.body.selectedTag,
      isDraft:'true',
      blog_isActive:'false'
    }
    let newBlog = await new Blog(obj).save()

    respObj.IsSuccess = true
    respObj.Message='Draft Created Successfully '
    respObj.Data = newBlog
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}

async function getDraftBlogById (req, res) {
  let respObj = {
    IsSuccess: false,
    Message: 'OK.',
    Data: null
  }
  try {
   
    let query= req.query.searchQuery || "";
    const createdByObjectId = new ObjectId(req.params.id);
    const page = parseInt(req.params.page) || 1; 
    const ITEMS_PER_PAGE = parseInt(req.params.count)
    const offset = (page -1)*ITEMS_PER_PAGE;
    const blogs = await Blog.aggregate([
      {
        $match: {
          blog_isDeleted: false,
          blog_CreatedBy: createdByObjectId,
          isDraft:true,
           blog_Title: { $regex: query, $options: 'i' }
        }
        
      },{ $sort: { blog_CreatedOn: -1 }}
     
    ]).skip(offset).limit(ITEMS_PER_PAGE);
    let totalBlogs =await Blog.countDocuments({
      blog_isDeleted: false,
      blog_CreatedBy: createdByObjectId,
      isDraft:true,
      blog_Title: { $regex: query, $options: 'i' }
    })
    console.log("getdraft",blogs)
    respObj.totalBlogs=totalBlogs
    respObj.IsSuccess = true
    respObj.Data = blogs
    res.status(200).json(respObj)
  } catch (err) {
    respObj.error = err
    ;(respObj.Message = err.message || 'Error while processing db query'),
      res.status(500).json(respObj)
  }
}


module.exports = {
  getAllBlogs,
  createBlog,
  deleteBlog,
  updateBlog,
  getBlogById,
  getAllActiveBlogs,
  getAllBlogsByBlogType,
  getBlogsByUserId,
  makeBlogActiveInactive,
  duplicateBlog,
  createBlogAsDraft,
  getDraftBlogById,
  
}
