const mongoose = require('mongoose');
const CSVParser = require('./CSVParser');
const NCXOrder = require('./models/NCXOrder');
const FeishuSync = require('./FeishuSync');


/**
 * 1. Read CSVData Into Array
 * 1.1 Find the file
 * 1.2 Read the file
 * 1.3 Rename the file
 */

const csvParser = new CSVParser('./workspace/ncx-data-0409.csv');


// 连接到 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017/ncxRecorder', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));


const appId = "cli_a4ba544859f8900d";
const appSecret = "4m5FvfleR8r6N55zMqzYJeQKAhYmCFzI";
const appToken = "EV2ZbNZqNanfVRsSH4gcfSHKnyg";
const tableId = "tbla7Med3RvKSBml";

async function main() {
    // Use the csvParser to parse the file and get the orders
    let orders = await csvParser.parse();

    // Save the orders to the database
    await saveOrders(orders);

    let feishuSync = new FeishuSync(appId, appSecret, appToken, tableId);
    await feishuSync.syncOrders();
}

async function saveOrders(orders) {
    for (let order of orders) {
        let existingOrder = await NCXOrder.findOne({orderID: order.orderID});
        if (!existingOrder) {
            let newOrder = new NCXOrder(order);
            await newOrder.save();
        }
    }
}

// main();


exports.handler = async function (event, context, callback) {

    console.log("LOGI-TRACK SERVICE STARTED");
    await main();
    callback(null, "LOGI-TRACK SERVICE STARTED COMPLETED");
};