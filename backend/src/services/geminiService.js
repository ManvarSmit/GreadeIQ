import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('GEMINI_API_KEY is missing in environment variables');
}

// Initialize Gemini AI with configuration
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

// Configuration for request timeout and retry
const GEMINI_CONFIG = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
};

// Request timeout in milliseconds (increased to 60 seconds for better quality)
const REQUEST_TIMEOUT = 60000;

/**
 * Generate a personalized improvement plan for a student
 * @param {object} student - Student profile data including academic stats
 * @returns {Promise<object>} - Structured improvement plan
 */
export const generateStudentImprovementPlan = async (student) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: GEMINI_CONFIG,
            requestOptions: { timeout: REQUEST_TIMEOUT }
        });

        const studentContext = `
        Student Name: ${student.name}
        Department: ${student.department}
        Semester: ${student.semester}
        Current CGPA: ${student.currentCGPA}
        Attendance: ${student.attendancePercent}%
        Risk Level: ${student.dropoutRisk}
        Counselor Notes: ${student.counselorNotes || 'None'}
        Family Income: ${student.familyIncome || 'Unknown'}
        Disciplinary Issues: ${student.disciplinaryIssues || 0}
        Probable Issues: ${student.problemCategories || 'None'}
        `;

        const prompt = `You are an expert academic counselor and student mentor. Create a detailed, personalized improvement plan for the following student:

        ${studentContext}

        Please provide a structured response in the following JSON format (output ONLY valid JSON):
        {
            "academic_guidance": [
                "Actionable step 1 (max 15 words)",
                "Actionable step 2..."
            ],
            "behavioral_guidance": [
                "Advice on attendance/behavior",
                "Social engagement tips..."
            ],
            "mentor_focus_areas": [
                "Key topic 1 for mentor to discuss",
                "Key topic 2..."
            ],
            "resource_recommendations": [
                "Book/Video/Technique recommendation 1",
                "Recommendation 2..."
            ],
            "motivational_message": "A short, encouraging message for the student"
        }
        
        Tailor the advice to their specific department (${student.department}) and risk factors. 
        IMPORTANT: Keep each bullet point extremely concise (max 1 sentence). Do not write paragraphs. Just the main action item.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown
        // Clean markdown and extract JSON
        let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Find JSON object if there's extra text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        try {
            return JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Gemini Plan JSON Parse Error:', parseError);
            console.error('Raw Gemini Response:', text);

            // Return fallback structure to avoid crashing
            return {
                academic_guidance: ["Review course materials regularly", "Seek help from professors during office hours"],
                behavioral_guidance: ["Maintain consistent attendance", "Participate more in class discussions"],
                mentor_focus_areas: ["Discuss current academic challenges", "Set achievable short-term goals"],
                resource_recommendations: ["Visit the learning center", "Join a study group"],
                motivational_message: "Consistency is key to success. Keep moving forward!"
            };
        }

    } catch (error) {
        console.error('Gemini Plan Generation Error:', error);
        throw new Error(`Failed to generate improvement plan: ${error.message}`);
    }
};

/**
 * Analyze student problems from counselor notes using Gemini AI
 * @param {string} counselorNotes - The counselor's notes about the student
 * @returns {Promise<object>} - Analysis result with problem categories and summary
 */
export const analyzeStudentProblems = async (counselorNotes) => {
    try {
        if (!counselorNotes || counselorNotes.trim().length === 0) {
            return {
                categories: [],
                summary: 'No issues documented',
                confidence: 0
            };
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: GEMINI_CONFIG,
            requestOptions: { timeout: REQUEST_TIMEOUT }
        });

        const prompt = `You are an expert student counselor analyzing student problems. Based on the following counselor notes, identify and categorize the student's problems.

Counselor Notes:
"${counselorNotes}"

Please analyze and respond in the following JSON format (output ONLY valid JSON, no additional text):
{
  "categories": ["category1", "category2", ...],
  "summary": "brief summary of issues (1-2 sentences)",
  "confidence": 0.0 to 1.0,
  "reasoning": "why you chose these categories"
}

Available categories (use exact names):
- academic_struggles: Poor grades, difficulty understanding subjects, exam failures
- family_issues: Family conflicts, divorce, domestic problems  
- financial_problems: Unable to pay fees, family financial crisis
- health_concerns: Physical health issues, chronic illness
- mental_health: Depression, anxiety, stress, mental health struggles
- bereavement: Death of family member, grief, loss
- social_isolation: Loneliness, lack of friends, social withdrawal
- attendance_issues: Frequent absences, late arrivals
- substance_abuse: Alcohol, drugs, addiction issues
- career_confusion: Unsure about career path, lack of direction

Return only categories that clearly apply based on the notes. Be specific and accurate.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const analysis = JSON.parse(text);

        return {
            categories: analysis.categories || [],
            summary: analysis.summary || 'Analysis completed',
            confidence: analysis.confidence || 0.5,
            reasoning: analysis.reasoning || ''
        };

    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error(`Failed to analyze student problems: ${error.message}`);
    }
};

