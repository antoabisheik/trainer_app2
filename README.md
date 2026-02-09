# Trainer App Frontend - Next.js React Application

A modern, responsive web application for fitness trainers to manage clients, track training sessions, and monitor exercise completion using **Next.js 16**, **React 19**, and **Tailwind CSS**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Features](#features)
8. [Components Documentation](#components-documentation)
9. [Authentication Flow](#authentication-flow)
10. [API Integration](#api-integration)
11. [Development Guide](#development-guide)
12. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

The **Trainer App Frontend** is a professional dashboard that allows fitness trainers to:

- ✅ **Authenticate** via Firebase with email/password or Google sign-in
- 👥 **Manage Clients** - View all assigned clients with detailed profiles
- 🏋️ **Track Sessions** - Monitor daily training sessions and exercise progress
- ⚠️ **Alerts System** - Get notified of incomplete exercises and high-risk sessions
- 📊 **Real-time Updates** - Auto-refresh data every 30-60 seconds
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

**Authentication Flow:**
```
1. User lands on Landing Page
2. Clicks "Sign In" → Sign In Form
3. Enters email & password
4. Backend verifies Firebase token + trainer status
5. Backend returns JWT token
6. Frontend stores JWT & redirects to Trainer Dashboard
7. All API calls include JWT in Authorization header
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.1.6 | React framework with SSR/SSG |
| **React** | 19.2.3 | UI component library |
| **Firebase** | ^12.8.0 | Auth & Firestore integration |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **React Icons** | ^5.5.0 | Icon library (Lucide + React Icons) |
| **Sonner** | ^2.0.7 | Toast notifications |
| **ESLint** | ^9 | Code linting |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx        # Home/entry page
│   │   │   ├── SignIn.jsx              # Trainer login form
│   │   │   ├── SignUp.jsx              # User registration
│   │   │   ├── ForgotPassword.jsx      # Password recovery
│   │   │   ├── NewPasswordPage.jsx     # Password reset page
│   │   │   ├── ConfirmPage.jsx         # Email confirmation
│   │   │   ├── Design.jsx              # Layout wrapper for auth
│   │   │   ├── LoadingOverlay.jsx      # Loading indicator
│   │   │   ├── TrainerDashboard.jsx    # 🆕 Main trainer dashboard
│   │   │   ├── ClientsList.jsx         # 🆕 View all clients
│   │   │   ├── ClientDetail.jsx        # 🆕 Individual client profile
│   │   │   ├── SessionsToday.jsx       # 🆕 Daily sessions tracker
│   │   │   └── Alerts.jsx              # 🆕 Alert system
│   │   ├── api/
│   │   │   └── firebase.js             # Firebase config
│   │   │   └── verification-api.js     # Email verification
│   │   ├── lib/
│   │   │   └── firebase.js             # Firebase utilities
│   │   ├── trainer/
│   │   │   └── page.jsx                # 🆕 Trainer dashboard page
│   │   ├── signin/
│   │   │   └── page.jsx                # Sign in page route
│   │   ├── signup/
│   │   │   └── page.jsx                # Sign up page route
│   │   ├── verify-email/
│   │   │   └── page.jsx                # Email verification route
│   │   ├── layout.js                   # Root layout
│   │   ├── page.js                     # Landing page route
│   │   ├── globals.css                 # Global styles
│   ├── public/
│   │   ├── logo.png                    # App logo
│   │   └── img_back.png                # Background image
├── package.json                        # Dependencies
├── next.config.mjs                     # Next.js config
├── tailwind.config.js                  # Tailwind configuration
├── postcss.config.mjs                  # PostCSS config
├── jsconfig.json                       # JS path aliases
├── eslint.config.mjs                   # ESLint rules
└── README.md                           # This file
```

---

## 💾 Installation

### 1. Clone the Repository

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Prerequisites

- **Node.js** version 18 or higher
- **Firebase Project** with Authentication enabled
- **Backend API** running on `http://localhost:5000` or deployed URL

---

## 🔧 Environment Configuration

### Create `.env.local` File

Create a `.env.local` file in the `frontend` directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
# For production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Settings** ⚙️ → **Project Settings**
4. Scroll to **Your apps** section
5. Click on your web app
6. Copy the Firebase configuration object

**Example:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "my-app-12345.firebaseapp.com",
  projectId: "my-app-12345",
  storageBucket: "my-app-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEF1234"
};
```

⚠️ **NOTE:** These are "public" keys - it's safe to expose them in the browser. They only work with your Firebase project.

---

## 🚀 Running the Application

### Development Server

```bash
npm run dev
```

**Output:**
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

Open **http://localhost:3000** in your browser.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

---

## ✨ Features

### 🔐 Authentication
- **Email/Password Login** - Trainer login with Firebase Auth
- **Google Sign-In** - Quick login with Google account
- **JWT Token Storage** - Secure token management with localStorage
- **Session Persistence** - Stay logged in across page refreshes

### 👥 Client Management
- **Client List** - View all assigned clients with search
- **Client Details** - Full profile including height, weight, health issues
- **BMI Calculation** - Automatic BMI calculation from height/weight
- **Health Status** - Track health issues for each client

### 🏋️ Session Tracking
- **Today's Sessions** - Real-time view of daily sessions
- **Exercise Progress** - Track reps completed vs. target reps
- **Status Filtering** - Filter by scheduled/in-progress/completed/cancelled
- **Auto-Refresh** - Updates every 30 seconds automatically
- **Progress Bars** - Visual representation of exercise completion

### ⚠️ Alert System
- **High-Risk Detection** - Identify incomplete exercises
- **Session Alerts** - Get notified of sessions with uncompleted work
- **Alert Details** - View which exercises are incomplete
- **Auto-Refresh** - Updates every 60 seconds automatically
- **Summary Stats** - Count of alerts and incomplete exercises

### 📱 Responsive Design
- **Mobile Optimized** - Hamburger menu and touch-friendly buttons
- **Tablet Support** - Flexible grid layouts
- **Desktop Experience** - Full sidebar navigation
- **Dark Theme** - Eye-friendly dark mode UI

---

## 🧩 Components Documentation

### **LandingPage** - Home Screen
**File:** src/app/components/LandingPage.jsx

Main entry point with "Sign In" and "Sign Up" buttons.

**Key Features:**
- Eye-catching headline with Tailwind styling
- Quick access to login/signup forms
- Responsive for all screen sizes

---

### **SignIn** - Trainer Login Form
**File:** src/app/components/SignIn.jsx

Email/password authentication with Firebase integration.

**Key Features:**
- Email & password input validation
- "Show/Hide password" toggle
- Google sign-in option
- Error handling with toast notifications
- Loading state during authentication
- Gym access verification

**Form Flow:**
```
1. User enters email & password
2. Frontend validates inputs
3. Firebase authenticates user
4. Backend verifies trainer status (approved)
5. JWT token returned and stored
6. Redirect to /trainer dashboard
```

---

### **TrainerDashboard** - Main Dashboard
**File:** src/app/components/TrainerDashboard.jsx

🆕 Complete trainer interface with navigation and overview stats.

**Key Features:**
- **Responsive Sidebar** - Collapsible on mobile
- **Tab Navigation** - Overview, Clients, Sessions, Alerts
- **Real-time Stats** - Client count, session count, alert count
- **Trainer Info Card** - Email, status, gym/organization ID
- **Logout Button** - Secure logout functionality

**Sections:**
- **Overview** - Quick stats and trainer information
- **My Clients** - Full client list and search
- **Today's Sessions** - Daily session tracking
- **Alerts** - Incomplete exercise alerts

---

### **ClientsList** - Client Directory
**File:** src/app/components/ClientsList.jsx

🆕 View and manage all assigned clients.

**Key Features:**
- **Search Functionality** - Filter clients by name
- **Expandable Cards** - Click to expand client details
- **Metrics Display** - Height, weight, health status
- **View Profile** - Click to see detailed client information
- **Client Count** - Shows total assigned clients

---

### **ClientDetail** - Client Profile
**File:** src/app/components/ClientDetail.jsx

🆕 Detailed view of individual client with sessions.

**Key Features:**
- **Physical Metrics** - Height, weight, BMI, health status
- **Session History** - Today's sessions for this client
- **Exercise Tracking** - View exercise progress
- **Back Navigation** - Return to client list
- **Client ID Display** - Reference for backend

---

### **SessionsToday** - Daily Sessions
**File:** src/app/components/SessionsToday.jsx

🆕 Track training sessions scheduled for today.

**Key Features:**
- **Status Filtering** - All, Scheduled, In-Progress, Completed, Cancelled
- **Exercise Progress** - Visual progress bars and rep tracking
- **Auto-Refresh** - Updates every 30 seconds
- **Session Cards** - Grid layout showing all sessions
- **Summary Stats** - Total, scheduled, in-progress, completed counts

---

### **Alerts** - Alert System
**File:** src/app/components/Alerts.jsx

🆕 Monitor high-risk sessions with incomplete exercises.

**Key Features:**
- **High-Risk Detection** - Sessions with incomplete exercises
- **Alert Summary** - Total alerts, incomplete exercises count
- **Expandable Details** - Click to see incomplete exercises
- **Auto-Refresh** - Updates every 60 seconds
- **Action Prompts** - Suggestions to contact clients
- **Success State** - Green message when all exercises done

---

## 🔐 Authentication Flow

### Login Sequence

1. User lands on Landing Page
2. Clicks "Sign In" → Sign In Form
3. Enters email & password
4. Firebase Auth verifies credentials
5. Backend receives Firebase token
6. Backend checks trainer status (must be "approved")
7. Backend returns JWT token
8. Frontend stores JWT in localStorage
9. Redirect to TrainerDashboard
10. All subsequent API calls include JWT in Authorization header

---

## 🔌 API Integration

### Authorization Header

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Fetching Clients

```javascript
const response = await fetch('http://localhost:5000/api/trainer-app/clients', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
const data = await response.json();
```

### Fetching Sessions

```javascript
const response = await fetch('http://localhost:5000/api/trainer-app/sessions/today', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
const data = await response.json();
```

### Fetching Alerts

```javascript
const response = await fetch('http://localhost:5000/api/trainer-app/alerts', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
const data = await response.json();
```

---

## 👨‍💻 Development Guide

### Running in Development Mode

```bash
npm run dev
```

Changes are automatically hot-reloaded.

### Adding a New Component

**1. Create Component File:**
```jsx
'use client';

import React, { useState } from 'react';

const MyNewComponent = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Component</h1>
    </div>
  );
};

export default MyNewComponent;
```

**2. Use in Dashboard:**
```jsx
import MyNewComponent from './MyNewComponent';

// Add to JSX in TrainerDashboard
{activeTab === 'myfeature' && <MyNewComponent jwtToken={jwtToken} />}
```

### Toast Notifications

```javascript
import { toast } from 'sonner';

toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
```

### Styling with Tailwind

```jsx
// Colors
className="bg-gray-800 text-white"
className="bg-[#A4FEB7]" // Brand green

// Responsive
className="px-4 sm:px-6 lg:px-8"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// States
className="hover:bg-gray-700 transition"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```bash
npm install
npm run dev
```

---

### Issue: "Firebase config is invalid"

**Solution:**
1. Verify all env variables in `.env.local`
2. Copy Firebase credentials exactly from Console
3. No spaces or extra characters
4. Restart dev server

---

### Issue: "401 Unauthorized" on API calls

**Solution:**
1. Check JWT token in localStorage
2. Verify token not expired
3. Re-login to get new token
4. Check backend JWT_SECRET

---

### Issue: Blank page / components not showing

**Solution:**

All interactive components need `'use client'`:
```jsx
'use client';

import React from 'react';
```

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review browser console for errors (F12)
3. Check Network tab for API responses
4. Ensure backend is running on port 5000
5. Verify Firebase and environment configuration

---

## 📄 License

[Your License Here]

---

## 🎯 Next Steps

1. **Configuration** - Set up `.env.local` with Firebase credentials
2. **Backend Connection** - Start backend on port 5000
3. **Development** - Run `npm run dev` and test locally
4. **Customization** - Add your colors, logos, and branding
5. **Deployment** - Deploy to Vercel or your hosting platform

---

**Happy Training! 🏋️💪**

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
