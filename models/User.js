import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    activationToken: {
      type: String,
      required: true,
    },
    avatarUrl: String,
    isActivated: Boolean,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('User', UserSchema);
