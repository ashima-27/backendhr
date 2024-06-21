const mongoose = require('mongoose');

// Replace the placeholders with your actual MongoDB credentials
const uri = process.env.DB;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 50000, // 30 seconds
  socketTimeoutMS: 45000 // 45 seconds
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});
