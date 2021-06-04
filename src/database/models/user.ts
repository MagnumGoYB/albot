import { Document, Schema } from 'mongoose'
import mongo from '../mongo'

export interface UserDocument extends Document {
  name: string
  isValid: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema<UserDocument> = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      sparse: true
    },
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

export default mongo.model('User', UserSchema)
