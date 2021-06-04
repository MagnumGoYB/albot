import { ConnectionOptions } from 'mongoose'
import { NODE_ENV } from '.'

// MongoDB 配置
const mongoUsername = process.env.DB_USERNAME || 'albot'
const mongoPassword = process.env.DB_PASSWORD || 'albot@q1w2e3'

const dbName =
  NODE_ENV === 'dev'
    ? process.env.DB_NAME
      ? process.env.DB_NAME
      : 'albot-db'
    : process.env.DB_NAME

const mongoHost =
  NODE_ENV === 'dev'
    ? process.env.DB_MONGO_HOST
      ? process.env.DB_MONGO_HOST
      : 'localhost'
    : process.env.DB_MONGO_HOST

const mongoPort =
  NODE_ENV === 'dev'
    ? process.env.DB_MONGO_PORT
      ? Number(process.env.DB_MONGO_PORT)
      : 27017
    : Number(process.env.DB_MONGO_PORT)

export const mongoConf = {
  user: mongoUsername,
  pass: mongoPassword,
  host: mongoHost,
  port: mongoPort,
  db: dbName
}

const poolSize = process.env.DB_POOL_SIZE
  ? Number(process.env.DB_POOL_SIZE)
  : 10
const connectTimeoutMS = process.env.DB_CONNECT_TIMEOUT_MS
  ? Number(process.env.DB_CONNECT_TIMEOUT_MS)
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
