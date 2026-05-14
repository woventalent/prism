# Recruitment Command Centre – TODO

## Database & Backend
- [x] Replace Drizzle/MySQL with direct pg (node-postgres) pool pointing to online PostgreSQL DB
- [x] Set PG_DATABASE_URL secret to the online PostgreSQL connection string
- [x] Wire original server/db.js to use PG_DATABASE_URL
- [x] Mount original Express REST routes (auth, roles, users) in Manus entry point
- [x] Schema already exists on online DB (seeded previously)
- [x] Seed already applied to online DB

## Authentication
- [x] JWT-based login page (email + password, stored in localStorage)
- [x] Role-based access control (admin vs recruiter)
- [x] Logout functionality
- [x] Auto-redirect unauthenticated users to login

## Dashboard
- [x] Stats bar: total headcount, open roles, difficulty breakdown (RAG), avg TTF
- [x] Roles table with columns: title, experience, headcount, CTC, difficulty, TTF, channels
- [x] Filter/search roles
- [x] Add Role button (admin/recruiter)

## Role Detail Drawer
- [x] Full recruiter pitch display
- [x] Lifecycle stage progression (sourcing → screening → interviewing → offer → closed)
- [x] Sourcing channels list with add/remove
- [x] Approvals section: add, toggle pending/approved, remove
- [x] Panelists section: add, edit, remove (name, designation, email, phone)
- [x] Edit role form (all fields)

## Add / Edit Role Form
- [x] Fields: title, experience, headcount, CTC, difficulty (RAG), TTF, pitch, channels
- [x] JD/questionnaire/assessment/feedback links (optional)
- [x] Validation

## Admin Users Management
- [x] List all users (admin only)
- [x] Create user (name, email, password, role)
- [x] Edit user (name, email, role, optional password reset)
- [x] Delete user (cannot delete self)
- [x] Role assignment: admin, recruiter, viewer

## Layout & Navigation
- [x] AEWC-branded sidebar with logo and colour scheme (#00259C)
- [x] Navigation: Dashboard link (all), Users link (admin only)
- [x] Responsive layout
- [x] AEWC branding in index.html (Outfit font, title)

## UX Improvements
- [x] Make entire row in All Roles table clickable to open role drawer (remove Details button)

## Testing
- [x] Vitest tests for API routes (14 tests, all passing)
- [x] Verify login, roles CRUD, approvals, panelists, lifecycle end-to-end
