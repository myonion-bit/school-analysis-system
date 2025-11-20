
import { StudentRecord, SubjectStats, GlobalStats, AnalysisResult, GradeDef, ClassStats, SubjectChampion } from '../types';
import { PASS_MARK, KENYAN_GRADING_SYSTEM } from '../constants';

// Helper: Get Grade and Points from Score
export const getGrade = (score: number): { grade: string, points: number } => {
  const def = KENYAN_GRADING_SYSTEM.find(g => score >= g.min && score <= g.max);
  return def ? { grade: def.grade, points: def.points } : { grade: 'E', points: 1 };
};

// Helper: Get Mean Grade from Average Points
export const getMeanGrade = (avgPoints: number): string => {
  // Round to nearest whole number to find the grade equivalent
  const roundedPoints = Math.round(avgPoints);
  const def = KENYAN_GRADING_SYSTEM.find(g => g.points === roundedPoints);
  return def ? def.grade : 'E';
};

const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  return parseFloat((sum / data.length).toFixed(2));
};

const calculateMedian = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateMode = (data: number[]): number => {
  if (data.length === 0) return 0;
  const counts: Record<number, number> = {};
  data.forEach((num) => {
    counts[num] = (counts[num] || 0) + 1;
  });
  let mode = data[0];
  let maxCount = 0;
  for (const num in counts) {
    if (counts[num] > maxCount) {
      maxCount = counts[num];
      mode = Number(num);
    }
  }
  return mode;
};

const calculateStdDev = (data: number[], mean: number): number => {
  if (data.length === 0) return 0;
  const squareDiffs = data.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = calculateMean(squareDiffs);
  return parseFloat(Math.sqrt(avgSquareDiff).toFixed(2));
};

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(',');

    if (currentline.length === headers.length) {
      for (let j = 0; j < headers.length; j++) {
        const val = currentline[j].trim();
        const numVal = Number(val);
        obj[headers[j]] = isNaN(numVal) ? val : numVal;
      }
      result.push(obj);
    }
  }
  return result;
};

export const calculateClassStats = (records: any[], classes: string[], classColumn: string | undefined, subjects: string[]): ClassStats[] => {
  if (!classColumn || classes.length === 0) return [];

  return classes.map(className => {
    const classRecords = records.filter(r => String(r[classColumn]) === className);
    
    if (classRecords.length === 0) {
      return { className, meanScore: 0, meanPoints: 0, meanGrade: '-', passRate: 0, studentCount: 0 };
    }

    // Calculate per-student stats for this class
    const studentStats = classRecords.map(student => {
      // Use pre-calculated if available
      if (typeof student.meanScore === 'number' && typeof student.meanPoints === 'number') {
        return {
          average: student.meanScore,
          points: student.meanPoints,
          passed: student.meanScore >= PASS_MARK
        };
      }

      let totalScore = 0;
      let totalPoints = 0;
      let count = 0;
      subjects.forEach(sub => {
        if (typeof student[sub] === 'number') {
          totalScore += student[sub];
          totalPoints += getGrade(student[sub]).points;
          count++;
        }
      });
      
      const avg = count > 0 ? totalScore / count : 0;
      return {
        average: avg,
        points: count > 0 ? totalPoints / count : 0,
        passed: avg >= PASS_MARK
      };
    });

    const meanScore = calculateMean(studentStats.map(s => s.average));
    const meanPoints = calculateMean(studentStats.map(s => s.points));
    const passCount = studentStats.filter(s => s.passed).length;
    
    return {
      className,
      meanScore,
      meanPoints,
      meanGrade: getMeanGrade(meanPoints),
      passRate: parseFloat(((passCount / studentStats.length) * 100).toFixed(1)),
      studentCount: classRecords.length
    };
  });
};

