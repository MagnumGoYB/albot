import { ConnectionOptions } from 'mongoose'
import { NODE_ENV } from '.'

// MongoDB 配置
const mongoUsername = process.env.MONGO_USERNAME || 'albot'
const mongoPassword = process.env.MONGO_PASSWORD || 'albot@q1w2e3'

const dbName =
  NODE_ENV === 'dev'
    ? process.env.MONGO_DB_NAME
      ? process.env.MONGO_DB_NAME
      : 'albot-db'
    : process.env.MONGO_DB_NAME

const mongoHost =
  NODE_ENV === 'dev'
    ? process.env.MONGO_HOST
      ? process.env.MONGO_HOST
      : 'localhost'
    : process.env.MONGO_HOST

const mongoPort =
  NODE_ENV === 'dev'
    ? process.env.MONGO_PORT
      ? Number(process.env.DMONGO_PORT)
      : 27017
    : Number(process.env.MONGO_PORT)

export const mongoConf = {
  user: mongoUsername,
  pass: mongoPassword,
  host: mongoHost,
  port: mongoPort,
  db: dbName
}

const poolSize = process.env.MONGO_POOL_SIZE
  ? Number(process.env.MONGO_POOL_SIZE)
  : 10
const connectTimeoutMS = process.env.MONGO_CONNECT_TIMEOUT_MS
  ? Number(process.env.MONGO_CONNECT_TIMEOUT_MS)
  : 10000

export const mongoOptions: ConnectionOptions = {
  poolSize,
  connectTimeoutMS,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5 * 6000 * 10000, // 重连最长等待时间
  heartbeatFrequencyMS: 5000, // 心跳机制时间
  user: mongoUsername,
  pass: mongoPassword
}
