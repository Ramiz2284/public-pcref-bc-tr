import mongoose from 'mongoose';

const AccessoriesSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    case: {
      type: String,
      required: true,
    },
    power: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    storage: {
      type: String,
      required: true,
    },
    processor: {
      type: String,
      required: true,
    },
    memory: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    motherboard: {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    image: {
      type: Array,
      sparse: true
    }

  },
  {
    timestamps: true,

  }
);

export default mongoose.model('Accessories', AccessoriesSchema);
