import mongoose from 'mongoose';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const email = 'admin@elemenopee.com';
        const newPassword = 'adminpassword123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email },
            { 
                password: hashedPassword,
                role: 'admin',
                name: 'Admin'
            },
            { upsert: true, new: true }
        );

        console.log('Admin user updated/created successfully:', user.email);
        process.exit(0);
    } catch (err) {
        console.error('Error resetting admin:', err);
        process.exit(1);
    }
};

resetAdmin();
