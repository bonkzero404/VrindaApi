import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Users', UsersSchema);
