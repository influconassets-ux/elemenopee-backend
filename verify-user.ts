import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const verifyUser = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error('MONGO_URL not found in env');
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUrl);
        console.log('Connected.');

        const user = await User.findOne({ email: 'admin@elemenopee.com' }).select('+password');
        if (!user) {
            console.log('STATUS: NOT_FOUND');
        } else if (!user.password) {
            console.log('STATUS: EXISTS_WITHOUT_PASSWORD');
        } else {
            console.log('STATUS: READY');
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
    }
};

verifyUser();
