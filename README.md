# 🎓 No Dues Management System

## Deploy the full application to Vercel

GitHub Pages can only host the static showcase; it cannot run the login, API routes, MongoDB operations, approvals, or assignment uploads. To make those features available online, deploy this Next.js project to Vercel:

1. Sign in to [Vercel](https://vercel.com/) using the GitHub account that owns `LogeshKumar30/NDMS`.
2. Choose **Add New → Project**, import `LogeshKumar30/NDMS`, and keep the project root as the Root Directory. Vercel should detect Next.js automatically.
3. Before deploying, add these **Production** environment variables in the Vercel project settings:
   - `MONGODB_URI` — connection string for a hosted MongoDB database reachable from Vercel. A local `127.0.0.1` MongoDB URL will not work on Vercel.
   - `MONGODB_DB` — database name, for example `no_due_db`.
   - `JWT_SECRET` — a unique, long, random secret. Do not use the development fallback or commit the value to GitHub.
   - `GEMINI_API_KEY` — optional; without it, the chatbot uses built-in guidance.
4. Deploy the project and open the Vercel deployment URL. Check `/api/health` to confirm MongoDB is reachable.
5. Enable automatic deployments from the `main` branch in Vercel’s Git settings. Future merged changes will be deployed by Vercel.

The GitHub Pages URL remains a static showcase. Use the Vercel URL for the complete application. Keep `.env.local` private and enter production secrets directly in Vercel’s environment-variable settings.

### 🚀 Smart Department Administration & Student Clearance

A web-based application designed to simplify student no-dues clearance and departmental administration through role-based access control, pre-request approvals, Excel-based record management, class and subject allocation, leave approvals, and integrated chatbot assistance.

![Project Status](https://img.shields.io/badge/Status-Completed-brightgreen)
![Application](https://img.shields.io/badge/Type-Web%20Application-blue)
![Chatbot](https://img.shields.io/badge/Chatbot-Integrated-purple)
![Record Management](https://img.shields.io/badge/Records-Excel%20Based-green)

---

## 📑 Table of Contents

- [📋 Project Overview](#-project-overview)
- [🎯 Project Objectives](#-project-objectives)
- [🏗️ System Architecture](#️-system-architecture)
- [👥 User Roles and Responsibilities](#-user-roles-and-responsibilities)
- [✨ Key Features](#-key-features)
- [🔄 System Workflow](#-system-workflow)
- [📊 Excel Record Management](#-excel-record-management)
- [🔐 Security and Access Control](#-security-and-access-control)
- [💻 Technology Stack](#-technology-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation and Setup](#️-installation-and-setup)
- [🧪 Testing and Validation](#-testing-and-validation)
- [🚀 Future Enhancements](#-future-enhancements)
- [🌟 Project Benefits](#-project-benefits)
- [📝 Conclusion](#-conclusion)

---

## 📋 Project Overview

The **No Dues Management System** is a web-based application developed to streamline student clearance requests and departmental administrative activities within an educational institution.

The application provides dedicated access for students, staff, and the Head of Department (HOD). Students can submit pre-requests and monitor their approval status, while the HOD manages departmental activities such as request approvals, class allocation, subject allocation, leave approvals, and student and staff records.

The system maintains student and staff information in separate Excel files, accessible only to the HOD through authorized application functionality. An integrated chatbot assists users by answering common questions and providing guidance about the no-dues process.

The primary goal is to reduce manual administrative work, improve record organization, establish clear approval workflows, and provide a convenient user experience.

## 🎯 Project Objectives

- 🎓 Simplify the student no-dues clearance process.
- ✅ Implement a structured pre-request approval workflow.
- 📊 Maintain separate Excel files for student and staff records.
- 🛡️ Restrict Excel record access to the HOD.
- 🏫 Enable centralized class allocation.
- 📚 Support subject allocation to staff members.
- 🗓️ Organize departmental leave approval activities.
- 🤖 Provide chatbot assistance for common user queries.
- 🔐 Implement role-based access to administrative functions.
- 📈 Improve transparency and efficiency in departmental operations.

---

## 🏗️ System Architecture

The system follows a role-based architecture that separates user access, administrative operations, and record management.

```text
                 🎓 NO DUES MANAGEMENT SYSTEM
                             |
                             ▼
             🔐 Authentication & Authorization
                             |
             +---------------+---------------+
             |               |               |
             ▼               ▼               ▼
         👨‍🎓 STUDENT       👨‍🏫 STAFF        🛡️ HOD
             |               |               |
      +------+-----+    +----+------+   +----+-----------+
      | Pre-Request|    | Authorized|   | HOD Dashboard  |
      | Submission |    | Staff     |   |                |
      | Status     |    | Functions |   | Approvals      |
      | Tracking   |    +-----------+   | Class Allocation|
      | Chatbot    |                    | Subject Allocation
      +------+-----+                    | Leave Approval |
             |                           +-------+--------+
             |                                   |
             |                                   ▼
             |                      📊 HOD-Restricted Excel
             |                                   |
             |                          +--------+--------+
             |                          |                 |
             |                    students.xlsx       staff.xlsx
             |                    Student Records    Staff Records
             |
             ▼
      🤖 Chatbot Assistance
```

**Architecture principle:** All protected administrative operations must be authorized by the backend. Student and staff users must not have direct access to HOD-restricted Excel records.

---

## 👥 User Roles and Responsibilities

### 👨‍🎓 1. Student Module

The student module enables students to initiate and monitor their no-dues clearance process.

**Features:**

- 🔑 Login and access the student dashboard.
- 📝 Submit a pre-request for no-dues clearance.
- 🔎 Track submitted request status.
- ✅ View approval decisions and relevant instructions.
- 🤖 Use the chatbot for guidance and common questions.

**Access restrictions:**

- Cannot access student or staff Excel files.
- Cannot approve their own pre-requests.
- Cannot perform HOD-exclusive administrative operations.

### 👨‍🏫 2. Staff Module

The staff module provides access to staff-related functionality according to assigned permissions.

**Features:**

- 🔑 Access authorized staff functions.
- 🏫 View assigned class information, where available.
- 📚 View assigned subject information, where available.
- 📋 Access relevant departmental information.
- 🤖 Use chatbot assistance, if enabled.

**Access restrictions:**

- Cannot access the HOD's Excel records.
- Cannot perform restricted administrative operations without authorization.

### 🛡️ 3. Head of Department (HOD) Module

The HOD module provides centralized control over departmental administration.

**Features:**

- 📊 Access student and staff Excel records.
- ✅ Review, approve, or reject student pre-requests.
- 🏫 Allocate classes to staff members.
- 📚 Allocate subjects to staff members.
- 🗓️ Review and manage leave approvals.
- 📋 Monitor student clearance requests.
- ⚙️ Manage departmental assignments and information.

The HOD is the authorized administrator for the departmental operations listed above.

---

## ✨ Key Features

### ✅ 1. Student Pre-Request Approval

Students can submit a pre-request before continuing with the no-dues clearance process.

**Workflow:**

1. The student logs in.
2. The student submits a pre-request.
3. The system records the request.
4. The HOD reviews the submitted request.
5. The HOD approves or rejects the request.
6. The system updates the request status.
7. The student checks the result and proceeds according to the clearance process.

**Typical request statuses:**

- ⏳ Pending
- ✅ Approved
- ❌ Rejected

### 📊 2. Excel-Based Record Management

The application maintains student and staff information in separate Excel files.

| Excel File | Purpose | Authorized Access |
|---|---|---|
| `students.xlsx` | Student information | HOD only |
| `staff.xlsx` | Staff information | HOD only |

This approach keeps student and staff records organized separately and allows the HOD to manage departmental data from a centralized interface.

The actual columns depend on the Excel templates used in the project.

### 🏫 3. Class Allocation

The HOD can assign classes or sections to staff members.

**Process:**

1. Open the class allocation section.
2. Select the staff member.
3. Choose the relevant class or section.
4. Save the allocation.
5. Make the updated assignment available to authorized users.

### 📚 4. Subject Allocation

The HOD manages subject assignments for staff members.

**Process:**

1. Select a staff member.
2. Choose the subject.
3. Confirm the allocation.
4. Save the updated assignment.
5. Display the allocation to authorized users.

### 🗓️ 5. Leave Approval Management

The system supports departmental leave approval activities managed by the HOD.

**Process, where leave submission is enabled:**

1. A staff member submits a leave request.
2. The system records the request.
3. The HOD reviews the request.
4. The HOD approves or rejects it.
5. The request status is updated.
6. The staff member checks the decision, where supported.

### 🤖 6. Integrated Chatbot Assistance

The chatbot provides conversational assistance to users interacting with the system.

**Example questions:**

- 💬 How do I apply for no-dues clearance?
- 💬 How can I submit a pre-request?
- 💬 How do I check my request status?
- 💬 Who approves my request?
- 💬 What does pending approval mean?
- 💬 What are the steps in the clearance process?

**Benefits:**

- ⚡ Provides quick guidance for common queries.
- 📘 Helps users understand the application workflow.
- 💬 Reduces repetitive questions about the process.
- 🎯 Improves the overall user experience.

The chatbot provides informational assistance. It does not independently approve requests or allocate classes and subjects unless such authorized integrations are specifically implemented.

---

## 🔄 System Workflow

### 🎓 Student Clearance Workflow

```text
Student Login
     |
     ▼
Student Dashboard
     |
     ▼
Submit Pre-Request
     |
     ▼
HOD Reviews Request
     |
     ▼
Approve / Reject
     |
     ▼
Request Status Updated
     |
     ▼
Student Checks Status
```

### 🛡️ HOD Administrative Workflow

```text
HOD Login
    |
    ▼
HOD Dashboard
    |
    ├── 📋 Review Pre-Requests
    |
    ├── 🏫 Allocate Classes
    |
    ├── 📚 Allocate Subjects
    |
    ├── 🗓️ Manage Leave Approvals
    |
    └── 📊 Access Excel Records
              |
              ├── students.xlsx
              |
              └── staff.xlsx
```

### 🤖 Chatbot Workflow

```text
User Enters a Question
          |
          ▼
Chatbot Processes the Query
          |
          ▼
Provides Relevant Guidance
          |
          ▼
User Follows the Suggested Steps
```

---

## 📊 Excel Record Management

The system uses separate Excel files for managing departmental records.

### 📁 Student Records — `students.xlsx`

May contain information such as:

- Student ID
- Student Name
- Department
- Class or Section
- Academic Year
- Clearance Status

### 📁 Staff Records — `staff.xlsx`

May contain information such as:

- Staff ID
- Staff Name
- Department
- Designation
- Assigned Class
- Assigned Subjects

The actual columns should match the files implemented in the application.

**🔒 Data access rule:** Only the HOD should be able to view or download these records through the application. The files should not be stored in a publicly accessible frontend directory or committed to a public repository if they contain confidential information.

---

## 🔐 Security and Access Control

The system uses role-based access principles to separate student, staff, and HOD functionality.

Security considerations include:

- 🔑 Authentication for protected application areas.
- 🛡️ Backend authorization for HOD-only operations.
- 📊 Restricted access to student and staff Excel records.
- 🚫 Prevention of unauthorized administrative actions.
- 🔍 Input validation for submitted requests.
- 🔒 Secure storage of API keys and application credentials.
- 🧾 Appropriate tracking of important approval actions, where implemented.
- 🤖 Protection of confidential records from chatbot responses.

**Important:** Hiding a button in the frontend is not sufficient. Protected operations must also be checked by the backend.

---

## 💻 Technology Stack

The following categories describe the technologies used to build this type of application. Update this section to match the actual dependencies in your repository.

| Component | Purpose |
|---|---|
| Frontend | User interface and dashboards |
| Backend | Request processing and business logic |
| Excel Processing | Student and staff record management |
| Chatbot | Conversational user assistance |
| Authentication | User verification |
| Authorization | Role-based access control |
| Git & GitHub | Version control and project hosting |

**Note:** Add your exact frameworks, programming languages, database, and chatbot technology based on the completed implementation.

---

## 📂 Project Structure

The following is an example of a logical project structure. Keep the actual folder and file names from your repository when documenting your implementation.

```text
no-dues-management-system/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── routes/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── config/
│
├── data/
│   ├── students.xlsx
│   └── staff.xlsx
│
├── docs/
│   └── screenshots/
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## ⚙️ Installation and Setup

Follow the setup instructions appropriate to the project's actual technology stack.

### 📌 Prerequisites

- 💻 Required programming language and runtime.
- 📦 Package manager and project dependencies.
- 🔐 Environment variables, if required.
- 📊 Student and staff Excel files in the configured data location.

### 🚀 Setup Steps

1. Clone or download the repository.
2. Open the project folder in Visual Studio Code.
3. Install the dependencies listed in the project configuration files.
4. Configure the required environment variables.
5. Verify that the required Excel files are available.
6. Start the backend and frontend services according to the project setup.
7. Open the application in your browser.
8. Test the student, staff, and HOD workflows using authorized test accounts.

Consult the actual project configuration files for the exact commands needed to run the application.

---

## 🧪 Testing and Validation

The following scenarios should be checked to validate the application.

- ✅ Student can submit a pre-request.
- ✅ Student can view the relevant request status.
- ✅ HOD can approve or reject student pre-requests.
- ✅ Student and staff records are maintained separately.
- ✅ Only the HOD can access protected Excel records.
- ✅ HOD can allocate classes and subjects.
- ✅ Leave approval operations work according to the configured workflow.
- ✅ Chatbot answers common process-related questions.
- 🔐 Unauthorized users cannot perform protected administrative operations.

---

## 🚀 Future Enhancements

Potential enhancements for future versions include:

- 📈 Dashboard analytics for pending and completed requests.
- 🧾 Detailed approval history and audit logs.
- 🔎 Advanced searching and filtering of departmental records.
- 📩 Automated status notifications.
- 🤖 Enhanced chatbot responses using verified system information.
- 📑 Downloadable clearance summaries and reports.
- 📱 Improved mobile responsiveness.
- 📊 Stronger Excel import validation and error reporting.

These are possible future improvements, not claims that the features are already implemented.

---

## 🌟 Project Benefits

- 🎯 Simplifies student no-dues clearance.
- 📋 Organizes student and staff records.
- 🛡️ Centralizes HOD administrative control.
- ⏱️ Reduces repetitive manual administrative tasks.
- 🔎 Improves visibility of request status.
- 🤖 Provides convenient chatbot assistance.
- 🔐 Establishes clear access boundaries for administrative data.
- 🏫 Supports organized departmental operations.

---



## Requirements

- Node.js 20.9 or newer
- MongoDB, local or hosted

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure the MongoDB connection and a private JWT secret.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The static showcase can also be opened locally at [http://localhost:3000/showcase/index.html](http://localhost:3000/showcase/index.html).

Check the database connection at `/api/health`. Build the production app with `npm run build`, then run it with `npm start`.

## GitHub upload notes

- Do not upload `.env.local`, credentials, or other secret values.
- Keep `.env.example` in the repository as a template; it contains placeholders only.
- `node_modules`, `.next`, build output, local environment files, and TypeScript build info are excluded by `.gitignore`.
- The GitHub Actions workflow in `.github/workflows/pages.yml` publishes `public/showcase/` when changes are pushed to `main`. In the repository’s **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
- 

## 📝 Conclusion

The **No Dues Management System** provides a centralized approach to student clearance requests and departmental administration. Its main features include student pre-request approval, HOD-controlled Excel record management, class and subject allocation, leave approval, and integrated chatbot assistance.

By organizing these operations through role-based access and structured workflows, the system aims to improve administrative efficiency, record organization, and transparency within an educational institution.

---

## 👨‍💻 Project Information

- **Project Name:** No Dues Management System
- **Project Type:** Web Application
- **Domain:** Educational Administration
- **Primary Features:** Student Clearance, Approval Workflow, Excel Record Management, HOD Administration, Chatbot Assistance
