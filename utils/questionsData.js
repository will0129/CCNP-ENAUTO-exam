/**
 * Embedded Questions Data
 * This file provides a fallback for local development when fetch() fails due to CORS restrictions.
 * When deployed to Azure Static Web Apps, the app will use fetch() to load questions.txt
 */

// Export as a global variable for the main app
window.EMBEDDED_QUESTIONS_DATA = null;

/**
 * Loads questions from the text file or falls back to embedded data
 * @returns {Promise<string>} The questions text content
 */
async function loadQuestionsText() {
    try {
        // Try to fetch the file (works on deployed sites)
        const response = await fetch('questions.txt');
        if (!response.ok) throw new Error('Failed to fetch questions.txt');
        return await response.text();
    } catch (error) {
        console.warn('Could not fetch questions.txt, using embedded fallback:', error.message);

        // Fallback: read from embedded data if available
        if (window.EMBEDDED_QUESTIONS_DATA) {
            return window.EMBEDDED_QUESTIONS_DATA;
        }

        throw new Error('Questions data not available. Please use a local web server (e.g., "python -m http.server" or "npx serve") to run this application locally.');
    }
}

// Make it available globally
window.loadQuestionsText = loadQuestionsText;
