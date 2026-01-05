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
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back, {session?.user?.name}! 👋
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
          Track your fitness journey and achieve your goals
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Diet Plans</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.dietPlans}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Workout Plans</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.workoutPlans}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Diet Days Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedDietDays}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Workout Days Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedWorkoutDays}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-xl">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Link href="/dashboard/diet" className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Diet Plans</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Create and track your daily diet plans with meal tracking</p>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline text-sm sm:text-base">Get started →</span>
        </Link>

        <Link href="/dashboard/workout" className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg group-hover:scale-110 transition-transform">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Workout Plans</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Create and track your workout routines with exercise tracking</p>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline text-sm sm:text-base">Get started →</span>
        </Link>
      </div>
    </div>
  );
}

