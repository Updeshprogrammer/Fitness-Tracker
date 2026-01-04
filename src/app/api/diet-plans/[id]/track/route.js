import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { date, mealIndex, completed } = await request.json();
    
    const dietPlan = await DietPlan.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!dietPlan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const dateStr = new Date(date).toDateString();
    let day = dietPlan.days.find(d => new Date(d.date).toDateString() === dateStr);

    if (!day) {
      day = {
        date: new Date(date),
        meals: [],
        completed: false,
        totalCalories: 0,
      };
      dietPlan.days.push(day);
    }

    if (mealIndex !== undefined) {
      if (!day.meals[mealIndex]) {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }
      day.meals[mealIndex].completed = completed;
      
      const allMealsCompleted = day.meals.every(m => m.completed);
      day.completed = allMealsCompleted;
    } else {
      day.completed = completed;
    }

    await dietPlan.save();
    return NextResponse.json(dietPlan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

