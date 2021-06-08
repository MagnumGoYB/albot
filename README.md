# Albot

> 使用 [Wechaty](https://wechaty.js.org/) 开发的一款可以提供数字币价格提醒与报价查询的微信机器人
>
> 数据来源于：https://github.com/xiaohao2019/API-docs

### 例子：

<img width="150" height="150" src="https://tva1.sinaimg.cn/large/008i3skNly1grawq9i616j30by0bymy0.jpg" alt="Albot" />

### 功能列表：

1. **查询币种价格：**

   输入币种名称或符号，如：`eth` `bitcoin`

2. **订阅价格预警**

   新增订阅方式：输入 $ `+` _(币种名称或符号)_ `>` 或 `<` 触发价格 $，如：`+eth>3000` `+eth<1000`

   删除已订阅方式：输入 $ `-` _(币种名称或符号)_ `>` 或 `<` 触发价格 $，如：`-eth>3000` `-eth<1000`

   > 每个用户最多订阅 5 条，触发 3 次提醒后自动清除该条订阅

3. **获取已订阅列表**

   输入关键字：`查询` `订阅列表`

### 开发：

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