/**
 * Suggest mentors based on problem categories
 * @param {array} problemCategories - Array of problem category IDs
 * @param {array} availableMentors - Array of mentor objects with specializations
 * @returns {array} - Sorted array of mentor recommendations
 */
/**
 * Suggest mentors based on student context using Gemini AI
 * @param {object} studentData - Student data including counselor notes and problem categories
 * @param {array} availableMentors - Array of mentor objects with specializations
 * @returns {Promise<array>} - Sorted array of mentor recommendations
 */
export const suggestMentors = async (studentData, availableMentors) => {
    try {
        console.log('Generating AI mentor suggestions for student...');

        if (!availableMentors || availableMentors.length === 0) {
            return [];
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: GEMINI_CONFIG,
            requestOptions: { timeout: REQUEST_TIMEOUT }
        });

        // Prepare mentor list for prompt
        const mentorsList = availableMentors.map(m =>
            `- ID: ${m.id}, Name: ${m.name}, Department: ${m.department || 'N/A'}, Specialization: ${m.specialization || 'General'}, Current Load: ${m.currentLoad || 0}`
        ).join('\n');

        const studentContext = `
        Student Context:
        Problem Categories: ${JSON.stringify(studentData.problemCategories || [])}
        Counselor Notes: "${studentData.counselorNotes || 'No notes provided'}"
        Department: ${studentData.department || 'Unknown'}
        Risk Level: ${studentData.dropoutRisk || 'Unknown'}
        `;

        const prompt = `You are an expert academic counselor. Your task is to select the most suitable mentors for a student based on their specific problems and the mentors' specializations.
        
        ${studentContext}

        Available Mentors:
        ${mentorsList}

        Please analyze the student's situation and the available mentors. Rank the top 3 most suitable mentors.
        
        Respond in the following JSON format (output ONLY valid JSON):
        {
            "recommendations": [
                {
                    "mentorId": "ID of the mentor",
                    "matchScore": 0 to 100,
                    "reasoning": "One sentence explaining why this mentor is a good match"
                }
            ]
        }
        
        Scoring Criteria:
        - High score (80-100): Mentor's specialization directly addresses the student's specific problems (e.g., Financial expert for financial issues).
        - Medium score (50-79): Mentor is in the same department or has relevant general experience.
        - Low score (0-49): Weak match.
        
        Consider the student's department and specific issues described in the notes.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown
        let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        let recommendations = [];
        try {
            const parsed = JSON.parse(jsonText);
            recommendations = parsed.recommendations || [];
        } catch (e) {
            console.error('Failed to parse mentor suggestions JSON:', e);
        }

        // Merge AI recommendations with original mentor objects
        const scoredMentors = availableMentors.map(mentor => {
            const rec = recommendations.find(r => r.mentorId === mentor.id);
            return {
                ...mentor,
                matchScore: rec ? rec.matchScore : 0,
                distinguishedReasoning: rec ? rec.reasoning : 'available', // renamed to avoid conflict if any
                isRecommended: rec ? rec.matchScore > 60 : false
            };
        });

        // effective sorting: High match score first, then lowest current load
        return scoredMentors.sort((a, b) => {
            if (b.matchScore !== a.matchScore) {
                return b.matchScore - a.matchScore; // Higher score first
            }
            return (a.currentLoad || 0) - (b.currentLoad || 0); // Lower load first
        });

    } catch (error) {
        console.error('AI Mentor Suggestion Error:', error);
        // Fallback to simple load balancing if AI fails
        return availableMentors.map(m => ({ ...m, matchScore: 0 })).sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0));
    }
};

export const generateQuizQuestions = async (topics, difficulty, numQuestions) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                ...GEMINI_CONFIG,
                responseMimeType: 'application/json'
            },
            requestOptions: { timeout: REQUEST_TIMEOUT }
        });

        const prompt = `You are an expert educator. Generate a multiple-choice quiz.
        Topics: ${topics}
        Difficulty: ${difficulty}
        Number of Questions: ${numQuestions}

        Respond in the following JSON format (output ONLY valid JSON array):
        [
            {
                "question": "The question text. Use single quotes (') inside, NEVER double quotes.",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "The exact text of the correct option. NEVER use double quotes.",
                "marks": 1.0
            }
        ]
        
        CRITICAL RULES:
        1. Ensure your JSON array is strictly valid.
        2. DO NOT use double quotes (") anywhere INSIDE your question or option strings. Use single quotes (') instead.
        3. Return ONLY the raw JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        let jsonText = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        try {
            return JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('Quiz JSON parsing failed. Output was:', jsonText);
            throw new Error('The AI engine returned malformed JSON text. Please try generating again.');
        }
    } catch (error) {
        console.error('Gemini Quiz Gen Error:', error);
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
};

export default {
    analyzeStudentProblems,
    suggestMentors,
    generateStudentImprovementPlan,
    generateQuizQuestions
};
