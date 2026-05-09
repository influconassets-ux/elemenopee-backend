const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema, 'orders');

const MongoDB_Url = process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee";

mongoose.connect(MongoDB_Url).then(async () => {
    console.log("Connected to MongoDB");
    
    const total = await Order.countDocuments({});
    console.log("Total orders in collection:", total);
    
    const sample = await Order.findOne({});
    if (sample) {
        console.log("Sample order keys:", Object.keys(sample.toObject()));
        console.log("Sample order status:", sample.orderStatus);
        console.log("Sample payment status:", sample.paymentStatus);
    }
    
    const valid = await Order.countDocuments({
        isDeleted: { $ne: true },
        $or: [
            { paymentStatus: "paid" },
            { paymentMethod: "COD" }
        ],
        orderStatus: { $nin: ["cancelled", "refunded"] },
        paymentStatus: { $nin: ["failed", "refunded"] }
    });
    console.log("Orders matching RANGE_FILTER:", valid);
    
    process.exit(0);
}).catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
