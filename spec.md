# Battery Repair Admin Dashboard — Spec

## Tech Stack
- Frontend: React (JSX), Redux, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL

## Overview
Admin dashboard for a battery repair company to manage incoming batteries, repair jobs, staff, parts inventory, and user access.

## User Roles & Permissions

### Super Admin
- Full access to everything below
- Can create/manage Admin accounts and assign roles & permissions

### Admin
- Manage day-to-day operations (batteries, repairs, staff, stock)
- Manage parts stock (mark parts in/out of stock)

## Core Features

### 1. Dashboard
- Overview of key metrics (battery intake, repairs in progress, stock levels, staff activity, etc.)

### 2. Truck / Battery Intake
- Record incoming batteries delivered by truck:
  - Truck number
  - Driver name
  - Date & time (auto-filled/updated)
  - Battery count

### 3. Battery Tracking (Unique ID per Battery)
- On battery intake/first repair, generate a unique ID for each battery
- Looking up that ID later shows full history:
  - Number of times repaired
  - Which parts were changed, and when
  - All repair details, for easy management/tracking

### 4. Repair Management
- For each repair, record:
  - Which part(s) were changed
  - Which staff member performed the change
  - Repair date/time
- Parts used in a repair are deducted from stock (stock managed by Admin)

### 5. Staff Management
- Manage battery repair staff (add/edit staff records)

### 6. Inventory / Stock Management
- Track parts stock used for battery repairs
- Admin manages which parts are in stock / out of stock
- Stock is consumed automatically as parts are used in repairs

### 7. Repaired Battery Return (Dispatch)
- Record outgoing shipment of repaired batteries back to the customer:
  - Truck number
  - Driver name
  - Date & time (auto-filled/updated)
  - Battery count / battery IDs returned

### 8. Audit Log
- Log key actions across the system (who did what, when) for accountability

