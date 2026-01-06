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

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const dietPlan = await DietPlan.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!dietPlan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    // Ensure days is always an array to avoid runtime errors on legacy data
    if (!Array.isArray(dietPlan.days)) {
      dietPlan.days = [];
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const dateStr = targetDate.toDateString();
    let day = dietPlan.days.find(d => new Date(d.date).toDateString() === dateStr);

    if (!day) {
      day = {
        date: targetDate,
        meals: [],
        completed: false,
        totalCalories: 0,
      };
      dietPlan.days.push(day);
    }

    if (mealIndex !== undefined) {
      // Normalise index to integer and validate bounds
      const idx = Number(mealIndex);
      if (!Array.isArray(day.meals) || idx < 0 || !Number.isInteger(idx) || idx >= day.meals.length) {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }

      day.meals[idx].completed = completed;

      const allMealsCompleted = day.meals.length > 0 && day.meals.every(m => m.completed);
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

