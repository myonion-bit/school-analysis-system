
export interface StudentRecord {
  id: string | number;
  name: string;
  meanScore?: number;
  meanPoints?: number;
  meanGrade?: string;
  gradeCounts?: Record<string, number>; // e.g. { 'A': 2, 'B': 1 }
  overallRank?: number;
  streamRank?: number;
  [key: string]: any; // Allow dynamic subject keys
}

export interface GradeDistribution {
  [grade: string]: number;
}

export interface SubjectStats {
  subject: string;
  mean: number;
  meanPoints: number; // e.g. 8.5
  meanGrade: string;  // e.g. B-
  median: number;
  mode: number;
  stdDev: number;
  min: number;
  max: number;
  passRate: number;
  count: number;
  gradeDistribution: GradeDistribution;
}

export interface ClassStats {
  className: string;
  meanScore: number;
  meanPoints: number;
  meanGrade: string;
  passRate: number;
  studentCount: number;
}

export interface GlobalStats {
  totalStudents: number;
  meanScore: number;
  meanPoints: number;
  meanGrade: string;
  topPerformingSubject: string;
  lowestPerformingSubject: string;
}

export interface SubjectChampion {
  subject: string;
  name: string;
  adm: string | number;
  score: number;
}

export interface AnalysisResult {
  records: StudentRecord[];
  subjects: string[];
  classColumn?: string;
  admColumn?: string;
  nameColumn?: string;
  classes: string[];
  subjectStats: SubjectStats[];
  classStats: ClassStats[];
  globalStats: GlobalStats;
  weakestStudents: { name: string; admNo: string | number; average: number; meanGrade: string; meanPoints: number }[];
  topStudents: { name: string; admNo: string | number; average: number; meanGrade: string; meanPoints: number }[];
  subjectChampions: SubjectChampion[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD',
}

export interface GradeDef {
  min: number;
  max: number;
  grade: string;
  points: number;
}