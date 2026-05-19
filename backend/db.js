const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://skycrm:qwert123@cluster0.olar6uh.mongodb.net/?retryWrites=true&w=majority';

console.log('🔌 Connecting to MongoDB...');

const options = {
  serverSelectionTimeoutMS: 90000,
  connectTimeoutMS: 90000,
  socketTimeoutMS: 90000,
  maxPoolSize: 10,
};

mongoose.connect(MONGODB_URI, options)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Drop old username index if exists
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('✅ Dropped old username index');
    } catch (e) {
      // Index might not exist, that's fine
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = mongoose;