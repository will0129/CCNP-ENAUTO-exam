// Score Manager - Handles score persistence using localStorage
const ScoreManager = {
    STORAGE_KEY: 'ccnp_study_game_score',

    // Load score from localStorage
    loadScore() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading score:', error);
        }
        return {
            totalCorrect: 0,
            totalAttempted: 0,
            percentage: 0
        };
    },

    // Save score to localStorage
    saveScore(correct, attempted) {
        try {
            const score = {
                totalCorrect: correct,
                totalAttempted: attempted,
                percentage: this.calculatePercentage(correct, attempted)
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(score));
            return score;
        } catch (error) {
            console.error('Error saving score:', error);
            return null;
        }
    },

    // Update score by adding new results
    updateScore(correctInRound, totalInRound) {
        const current = this.loadScore();
        const newCorrect = current.totalCorrect + correctInRound;
        const newTotal = current.totalAttempted + totalInRound;
        return this.saveScore(newCorrect, newTotal);
    },

    // Calculate percentage
    calculatePercentage(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },

    // Reset all score data
    resetScore() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return {
                totalCorrect: 0,
                totalAttempted: 0,
                percentage: 0
            };
        } catch (error) {
            console.error('Error resetting score:', error);
            return null;
        }
    }
};
