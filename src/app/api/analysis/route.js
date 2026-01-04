import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import WorkoutPlan from '@/models/WorkoutPlan';
import BMIRecord from '@/models/BMIRecord';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const dietPlans = await DietPlan.find({
      userId: session.user.id,
      createdAt: { $gte: startDate },
    });

    const workoutPlans = await WorkoutPlan.find({
      userId: session.user.id,
      createdAt: { $gte: startDate },
    });

    const bmiRecords = await BMIRecord.find({
      userId: session.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    let dietStats = {
      totalPlans: dietPlans.length,
      completedDays: 0,
      totalDays: 0,
      totalCalories: 0,
      averageCalories: 0,
    };

    dietPlans.forEach(plan => {
      plan.days.forEach(day => {
        dietStats.totalDays++;
        if (day.completed) dietStats.completedDays++;
        dietStats.totalCalories += day.totalCalories || 0;
      });
    });

    dietStats.averageCalories = dietStats.totalDays > 0 
      ? Math.round(dietStats.totalCalories / dietStats.totalDays) 
      : 0;

    let workoutStats = {
      totalPlans: workoutPlans.length,
      completedDays: 0,
      totalDays: 0,
      totalExercises: 0,
      completedExercises: 0,
    };

    workoutPlans.forEach(plan => {
      plan.days.forEach(day => {
        workoutStats.totalDays++;
        if (day.completed) workoutStats.completedDays++;
        workoutStats.totalExercises += day.exercises.length;
        workoutStats.completedExercises += day.exercises.filter(e => e.completed).length;
      });
    });

    return NextResponse.json({
      diet: dietStats,
      workout: workoutStats,
      bmi: bmiRecords,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

