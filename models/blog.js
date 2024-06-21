"use strict";
const mongoose = require("mongoose");
const blogSchema = mongoose.Schema(
  {
    blog_Title:{
        type: String,
        required: [true, 'Blog Title is required'],
    },
    blog_CreatedBy:{     
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    blog_CreatedOn:{
        type: Date,
        default: Date.now 
    },
    blog_Body:{
        type: String,
    },
    blog_Type:{
        type: String,
    },
    blog_isDeleted:{
        type: Boolean,
        default: false
    },
    blog_isActive:{
        type: Boolean,
        default: true
    },
    image:{type:String},
    blog_description:String,
    blog_wordCount:{
        type:String
    },
    blog_readingTime:{
        type:String
    },
    tags: [String], 
    isDraft:{
        type: Boolean,
        default: false
    },
  },
  { 
    timestamp: true,
    autoIndex: true,
    versionKey: false, }
);

const blog = (module.exports = mongoose.model(
  "blog",
  blogSchema 
));
