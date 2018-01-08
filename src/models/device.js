import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  deviceid: {
    type: String,
    required: true
  },
  devicelabel: {
    type: String,
  },
  online: {
    type: Number,
    enum: [0, 1],
    default: 1,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, 
		ref: 'Auth',
		required: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Devices', DeviceSchema);
