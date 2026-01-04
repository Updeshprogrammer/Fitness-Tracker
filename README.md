# Fitness Tracker App

A comprehensive fitness tracking application built with Next.js, MongoDB, and NextAuth. Track your diet plans, workout routines, BMI, and analyze your progress.

## Features

### User Dashboard
- **Diet Plans**: Create and track daily/weekly/monthly diet plans with meal checkboxes
- **Workout Plans**: Create and track workout routines with exercise tracking
- **Analysis**: View detailed statistics and charts for your fitness journey
- **BMI Calculator**: Calculate and track your BMI over time
- **Reports**: Download PDF reports for diet, workout, and analysis data

### Admin Dashboard
- **User Management**: View all users and their statistics
- **System Overview**: Monitor overall app usage and statistics
- **Suggestions**: Send diet and workout suggestions to users

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **PDF Generation**: jsPDF with AutoTable

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fitness-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your MongoDB connection string and NextAuth secret:
```
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Creating an Admin User

To create an admin user, you can either:

1. Register a new user through the registration page, then update the user in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

2. Or create an admin user directly in MongoDB:
```javascript
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$12$hashedpassword", // Use bcrypt to hash password
  role: "admin",
  createdAt: new Date()
})
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard pages
│   ├── dashboard/        # User dashboard pages
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/           # React components
├── lib/                  # Utility functions
└── models/               # MongoDB models
```

## Features in Detail

### Diet Plan Tracking
- Create diet plans with start and end dates
- Set daily calorie goals
- Add meals (breakfast, lunch, dinner, snacks) for each day
- Track completion with checkboxes
- View plans by day, week, or month
- Download diet reports as PDF

### Workout Plan Tracking
- Create workout plans with start and end dates
- Add exercises with sets, reps, and duration
- Track exercise completion
- View plans by day, week, or month
- Download workout reports as PDF

### Analysis Dashboard
- View completion rates for diet and workout plans
- See average daily calories
- Track BMI trends with charts
- Filter by week, month, or year
- Download comprehensive analysis reports

### BMI Calculator
- Calculate BMI from height and weight
- Track BMI history over time
- View BMI trends with charts
- Get category classification (Underweight, Normal, Overweight, Obese)
- Download BMI reports

## License

MIT
