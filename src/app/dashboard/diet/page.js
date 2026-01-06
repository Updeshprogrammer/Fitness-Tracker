'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Download, Trash2, CheckCircle2, Circle, Copy, Edit, X, Upload, FileText } from 'lucide-react';
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
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null); // { planId, date, mealIndex }
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      if (!res.ok) {
        console.error('Failed to fetch diet plans:', res.status, res.statusText);
        toast.error('Failed to load diet plans');
        setDietPlans([]);
        return;
      }

      const data = await res.json();
      const safePlans = Array.isArray(data) ? data : [];

      setDietPlans(safePlans);
      if (safePlans.length > 0 && !selectedPlan) {
        setSelectedPlan(safePlans[0]._id);
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
      toast.error('Error loading diet plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        // Update existing plan
        const res = await fetch(`/api/diet-plans/${editingPlan}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          await fetchDietPlans();
          setShowModal(false);
          setEditingPlan(null);
          setFormData({
            name: '',
            description: '',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            dailyCalorieGoal: 2000,
          });
          toast.success('Diet plan updated successfully!');
        } else {
          toast.error('Failed to update diet plan');
        }
      } else {
        // Create new plan
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
      }
    } catch (error) {
      console.error('Error saving diet plan:', error);
      toast.error('Error saving diet plan');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      startDate: format(new Date(plan.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(plan.endDate), 'yyyy-MM-dd'),
      dailyCalorieGoal: plan.dailyCalorieGoal || 2000,
    });
    setShowModal(true);
  };

  const handleDuplicateToTomorrow = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    try {
      const plan = dietPlans.find(p => p._id === selectedPlan);
      if (!plan) {
        toast.error('Plan not found');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDay = plan.days.find(d => {
        const dayDate = new Date(d.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });

      if (!todayDay || !todayDay.meals || todayDay.meals.length === 0) {
        toast.error('No meals found for today to duplicate');
        return;
      }

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if tomorrow already exists
      const tomorrowDateStr = tomorrow.toDateString();
      const existingTomorrow = plan.days.find(d => {
        const dayDate = new Date(d.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.toDateString() === tomorrowDateStr;
      });

      // Create duplicated meals with completed status reset
      const duplicatedMeals = todayDay.meals.map(meal => {
        const { _id, ...mealWithoutId } = meal;
        return {
          ...mealWithoutId,
          completed: false,
        };
      });

      const newDay = {
        date: tomorrow,
        meals: duplicatedMeals,
        completed: false,
        totalCalories: todayDay.totalCalories || 0,
      };

      let updatedDays;
      if (existingTomorrow) {
        // Replace existing tomorrow's meals
        updatedDays = plan.days.map(d => {
          const dayDate = new Date(d.date);
          dayDate.setHours(0, 0, 0, 0);
          if (dayDate.toDateString() === tomorrowDateStr) {
            return newDay;
          }
          return d;
        });
      } else {
        // Add new day
        updatedDays = [...plan.days, newDay];
      }

      const res = await fetch(`/api/diet-plans/${selectedPlan}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (res.ok) {
        await fetchDietPlans();
        toast.success('Today\'s plan duplicated to tomorrow!');
      } else {
        toast.error('Failed to duplicate plan');
      }
    } catch (error) {
      console.error('Error duplicating plan:', error);
      toast.error('Error duplicating plan');
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
        toast.success('Meal added successfully!');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Error adding meal');
    }
  };

  const handleUpdateMeal = async (planId, date, mealIndex, food, calories) => {
    try {
      const plan = dietPlans.find(p => p._id === planId);
      if (!plan) return;

      const dateStr = new Date(date).toDateString();
      const existingDay = plan.days.find(d => new Date(d.date).toDateString() === dateStr);

      if (!existingDay || !existingDay.meals[mealIndex]) {
        toast.error('Meal not found');
        return;
      }

      if (!food.trim()) {
        toast.error('Food name cannot be empty');
        setEditingMeal(null);
        return;
      }

      const oldCalories = existingDay.meals[mealIndex].calories || 0;
      const newCalories = parseInt(calories) || 0;
      const calorieDiff = newCalories - oldCalories;

      const updatedDays = plan.days.map(d => {
        if (new Date(d.date).toDateString() === dateStr) {
          const updatedMeals = d.meals.map((meal, index) => {
            if (index === mealIndex) {
              return {
                ...meal,
                food: food.trim(),
                calories: newCalories,
              };
            }
            return meal;
          });

          return {
            ...d,
            meals: updatedMeals,
            totalCalories: Math.max(0, (d.totalCalories || 0) + calorieDiff),
          };
        }
        return d;
      });

      const res = await fetch(`/api/diet-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (res.ok) {
        await fetchDietPlans();
        setEditingMeal(null);
        toast.success('Meal updated successfully!');
      } else {
        toast.error('Failed to update meal');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      toast.error('Error updating meal');
    }
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Expected headers
    const requiredHeaders = ['plan_name', 'description', 'start_date', 'end_date', 'daily_calorie_goal', 'date', 'meal_type', 'food', 'calories'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Please check your CSV format.`);
    }

    const plansMap = new Map();

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) {
        console.warn(`Row ${i + 1} has fewer columns than headers, skipping...`);
        continue;
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = (values[index] || '').replace(/^"|"$/g, '').trim();
      });

      const planName = row.plan_name;
      if (!planName) {
        console.warn(`Row ${i + 1} missing plan name, skipping...`);
        continue;
      }

      if (!plansMap.has(planName)) {
        plansMap.set(planName, {
          name: planName,
          description: row.description || '',
          startDate: row.start_date,
          endDate: row.end_date,
          dailyCalorieGoal: parseInt(row.daily_calorie_goal) || 2000,
          days: new Map(),
        });
      }

      const plan = plansMap.get(planName);
      const date = row.date;
      if (!date) {
        console.warn(`Row ${i + 1} missing date, skipping...`);
        continue;
      }

      if (!plan.days.has(date)) {
        plan.days.set(date, {
          date: new Date(date),
          meals: [],
          completed: false,
          totalCalories: 0,
        });
      }

      const day = plan.days.get(date);
      const mealType = row.meal_type?.toLowerCase().trim();
      if (!mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
        console.warn(`Row ${i + 1} has invalid meal type: ${row.meal_type}, skipping...`);
        continue;
      }

      const meal = {
        mealType: mealType,
        food: row.food || '',
        calories: parseInt(row.calories) || 0,
        completed: false,
      };

      day.meals.push(meal);
      day.totalCalories += meal.calories;
    }

    // Convert Map to Array
    const plans = Array.from(plansMap.values()).map(plan => ({
      ...plan,
      days: Array.from(plan.days.values()),
    }));

    if (plans.length === 0) {
      throw new Error('No valid diet plans found in CSV. Please check the format.');
    }

    return plans;
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const plans = parseCSV(text);

      if (plans.length === 0) {
        toast.error('No valid diet plans found in CSV file');
        setUploading(false);
        return;
      }

      // Create all plans
      let successCount = 0;
      let errorCount = 0;

      for (const plan of plans) {
        try {
          const res = await fetch('/api/diet-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Error creating plan:', error);
          errorCount++;
        }
      }

      await fetchDietPlans();
      setShowUploadModal(false);
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} diet plan(s)!`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} diet plan(s)`);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadCSVTemplate = () => {
    const template = `Plan_Name,Description,Start_Date,End_Date,Daily_Calorie_Goal,Date,Meal_Type,Food,Calories
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-01,breakfast,"2 Whole Eggs + 2 egg whites + 1 roti",200
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-01,lunch,"Sabzi + Salad",250
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-01,dinner,"Panner/dal + sabzi",300
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-01,snack,Black Coffee,20
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-02,breakfast,"2 Whole Eggs + 2 egg whites + 1 roti",200
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-02,lunch,"Sabzi + Salad",250
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-02,dinner,"Panner/dal + sabzi",300
Weight Loss Plan,Healthy diet for weight loss,2024-01-01,2024-01-31,2000,2024-01-02,snack,Black Coffee,20
Muscle Gain Plan,High protein diet for muscle building,2024-02-01,2024-02-28,2500,2024-02-01,breakfast,"Oatmeal + Banana + Protein Shake",400
Muscle Gain Plan,High protein diet for muscle building,2024-02-01,2024-02-28,2500,2024-02-01,lunch,"Grilled Chicken + Rice + Vegetables",600
Muscle Gain Plan,High protein diet for muscle building,2024-02-01,2024-02-28,2500,2024-02-01,dinner,"Salmon + Sweet Potato + Broccoli",500
Muscle Gain Plan,High protein diet for muscle building,2024-02-01,2024-02-28,2500,2024-02-01,snack,Protein Bar,200`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diet-plans-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV template downloaded!');
  };

  const handleDeleteMeal = async (planId, date, mealIndex) => {
    try {
      const plan = dietPlans.find(p => p._id === planId);
      if (!plan) return;

      const dateStr = new Date(date).toDateString();
      const existingDay = plan.days.find(d => new Date(d.date).toDateString() === dateStr);

      if (!existingDay || !existingDay.meals[mealIndex]) {
        toast.error('Meal not found');
        return;
      }

      const mealToDelete = existingDay.meals[mealIndex];
      const caloriesToRemove = mealToDelete.calories || 0;

      const updatedDays = plan.days.map(d => {
        if (new Date(d.date).toDateString() === dateStr) {
          const updatedMeals = d.meals.filter((_, index) => index !== mealIndex);
          
          return {
            ...d,
            meals: updatedMeals,
            totalCalories: Math.max(0, (d.totalCalories || 0) - caloriesToRemove),
          };
        }
        return d;
      });

      const res = await fetch(`/api/diet-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });

      if (res.ok) {
        await fetchDietPlans();
        toast.success('Meal deleted successfully!');
      } else {
        toast.error('Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Error deleting meal');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/reports?type=diet');

      if (!res.ok) {
        console.error('Failed to fetch diet report:', res.status, res.statusText);
        toast.error('Failed to download diet report');
        return;
      }

      const data = await res.json();

      if (!data || !data.user || !Array.isArray(data.dietPlans)) {
        console.error('Unexpected diet report response shape:', data);
        toast.error('Report data is invalid or incomplete');
        return;
      }
  
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
  
      doc.text(`Name: ${data.user.name || ''}`, 14, 48);
      doc.text(`Email: ${data.user.email || ''}`, 14, 54);
  
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
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Diet Plans
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-green-600 hover:bg-green-700 text-white"
          >
            <Download size={16} />
            Download Report
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Upload size={16} />
            Upload CSV
          </button>
          <button
            onClick={() => {
              setEditingPlan(null);
              setFormData({
                name: '',
                description: '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                dailyCalorieGoal: 2000,
              });
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>
      </div>

      {dietPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No diet plans yet
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Create Your First Plan
        </button>
      </div>
      ) : (
        <>
          {/* CONTROLS */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              value={selectedPlan || ''}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {dietPlans.map(plan => (
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

          {currentPlan && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentPlan.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{currentPlan.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Goal</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {currentPlan.dailyCalorieGoal} cal
                  </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPlan(currentPlan)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                        bg-blue-600 hover:bg-blue-700 text-white"
                      title="Edit Plan"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={handleDuplicateToTomorrow}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                        bg-purple-600 hover:bg-purple-700 text-white"
                      title="Duplicate Today to Tomorrow"
                    >
                      <Copy size={16} />
                      Duplicate Today
                    </button>
                  </div>
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
                  const mealTypes = ['🏋️‍♂️ Breakfast (Pre-workout)' ,'💪 Breakfast (Post-workout)','🍎 Mid‑Morning', '🍛 Lunch', '🍽️ Dinner (Light)', '☕ Evening', '💧 Water Intake'];
                  const drinkTypes = ['Water Intake'];
                  

                  // Water Intake Input
                  const waterIntake = day?.waterIntake || 0;
                  const waterIntakeInput = (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Water Intake: {waterIntake} ml
                      </p>
                    </div>
                  );
                  

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
                              editingMeal && 
                              editingMeal.planId === selectedPlan && 
                              editingMeal.date.toDateString() === date.toDateString() &&
                              editingMeal.mealIndex === meals.indexOf(meal) ? (
                                <div className="ml-6 space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      defaultValue={meal.food}
                                      onBlur={(e) => {
                                        const food = e.target.value;
                                        const caloriesInput = e.target.parentElement.parentElement.querySelector('input[type="number"]');
                                        const calories = caloriesInput ? caloriesInput.value : meal.calories;
                                        if (food.trim() && (food !== meal.food || parseInt(calories) !== meal.calories)) {
                                          handleUpdateMeal(selectedPlan, date, meals.indexOf(meal), food, calories);
                                        } else {
                                          setEditingMeal(null);
                                        }
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.target.blur();
                                        }
                                      }}
                                      className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        setEditingMeal(null);
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      defaultValue={meal.calories}
                                      placeholder="Calories"
                                      onBlur={(e) => {
                                        const calories = e.target.value;
                                        const foodInput = e.target.parentElement.parentElement.querySelector('input[type="text"]');
                                        const food = foodInput ? foodInput.value : meal.food;
                                        if (food.trim() && (food !== meal.food || parseInt(calories) !== meal.calories)) {
                                          handleUpdateMeal(selectedPlan, date, meals.indexOf(meal), food, calories);
                                        } else {
                                          setEditingMeal(null);
                                        }
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.target.blur();
                                        }
                                      }}
                                      className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                    />
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this meal?')) {
                                          handleDeleteMeal(selectedPlan, date, meals.indexOf(meal));
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Delete meal"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="ml-6 flex items-center gap-2 group">
                                  <div 
                                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex-1"
                                    onClick={() => setEditingMeal({
                                      planId: selectedPlan,
                                      date: date,
                                      mealIndex: meals.indexOf(meal)
                                    })}
                                    title="Click to edit"
                                  >
                                {meal.food} ({meal.calories} cal)
                              </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to delete this meal?')) {
                                        handleDeleteMeal(selectedPlan, date, meals.indexOf(meal));
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1"
                                    title="Delete meal"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingPlan ? 'Edit Diet Plan' : 'Create Diet Plan'}
            </h2>
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
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlan(null);
                    setFormData({
                      name: '',
                      description: '',
                      startDate: format(new Date(), 'yyyy-MM-dd'),
                      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                      dailyCalorieGoal: 2000,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingPlan ? 'Update' : 'Create'}
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Upload Diet Plans from CSV
            </h2>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CSV File Format
                </label>
                <button
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <FileText size={14} />
                  Download Template
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  Required CSV Columns:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>Plan_Name</strong> - Name of the diet plan</li>
                  <li><strong>Description</strong> - Description of the plan (optional)</li>
                  <li><strong>Start_Date</strong> - Start date (YYYY-MM-DD format)</li>
                  <li><strong>End_Date</strong> - End date (YYYY-MM-DD format)</li>
                  <li><strong>Daily_Calorie_Goal</strong> - Daily calorie goal (number)</li>
                  <li><strong>Date</strong> - Date for the meal (YYYY-MM-DD format)</li>
                  <li><strong>Meal_Type</strong> - Type of meal (breakfast, lunch, dinner, snack)</li>
                  <li><strong>Food</strong> - Food item name</li>
                  <li><strong>Calories</strong> - Calories for the meal (number)</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  Example CSV Format:
                </p>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
{`Plan_Name,Description,Start_Date,End_Date,Daily_Calorie_Goal,Date,Meal_Type,Food,Calories
Weight Loss Plan,Healthy diet,2024-01-01,2024-01-31,2000,2024-01-01,breakfast,"2 Whole Eggs + 1 roti",200
Weight Loss Plan,Healthy diet,2024-01-01,2024-01-31,2000,2024-01-01,lunch,"Sabzi + Salad",250
Weight Loss Plan,Healthy diet,2024-01-01,2024-01-31,2000,2024-01-01,dinner,"Panner/dal + sabzi",300
Weight Loss Plan,Healthy diet,2024-01-01,2024-01-31,2000,2024-01-01,snack,Black Coffee,20`}
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <strong>Note:</strong> You can add multiple plans and multiple dates. Each row represents one meal for a specific date in a plan.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              {uploading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Uploading diet plans...</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}