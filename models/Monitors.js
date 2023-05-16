import mongoose from 'mongoose';

const MonitorsSchema = new mongoose.Schema(
  {

    model: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    screenresolution: {
      type: String,
      required: true,
    },
    update: {
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

export default mongoose.model('Monitors', MonitorsSchema);
