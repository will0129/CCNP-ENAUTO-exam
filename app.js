// Main Application Logic
class CCNPStudyGame {
    constructor() {
        this.allSections = [];
        this.selectedSections = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.roundCorrect = 0;
        this.roundCorrect = 0;
        this.roundTotal = 0;
        this.lastRoundCount = 10;

        this.init();
    }

    async init() {
        try {
            // Load questions
            this.allSections = await QuestionParser.parseQuestionsFile('questions.txt');

            // Load saved score
            this.updateScoreDisplay();

            // Setup event listeners
            this.setupEventListeners();

            // Render section selector
            this.renderSectionSelector();

            // Show section select screen
            this.showScreen('section-select-screen');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load questions. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Section select screen
        document.getElementById('start-round-btn').addEventListener('click', () => this.startRound(10));
        document.getElementById('start-round-btn').addEventListener('click', () => this.startRound(10));
        const startAllBtn = document.getElementById('start-all-btn');
        if (startAllBtn) {
            startAllBtn.addEventListener('click', () => this.startRound(Number.MAX_SAFE_INTEGER));
        }
        document.getElementById('reset-score-btn').addEventListener('click', () => this.resetScore());

        // Gameplay screen
        document.getElementById('exit-round-btn').addEventListener('click', () => this.exitRound());

        // Feedback screen
        document.getElementById('next-question-btn').addEventListener('click', () => this.nextQuestion());

        // Round complete screen
        document.getElementById('continue-studying-btn').addEventListener('click', () => this.continueStudying());
        document.getElementById('same-sections-btn').addEventListener('click', () => this.startRound(this.lastRoundCount));
    }

    renderSectionSelector() {
        const sectionList = document.getElementById('section-list');
        sectionList.innerHTML = '';

        // Sort sections alphabetically
        const sortedSections = [...this.allSections].sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Add individual sections
        sortedSections.forEach(section => {
            const item = this.createSectionItem(section.name, section.questions.length);
            sectionList.appendChild(item);
        });

        // Add "All Sections" option at the end
        const allQuestions = this.allSections.reduce((sum, s) => sum + s.questions.length, 0);
        const allItem = this.createSectionItem('All Sections', allQuestions, true);
        sectionList.appendChild(allItem);
    }

    createSectionItem(name, count, isAll = false) {
        const item = document.createElement('div');
        item.className = 'section-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `section-${name.replace(/\s+/g, '-')}`;
        checkbox.value = isAll ? 'ALL' : name;
        checkbox.addEventListener('change', (e) => this.handleSectionToggle(e, isAll));

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.innerHTML = `
            <span class="section-name">${name}</span>
            <span class="question-count">${count} question${count !== 1 ? 's' : ''}</span>
        `;

        item.appendChild(checkbox);
        item.appendChild(label);

        return item;
    }

    handleSectionToggle(event, isAll) {
        if (isAll) {
            // Toggle all sections
            const checkboxes = document.querySelectorAll('#section-list input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = event.target.checked;
            });
        } else {
            // Uncheck "All Sections" if any individual is unchecked
            const allCheckbox = document.querySelector('input[value="ALL"]');
            if (!event.target.checked && allCheckbox) {
                allCheckbox.checked = false;
            }
        }

        this.updateSelectedSections();
    }

    updateSelectedSections() {
        const checkboxes = document.querySelectorAll('#section-list input[type="checkbox"]:checked');
        const allCheckbox = document.querySelector('input[value="ALL"]');

        if (allCheckbox && allCheckbox.checked) {
            // All sections selected
            this.selectedSections = this.allSections.map(s => s.name);
        } else {
            // Individual selections
            this.selectedSections = Array.from(checkboxes)
                .map(cb => cb.value)
                .filter(v => v !== 'ALL');
        }

        // Enable/disable start buttons
        const startBtn = document.getElementById('start-round-btn');
        const startAllBtn = document.getElementById('start-all-btn');
        const hasSelection = this.selectedSections.length > 0;

        if (startBtn) startBtn.disabled = !hasSelection;
        if (startAllBtn) startAllBtn.disabled = !hasSelection;
    }

