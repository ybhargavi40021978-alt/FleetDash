const mongoose = require("mongoose");

const connectDB = async () => {

    try {

        if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Configure MongoDB in backend/.env.');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {

        console.log("❌ MongoDB Connection Failed");
        console.log(error.message);

        process.exit(1);

    }

};

module.exports = connectDB;