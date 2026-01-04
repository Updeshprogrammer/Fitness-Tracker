import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DietPlan from '@/models/DietPlan';
import WorkoutPlan from '@/models/WorkoutPlan';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const dietPlans = await DietPlan.countDocuments({ userId: user._id });
        const workoutPlans = await WorkoutPlan.countDocuments({ userId: user._id });
        
        let dietDays = 0;
        let completedDietDays = 0;
        const userDietPlans = await DietPlan.find({ userId: user._id });
        userDietPlans.forEach(plan => {
          plan.days.forEach(day => {
            dietDays++;
            if (day.completed) completedDietDays++;
          });
        });

        let workoutDays = 0;
        let completedWorkoutDays = 0;
        const userWorkoutPlans = await WorkoutPlan.find({ userId: user._id });
        userWorkoutPlans.forEach(plan => {
          plan.days.forEach(day => {
            workoutDays++;
            if (day.completed) completedWorkoutDays++;
          });
        });

        return {
          ...user.toObject(),
          stats: {
            dietPlans,
            workoutPlans,
            dietDays,
            completedDietDays,
            workoutDays,
            completedWorkoutDays,
          },
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

