const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://skycrm:qwert123@cluster0.olar6uh.mongodb.net/?retryWrites=true&w=majority';

const options = {
  serverSelectionTimeoutMS: 90000,
  connectTimeoutMS: 90000,
  socketTimeoutMS: 90000,
  maxPoolSize: 10,
};

mongoose.connect(MONGODB_URI, options)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

module.exports = mongoose;
