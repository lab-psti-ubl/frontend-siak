export interface Grade {
  id: string;
  grade: string;
  minNilai: number;
  maxNilai: number;
  deskripsi?: string;
  isDefault?: boolean;
}

export const validateGradeRange = (grades: Grade[]): { isValid: boolean; error?: string } => {
  const sortedGrades = [...grades].sort((a, b) => a.minNilai - b.minNilai);

  for (let i = 0; i < sortedGrades.length - 1; i++) {
    const current = sortedGrades[i];
    const next = sortedGrades[i + 1];

    if (current.maxNilai >= next.minNilai) {
      return {
        isValid: false,
        error: `Range grade ${current.grade} dan ${next.grade} tumpang tindih`,
      };
    }
  }

  if (sortedGrades.length > 0) {
    const lastGrade = sortedGrades[sortedGrades.length - 1];
    if (lastGrade.maxNilai < 100) {
      return {
        isValid: false,
        error: `Grade tertinggi harus mencapai nilai 100. Saat ini maksimal ${lastGrade.maxNilai}`,
      };
    }
  }

  if (sortedGrades.length > 0 && sortedGrades[0].minNilai > 0) {
    return {
      isValid: false,
      error: `Grade terendah harus dimulai dari nilai 0. Saat ini mulai dari ${sortedGrades[0].minNilai}`,
    };
  }

  return { isValid: true };
};

export const getDefaultGrades = (): Grade[] => [
  { id: '1', grade: 'A', minNilai: 85, maxNilai: 100, deskripsi: 'Sangat Baik', isDefault: true },
  { id: '2', grade: 'B', minNilai: 70, maxNilai: 84, deskripsi: 'Baik', isDefault: true },
  { id: '3', grade: 'C', minNilai: 55, maxNilai: 69, deskripsi: 'Cukup', isDefault: true },
  { id: '4', grade: 'D', minNilai: 40, maxNilai: 54, deskripsi: 'Kurang', isDefault: true },
  { id: '5', grade: 'E', minNilai: 0, maxNilai: 39, deskripsi: 'Sangat Kurang', isDefault: true },
];

export const formatGradeDisplay = (grade: Grade): string => {
  return `${grade.grade} (${grade.minNilai}-${grade.maxNilai})`;
};

export const getNilaiGrade = (nilai: number, grades: Grade[]): string | null => {
  const grade = grades.find(g => nilai >= g.minNilai && nilai <= g.maxNilai);
  return grade ? grade.grade : null;
};

export const saveGradesToLocalStorage = (grades: Grade[]): void => {
  try {
    localStorage.setItem('pengaturanGrade', JSON.stringify(grades));
  } catch (error) {
    console.error('Error saving grades to localStorage:', error);
  }
};

export const getGradesFromLocalStorage = (): Grade[] => {
  try {
    const stored = localStorage.getItem('pengaturanGrade');
    if (!stored) return getDefaultGrades();
    const grades = JSON.parse(stored);
    return Array.isArray(grades) && grades.length > 0 ? grades : getDefaultGrades();
  } catch (error) {
    console.error('Error reading grades from localStorage:', error);
    return getDefaultGrades();
  }
};
