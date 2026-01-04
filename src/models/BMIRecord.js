import mongoose from 'mongoose';

const BMIRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  bmi: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['Underweight', 'Normal', 'Overweight', 'Obese'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.BMIRecord || mongoose.model('BMIRecord', BMIRecordSchema);

