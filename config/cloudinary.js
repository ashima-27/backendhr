const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
    
  cloudinary: cloudinary,
  params: {
    folder: "employee_images",
    public_id: (req, file) => `empImage_${Date.now()}`,
  },

 
});



// const destroyImage = async (publicId) => {
//     try {
//         console.log("id",publicId)
//       const deletionResult = await cloudinary.uploader.destroy(publicId);
//       if (deletionResult.result === 'ok') {
//         console.log('Image successfully destroyed:', deletionResult);
//         return { success: true };
//       } else {
//         console.error('Failed to destroy image:', deletionResult);
//         return { success: false, error: 'Failed to destroy image' };
//       }
//     } catch (error) {
//       console.error('Error occurred while destroying image:', error);
//       return { success: false, error: 'Error occurred while destroying image' };
//     }
//   };
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
