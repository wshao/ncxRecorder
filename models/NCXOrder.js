const mongoose = require('mongoose');

const NCXOrderSchema = new mongoose.Schema({
    orderID: { type: String, unique: true },
    approvalDate: String,
    comment: String,
    asin: String,
    sku: String,
    status: String
});

const NCXOrder = mongoose.model('NCXOrder', NCXOrderSchema);

module.exports = NCXOrder;
