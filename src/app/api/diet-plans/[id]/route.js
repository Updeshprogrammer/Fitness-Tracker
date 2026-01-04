import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const dietPlan = await DietPlan.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!dietPlan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    return NextResponse.json(dietPlan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    
    const dietPlan = await DietPlan.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      data,
      { new: true }
    );

    if (!dietPlan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    return NextResponse.json(dietPlan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const dietPlan = await DietPlan.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!dietPlan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Diet plan deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

