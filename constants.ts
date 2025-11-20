
export const PASS_MARK = 50;

export const KENYAN_GRADING_SYSTEM = [
  { min: 80, max: 100, grade: 'A', points: 12 },
  { min: 75, max: 79, grade: 'A-', points: 11 },
  { min: 70, max: 74, grade: 'B+', points: 10 },
  { min: 65, max: 69, grade: 'B', points: 9 },
  { min: 60, max: 64, grade: 'B-', points: 8 },
  { min: 55, max: 59, grade: 'C+', points: 7 },
  { min: 50, max: 54, grade: 'C', points: 6 },
  { min: 45, max: 49, grade: 'C-', points: 5 },
  { min: 40, max: 44, grade: 'D+', points: 4 },
  { min: 35, max: 39, grade: 'D', points: 3 },
  { min: 30, max: 34, grade: 'D-', points: 2 },
  { min: 0, max: 29, grade: 'E', points: 1 },
];

// Realistic Kenyan High School Data
export const SAMPLE_DATA_CSV = `AdmNo,Name,Stream,Mathematics,English,Kiswahili,Chemistry,Biology,Physics,History,CRE,Geography
1001,James Kamau,4 East,78,82,75,65,70,68,85,88,72
1002,Mary Wanjiku,4 West,65,78,88,55,60,50,72,80,68
1003,Brian Ochieng,4 East,92,88,85,95,90,92,88,90,94
1004,Stacy Chebet,4 North,45,58,62,38,42,35,55,60,48
1005,Emmanuel Kiprop,4 West,85,75,70,82,78,80,76,84,81
1006,Faith Mwende,4 East,55,65,72,48,52,45,68,75,58
1007,Joseph Njoroge,4 North,32,40,45,28,35,30,42,50,38
1008,Grace Adhiambo,4 West,74,80,85,68,72,65,78,82,75
1009,Kevin Otieno,4 East,88,85,80,90,86,88,84,89,85
1010,Mercy Auma,4 North,95,92,94,98,96,95,90,94,92
1011,Ian Mutua,4 West,60,62,68,55,58,52,65,70,64
1012,Sarah Korir,4 North,28,35,40,25,30,28,38,45,32
1013,David Wafula,4 East,72,75,78,68,70,74,76,80,75
1014,Esther Nyambura,4 West,50,55,60,45,48,42,58,65,52
1015,Samuel Maina,4 North,82,85,88,80,84,78,86,90,85
1016,Alice Mutiso,4 East,68,72,75,62,65,60,74,78,70
1017,John Odhiambo,4 West,42,48,55,35,40,38,50,58,45
1018,Purity Wangui,4 North,90,94,92,88,92,89,85,92,90
1019,Peter Kimani,4 East,58,60,65,50,55,52,62,68,60
1020,Jane Atieno,4 West,76,82,85,72,78,75,80,86,78
`;

export const MOCK_FILE_NAME = "form4_term1_results.csv";
