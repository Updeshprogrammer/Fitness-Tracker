'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [period]);

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(`/api/analysis?period=${period}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/reports?type=analysis');
      const data = await res.json();
  
      const doc = new jsPDF();
  
      /* ---------------- LOGO ---------------- */
      const logoImg = new Image();
      logoImg.src = '/logo.webp';
  
      await new Promise(resolve => {
        logoImg.onload = resolve;
      });
  
      doc.addImage(logoImg, 'WEBP', 14, 10, 30, 30);
  
      /* ---------------- HEADER ---------------- */
      doc.setFontSize(20);
      doc.text('Fitness Tracker App', 50, 20);
  
      doc.setFontSize(14);
      doc.text('Analysis Report', 50, 28);
  
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 34);
  
      doc.text(`Name: ${data.user.name}`, 14, 48);
      doc.text(`Email: ${data.user.email}`, 14, 54);
  
      let yPos = 65;
  
      /* ---------------- DIET STATISTICS ---------------- */
      doc.setFontSize(14);
      doc.text('Diet Statistics', 14, yPos);
      yPos += 10;
  
      doc.setFontSize(10);
      doc.text(`Total Plans: ${data.analysis.diet.totalPlans}`, 14, yPos);
      yPos += 6;
  
      doc.text(
        `Completed Days: ${data.analysis.diet.completedDays}/${data.analysis.diet.totalDays}`,
        14,
        yPos
      );
      yPos += 6;
  
      doc.text(
        `Total Calories: ${data.analysis.diet.totalCalories}`,
        14,
        yPos
      );
      yPos += 15;
  
      /* ---------------- WORKOUT STATISTICS ---------------- */
      doc.setFontSize(14);
      doc.text('Workout Statistics', 14, yPos);
      yPos += 10;
  
      doc.setFontSize(10);
      doc.text(`Total Plans: ${data.analysis.workout.totalPlans}`, 14, yPos);
      yPos += 6;
  
      doc.text(
        `Completed Days: ${data.analysis.workout.completedDays}/${data.analysis.workout.totalDays}`,
        14,
        yPos
      );
      yPos += 6;
  
      doc.text(
        `Completed Exercises: ${data.analysis.workout.completedExercises}/${data.analysis.workout.totalExercises}`,
        14,
        yPos
      );
      yPos += 15;
  
      /* ---------------- BMI HISTORY ---------------- */
      if (data.analysis.bmiRecords?.length > 0) {
        doc.setFontSize(14);
        doc.text('BMI History', 14, yPos);
        yPos += 8;
  
        const bmiData = data.analysis.bmiRecords.map(r => [
          new Date(r.date).toLocaleDateString(),
          r.height,
          r.weight,
          r.bmi,
          r.category,
        ]);
  
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Height (cm)', 'Weight (kg)', 'BMI', 'Category']],
          body: bmiData,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229] }, // Indigo
        });
      }
  
      /* ---------------- FOOTER ---------------- */
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          'Fitness Tracker App • Complete Health Analytics',
          14,
          290
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          190,
          290,
          { align: 'right' }
        );
      }
  
      doc.save(`analysis-report-${Date.now()}.pdf`);
      toast.success('Analysis report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download analysis report');
    }
  };
  
  
  
  

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!analysis) {
    return <div className="p-6">No data available</div>;
  }

  const dietCompletionRate = analysis.diet.totalDays > 0 
    ? ((analysis.diet.completedDays / analysis.diet.totalDays) * 100).toFixed(1)
    : 0;

  const workoutCompletionRate = analysis.workout.totalDays > 0
    ? ((analysis.workout.completedDays / analysis.workout.totalDays) * 100).toFixed(1)
    : 0;

  const bmiChartData = analysis.bmi.map((record, index) => ({
    date: new Date(record.date).toLocaleDateString(),
    bmi: record.bmi,
    weight: record.weight,
  }));

  const weeklyData = [];
  if (analysis.bmi.length > 0) {
    const weeks = Math.ceil(analysis.bmi.length / 7);
    for (let i = 0; i < weeks; i++) {
      const weekRecords = analysis.bmi.slice(i * 7, (i + 1) * 7);
      if (weekRecords.length > 0) {
        const avgBMI = weekRecords.reduce((sum, r) => sum + r.bmi, 0) / weekRecords.length;
        weeklyData.push({
          week: `Week ${i + 1}`,
          bmi: parseFloat(avgBMI.toFixed(2)),
        });
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis</h1>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diet Completion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {dietCompletionRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analysis.diet.completedDays} / {analysis.diet.totalDays} days
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workout Completion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {workoutCompletionRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analysis.workout.completedDays} / {analysis.workout.totalDays} days
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Daily Calories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {analysis.diet.averageCalories}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">calories</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exercises Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {analysis.workout.completedExercises}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {analysis.workout.totalExercises} total
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">BMI Trend</h2>
          {bmiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bmiChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bmi" stroke="#8884d8" name="BMI" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No BMI data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly BMI Average</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bmi" fill="#8884d8" name="Average BMI" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No weekly data available</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Diet Performance</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Total Plans: {analysis.diet.totalPlans}</li>
              <li>Total Days: {analysis.diet.totalDays}</li>
              <li>Completed Days: {analysis.diet.completedDays}</li>
              <li>Total Calories: {analysis.diet.totalCalories}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Workout Performance</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Total Plans: {analysis.workout.totalPlans}</li>
              <li>Total Days: {analysis.workout.totalDays}</li>
              <li>Completed Days: {analysis.workout.completedDays}</li>
              <li>Total Exercises: {analysis.workout.totalExercises}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

