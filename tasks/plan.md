# Implementation Plan: HR Employee Portal & Attendance Enhancements

## Overview

Give HR managers, HR specialists, and admins their own employee attendance portal with punch-in/punch-out for any employee, monthly reporting with organizational tree, and a guide map showing last-known employee locations.

## Architecture Decisions

- **Multiple punches per day**: Add a `punch_sequence` column to `attendance_records` (default 1) to support multiple punch-in/punch-out pairs per employee per day. First punch of the day = sequence 1, second = sequence 2, etc.
- **HR punch procedures**: New `attendance.punchInForEmployee` and `attendance.punchOutForEmployee` procedures that accept `employeeId` and require `attendance:manage` capability.
- **Organizational tree**: Recursive CTE query on `managerEmployeeId` to fetch subtrees. Last location from the most recent `attendance_records` entry per employee.
- **Location storage**: `work_location` column stores `"lat,lng"` as text. A `last_known_location` computed field joins from the latest attendance record.
- **Guide map**: New page at `/attendance/guide-map` showing all employees with their last known location as markers. Uses **OpenFreeMap "Bright" style** (`https://tiles.openfreemap.org/styles/bright`) via **MapLibre GL** (open-source, replaces Leaflet raster tiles). "Bright" style is optimized for high-visibility in Saudi Arabia's sunny climate. Saved to database (`guide_maps` table) so managers can access shared maps.

## Task List

### Phase 1: Database Layer

- [ ] **Task 1**: Add `punch_sequence` column to `attendance_records` schema (default 1, not null)
  - Acceptance: Migration runs without error; existing records default to sequence 1
  - Verification: `pnpm db:generate` produces migration; `pnpm db:migrate` applies cleanly

- [ ] **Task 2**: Add `last_location` computed/derived field logic in tRPC — no schema change needed, derive from latest attendance record
  - Acceptance: API returns last known lat/lng per employee when fetching attendance
  - Verification: tRPC typecheck passes

- [ ] **Task 2b**: Create `guide_maps` table schema
  - Fields: id, name, center_lat, center_lng, zoom, created_by (user FK), created_at
  - Acceptance: Migration runs cleanly
  - Verification: `pnpm db:generate` produces migration; `pnpm db:migrate` applies cleanly

### Phase 2: tRPC API (Attendance Router)

- [ ] **Task 3**: Add `punchInForEmployee` procedure — accepts `employeeId`, `workDate`, `workLocation`; requires `attendance:manage` capability
  - Acceptance: HR/admin can punch in for any employee; CONFLICT if same sequence already punched in
  - Verification: tRPC typecheck passes

- [ ] **Task 4**: Add `punchOutForEmployee` procedure — accepts `employeeId`, `workDate`, `workLocation`, `punchSequence`; requires `attendance:manage` capability
  - Acceptance: HR/admin can punch out any punch-in sequence for any employee
  - Verification: tRPC typecheck passes

- [ ] **Task 5**: Update `attendance.list` to support filtering by `employeeId` and `departmentId`; include `employee { manager }` relation
  - Acceptance: HR can list attendance for specific employees or all employees
  - Verification: tRPC typecheck passes

- [ ] **Task 6**: Add `attendance.getSubtree` procedure — accepts `rootEmployeeId`; returns recursive tree of direct/indirect reports with last known location
  - Acceptance: Returns nested employee tree with lat/lng from latest attendance record
  - Verification: tRPC typecheck passes

### Phase 3: Employee Portal UI (New Pages)

- [ ] **Task 7**: Create `/attendance/portal` page — HR/admin employee attendance portal
  - Lists all employees with their today's punch status
  - Punch In / Punch Out buttons per employee row (not slider)
  - Supports multiple punch pairs with sequence indicators (e.g., "Punch In #2")
  - Location picker embedded in punch modal/dialog
  - Requires `attendance:manage` capability

- [ ] **Task 8**: Employee attendance detail drawer/modal — shows full punch history for a selected employee including all sequences for the day
  - Acceptance: Shows all punch-in/punch-out pairs for selected date
  - Verification: Manual check in browser

### Phase 4: Organizational Tree + Reporting

- [ ] **Task 9**: Create `/attendance/reports` page with organizational tree
  - UDS rule: manager sees their entire reporting subtree
  - Tree nodes show employee name, department, last seen location
  - Click node to expand/collapse children
  - Monthly summary per employee (present, late, absent, worked hours)

- [ ] **Task 10**: Add `monthlyReport` procedure variant that accepts `managerId` and returns only the manager's subtree employees
  - Acceptance: Manager only sees their own reporting tree's attendance
  - Verification: tRPC typecheck passes

### Phase 5: Guide Map

- [ ] **Task 11**: Create `guide_maps` table schema + `/attendance/guide-map` page
  - `guide_maps` table: id, name, center_lat, center_lng, zoom, created_by, created_at
  - **Map**: OpenFreeMap "Bright" style via MapLibre GL (bright, high-contrast, optimized for Saudi Arabia outdoor visibility)
  - Show all active employees as markers on map
  - Markers colored by status (present=green, late=amber, absent=red)
  - Click marker shows employee name, department, last punch time
  - "Create Guide Map" saves current view to DB with a name
  - List of saved maps; manager can load any saved map
  - Acceptance: Map renders with bright styled tiles and employee markers; maps persist in DB
  - Verification: Manual check in browser

### Phase 6: Navigation & RBAC Polish

- [ ] **Task 12**: Add sidebar links for new attendance pages under HR/admin role
  - `/attendance/portal` — "Employee Attendance"
  - `/attendance/reports` — "Attendance Reports"
  - `/attendance/guide-map` — "Guide Map"
  - Only visible to roles with `attendance:manage` or `reports:view_company`

## Dependency Graph

```
punch_sequence column (Task 1)
    │
    ├── punchInForEmployee (Task 3)
    ├── punchOutForEmployee (Task 4)
    │
attendance.list update (Task 5)
    │
    ├── Employee Portal UI (Task 7)
    │       │
    │       └── Employee Detail (Task 8)
    │
getSubtree (Task 6)
    │
    └── Attendance Reports + Org Tree (Task 9, Task 10)

Guide Map (Task 11) — independent of above, can run in parallel

Sidebar links (Task 12) — final step
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Multiple punches breaks existing `today` query | High | Update `today` procedure to return all sequences for the day |
| Recursive tree query is slow for large orgs | Medium | Add index on `managerEmployeeId`, paginate if needed |
| Location picker requires GPS permission | Low | Show manual lat/lng input fallback |

## Open Questions

- ~~Should "Create Guide Map" save to the database (shared across users) or localStorage (private)?~~ → **Server/DB**: Saved to database so senior/reporting managers can see employee locations
- ~~Is there a maximum number of punch sequences per day, or unlimited?~~ → **Unlimited**
- ~~Should the organizational tree show all levels deep, or limit to N levels (e.g., 3)?~~ → **All levels**: Every person except the top CEO can see their immediate boss and the entire tree below them (no depth limit)