    startRound(count = 10) {
        this.lastRoundCount = count;
        this.roundCorrect = 0;
        this.roundTotal = 0;
        this.currentQuestionIndex = 0;

        // Select random questions
        this.currentQuestions = RandomSelector.selectRandomQuestions(
            this.selectedSections,
            this.allSections,
            count
        );

        this.showScreen('gameplay-screen');
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const questionNum = this.currentQuestionIndex + 1;
        const total = this.currentQuestions.length;

        // Update UI
        document.getElementById('question-counter').textContent = `Question ${questionNum} of ${total}`;
        document.getElementById('current-section-badge').textContent = question.section;
        document.getElementById('question-text').textContent = question.text;

        // Update progress bar
        const progress = (questionNum / total) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;

        // Render options
        const optionsList = document.getElementById('options-list');
        optionsList.innerHTML = '';

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.selectAnswer(String.fromCharCode(65 + index)));
            optionsList.appendChild(button);
        });

        this.selectedAnswer = null;
    }

    selectAnswer(answer) {
        this.selectedAnswer = answer;
        const question = this.currentQuestions[this.currentQuestionIndex];
        const isCorrect = answer === question.correctAnswer;

        if (isCorrect) {
            this.roundCorrect++;
        }
        this.roundTotal++;

        // Update overall score immediately
        const currentScore = ScoreManager.loadScore();
        const newCorrect = currentScore.totalCorrect + (isCorrect ? 1 : 0);
        const newTotal = currentScore.totalAttempted + 1;
        ScoreManager.saveScore(newCorrect, newTotal);

        this.showFeedback(isCorrect, question);
    }

    showFeedback(isCorrect, question) {
        const feedbackContent = document.getElementById('feedback-content');

        // Generate options HTML
        const optionsHtml = question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            let className = 'option-btn neutral';

            // Check if this option is the correct answer
            const isThisCorrect = letter === question.correctAnswer;

            // Check if this option was the one selected by the user
            const isThisSelected = letter === this.selectedAnswer;

            if (isThisCorrect) {
                className = 'option-btn correct';
            } else if (isThisSelected) {
                className = 'option-btn incorrect';
            }

            return `<div class="${className}">${option}</div>`;
        }).join('');

        let headerHtml = '';
        if (isCorrect) {
            headerHtml = `
                <div class="feedback-correct">
                    <div class="celebration-animation">
                        <div class="confetti">🎉</div>
                        <div class="confetti">✨</div>
                        <div class="confetti">🌟</div>
                        <div class="confetti">💫</div>
                    </div>
                    <div class="feedback-icon" style="margin-bottom: 0.5rem;">✓</div>
                    <h2 style="margin-bottom: 0.5rem;">Correct!</h2>
                </div>
            `;
        } else {
            headerHtml = `
                <div class="feedback-incorrect">
                    <div class="feedback-icon" style="margin-bottom: 0.5rem;">✗</div>
                    <h2 style="margin-bottom: 0.5rem;">Incorrect</h2>
                </div>
            `;
        }

        feedbackContent.innerHTML = `
            ${headerHtml}
            <div style="margin-top: 1rem; margin-bottom: 1.5rem;">
                <h3 class="question-text" style="font-size: 1.25rem; margin-bottom: 1rem;">${question.text}</h3>
                <div class="feedback-options-list">
                    ${optionsHtml}
                </div>
                ${question.explanation ? `
                <div class="explanation-box" style="margin-top: 1.5rem; padding: 1rem; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <h4 style="display: flex; align-items: center; margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1rem;">
                        <span style="font-size: 1.25rem; margin-right: 0.5rem;">💡</span> Explanation
                    </h4>
                    <p style="margin: 0; color: #475569; line-height: 1.5; font-size: 0.95rem;">${question.explanation}</p>
                </div>
                ` : ''}
            </div>
        `;

        // Update button text
        const nextBtn = document.getElementById('next-question-btn');
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            nextBtn.textContent = 'Next Question →';
        } else {
            nextBtn.textContent = 'Finish Round →';
        }

        this.showScreen('feedback-screen');
        this.updateScoreDisplay();
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.currentQuestions.length) {
            this.showScreen('gameplay-screen');
            this.displayQuestion();
        } else {
            this.showRoundComplete();
        }
    }

    showRoundComplete() {
        const score = ScoreManager.loadScore();

        document.getElementById('round-score').textContent = `${this.roundCorrect}/${this.roundTotal}`;
        document.getElementById('final-overall-score').textContent = `${score.totalCorrect}/${score.totalAttempted}`;
        document.getElementById('final-percentage').textContent = `${score.percentage}%`;

        this.showScreen('round-complete-screen');
    }

    exitRound() {
        this.showScreen('section-select-screen');
        this.updateScoreDisplay();
    }

    continueStudying() {
        this.showScreen('section-select-screen');
        // Clear selections
        const checkboxes = document.querySelectorAll('#section-list input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateSelectedSections();
    }

    resetScore() {
        if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
            ScoreManager.resetScore();
            this.updateScoreDisplay();
        }
    }

    updateScoreDisplay() {
        const score = ScoreManager.loadScore();
        const hasScore = score.totalAttempted > 0;

        // Overall score card
        const scoreCard = document.getElementById('overall-score-card');
        if (hasScore) {
            scoreCard.style.display = 'flex';
            document.getElementById('overall-score-display').textContent = `${score.totalCorrect}/${score.totalAttempted}`;
            document.getElementById('overall-percentage-display').textContent = `${score.percentage}%`;
        } else {
            scoreCard.style.display = 'none';
        }

        // Game score display
        const gameScore = document.getElementById('game-score-display');
        if (gameScore) {
            gameScore.textContent = `${score.totalCorrect}/${score.totalAttempted} (${score.percentage}%)`;
        }
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
        }
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CCNPStudyGame();
});
