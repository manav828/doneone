# 🏢 Company Owner Lifecycle Guide

This document outlines the complete journey of a Company Owner using the DoneOne system, from the moment of registration to daily operational oversight.

---

## **Phase 1: Registration & The "Fork"**
_Objective: Establish the digital headquarters._

1.  Sign Up: The owner enters their email and password.
2.  The Role Question: The system asks: "How will you use DoneOne?"
    *   Action: Owner selects "I run a Company".
3.  Name the Organization:
    *   Action: Owner enters the Legal Business Name (e.g., "Apex Construction Ltd").
    *   Result: The system creates a dedicated workspace named "Apex Construction Ltd" and assigns the user as the Super Admin.
4.  The Dashboard: The owner lands on a clean dashboard.
    *   Sidebar: Shows "Apex Construction Ltd" as the header.
    *   Projects: Empty (Clean Slate).

---

## **Phase 2: Structural Configuration**
_Objective: Replicate the real-world company structure._

1.  Access Admin Panel: Owner clicks "Admin Panel" (or Company Settings) in the sidebar.
2.  Define Departments:
    *   Owner goes to the Departments tab.
    *   Action: Creates logical business units.
        *   _Example:_ "Head Office", "Site Crew A", "Logistics".
3.  Define Roles:
    *   Owner goes to the Roles tab.
    *   Action: Creates the hierarchy.
        *   _Example:_ "Director" (Red), "Foreman" (Blue), "Worker" (Green).

---

## **Phase 3: Building the Workforce**
_Objective: Onboard employees seamlessly._

1.  Get the Key:
    *   In the Admin Panel, the owner copies the unique Company Join Code.
2.  Invitation:
    *   Owner emails the code to staff: "Sign up at doneone.com and use code APEX-8821 to join."
3.  Gating (Security):
    *   As staff sign up, they appear in the "Pending Requests" list in the Admin Panel.
    *   Action: Owner clicks "Approve".
4.  Assignment:
    *   Upon approval, the Owner immediately:
        *   Assigns them to a Department (e.g., "Site Crew A").
        *   Assigns them a Role (e.g., "Worker").

---

## **Phase 4: Operational Setup (The Projects)**
_Objective: Define the actual work to be done._

1.  Create First Project:
    *   Owner (or a Manager they appointed) clicks "New Project".
2.  Setup:
    *   Name: "Downtown Office Renovation"
    *   Template: Selects "Construction Template" (Standard columns: Demo, Frame, Drywall).
3.  Staffing (The crucial step):
    *   Owner opens Project Assignments.
    *   Filter: Selects Department "Site Crew A".
    *   Action: Adds specific employees from that crew to *this* project only.
    *   Result: Only "Site Crew A" sees this project. The "Head Office" team does not (avoiding clutter).

---

## **Phase 5: Daily Oversight**
_Objective: Monitor progress without micromanaging._

1.  Global Dashboards:
    *   Owner uses "Reports" to see high-level health across all projects.
    *   _Metric:_ "Is 'Downtown Renovation' behind schedule?"
2.  Intervention:
    *   If a project is blocked, the Owner can jump into the specific board, read the Discussion Tasks, and unblock the team.
3.  User Management:
    *   If an employee leaves, the Owner goes to Admin Panel > Employees and revokes access instantly.

---

### **Summary of Permissions**
| Action | Company Owner | Project Manager | Team Lead | Employee |
| :--- | :---: | :---: | :---: | :---: |
| Delete Company | ✅ | ❌ | ❌ | ❌ |
| Manage Depts/Roles | ✅ | ❌ | ❌ | ❌ |
| See All Projects | ✅ | ❌ (Own only) | ❌ (Assigned only) | ❌ (Assigned only) |
| Approve New Users | ✅ | ❌ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ❌ | ❌ |
