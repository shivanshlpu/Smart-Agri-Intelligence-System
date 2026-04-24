const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("💡 Make sure your MONGO_URI in backend/.env is correct.");
    console.log("   Using mock mode — predictions will not be saved to DB.");
    // Don't exit — allow app to run without DB (for development/demo)
  }
};

module.exports = connectDB;
