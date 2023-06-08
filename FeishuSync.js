const axios = require('axios');
const NCXOrder = require('./models/NCXOrder');
const FeishuAuth = require('./FeishuAuth');

class FeishuSync {
    constructor(appId,appSecret,appToken, tableId) {
        this.appSecret = appSecret;
        this.appId = appId;
        this.appToken = appToken;
        this.tableId = tableId;
        this.endpoint = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records/batch_create`;
        this.feishuAuth = new FeishuAuth(this.appId,this.appSecret);

    }

    async syncOrders() {
        // 1. 查找所有状态为INIT的订单
        const orders = await NCXOrder.find({status: 'INIT'});

        // 如果没有INIT状态的订单，直接返回
        if (orders.length === 0) {
            console.info("没有需要同步的订单");
            return;
        }

        // 2. 构造请求正文
        const requestBody = {
            "records": orders.map(order => ({
                fields: {
                    "orderID": order.orderID,
                    "approvalDate": order.approvalDate,
                    "comment": order.comment,
                    "asin": order.asin,
                    "sku": order.sku
                }
            }))
        };


        // 打印请求体
        // console.log("请求体:", JSON.stringify(requestBody, null, 2));

        const accessToken = await this.feishuAuth.getAccessToken();

        // 3. 同步所有INIT状态的订单到飞书bitable
        await axios.post(this.endpoint, requestBody, {
            headers: {
                'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json; charset=utf-8'  // 添加Content-Type header
            }
        })
            .then(async (response) => {
                // 如果同步成功，将所有同步的订单的状态更新为PROCESSED
                if (response.status === 200) {
                    console.info('同步Feishu订单成功，现在更改DB中的状态');
                    for (const order of orders) {
                        order.status = 'PROCESSED';
                        await order.save();  // 更新订单状态并保存
                    }
                }
                console.info('同步完成，可以关闭程序');
            })
            .catch((error) => {
                console.error("同步订单时发生错误:", error);
                console.error("错误详情:", error.response && error.response.data && error.response.data.error); // 输出详细的错误信息
            });
    }


}

module.exports = FeishuSync;
