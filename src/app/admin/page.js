'use client';

import { useState, useEffect } from 'react';
import { Users, UtensilsCrossed, Dumbbell, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!stats) {
    return <div className="p-6">No data available</div>;
  }

  const dietCompletionRate = stats.totalDietDays > 0
    ? ((stats.completedDietDays / stats.totalDietDays) * 100).toFixed(1)
    : 0;

  const workoutCompletionRate = stats.totalWorkoutDays > 0
    ? ((stats.completedWorkoutDays / stats.totalWorkoutDays) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of all users and their fitness tracking activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.activeUsers} active this month
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalDietPlans}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dietCompletionRate}% completion rate
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <UtensilsCrossed className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workout Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalWorkoutPlans}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {workoutCompletionRate}% completion rate
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Dumbbell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">BMI Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalBMIRecords}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total calculations
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Users</h2>
              <p className="text-gray-600 dark:text-gray-400">View all users and their statistics</p>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Overview</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Diet Days: {stats.completedDietDays}/{stats.totalDietDays} | 
                Workout Days: {stats.completedWorkoutDays}/{stats.totalWorkoutDays}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

