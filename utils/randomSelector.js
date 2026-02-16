// Random Selector - Select random questions from chosen sections
const RandomSelector = {
    // Select N random questions from specified sections
    selectRandomQuestions(selectedSectionNames, allSections, count = 10) {
        // Filter sections by selected names
        const selectedSections = allSections.filter(section =>
            selectedSectionNames.includes(section.name)
        );

        // Collect all questions from selected sections
        const allQuestions = [];
        for (const section of selectedSections) {
            allQuestions.push(...section.questions);
        }

        // If we have fewer questions than requested, return all
        if (allQuestions.length <= count) {
            return this.shuffleArray([...allQuestions]);
        }

        // Select random questions without duplicates
        const shuffled = this.shuffleArray([...allQuestions]);
        return shuffled.slice(0, count);
    },

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Get total question count for selected sections
    getQuestionCount(selectedSectionNames, allSections) {
        const selectedSections = allSections.filter(section =>
            selectedSectionNames.includes(section.name)
        );

        return selectedSections.reduce((total, section) =>
            total + section.questions.length, 0
        );
    }
};
