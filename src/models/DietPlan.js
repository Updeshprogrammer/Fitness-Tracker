import mongoose from 'mongoose';
import { Water_Brush } from 'next/font/google';

const DietDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  meals: [{
    mealType: {
      type: String,
      enum: ['🏋️‍♂️ Breakfast (Pre-workout)', '💪 Breakfast (Post-workout)', '🍎 Mid‑Morning', '🍛 Lunch', '🍽️ Dinner (Light)', '☕ Evening', '💧 Water Intake'],
      required: true,
    },
    food: {
      type: String,
      required: true,
    },
    calories: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  }],
  totalCalories: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const DietPlanSchema = new mongoose.Schema({
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
  dailyCalorieGoal: {
    type: Number,
    default: 2000,
  },
  days: [DietDaySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.DietPlan || mongoose.model('DietPlan', DietPlanSchema);

