# GODOT - Project Management & Requirements Tool

## Overview

GODOT is a modern project management and requirements tracking application built with SvelteKit 5, TypeORM, and PostgreSQL. It combines DevOps-oriented workflows with comprehensive project tracking capabilities, featuring both traditional table views and interactive Kanban boards.

## Current Features

### ✅ Core Functionality
- **User Management**: Role-based access control (Owner, Admin, Controller, User) with granular permissions and sub-roles
- **Project Management**: Full CRUD operations for projects with status tracking, budgets, timelines, and iteration management
- **Task Management**: 
  - Comprehensive task tracking with statuses, priorities, types, and assignments
  - Parent-child task relationships for hierarchical organization
  - Time tracking with daily time series aggregation
  - Task dependencies and meta-tasks support
- **Kanban Board**: 
  - Dynamic column generation (by status or by weekday)
  - Drag-and-drop interface (powered by @dnd-kit-svelte)
  - Real-time view switching between table and kanban views
  - Visual indicators for today's date in weekday view
- **Data Tables**: Advanced filtering, sorting, pagination, and inline editing
- **Authentication**: Secure login/registration with Argon2 password hashing
- **Activity Logging**: Automatic logging of project and task activities
- **Avatar Generation**: Automated identicon generation for users and projects

### 🎨 UI/UX
- Shadcn-svelte component library integration
- Responsive sidebar navigation
- Dark mode support
- Breadcrumb navigation
- Admin dashboard with dedicated layout
- Interactive charts and data visualization (LayerChart)

### 🔧 Technical Stack
- **Frontend**: SvelteKit 5 with Svelte 5 runes ($state, $derived, $props)
- **Backend**: TypeORM with PostgreSQL
- **Styling**: Tailwind CSS v4 with shadcn-svelte components
- **DnD**: @dnd-kit-svelte for drag-and-drop functionality
- **Icons**: Tabler Icons, Lucide Icons
- **Charts**: LayerChart with D3

## Getting Started

### Prerequisites
- Node.js (version 22 or higher)
- Docker & Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/patarok/godot-development
   cd godot-development
   ```

2. Bootstrap the development environment:
   ```bash
   docker compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

5. Initialize the database and seed data:
   ```bash
   npm run db:seed:alt
   ```

### Running the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in terminal).

### Available Scripts

```json
{
  "dev": "Start development server",
  "build": "Build for production",
  "preview": "Preview production build",
  "check": "Run Svelte type checking",
  "db:schema:drop": "Drop all database tables",
  "db:seed:alt": "Seed database with base + test data",
  "db:seed": "Seed base data only",
  "db:seed:users": "Seed additional users",
  "db:seed:tasks": "Seed additional tasks",
  "db:seed:time": "Seed time entries",
  "db:seed:all": "Run all seed scripts sequentially"
}
```

## Project Structure

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
│   │   │   ├── models/     # Domain models
│   │   │   ├── seeds/      # Database seed scripts
│   │   │   └── services/   # Business logic services
│   ├── stores/             # Svelte stores
│   └── utils/              # Utility functions
├── routes/                  # SvelteKit routes
│   ├── (auth)/             # Authentication routes
│   ├── admin/              # Admin panel
│   ├── projects/           # Project management
│   └── tasks/              # Task management
└── hooks.server.ts         # Server hooks for auth
```

## Database Schema

The application uses a comprehensive relational schema including:
- Users, Roles, Permissions (with sub-roles)
- Projects with status, priority, risk levels
- Tasks with hierarchical relationships
- Task/Project assignments and logs
- Time tracking entries
- Tags and tagging system
- Mail and contractor mail entities

## Default Users (Development)

After running `npm run db:seed:alt`:
- Owner: `owner@example.com` / `ownerpass`
- Admin: `admin@example.com` / `adminpass`
- User: `user@example.com` / `userpass`

## Roadmap

See [TODO.md](./TODO.md) for the current development roadmap and priorities.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC
