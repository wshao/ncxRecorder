const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class CSVParser {
    constructor(filePath) {
        this.filePath = filePath;
    }

    parse() {
        return new Promise((resolve, reject) => {
            const orders = [];
            fs.createReadStream(this.filePath)
                .pipe(csv())
                .on('data', (row) => {
                    const feedbacks = row['近期买家反馈-退货'].split('\n'); // 按换行分割多条反馈
                    for (const feedback of feedbacks) {
                        if (feedback.trim() === '') continue;
                        const orderDetails = feedback.split('|');
                        const orderID = orderDetails[0].split('：')[1].trim();
                        const approvalDate = orderDetails[1].split('：')[1].trim();
                        const comment = orderDetails[2].split('：')[1].trim();
                        const asin = row['ASIN'];
                        const sku = row['SKU'];
                        const status = 'INIT';
                        const order = {
                            orderID,
                            approvalDate,
                            comment,
                            asin,
                            sku,
                            status
                        };
                        orders.push(order);
                    }
                })
                .on('end', () => {
                    console.info("文件读取完毕,准备返回orders数据");
                    resolve(orders);
                    console.info("准备修改文件名");
                    // Rename file here
                    const dateStr = new Date().toISOString().slice(0,10);
                    const oldPath = this.filePath;
                    const newPath = path.join(path.dirname(oldPath), `processed_${dateStr}_${path.basename(oldPath)}`);

                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            console.error("重命名文件时发生错误:", err);
                            reject(err);
                        } else {
                            console.info("文件重命名成功:", newPath);
                        }
                    });
                })
                .on('error', reject);
        });
    }
}

module.exports = CSVParser;
