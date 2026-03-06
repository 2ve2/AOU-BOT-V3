/**
 * Branch and Department Service
 * Handles branch and department information from branches.json
 */

import branchesData from "@/data/branches.json" assert { type: "json" };

export interface LocalizedName {
  ar: string;
  en: string;
}

export interface EmailContact {
  name: LocalizedName;
  email: string;
}

export interface LocalizedInfo {
  ar: string[];
  en: string[];
}

export interface Department {
  department_name: LocalizedName;
  info: LocalizedInfo;
  emails: EmailContact[];
}

export interface Branch {
  branch_name: LocalizedName;
  departments: Department[];
}

export interface BranchesData {
  branches: Branch[];
}

/**
 * Get all branches data
 */
export function getBranchesData(): BranchesData {
  return branchesData;
}

/**
 * Get all branch names for a specific language
 */
export function getBranchNames(userLang: "ar" | "en" = "ar"): string[] {
  return branchesData.branches.map(b => b.branch_name[userLang]);
}

/**
 * Get all department names (from first branch as reference) for a specific language
 */
export function getDepartmentNames(userLang: "ar" | "en" = "ar"): string[] {
  if (branchesData.branches.length === 0) return [];
  const firstBranch = branchesData.branches[0];
  if (!firstBranch) return [];
  return firstBranch.departments.map(d => d.department_name[userLang]);
}

/**
 * Get branch by name (supports both Arabic and English)
 */
export function getBranchByName(branchName: string): Branch | undefined {
  return branchesData.branches.find(b =>
    b.branch_name.ar === branchName || b.branch_name.en === branchName
  );
}

/**
 * Get branch by localized name
 */
export function getBranchByLocalizedName(branchName: string, userLang: "ar" | "en"): Branch | undefined {
  return branchesData.branches.find(b => b.branch_name[userLang] === branchName);
}

/**
 * Get department info for a specific branch and department (supports both Arabic and English)
 */
export function getDepartmentInfo(
  branchName: string,
  departmentName: string
): { branch: Branch; department: Department } | null {
  const branch = getBranchByName(branchName);
  if (!branch) return null;

  const department = branch.departments.find(d =>
    d.department_name.ar === departmentName || d.department_name.en === departmentName
  );
  if (!department) return null;

  return { branch, department };
}

/**
 * Format department info message
 */
export function formatDepartmentInfo(
  branchName: string,
  departmentName: string,
  userLang: "ar" | "en"
): string | null {
  const data = getDepartmentInfo(branchName, departmentName);
  if (!data) return null;

  const { branch, department } = data;

  const branchDisplayName = branch.branch_name[userLang];
  const deptDisplayName = department.department_name[userLang];
  const infoText = department.info[userLang].join("");

  // Localized message templates
  const templates = {
    ar: {
      header: `📌 الجامعة العربية المفتوحة - فرع ${branchDisplayName}\n`,
      department: `🏢 قسم ${deptDisplayName}\n\n`,
      info: `🔍 وظيفة القسم :\n${infoText}\n`,
      contact: `📧 التواصل :\n`,
      employee: `• 👤 الموظف/ة : `,
      email: `• ✉️ الايميل : `,
      separator: `-\n`
    },
    en: {
      header: `📌 Arab Open University - ${branchDisplayName} Branch\n`,
      department: `🏢 ${deptDisplayName} Department\n\n`,
      info: `🔍 Department Functions:\n${infoText}\n`,
      contact: `📧 Contact:\n`,
      employee: `• 👤 Employee: `,
      email: `• ✉️ Email: `,
      separator: `-\n`
    }
  };

  const t = templates[userLang];
  let message = t.header;
  message += t.department;
  message += t.info;
  message += t.contact;

  for (const email of department.emails) {
    const emailName = email.name[userLang];
    message += `${t.employee}${emailName}\n`;
    message += `${t.email}${email.email}\n${t.separator}`;
  }

  return message;
}

/**
 * Check if a text is a department name (supports both Arabic and English)
 */
export function isDepartmentName(text: string): boolean {
  return branchesData.branches.some(branch =>
    branch.departments.some(dept =>
      dept.department_name.ar === text || dept.department_name.en === text
    )
  );
}

/**
 * Check if a text is a branch name (supports both Arabic and English)
 */
export function isBranchName(text: string): boolean {
  return branchesData.branches.some(branch =>
    branch.branch_name.ar === text || branch.branch_name.en === text
  );
}
