'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Download, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function DietPage() {
  const [dietPlans, setDietPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewMode, setViewMode] = useState('day'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    dailyCalorieGoal: 2000,
  });

  useEffect(() => {
    fetchDietPlans();
  }, []);

  const fetchDietPlans = async () => {
    try {
      const res = await fetch('/api/diet-plans');
      const data = await res.json();
      setDietPlans(data);
      if (data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchDietPlans();
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          dailyCalorieGoal: 2000,
        });
        toast.success('Diet plan created successfully!');
      } else {
        toast.error('Failed to create diet plan');
      }
    } catch (error) {
      console.error('Error creating diet plan:', error);
    }
  };

  const handleDeletePlan = async (id) => {
    setPlanToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      const res = await fetch(`/api/diet-plans/${planToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchDietPlans();
        if (selectedPlan === planToDelete) {
          setSelectedPlan(null);
        }
        toast.success('Diet plan deleted successfully');
      } else {
        toast.error('Failed to delete diet plan');
      }
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      toast.error('Error deleting diet plan');
    } finally {
      setPlanToDelete(null);
    }
  };

  const handleToggleMeal = async (planId, date, mealIndex, completed) => {
    try {
      const res = await fetch(`/api/diet-plans/${planId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          mealIndex,
          completed: !completed,
        }),
      });

      if (res.ok) {
        await fetchDietPlans();
      }
    } catch (error) {
      console.error('Error updating meal:', error);
    }
  };

  const handleAddMeal = async (planId, date, mealType, food, calories) => {
    try {
      const plan = dietPlans.find(p => p._id === planId);
      if (!plan) return;

      const dateStr = new Date(date).toDateString();
      const existingDay = plan.days.find(d => new Date(d.date).toDateString() === dateStr);

      const newMeal = {
        mealType,
        food,
        calories: parseInt(calories) || 0,
        completed: false,
      };

      let updatedDays;
      if (!existingDay) {
        const newDay = {
          date: new Date(date),
          meals: [newMeal],
          completed: false,
          totalCalories: parseInt(calories) || 0,
        };
        updatedDays = [...plan.days, newDay];
      } else {
        updatedDays = plan.days.map(d => {
          if (new Date(d.date).toDateString() === dateStr) {
            return {
              ...d,
              meals: [...d.meals, newMeal],
              totalCalories: (d.totalCalories || 0) + (parseInt(calories) || 0),
            };
          }
          return d;
        });
      }

      const res = await fetch(`/api/diet-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (res.ok) {
        await fetchDietPlans();
      }
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/reports?type=diet');
      const data = await res.json();
  
      const doc = new jsPDF();
  
      /* ---------------- LOGO ---------------- */
      const logoUrl = '/logo.webp';
      const logoImg = new Image();
      logoImg.src = logoUrl;
  
      await new Promise(resolve => {
        logoImg.onload = resolve;
      });
  
      doc.addImage(logoImg, 'WEBP', 14, 10, 30, 30);
  
      /* ---------------- HEADER ---------------- */
      doc.setFontSize(20);
      doc.text('Fitness Tracker App', 50, 20);
  
      doc.setFontSize(14);
      doc.text('Diet Plan Report', 50, 28);
  
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 34);
  
      doc.text(`Name: ${data.user.name}`, 14, 48);
      doc.text(`Email: ${data.user.email}`, 14, 54);
  
      let yPos = 65;
  
      /* ---------------- PLANS ---------------- */
      data.dietPlans.forEach((plan, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
  
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${plan.name}`, 14, yPos);
        yPos += 8;
  
        doc.setFontSize(10);
        doc.text(
          `Period: ${format(new Date(plan.startDate), 'MMM dd, yyyy')} - ${format(
            new Date(plan.endDate),
            'MMM dd, yyyy'
          )}`,
          14,
          yPos
        );
        yPos += 6;
  
        doc.text(
          `Completed: ${plan.completedDays}/${plan.totalDays} days`,
          14,
          yPos
        );
        yPos += 10;
  
        const tableData = plan.days.map(day => [
          format(new Date(day.date), 'MMM dd, yyyy'),
          day.completed ? 'Yes' : 'No',
          day.totalCalories || 0,
          day.meals?.length || 0,
        ]);
  
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Completed', 'Calories', 'Meals']],
          body: tableData,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229] }, // Indigo
        });
  
        yPos = doc.lastAutoTable?.finalY
          ? doc.lastAutoTable.finalY + 15
          : yPos + 30;
      });
  
      /* ---------------- FOOTER ---------------- */
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          'Fitness Tracker App • Stay Fit, Stay Healthy',
          14,
          290
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          180,
          290,
          { align: 'right' }
        );
      }
  
      doc.save(`diet-report-${Date.now()}.pdf`);
      toast.success('Diet report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download diet report');
    }
  };
  
  

  const currentPlan = dietPlans.find(p => p._id === selectedPlan);
  const dateStr = currentDate.toDateString();

  let displayDates = [];
  if (viewMode === 'day') {
    displayDates = [currentDate];
  } else if (viewMode === 'week') {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    displayDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    displayDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Diet Plans</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </div>

      {dietPlans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No diet plans yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <select
              value={selectedPlan || ''}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {dietPlans.map(plan => (
                <option key={plan._id} value={plan._id}>{plan.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Month
              </button>
            </div>
            <button
              onClick={() => handleDeletePlan(selectedPlan)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {currentPlan && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlan.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {currentPlan.dailyCalorieGoal} cal
                  </p>
                </div>
              </div>

              <div className="mb-4 flex gap-2 items-center">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() - (viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30));
                    setCurrentDate(newDate);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded"
                >
                  ←
                </button>
                <span className="px-4 py-1 text-gray-700 dark:text-gray-300">
                  {viewMode === 'day' 
                    ? format(currentDate, 'MMMM dd, yyyy')
                    : viewMode === 'week'
                    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                    : format(currentDate, 'MMMM yyyy')
                  }
                </span>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() + (viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30));
                    setCurrentDate(newDate);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayDates.map(date => {
                  const day = currentPlan.days.find(d => 
                    new Date(d.date).toDateString() === date.toDateString()
                  );
                  
                  const meals = day?.meals || [];
                  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

                  return (
                    <div key={date.toISOString()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {format(date, 'MMM dd')}
                        </h3>
                        {day?.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {mealTypes.map(mealType => {
                        const meal = meals.find(m => m.mealType === mealType);
                        return (
                          <div key={mealType} className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={meal?.completed || false}
                                onChange={() => {
                                  if (meal) {
                                    handleToggleMeal(selectedPlan, date, meals.indexOf(meal), meal.completed);
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {mealType}:
                              </span>
                            </div>
                            {meal ? (
                              <div className="ml-6 text-sm text-gray-600 dark:text-gray-400">
                                {meal.food} ({meal.calories} cal)
                              </div>
                            ) : (
                              <div className="ml-6">
                                <input
                                  type="text"
                                  placeholder="Add food"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const food = e.target.value;
                                      const calories = prompt('Enter calories:') || '0';
                                      handleAddMeal(selectedPlan, date, mealType, food, calories);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {day && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total: {day.totalCalories || 0} cal
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Diet Plan</h2>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Calorie Goal
                </label>
                <input
                  type="number"
                  required
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => setFormData({ ...formData, dailyCalorieGoal: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Diet Plan"
        message="Are you sure you want to delete this diet plan? This action cannot be undone."
      />
    </div>
  );
}

