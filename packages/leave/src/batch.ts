export function toLeaveTypeContext(row: {
  id: string;
  name: string;
  daysAllowed: number;
  rules: unknown;
}) {
  return {
    id: row.id,
    name: row.name,
    daysAllowed: row.daysAllowed,
    rules: row.rules,
  };
}

export function toEmployeeContext(row: {
  id: string;
  fullName: string;
  hireDate: string;
  employmentStatus: string;
}) {
  return {
    id: row.id,
    fullName: row.fullName,
    hireDate: row.hireDate,
    employmentStatus: row.employmentStatus,
  };
}

export function toLeaveBalanceContext(row: {
  employeeId: string;
  leaveTypeId: string;
  balance: string | number;
  year: number;
}) {
  return {
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    balance: typeof row.balance === "string" ? parseFloat(row.balance) : row.balance,
    year: row.year,
  };
}