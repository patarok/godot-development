# GODOT - Community Boilerplate (Open Source)

## Overview

**GODOT** is an open-source portfolio and community boilerplate version of a Godot project management application. It is built with SvelteKit 5, TypeORM, and PostgreSQL.

This version demonstrates modern full-stack development skills, specifically focusing on the Svelte ecosystem and robust backend architecture.

### What it shows:
- **Exemplary usage of shadcn-svelte**: Implementation of components based on `bits-ui` in a SvelteKit app.
- **Project Management Concepts**: A foundational look at how to build a project management application.
- **Advanced SvelteKit Patterns**: Demonstrates how nesting works (and doesn't work) with Svelte components rendering on both server and client sides.
- **Infrastructure**: A production-like development environment using Docker Compose.

---

## 💼 For Employers

This project demonstrates proficiency in:
- **Architecture**: Understanding how to build entities, stores, hooks, and determining when to use services vs. direct repository access.
- **SvelteKit Mastery**: Handling the SvelteKit lifecycle, server-side rendering, and complex routing.
- **Component Design**: Creating Svelte molecules from component frameworks and using them in a meaningful, user-centric way.
- **DevOps**: Building a comprehensive Dockerized environment for development and hosting.

> **Note**: This is not a "design marvel" but rather a demonstration of technical implementation and conceptual ideas for project management lifecycles.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 22 or higher)
- Docker & Docker Compose
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/patarok/godot-development
   cd godot-development
   ```

2. Bootstrap the environment:
   ```bash
   docker compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Initialize the database and seed data:
   ```bash
   # Both are required for a complete base
   npm run db:seed:base
   npm run db:seed:dev
   ```

### Running the Application

```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Test Accounts
- **Test User**: `test@example.com` / `user123`
- **Admin User**: `admin@example.com` / `admin123`

---

## 🛠 Features

- **Project Management**: CRUD operations, status tracking, budget management, and active project focus.
- **Task Management**: Hierarchical tasks, status/priority tracking, and project-task assignment.
- **Interactive Boards**: Kanban view with drag-and-drop and dynamic grouping.
- **Activity Logging**: Automated logs for project and task activities.
- **Admin Panel**: User management and system settings via a consolidated menubar.
- **Charts**: Data visualization for contributions and project revenue.
- **Theme Support**: Integrated Light/Dark mode.

---

## 🔧 Technical Stack

- **Frontend**: SvelteKit 5 with Svelte 5 runes ($state, $derived, $props)
- **Backend**: TypeORM with PostgreSQL
- **Styling**: Tailwind CSS v4 with shadcn-svelte components
- **DnD**: @dnd-kit-svelte for drag-and-drop functionality
- **Icons**: Tabler Icons, Lucide Icons
- **Charts**: LayerChart with D3

---

## 📂 Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── kanban/         # Kanban board components
│   │   ├── ui/             # shadcn-svelte UI components
│   │   └── molecules/      # Complex composite components
│   ├── server/
│   │   ├── database/
│   │   │   ├── entities/   # TypeORM entities
│   │   │   └── seeds/      # Database seed scripts
│   ├── state.svelte.ts     # Global application state
│   └── utils/              # Utility functions
├── routes/                  # SvelteKit routes
│   ├── admin/              # Admin panel
│   ├── projects/           # Project management
│   └── tasks/              # Task management
└── hooks.server.ts         # Server hooks for auth
```

---

## 📜 License

**CC BY-NC-SA 4.0** - Free for non-commercial use.

---

*Active commercial development continues in a private repository.*
