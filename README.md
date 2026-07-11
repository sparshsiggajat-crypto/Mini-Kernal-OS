# 🖥️ MiniKernel OS Simulator with DBMS

A web-based **Operating System Kernel Simulation Platform** that demonstrates the working of an OS kernel through process management, CPU scheduling, memory management, file systems, and database integration.

---

## 🚀 Live Demo

🌐 Application Link:  
https://minikernel-os-simulator-356200851822.asia-southeast1.run.app

---

## 📌 Overview

MiniKernel OS Simulator is an educational project designed to simulate the core functionalities of an Operating System kernel.

The project provides an interactive environment to understand how an OS manages:

- Processes
- CPU Scheduling
- Memory
- Files
- Users
- System Resources

All modules are internally connected using a relational database for storing and managing system information.

---

## ✨ Features

### ⚙️ Process Management
- Create, suspend, resume, and terminate processes
- Process state tracking
- Process history management

### 🖥️ CPU Scheduling
Implemented Algorithms:
- FCFS
- SJF
- Round Robin
- Priority Scheduling

Includes:
- Gantt Chart
- Waiting Time
- Turnaround Time Calculation

### 💾 Memory Management
Supports:
- First Fit
- Best Fit
- Worst Fit
- Paging
- Segmentation

### 📂 File System Simulation
- Create and manage files/folders
- File operations
- Storage monitoring

### 💻 Terminal Emulator
Linux-style command simulation:

```
help
ls
pwd
mkdir
touch
cat
rm
ps
cpu
mem
clear
```

### 📊 Dashboard
Displays:
- CPU Usage
- Memory Usage
- Processes
- Logs
- System Statistics

### 🗄️ Database Integration
Uses database management for storing:

- Users
- Processes
- Memory Data
- Files
- Logs
- Scheduler History

---

## 🏗️ Architecture

```
User
 |
Frontend
(HTML/CSS/JavaScript)
 |
Flask Backend
 |
SQLAlchemy ORM
 |
SQLite/MySQL Database
 |
Kernel Simulation Modules
```

---

## 🛠️ Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript
- Bootstrap
- Chart.js

**Backend**
- Python
- Flask
- SQLAlchemy

**Database**
- SQLite / MySQL

**Deployment**
- Google Cloud Run

---

## 🎯 Purpose

This project helps in understanding practical concepts of:

- Operating Systems
- Kernel Architecture
- CPU Scheduling
- Memory Management
- File Systems
- DBMS Integration

---

## ⚙️ Run Locally

Clone repository:

```bash
git clone https://github.com/sparshsiggajat-crypto/Mini-Kernal-OS.git
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run application:

```bash
python app.py
```

Open:

```
http://localhost:5000
```

---

⭐ If you find this project useful, consider starring the repository.
