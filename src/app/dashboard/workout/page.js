'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function WorkoutPage() {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewMode, setViewMode] = useState('day');
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
  });

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const fetchWorkoutPlans = async () => {
    try {
      const res = await fetch('/api/workout-plans');
      const data = await res.json();
      setWorkoutPlans(data);
      if (data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchWorkoutPlans();
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        });
        toast.success('Workout plan created successfully!');
      } else {
        toast.error('Failed to create workout plan');
      }
    } catch (error) {
      console.error('Error creating workout plan:', error);
    }
  };

  const handleDeletePlan = async (id) => {
    setPlanToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      const res = await fetch(`/api/workout-plans/${planToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchWorkoutPlans();
        if (selectedPlan === planToDelete) {
          setSelectedPlan(null);
        }
        toast.success('Workout plan deleted successfully');
      } else {
        toast.error('Failed to delete workout plan');
      }
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      toast.error('Error deleting workout plan');
    } finally {
      setPlanToDelete(null);
    }
  };

  const handleToggleExercise = async (planId, date, exerciseIndex, completed) => {
    try {
      const res = await fetch(`/api/workout-plans/${planId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          exerciseIndex,
          completed: !completed,
        }),
      });

      if (res.ok) {
        await fetchWorkoutPlans();
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleAddExercise = async (planId, date, exerciseName, sets, reps, duration) => {
    try {
      const plan = workoutPlans.find(p => p._id === planId);
      if (!plan) return;

      const dateStr = new Date(date).toDateString();
      const existingDay = plan.days.find(d => new Date(d.date).toDateString() === dateStr);

      const newExercise = {
        name: exerciseName,
        sets: parseInt(sets) || 0,
        reps: parseInt(reps) || 0,
        duration: parseInt(duration) || 0,
        completed: false,
      };

      let updatedDays;
      if (!existingDay) {
        const newDay = {
          date: new Date(date),
          exercises: [newExercise],
          completed: false,
        };
        updatedDays = [...plan.days, newDay];
      } else {
        updatedDays = plan.days.map(d => {
          if (new Date(d.date).toDateString() === dateStr) {
            return {
              ...d,
              exercises: [...d.exercises, newExercise],
            };
          }
          return d;
        });
      }

      const res = await fetch(`/api/workout-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (res.ok) {
        await fetchWorkoutPlans();
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/reports?type=workout');
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
      doc.text('Workout Plan Report', 50, 28);
  
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 34);
  
      doc.text(`Name: ${data.user.name}`, 14, 48);
      doc.text(`Email: ${data.user.email}`, 14, 54);
  
      let yPos = 65;
  
      /* ---------------- PLANS ---------------- */
      data.workoutPlans.forEach((plan, index) => {
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
          day.exercises.length,
          day.exercises.filter(e => e.completed).length,
        ]);
  
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Completed', 'Total Exercises', 'Completed Exercises']],
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
          'Fitness Tracker App • Track your fitness journey',
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
  
      doc.save(`workout-report-${Date.now()}.pdf`);
      toast.success('Workout report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download workout report');
    }
  };
  
  

  const currentPlan = workoutPlans.find(p => p._id === selectedPlan);

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
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Workout Plans
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>
      </div>

      {workoutPlans.length === 0 ? (
         <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
         <p className="text-gray-600 dark:text-gray-400 mb-4">
           No workout plans yet
         </p>
         <button
           onClick={() => setShowModal(true)}
           className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
         >
           Create Your First Plan
         </button>
       </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg border
              bg-white dark:bg-gray-800
              border-gray-300 dark:border-gray-700
              text-gray-900 dark:text-gray-200"
          >
            {workoutPlans.map(plan => (
              <option key={plan._id} value={plan._id}>{plan.name}</option>
            ))}
          </select>

          <div className="flex w-full sm:w-auto gap-2">
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 px-4 py-2 rounded-lg capitalize
                  ${viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setPlanToDelete(selectedPlan);
              setShowDeleteConfirm(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>

{/* PLAN CARD */}
          {currentPlan && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlan.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{currentPlan.description}</p>
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
                  
                  const exercises = day?.exercises || [];

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

                      {exercises.length > 0 ? (
                        exercises.map((exercise, index) => (
                          <div key={index} className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={exercise.completed || false}
                                onChange={() => handleToggleExercise(selectedPlan, date, index, exercise.completed)}
                                className="w-4 h-4"
                              />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {exercise.name}
                              </span>
                            </div>
                            <div className="ml-6 text-sm text-gray-600 dark:text-gray-400">
                              Sets: {exercise.sets} | Reps: {exercise.reps} | Duration: {exercise.duration} min
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No exercises</div>
                      )}

                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Exercise name"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const name = e.target.value;
                              const sets = prompt('Sets:') || '0';
                              const reps = prompt('Reps:') || '0';
                              const duration = prompt('Duration (minutes):') || '0';
                              handleAddExercise(selectedPlan, date, name, sets, reps, duration);
                              e.target.value = '';
                            }
                          }}
                          className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                        />
                      </div>
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Workout Plan</h2>
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
        title="Delete Workout Plan"
        message="Are you sure you want to delete this workout plan? This action cannot be undone."
      />
    </div>
  );
}

