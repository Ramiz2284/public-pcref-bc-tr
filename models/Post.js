import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
    },
    processor: {
      type: String,
      required: true,
    },
    memory: {
      type: String,
      required: true,
    },
    storage: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: false,
    },
    tel: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },

    image: {
      type: Array,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,

  },
);

export default mongoose.model('Post', PostSchema);
