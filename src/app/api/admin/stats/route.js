import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DietPlan from '@/models/DietPlan';
import WorkoutPlan from '@/models/WorkoutPlan';
import BMIRecord from '@/models/BMIRecord';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDietPlans = await DietPlan.countDocuments();
    const totalWorkoutPlans = await WorkoutPlan.countDocuments();
    const totalBMIRecords = await BMIRecord.countDocuments();

    let totalDietDays = 0;
    let completedDietDays = 0;
    const allDietPlans = await DietPlan.find();
    allDietPlans.forEach(plan => {
      plan.days.forEach(day => {
        totalDietDays++;
        if (day.completed) completedDietDays++;
      });
    });

    let totalWorkoutDays = 0;
    let completedWorkoutDays = 0;
    const allWorkoutPlans = await WorkoutPlan.find();
    allWorkoutPlans.forEach(plan => {
      plan.days.forEach(day => {
        totalWorkoutDays++;
        if (day.completed) completedWorkoutDays++;
      });
    });

    const activeUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalDietPlans,
      totalWorkoutPlans,
      totalBMIRecords,
      totalDietDays,
      completedDietDays,
      totalWorkoutDays,
      completedWorkoutDays,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

