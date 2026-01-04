'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { UtensilsCrossed, Dumbbell, TrendingUp, Target } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    dietPlans: 0,
    workoutPlans: 0,
    completedDietDays: 0,
    completedWorkoutDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [dietRes, workoutRes] = await Promise.all([
        fetch('/api/diet-plans'),
        fetch('/api/workout-plans'),
      ]);

      const dietPlans = await dietRes.json();
      const workoutPlans = await workoutRes.json();

      let completedDietDays = 0;
      let totalDietDays = 0;
      dietPlans.forEach(plan => {
        plan.days.forEach(day => {
          totalDietDays++;
          if (day.completed) completedDietDays++;
        });
      });

      let completedWorkoutDays = 0;
      let totalWorkoutDays = 0;
      workoutPlans.forEach(plan => {
        plan.days.forEach(day => {
          totalWorkoutDays++;
          if (day.completed) completedWorkoutDays++;
        });
      });

      setStats({
        dietPlans: dietPlans.length,
        workoutPlans: workoutPlans.length,
        completedDietDays,
        completedWorkoutDays,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your fitness journey and achieve your goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.dietPlans}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UtensilsCrossed className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workout Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.workoutPlans}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Dumbbell className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diet Days Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedDietDays}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workout Days Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedWorkoutDays}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/diet" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Diet Plans</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and track your daily diet plans</p>
        </Link>

        <Link href="/dashboard/workout" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Workout Plans</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and track your workout routines</p>
        </Link>
      </div>
    </div>
  );
}

