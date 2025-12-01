# 🌊 FlowBoard - Premium Task Management Extension

FlowBoard is a powerful, aesthetic, and feature-rich Chrome extension designed to streamline your project management directly from your browser. With a focus on speed, visual appeal, and seamless integration, FlowBoard helps you stay organized without leaving your current tab.

![FlowBoard Banner](https://via.placeholder.com/1200x400?text=FlowBoard+Premium+Extension)

## 🚀 Key Features

-   **Zero-Setup Quick Add:** Instantly capture tasks from any webpage using `Ctrl+Shift+F`.
-   **Visual Boards:** Kanban, List, and Calendar views to visualize your work your way.
-   **Time Tracking:** Built-in timer and manual time entry for precise productivity tracking.
-   **Team Collaboration:** Real-time sync, role-based access (Manager, Lead, Resource), and task assignments.
-   **Smart Reports:** Visual insights into team performance and project progress (Manager only).
-   **Data Ownership:** Export your data anytime (CSV/JSON) or archive completed projects.

## 🛠️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/manav828/flowboard.git
    cd flowboard
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Build the Extension:**
    ```bash
    npm run build
    ```

4.  **Load in Chrome:**
    -   Open `chrome://extensions/`
    -   Enable **Developer mode** (top right toggle).
    -   Click **Load unpacked**.
    -   Select the `dist` folder generated in your project directory.

## ⚡ Quick Start

1.  **Create an Account:** Open the extension and sign up.
2.  **Create a Project:** Click "+" to start a new project.
3.  **Add Members:** Share the unique **Join Code** with your team.
4.  **Start Working:** Add columns, create tasks, and drag-and-drop to manage workflow.

## 🏗️ Tech Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** TailwindCSS, Lucide Icons
-   **State Management:** Zustand
-   **Backend:** Supabase (PostgreSQL, Realtime)
-   **Drag & Drop:** dnd-kit

## 📄 License

This project is licensed under the MIT License.

---
*Built with ❤️ by Manav*
