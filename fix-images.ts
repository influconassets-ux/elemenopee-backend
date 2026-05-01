import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const CLOUDINARY_BASE = "https://res.cloudinary.com/dpjcwbxhp/image/upload/";

const fixImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee");
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Checking ${products.length} products...`);

        let updatedCount = 0;

        for (const product of products) {
            let changed = false;

            // Fix imageUrl
            if (product.imageUrl &&
                !product.imageUrl.startsWith('http') &&
                !product.imageUrl.startsWith('/') &&
                product.imageUrl.length > 5) {
                console.log(`Fixing imageUrl for ${product.title}: ${product.imageUrl}`);
                product.imageUrl = CLOUDINARY_BASE + product.imageUrl;
                changed = true;
            }

            // Fix images array
            if (product.images && product.images.length > 0) {
                const newImages = product.images.map(img => {
                    if (img && !img.startsWith('http') && !img.startsWith('/') && img.length > 5) {
                        changed = true;
                        console.log(`Fixing image in array for ${product.title}: ${img}`);
                        return CLOUDINARY_BASE + img;
                    }
                    return img;
                });
                product.images = newImages;
            }

            if (changed) {
                await product.save();
                updatedCount++;
            }
        }

        console.log(`Fixed ${updatedCount} products.`);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing images:', err);
        process.exit(1);
    }
};

fixImages();
