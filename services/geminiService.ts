
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

const getSystemInstruction = () => `
You are an expert Educational Data Analyst specializing in the Kenyan Education System (8-4-4 and CBC curriculums).
Your role is to analyze school exam data (KCSE mock or internal exams) and provide insights similar to those found in Zeraki Analytics reports.

Key Directives:
1. Use Kenyan terminology: "Mean Score", "Mean Grade" (e.g., B plain, C plus), "Streams", "Subject Champions".
2. Focus on "Quality Grades" (C+ and above, which qualifies for University entry).
3. Analyze the "Tail" (D+ and below) and suggest remedial actions.
4. Be encouraging but strictly data-driven.
5. Format output in clean Markdown.
`;

export const generateInsight = async (analysis: AnalysisResult): Promise<string> => {
  if (!process.env.API_KEY) {
    return "## API Key Missing\n\nPlease configure your API Key to generate AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a concise summary context
  const summaryData = {
    schoolMean: {
      grade: analysis.globalStats.meanGrade,
      points: analysis.globalStats.meanPoints,
      score: analysis.globalStats.meanScore
    },
    subjects: analysis.subjectStats.map(s => ({
      name: s.subject,
      meanPoints: s.meanPoints,
      meanGrade: s.meanGrade,
      change: "N/A" // Placeholder for term-on-term comparison if we had it
    })),
    topStudent: analysis.topStudents[0]?.name,
    universityEntryCount: analysis.records.filter(r => {
       // Quick hack to estimate C+ and above based on average > 55
       // Real logic would sum points.
       let total = 0; let count = 0;
       analysis.subjects.forEach(s => { if(typeof r[s] === 'number') { total += r[s]; count++; }});
       return (count ? total/count : 0) >= 55; 
    }).length,
    totalCandidates: analysis.globalStats.totalStudents
  };

  const prompt = `
    Analyze the following Form 4 Exam Results:
    
    ${JSON.stringify(summaryData, null, 2)}
    
    Generate a "Principal's Brief" covering:
    1. **Executive Summary**: Overall school performance (Mean Grade ${analysis.globalStats.meanGrade}).
    2. **Departmental Analysis**: Which subjects are pulling the mean down? Which are the "Booster" subjects?
    3. **Quality Assurance**: Estimated number of students qualifying for university (C+ and above).
    4. **Action Plan**: 3 specific strategies for the Academic Dean to improve the Mean Score by 0.5 points next term.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
        temperature: 0.3, 
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `## Error Generating Report\n\nUnable to generate insights at this time.\n\nError details: ${(error as Error).message}`;
  }
};
