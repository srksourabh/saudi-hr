import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "on_leave",
  "remote",
  "half_day",
  "holiday",
  "weekend",
]);

export const exceptionTypeEnum = pgEnum("attendance_exception_type", [
  "missing_punch_in",
  "missing_punch_out",
  "late_arrival",
  "early_departure",
  "no_show",
  "missed_break",
  "location_violation",
]);

export const exceptionStatusEnum = pgEnum("attendance_exception_status", [
  "open",
  "acknowledged",
  "resolved",
  "waived",
]);

/**
 * Work shift definition (e.g. "Corporate day 08:00–17:00 Sun–Thu").
 * Per-tenant table: tenant_xxx.shifts
 */
export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  graceMinutes: integer("grace_minutes").notNull().default(10),
  workDays: text("work_days").notNull().default("sun,mon,tue,wed,thu"),
  breakMinutes: integer("break_minutes").notNull().default(60),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Maps an employee to a shift with an effective date.
 */
export const shiftAssignments = pgTable(
  "shift_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "restrict" }),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    empIdx: index("shift_assignments_emp_idx").on(table.employeeId),
    shiftIdx: index("shift_assignments_shift_idx").on(table.shiftId),
  }),
);

/**
 * One row per employee per day. Captures punch in/out and the day's status.
 * If employee forgot to punch, the field is null and an exception is raised.
 */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    workDate: date("work_date").notNull(),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "set null" }),

    punchInAt: timestamp("punch_in_at"),
    punchOutAt: timestamp("punch_out_at"),

    scheduledStart: time("scheduled_start"),
    scheduledEnd: time("scheduled_end"),

    workedMinutes: integer("worked_minutes").notNull().default(0),
    overtimeMinutes: integer("overtime_minutes").notNull().default(0),
    lateMinutes: integer("late_minutes").notNull().default(0),
    earlyLeaveMinutes: integer("early_leave_minutes").notNull().default(0),

    status: attendanceStatusEnum("attendance_status").notNull().default("present"),
    workLocation: text("work_location"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    empDateIdx: index("attendance_records_emp_date_idx").on(
      table.employeeId,
      table.workDate,
    ),
    dateIdx: index("attendance_records_date_idx").on(table.workDate),
  }),
);

/**
 * Exceptions raised automatically (or by the employee) on attendance records.
 * The Document/HR teams resolve or waive them.
 */
export const attendanceExceptions = pgTable(
  "attendance_exceptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attendanceRecordId: uuid("attendance_record_id")
      .notNull()
      .references(() => attendanceRecords.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    exceptionType: exceptionTypeEnum("attendance_exception_type").notNull(),
    status: exceptionStatusEnum("attendance_exception_status").notNull().default("open"),
    minutes: integer("minutes"),
    description: text("description"),
    resolvedByUserId: uuid("resolved_by_user_id"),
    resolvedAt: timestamp("resolved_at"),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("attendance_exceptions_status_idx").on(table.status),
    empIdx: index("attendance_exceptions_emp_idx").on(table.employeeId),
  }),
);

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type AttendanceException = typeof attendanceExceptions.$inferSelect;
