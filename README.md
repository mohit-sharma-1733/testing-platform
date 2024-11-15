# Test Taking Platform

A comprehensive test-taking platform built with Next.js and Flask, featuring secure authentication, real-time test sessions, and detailed analytics.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

### User Features

- **Secure Authentication**: Login and signup with JWT-based security.
- **Test-Taking Interface**: Supports MCQ, Multiple Select, and Fill-in-the-Blanks questions.
- **Real-Time Progress**: Auto-save progress during tests with a live timer.
- **Detailed Results**: Get detailed explanations and performance breakdowns after tests.
- **User Dashboard**: Track performance metrics and manage test history.
- **Leaderboard**: Compare scores and ranks with others.

### Admin Features

- **Test Management**: Create tests.
- **AI-Powered Questions**: Generate questions using Google Gemini AI.
- **Analytics Dashboard**: View detailed test statistics and user metrics.
- **User Management**: Manage users and monitor active sessions.

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **State Management**: React Query
- **Notifications**: Sonner for toast notifications
- **Visual Effects**: Canvas Confetti for celebrations
- **Data Display**: React Table

### Backend

- **Framework**: Flask 2.0+
- **Database**: PostgreSQL 12+ with SQLAlchemy ORM
- **Authentication**: JWT
- **AI Integration**: Google Gemini AI
- **Cross-Origin Support**: Flask-CORS
- **Database Migrations**: Flask-Migrate

## 🏗 Architecture

The platform follows a modular architecture, ensuring scalability and maintainability:

- **Frontend**: Serves the user interface with server-side rendering (SSR) using Next.js.
- **Backend**: Provides RESTful APIs for test management, authentication, and analytics.
- **Database**: PostgreSQL as the relational database for secure data storage.
- **Real-Time Updates**: WebSocket integration for live test sessions.
- **AI Services**: Powered by Google Gemini for question generation.

## ✅ Prerequisites

- **Node.js**: v16 or higher
- **Python**: 3.9 or higher
- **PostgreSQL**: 12 or higher
- **Git**
- **A package manager**: `npm`, `yarn`, or `pnpm`

## 📥 Installation Guide

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mohit-sharma-1733/testing-platform.git
   cd test-taking-platform
   ```

2. **Setup Frontend**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Backend**:

   - Create a virtual environment:
     ```bash
     python -m venv venv
     source venv/bin/activate  # On Windows, use venv\Scripts\activate
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Run migrations:
     ```bash
     flask db upgrade
     ```
   - Start the server:
     ```bash
     flask run
     ```

4. **Configure Environment Variables**:
   - Frontend: Create a `.env.local` file in the `frontend` directory.
   - Backend: Create a `.env` file in the `backend` directory.

## 🚧 Development

- **Frontend**:

  - Start the development server:
    ```bash
    npm run dev
    ```
  - Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Backend**:
  - Start the Flask server:
    ```bash
    flask run
    ```
  - API will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000).

## 🧪 Testing

- **Frontend**:
  - Run tests:
    ```bash
    npm test
    ```
- **Backend**:
  - Run tests:
    ```bash
    pytest
    ```

## 🚀 Deployment

1. **Frontend**:

   - Build the application:
     ```bash
     npm run build
     ```
   - Deploy using your preferred platform (e.g., Vercel, Netlify).

2. **Backend**:

   - Use a production server like `gunicorn` or `uwsgi`:
     ```bash
     gunicorn app:app
     ```

3. **Database**:
   - Ensure your PostgreSQL instance is accessible in the production environment.

## 🔒 Security

- Use HTTPS for secure communication.
- Store sensitive credentials securely (e.g., AWS Secrets Manager, .env files).
- Implement role-based access control (RBAC).

## 🛠 Troubleshooting

- **Frontend Errors**:

  - Check the browser console for error logs.
  - Ensure `.env.local` contains valid API endpoints.

- **Backend Errors**:
  - Check server logs for traceback.
  - Ensure `.env` variables are correctly configured.

## 💬 Feedback

For issues, suggestions, or contributions, please raise an issue in the [GitHub repository](https://github.com/mohit-sharma-1733/testing-platform.git).

---

Happy Testing! 🚀
