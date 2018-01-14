import mongoose from 'mongoose';

const AuthSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  plainPassword: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: ['administrator', 'manager', 'user'],
    default: 'user',
    required: true,
  },
  status: {
    type: String,
    enum: ['approval', 'active', 'suspend'],
    default: ['approval'],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Auth', AuthSchema);
