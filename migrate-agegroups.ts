import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const migrateAgeGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee");
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products to check...`);

        let updatedCount = 0;

        for (const product of products) {
            if (product.ageGroup) {
                const agLower = String(product.ageGroup).trim().toLowerCase();
                let mappedAgeGroup = null;

                if (agLower === "jnr" || agLower === "junior" || agLower === "juniors" || agLower.includes("2-8")) {
                    mappedAgeGroup = "Junior (2-8 Yrs)";
                } else if (agLower === "snr" || agLower === "senior" || agLower === "seniors" || agLower.includes("9-16")) {
                    mappedAgeGroup = "Senior (9-16 Yrs)";
                } else if (agLower === "infant" || agLower === "infants" || agLower.includes("6-24")) {
                    mappedAgeGroup = "Infant (6-24 Months)";
                }

                if (mappedAgeGroup && product.ageGroup !== mappedAgeGroup) {
                    console.log(`Updating ageGroup for "${product.title}": "${product.ageGroup}" -> "${mappedAgeGroup}"`);
                    product.ageGroup = mappedAgeGroup;
                    await product.save();
                    updatedCount++;
                }
            }
        }

        console.log(`Migration complete! Successfully updated ${updatedCount} products.`);
        process.exit(0);
    } catch (err) {
        console.error('Error migrating ageGroups:', err);
        process.exit(1);
    }
};

migrateAgeGroups();
