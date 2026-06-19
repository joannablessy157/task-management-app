# ✅ TaskFlow – Task Management Application

A modern and responsive full-stack Task Management Application that helps users organize, track, and manage their daily tasks efficiently. The application provides secure authentication, task tracking, productivity monitoring, and a clean user-friendly interface.

---

## 🌐 Repository

🔗 https://github.com/joannablessy157/task-management-app

---

## 📖 Overview

TaskFlow provides a centralized workspace where users can:

* Create and manage tasks
* Track task completion status
* Set task priorities
* Organize daily activities
* Manage pending and completed tasks
* Securely access personal task data through authentication
* Improve productivity with a clean and responsive interface

Built using HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.

---

## ✨ Features

### 🔐 User Authentication

* User Registration
* Secure Login System
* Password Hashing using bcrypt
* JWT Authentication
* Protected Routes

### 📋 Task Management

* Create New Tasks
* Edit Existing Tasks
* Delete Tasks
* Mark Tasks as Completed
* View Pending Tasks
* Task Priority Management
* Due Date Tracking

### 📊 Productivity Dashboard

* Track Task Progress
* Monitor Completed Tasks
* View Pending Work
* Organize Daily Activities

### 📱 Responsive Design

* Mobile-Friendly Interface
* Tablet Optimized
* Desktop Optimized
* Adaptive Layout

### 🔒 Security

* Secure Password Storage
* Token-Based Authentication
* Protected API Endpoints
* User-Specific Task Access

---

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Backend

* Node.js
* Express.js

### Database

* MySQL
* mysql2

### Authentication & Security

* JWT (JSON Web Tokens)
* bcryptjs

---

## 📂 Project Structure

```text
task-management-app/

│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── User.js
│   └── Task.js
│
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── settings.html
│   ├── style.css
│   └── script.js
│
├── routes/
│   ├── auth.js
│   └── tasks.js
│
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## 🎯 Skills Demonstrated

* Full-Stack Web Development
* REST API Development
* Authentication & Authorization
* CRUD Operations
* MySQL Database Integration
* Backend Routing
* Middleware Implementation
* Responsive Web Design
* Local Storage Management
* Git & GitHub Version Control

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/joannablessy157/task-management-app.git
```

### Navigate to Project Folder

```bash
cd task-management-app
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskflow
JWT_SECRET=your_secret_key
PORT=5000
```

### Run the Application

```bash
node server.js
```

Open:

```text
http://localhost:5000
```

---

## 📸 Screenshots

### Login Page

![Login Page](screenshots/login.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Task Management

![Task Management](screenshots/tasks.png)

---

## 🔮 Future Improvements

* Task Categories
* Search & Filtering
* Dark Mode Support
* Email Notifications
* Calendar Integration
* Task Analytics Dashboard
* Drag & Drop Task Organization
* Cloud Deployment

---

## 👩‍💻 Author

**Joanna Blessy E**

* B.Tech Computer Science and Engineering
* GitHub: https://github.com/joannablessy157

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.
