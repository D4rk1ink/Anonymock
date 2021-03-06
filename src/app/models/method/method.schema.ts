import { Schema, Types } from 'mongoose'
import { encrypt } from '../../utils/encrypt.util'
import * as timestamps from 'mongoose-timestamp'

const MethodSchema = new Schema({
    name: {
        type: String,
        required: true
    },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
    }
)

MethodSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

MethodSchema.plugin(timestamps)

export default MethodSchema
