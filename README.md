# Albot

> 使用 [Wechaty](https://wechaty.js.org/) 开发的一款可以提供数字币价格提醒与报价查询的微信机器人
>
> 数据来源于：https://github.com/xiaohao2019/API-docs

### 本地运行：

确保开发环境中已经运行 MongoDB 服务：

```shell
$ npm install
$ npm start
```

#### 环境变量：

| 变量名称                 | 类型     | 默认值                      | 备注                       |
| ------------------------ | -------- | --------------------------- | -------------------------- |
| NODE_ENV                 | `String` | `dev`                       | 不多解释                   |
| MONGO_USERNAME           | `String` | `albot`                     | MongoDB 用户名             |
| MONGO_PASSWORD           | `String` | `albot@q1w2e3`              | MongoDB 密码               |
| MONGO_DB_NAME            | `String` | `dev` 环境<br />`albot-db`  | MongoDB 集合名称           |
| MONGO_HOST               | `String` | `dev` 环境<br />`localhost` | MongoDB HOST               |
| MONGO_PORT               | `Number` | `27017`                     | MongoDB 端口号             |
| MONGO_POOL_SIZE          | `Number` | `10`                        | MongoDB 连接池数量         |
| MONGO_CONNECT_TIMEOUT_MS | `Number` | `10000`                     | MongoDB 连接超时时间（ms） |