export const calculateStats = (records: any[], subjects: string[]): { 
  subjectStats: SubjectStats[]; 
  globalStats: GlobalStats; 
  weakestStudents: { name: string; admNo: string | number; average: number; meanGrade: string; meanPoints: number }[];
  topStudents: { name: string; admNo: string | number; average: number; meanGrade: string; meanPoints: number }[];
} => {
  
  const subjectStats: SubjectStats[] = [];
  const studentPerformance: { name: string; admNo: string | number; average: number; points: number }[] = [];

  // Detect Metadata Keys
  const sample = records[0] || {};
  
  const admKey = Object.keys(sample).find(k => 
      ['admno', 'adm', 'admission', 'id', 'reg', 'regno'].includes(k.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const nameKey = Object.keys(sample).find(k => 
      ['name', 'names', 'student', 'studentname', 'candidate', 'pupil'].includes(k.toLowerCase().replace(/[^a-z]/g, ''))
  ) || Object.keys(sample).find(k => typeof sample[k] === 'string' && k !== admKey) || 'Name';

  // 1. Calculate Per-Subject Stats
  subjects.forEach(subject => {
    const scores = records.map(row => row[subject]).filter(val => typeof val === 'number');
    
    if (scores.length === 0) {
      subjectStats.push({
        subject,
        mean: 0, meanPoints: 0, meanGrade: 'E', median: 0, mode: 0, stdDev: 0, min: 0, max: 0, passRate: 0, count: 0, gradeDistribution: {}
      });
      return;
    }

    const mean = calculateMean(scores);
    const median = calculateMedian(scores);
    const mode = calculateMode(scores);
    const stdDev = calculateStdDev(scores, mean);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const passCount = scores.filter(s => s >= PASS_MARK).length;
    const passRate = parseFloat(((passCount / scores.length) * 100).toFixed(1));

    // Grade Calculations
    let totalPoints = 0;
    const gradeDist: Record<string, number> = { 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0, 'E': 0 };
    
    scores.forEach(s => {
      const { grade, points } = getGrade(s);
      totalPoints += points;
      gradeDist[grade] = (gradeDist[grade] || 0) + 1;
    });

    const meanPoints = parseFloat((totalPoints / scores.length).toFixed(2));
    const meanGrade = getMeanGrade(meanPoints);

    subjectStats.push({
      subject,
      mean,
      meanPoints,
      meanGrade,
      median,
      mode,
      stdDev,
      min,
      max,
      passRate,
      count: scores.length,
      gradeDistribution: gradeDist
    });
  });

  // 2. Calculate Per-Student Stats (Overall)
  records.forEach(row => {
    let average, points;

    // Check if pre-calculated (Optimized)
    if (typeof row.meanScore === 'number' && typeof row.meanPoints === 'number') {
       average = row.meanScore;
       points = row.meanPoints;
    } else {
       // Fallback Calculation
        let totalScore = 0;
        let totalPoints = 0;
        let count = 0;
        
        subjects.forEach(sub => {
          if (typeof row[sub] === 'number' && !sub.toLowerCase().includes('attendance')) {
            const score = row[sub];
            totalScore += score;
            totalPoints += getGrade(score).points;
            count++;
          }
        });

        if (count > 0) {
          average = parseFloat((totalScore / count).toFixed(2));
          points = parseFloat((totalPoints / count).toFixed(2));
        }
    }

    if (typeof average === 'number' && typeof points === 'number') {
      studentPerformance.push({
        name: row[nameKey] || 'Unknown',
        admNo: admKey ? row[admKey] : '-',
        average: average,
        points: points
      });
    }
  });

  // 3. Global Stats
  const allSubjectMeans = subjectStats.filter(s => s.count > 0).map(s => s.mean);
  const globalMeanScore = calculateMean(allSubjectMeans);
  
  // Calculate Global Mean Points (Average of all student average points)
  const globalMeanPoints = calculateMean(studentPerformance.map(s => s.points));
  const globalMeanGrade = getMeanGrade(globalMeanPoints);

  const sortedSubjects = [...subjectStats].sort((a, b) => b.meanPoints - a.meanPoints);
  
  const globalStats: GlobalStats = {
    totalStudents: records.length,
    meanScore: globalMeanScore,
    meanPoints: globalMeanPoints,
    meanGrade: globalMeanGrade,
    topPerformingSubject: sortedSubjects.length > 0 ? sortedSubjects[0].subject : 'N/A',
    lowestPerformingSubject: sortedSubjects.length > 0 ? sortedSubjects[sortedSubjects.length - 1].subject : 'N/A',
  };

  // 4. Sort Students
  // Sort primarily by Points (Desc), then by Average (Desc)
  const sortedStudents = [...studentPerformance].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.average - a.average;
  });
  
  const topStudents = sortedStudents.slice(0, 5).map(s => ({
    name: s.name,
    admNo: s.admNo,
    average: s.average,
    meanPoints: s.points,
    meanGrade: getMeanGrade(s.points)
  }));

  const weakestStudents = sortedStudents.slice(sortedStudents.length - 5).reverse().map(s => ({
    name: s.name,
    admNo: s.admNo,
    average: s.average,
    meanPoints: s.points,
    meanGrade: getMeanGrade(s.points)
  }));

  return { subjectStats, globalStats, weakestStudents, topStudents };
};

