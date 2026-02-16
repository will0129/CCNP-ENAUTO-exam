// Question Parser - Parses questions.txt into structured data
const QuestionParser = {
    /**
     * Loads and parses questions from the questions.txt file
     * @returns {Promise<Array>} Array of section objects
     */
    async parseQuestionsFile() {
        try {
            // Priority 1: Try loading the structured JSON file (generated from questions.txt)
            try {
                const jsonResponse = await fetch('questions.json');
                if (jsonResponse.ok) {
                    const jsonData = await jsonResponse.json();
                    console.log(`Loaded ${jsonData.length} sections from questions.json`);
                    return jsonData;
                }
            } catch (jsonError) {
                console.warn('Could not load questions.json, falling back to text parsing:', jsonError);
            }

            // Priority 2: Use the loadQuestionsText function if available (window embedded)
            let text;
            if (window.loadQuestionsText) {
                text = await window.loadQuestionsText();
            } else {
                // Priority 3: Direct fetch fallback for text file
                const response = await fetch('questions.txt');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                text = await response.text();
            }
            return this.parseText(text);
        } catch (error) {
            console.error('Error loading questions:', error);

            // Show user-friendly error message
            const loadingOverlay = document.getElementById('loading-overlay') || document.getElementById('loading-screen');
            if (loadingOverlay) {
                loadingOverlay.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h2 style="color: var(--error-color, #ff6b6b); margin-bottom: 20px;">⚠️ Cannot Load Questions</h2>
                        <p style="margin-bottom: 15px;">This application requires a web server to run locally.</p>
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: left; max-width: 500px; margin: 0 auto;">
                            <p style="margin-bottom: 10px;"><strong>To run locally, use one of these commands:</strong></p>
                            <code style="display: block; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin: 5px 0;">python -m http.server 8000</code>
                            <code style="display: block; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin: 5px 0;">npx serve</code>
                            <p style="margin-top: 15px; font-size: 14px; opacity: 0.8;">Then open <strong>http://localhost:8000</strong> in your browser.</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">Or deploy to Azure Static Web Apps for production use.</p>
                    </div>
                `;
            }

            throw error;
        }
    },

    // Parse the text content
    parseText(text) {
        const sections = [];

        // More robust regex to match all section header variations:
        // - "Section: Name"
        // - "Section Name" 
        // - "Section : Name"
        const sectionRegex = /Section\s*:?\s+([^\r\n]+)/gi;
        const matches = [...text.matchAll(sectionRegex)];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const sectionName = match[1].trim();

            // Extract the text between this section and the next (or end of file)
            const startIdx = match.index + match[0].length;
            const endIdx = i < matches.length - 1 ? matches[i + 1].index : text.length;
            const sectionText = text.substring(startIdx, endIdx).trim();

            if (!sectionText) continue;

            const questions = this.parseQuestions(sectionText, sectionName);

            if (questions.length > 0) {
                sections.push({
                    name: sectionName,
                    questions: questions
                });
                console.log(`Parsed section "${sectionName}" with ${questions.length} questions`);
            }
        }

        console.log(`Total sections parsed: ${sections.length}`);
        return sections;
    },

    // Parse individual questions from a section
    parseQuestions(text, sectionName) {
        const questions = [];
        const questionBlocks = text.split(';').filter(block => block.trim());

        for (const block of questionBlocks) {
            const question = this.parseQuestion(block, sectionName);
            if (question) {
                questions.push(question);
            }
        }

        return questions;
    },

    // Parse a single question
    parseQuestion(block, sectionName) {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 5) return null; // Need at least question + 4 options + answer

        const questionText = lines[0];
        const optionLines = [];
        let answerLine = '';

        // Find options (A, B, C, D) and answer
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line contains an answer (has a comma)
            if (line.includes(',')) {
                // This is the last option with the answer
                const parts = line.split(',');
                if (parts.length >= 2) {
                    optionLines.push(parts[0].trim());
                    answerLine = parts[parts.length - 1].trim();
                }
            }
            // Otherwise check if this is a regular option line (starts with A), B), C), D) or A., B., etc.)
            else if (/^[A-D][\):]/.test(line)) {
                optionLines.push(line);
            }
        }

        // We need exactly 4 options
        if (optionLines.length !== 4 || !answerLine) {
            return null;
        }

        // Extract correct answer letter
        let correctAnswer = answerLine;

        // If answer is full text, try to match it to an option
        if (correctAnswer.length > 1 && !/^[A-D]$/i.test(correctAnswer)) {
            // Try to find matching option
            for (let i = 0; i < optionLines.length; i++) {
                const option = optionLines[i];
                const optionText = option.substring(option.indexOf(')') + 1).trim();
                if (optionText.toLowerCase().includes(correctAnswer.toLowerCase()) ||
                    correctAnswer.toLowerCase().includes(optionText.toLowerCase())) {
                    correctAnswer = String.fromCharCode(65 + i); // A, B, C, D
                    break;
                }
            }
        }

        // Ensure correct answer is uppercase single letter
        if (/^[A-D]$/i.test(correctAnswer)) {
            correctAnswer = correctAnswer.toUpperCase();
        } else {
            // Default to A if we can't determine
            correctAnswer = 'A';
        }

        return {
            text: questionText,
            options: optionLines,
            correctAnswer: correctAnswer,
            section: sectionName
        };
    }
};
