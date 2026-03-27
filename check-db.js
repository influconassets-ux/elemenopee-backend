import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee");
        const user = await User.findOne({ email: 'admin@elemenopee.com' }).select('+password');
        if (user) {
            console.log('ADMIN_FOUND: true');
            console.log('HAS_PASSWORD: ' + (!!user.password));
        } else {
            console.log('ADMIN_FOUND: false');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
