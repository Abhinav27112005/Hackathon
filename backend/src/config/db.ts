import mongoose from "mongoose";

const connectDb = async () => {
    try {
        // Validate MongoDB URI exists
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

    } catch (error) {
        console.error("❌ MongoDB Connection Error:");
        if (error instanceof Error) {
            console.error(`   Message: ${error.message}`);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

export default connectDb;
