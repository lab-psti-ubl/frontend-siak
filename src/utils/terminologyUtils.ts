/**
 * Utility functions for terminology based on system type
 * Returns "Ustaz/ah" instead of "guru" and "santri" instead of "murid" 
 * when systemType is "tahfiz"
 */

export const getTeacherTerm = (systemType: string): string => {
  return systemType === 'tahfiz' ? 'Ustaz/ah' : 'guru';
};

export const getStudentTerm = (systemType: string): string => {
  return systemType === 'tahfiz' ? 'santri' : 'murid';
};

/**
 * Get terminology object with both teacher and student terms
 */
export const getTerminology = (systemType: string) => {
  return {
    teacher: getTeacherTerm(systemType),
    student: getStudentTerm(systemType),
  };
};




