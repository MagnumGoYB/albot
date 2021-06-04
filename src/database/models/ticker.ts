import { Document, Schema } from 'mongoose'
import mongo from '../mongo'

export interface TickerDocument extends Document {
  name: string
  symbol: string
  value: number
  source: string
  lastUpdatedTime: string
  keyword: string[]
  isValid: boolean
  createdAt: Date
  updatedAt: Date
}

const TickerSchema: Schema<TickerDocument> = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true
    },
    symbol: {
      type: Schema.Types.String,
      required: true
    },
    value: { type: Schema.Types.Number, required: true, default: 0 },
    source: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      sparse: true
    },
    lastUpdatedTime: { type: Schema.Types.String, required: true },
    keyword: { type: [{ type: Schema.Types.String }], select: false },
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

export default mongo.model('Ticker', TickerSchema)
