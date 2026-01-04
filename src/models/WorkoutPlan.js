import mongoose from 'mongoose';

const WorkoutDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  exercises: [{
    name: {
      type: String,
      required: true,
    },
    sets: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  }],
  completed: {
    type: Boolean,
    default: false,
  },
});

const WorkoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  days: [WorkoutDaySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.WorkoutPlan || mongoose.model('WorkoutPlan', WorkoutPlanSchema);

