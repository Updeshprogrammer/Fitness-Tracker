import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import WorkoutPlan from '@/models/WorkoutPlan';
import BMIRecord from '@/models/BMIRecord';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const user = await User.findById(session.user.id);
    const dietPlans = await DietPlan.find({ userId: session.user.id }).sort({ createdAt: -1 });
    const workoutPlans = await WorkoutPlan.find({ userId: session.user.id }).sort({ createdAt: -1 });
    const bmiRecords = await BMIRecord.find({ userId: session.user.id }).sort({ date: -1 });

    let reportData = {
      user: {
        name: user.name,
        email: user.email,
        height: user.height,
        weight: user.weight,
      },
      generatedAt: new Date().toISOString(),
    };

    if (type === 'diet' || type === 'all') {
      reportData.dietPlans = dietPlans.map(plan => ({
        name: plan.name,
        description: plan.description,
        startDate: plan.startDate,
        endDate: plan.endDate,
        dailyCalorieGoal: plan.dailyCalorieGoal,
        totalDays: plan.days.length,
        completedDays: plan.days.filter(d => d.completed).length,
        days: plan.days.map(day => ({
          date: day.date,
          completed: day.completed,
          totalCalories: day.totalCalories,
          meals: day.meals,
        })),
      }));
    }

    if (type === 'workout' || type === 'all') {
      reportData.workoutPlans = workoutPlans.map(plan => ({
        name: plan.name,
        description: plan.description,
        startDate: plan.startDate,
        endDate: plan.endDate,
        totalDays: plan.days.length,
        completedDays: plan.days.filter(d => d.completed).length,
        days: plan.days.map(day => ({
          date: day.date,
          completed: day.completed,
          exercises: day.exercises,
        })),
      }));
    }

    if (type === 'analysis' || type === 'all') {
      let dietStats = {
        totalPlans: dietPlans.length,
        completedDays: 0,
        totalDays: 0,
        totalCalories: 0,
      };

      dietPlans.forEach(plan => {
        plan.days.forEach(day => {
          dietStats.totalDays++;
          if (day.completed) dietStats.completedDays++;
          dietStats.totalCalories += day.totalCalories || 0;
        });
      });

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

      reportData.analysis = {
        diet: dietStats,
        workout: workoutStats,
        bmiRecords: bmiRecords.map(r => ({
          date: r.date,
          height: r.height,
          weight: r.weight,
          bmi: r.bmi,
          category: r.category,
        })),
      };
    }

    return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