export const analyzeData = (data: any[]): AnalysisResult => {
  if (data.length === 0) {
    throw new Error("No data to analyze");
  }

  const keys = Object.keys(data[0]);
  
  // Identify Subjects (Exclude non-numeric and specific metadata columns)
  const potentialSubjects = keys.filter(key => {
    const val = data[0][key];
    const keyLower = key.toLowerCase();
    return typeof val === 'number' && 
           !['id', 'admno', 'adm', 'admission', 'phone', 'mobile', 'zip', 'year'].includes(keyLower.replace(/\s/g, ''));
  });

  // Identify Class/Stream Column
  const classColumn = keys.find(key => 
    ['stream', 'class', 'grade', 'form', 'section', 'year group'].includes(key.toLowerCase())
  );

  // Identify Adm Column
  const admColumn = keys.find(key => 
    ['adm', 'admno', 'admission', 'id', 'reg', 'regno'].includes(key.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  // Identify Name Column (Robust check)
  const nameColumn = keys.find(key => 
    ['name', 'names', 'student', 'studentname', 'candidate', 'pupil'].includes(key.toLowerCase().replace(/[^a-z]/g, ''))
  ) || keys.find(k => typeof data[0][k] === 'string' && k !== admColumn && k !== classColumn);

  // Calculate Student Stats and Enrich Data (Mutate records before analysis)
  const enrichedData = data.map(row => {
    let totalScore = 0;
    let totalPoints = 0;
    let count = 0;
    const gradeCounts: Record<string, number> = {};
    // Initialize grade counts
    KENYAN_GRADING_SYSTEM.forEach(g => gradeCounts[g.grade] = 0);
    
    potentialSubjects.forEach(sub => {
      if (typeof row[sub] === 'number') {
        const score = row[sub];
        totalScore += score;
        const { grade, points } = getGrade(score);
        totalPoints += points;
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        count++;
      }
    });

    const meanScore = count > 0 ? parseFloat((totalScore / count).toFixed(2)) : 0;
    const meanPoints = count > 0 ? parseFloat((totalPoints / count).toFixed(2)) : 0;
    const meanGrade = getMeanGrade(meanPoints);

    return {
      ...row,
      meanScore,
      meanPoints,
      meanGrade,
      gradeCounts
    };
  });

  // --- NEW: RANKING LOGIC ---
  
  // 1. Overall Rank
  enrichedData.sort((a, b) => b.meanPoints - a.meanPoints);
  let currentRank = 1;
  for (let i = 0; i < enrichedData.length; i++) {
    // If points match previous, give same rank
    if (i > 0 && enrichedData[i].meanPoints === enrichedData[i - 1].meanPoints) {
      enrichedData[i].overallRank = enrichedData[i - 1].overallRank;
    } else {
      enrichedData[i].overallRank = i + 1;
    }
  }

  // 2. Stream Rank (if class column exists)
  const classes = classColumn 
    ? Array.from(new Set(enrichedData.map(row => String(row[classColumn])))).sort() 
    : [];

  if (classColumn && classes.length > 0) {
     classes.forEach(cls => {
       const streamStudents = enrichedData.filter(r => String(r[classColumn]) === cls);
       // They are already sorted by points from the overall sort
       // Re-verify sort within stream subset just in case
       streamStudents.sort((a, b) => b.meanPoints - a.meanPoints);
       
       for (let i = 0; i < streamStudents.length; i++) {
         const student = streamStudents[i];
         if (i > 0 && student.meanPoints === streamStudents[i - 1].meanPoints) {
            student.streamRank = streamStudents[i-1].streamRank;
         } else {
            student.streamRank = i + 1;
         }
       }
     });
  }

  // --- NEW: SUBJECT CHAMPIONS ---
  const subjectChampions: SubjectChampion[] = [];
  potentialSubjects.forEach(sub => {
    let maxScore = -1;
    let bestStudent: any = null;
    
    enrichedData.forEach(student => {
      if (typeof student[sub] === 'number') {
        if (student[sub] > maxScore) {
          maxScore = student[sub];
          bestStudent = student;
        }
      }
    });

    if (bestStudent) {
      subjectChampions.push({
        subject: sub,
        name: bestStudent[nameColumn || 'Name'],
        adm: admColumn ? bestStudent[admColumn] : '-',
        score: maxScore
      });
    }
  });

  // Perform initial calculation using enriched data
  const stats = calculateStats(enrichedData, potentialSubjects);
  const classStats = calculateClassStats(enrichedData, classes, classColumn, potentialSubjects);

  return {
    records: enrichedData,
    subjects: potentialSubjects,
    classColumn,
    admColumn,
    nameColumn,
    classes,
    classStats,
    subjectChampions,
    ...stats
  };
};