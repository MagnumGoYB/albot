import mongoose from 'mongoose'

import { DB } from '../../config'

// 连接 MongoDB
const { mongoConf, mongoOptions } = DB
const mongoUrl = `mongodb://${mongoConf.host}:${mongoConf.port}/${mongoConf.db}`
const mongo = mongoose.createConnection(mongoUrl, mongoOptions)

// 设置 Mongoose 全局参数
mongoose.set('returnOriginal', false)

mongo.on('error', console.error)
mongo.on('connected', () => console.log(`Mongo connected at: ${mongoUrl}`))
mongo.on('reconnected', () => console.log('Mongo reconnected!'))
mongo.on('disconnected', () => console.log('Mongo disconnected!'))

export default mongo
