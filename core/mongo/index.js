const mongoose = require('mongoose');
const CONFIG = require('../config');

const connectMongoDB = async () => {
  try {
    await mongoose.connect( CONFIG.MONGO_DB.MONGODB_URL || "xxxxxxx", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
};

module.exports = connectMongoDB;