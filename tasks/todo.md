# Todo: HR Employee Portal & Attendance Enhancements

## Phase 1: Database Layer
- [ ] **Task 1**: Add `punch_sequence` column to `attendance_records` schema
- [ ] **Task 2**: Add `last_location` derived field logic in tRPC
- [ ] **Task 2b**: Create `guide_maps` table schema

## Phase 2: tRPC API (Attendance Router)
- [ ] **Task 3**: Add `punchInForEmployee` procedure
- [ ] **Task 4**: Add `punchOutForEmployee` procedure
- [ ] **Task 5**: Update `attendance.list` to support `employeeId` and `departmentId` filters
- [ ] **Task 6**: Add `attendance.getSubtree` procedure

## Phase 3: Employee Portal UI
- [ ] **Task 7**: Create `/attendance/portal` page
- [ ] **Task 8**: Employee attendance detail drawer/modal

## Phase 4: Organizational Tree + Reporting
- [ ] **Task 9**: Create `/attendance/reports` page with organizational tree
- [ ] **Task 10**: Add manager-scoped `monthlyReport` variant

## Phase 5: Guide Map (OpenFreeMap Bright + MapLibre GL)
- [ ] **Task 11**: Create `guide_maps` table + `/attendance/guide-map` page

## Phase 6: Navigation & RBAC Polish
- [ ] **Task 12**: Add sidebar links for new attendance pages
