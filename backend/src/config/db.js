import mongoose from "mongoose";

let mongoReady = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("MongoDB is not configured. Using in-memory data for this session.");
    mongoReady = false;
    return false;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    mongoReady = true;
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    mongoReady = false;
    console.warn(`MongoDB unavailable. Using in-memory data. Reason: ${error.message}`);
    return false;
  }
};

export const isMongoConnected = () => mongoReady && mongoose.connection.readyState === 1;
