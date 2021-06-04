import { Document, Schema } from 'mongoose'
import mongo from '../mongo'
import { TickerDocument } from './ticker'

export interface SubscriptionDocument extends Document {
  userId: string
  ticker: string & TickerDocument
  formula: 'lt' | 'gt'
  triggerValue: number
  remainingTimes: number // 剩余提醒次数，默认 3 次
  isValid: boolean
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema: Schema<SubscriptionDocument> = new Schema(
  {
    userId: { type: Schema.Types.String, required: true },
    ticker: { type: Schema.Types.ObjectId, ref: 'Ticker', required: true },
    formula: {
      type: Schema.Types.String,
      required: true,
      enum: ['lt', 'gt']
    },
    triggerValue: { type: Schema.Types.Number, required: true },
    remainingTimes: { type: Schema.Types.Number, require: true, default: 3 },
    isValid: {
      type: Schema.Types.Boolean,
      required: true,
      default: true,
      select: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export default mongo.model('Subscription', SubscriptionSchema)
