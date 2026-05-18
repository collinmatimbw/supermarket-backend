const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://skycrm:qwert123@cluster0.olar6uh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔌 Connecting to MongoDB...');
console.log('🔌 URI:', MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://<user>:<password>@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

module.exports = mongoose;