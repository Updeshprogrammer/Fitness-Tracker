import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkoutPlan from '@/models/WorkoutPlan';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { date, exerciseIndex, completed } = await request.json();
    
    const workoutPlan = await WorkoutPlan.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!workoutPlan) {
      return NextResponse.json({ error: 'Workout plan not found' }, { status: 404 });
    }

    const dateStr = new Date(date).toDateString();
    let day = workoutPlan.days.find(d => new Date(d.date).toDateString() === dateStr);

    if (!day) {
      day = {
        date: new Date(date),
        exercises: [],
        completed: false,
      };
      workoutPlan.days.push(day);
    }

    if (exerciseIndex !== undefined) {
      if (!day.exercises[exerciseIndex]) {
        return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
      }
      day.exercises[exerciseIndex].completed = completed;
      
      const allExercisesCompleted = day.exercises.every(e => e.completed);
      day.completed = allExercisesCompleted;
    } else {
      day.completed = completed;
    }

    await workoutPlan.save();
    return NextResponse.json(workoutPlan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

