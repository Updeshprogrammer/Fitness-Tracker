'use client';

import { useState, useEffect } from 'react';
import { Calculator, Download, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BMIPage() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmiRecords, setBmiRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBMI, setCurrentBMI] = useState(null);

  useEffect(() => {
    fetchBMIRecords();
  }, []);

  const fetchBMIRecords = async () => {
    try {
      const res = await fetch('/api/bmi');
      const data = await res.json();
      setBmiRecords(data);

      if (data.length > 0) {
        const latest = data[0];
        setHeight(latest.height.toString());
        setWeight(latest.weight.toString());
        setCurrentBMI(latest);
      }
    } catch (error) {
      console.error('Error fetching BMI records:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (h, w) => {
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(2);
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' };
    return { category: 'Obese', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' };
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!height || !weight) return;

    try {
      const res = await fetch('/api/bmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: parseFloat(height),
          weight: parseFloat(weight),
        }),
      });

      if (res.ok) {
        await fetchBMIRecords();
      }
    } catch (error) {
      console.error('Error calculating BMI:', error);
    }
  };

  // ✅ FIXED PDF FUNCTION
  const handleDownloadReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('BMI Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    if (bmiRecords.length > 0) {
      const tableData = bmiRecords.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.height,
        record.weight,
        record.bmi,
        record.category,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Height (cm)', 'Weight (kg)', 'BMI', 'Category']],
        body: tableData,
        theme: 'striped',
      });
    }

    doc.save(`bmi-report-${Date.now()}.pdf`);
  };

  const bmiValue = height && weight
    ? calculateBMI(parseFloat(height), parseFloat(weight))
    : null;

  const bmiCategory = bmiValue
    ? getBMICategory(parseFloat(bmiValue))
    : null;

  const chartData = bmiRecords
    .map(record => ({
      date: new Date(record.date).toLocaleDateString(),
      bmi: record.bmi,
      weight: record.weight,
    }))
    .reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-lg sm:text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">BMI Calculator</h1>
      {bmiRecords.length > 0 && (
        <button
          onClick={handleDownloadReport}
          className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download Report</span>
          <span className="sm:hidden">Download</span>
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Calculate BMI</h2>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base transition-colors"
              placeholder="Enter height in cm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base transition-colors"
              placeholder="Enter weight in kg"
            />
          </div>

          {bmiValue && bmiCategory && (
            <div className={`p-4 rounded-lg ${bmiCategory.bg} transition-colors duration-300`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Your BMI</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${bmiCategory.color} mt-1`}>
                    {bmiValue}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-base sm:text-lg font-semibold ${bmiCategory.color}`}>
                    {bmiCategory.category}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
          >
            Calculate & Save
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">BMI History</h2>
        </div>

        {bmiRecords.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Latest Record</p>
              {currentBMI && (
                <div className={`p-3 rounded-lg ${getBMICategory(currentBMI.bmi).bg} transition-colors duration-300`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {new Date(currentBMI.date).toLocaleDateString()}
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold ${getBMICategory(currentBMI.bmi).color} mt-1`}>
                        {currentBMI.bmi}
                      </p>
                    </div>
                    <p className={`text-base sm:text-lg font-semibold ${getBMICategory(currentBMI.bmi).color}`}>
                      {currentBMI.category}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="mb-4 -mx-2 sm:mx-0">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bmi" stroke="#6366f1" name="BMI" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 max-h-48 overflow-y-auto -mx-2 sm:mx-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[300px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">Date</th>
                      <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">BMI</th>
                      <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bmiRecords.slice(0, 10).map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 text-gray-900 dark:text-white font-medium">{record.bmi}</td>
                        <td className={`py-2 px-2 ${getBMICategory(record.bmi).color} font-medium`}>
                          {record.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center py-8 sm:py-12">
            No BMI records yet. Calculate your BMI to get started!
          </p>
        )}
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">BMI Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-blue-100 dark:bg-blue-900 rounded-lg transition-colors duration-300">
          <p className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-200">Underweight</p>
          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 mt-1">BMI &lt; 18.5</p>
        </div>
        <div className="p-3 sm:p-4 bg-green-100 dark:bg-green-900 rounded-lg transition-colors duration-300">
          <p className="font-semibold text-sm sm:text-base text-green-800 dark:text-green-200">Normal</p>
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-300 mt-1">BMI 18.5 - 24.9</p>
        </div>
        <div className="p-3 sm:p-4 bg-orange-100 dark:bg-orange-900 rounded-lg transition-colors duration-300">
          <p className="font-semibold text-sm sm:text-base text-orange-800 dark:text-orange-200">Overweight</p>
          <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-300 mt-1">BMI 25 - 29.9</p>
        </div>
        <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-900 rounded-lg transition-colors duration-300">
          <p className="font-semibold text-sm sm:text-base text-red-800 dark:text-red-200">Obese</p>
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-1">BMI ≥ 30</p>
        </div>
      </div>
    </div>
  </div>
  );
}

