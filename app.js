let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let score = 0;
let answered = 0;

// Load questions on initial load
window.addEventListener("DOMContentLoaded", loadQuestions);

async function loadQuestions() {
    try {
        const response = await fetch("questions.json");
        if (!response.ok) throw new Error("Could not load questions.json");
        
        questions = await response.json();
        document.getElementById("total-questions").textContent = questions.length;
        
        setupEventListeners();
        showQuestion();
    } catch (error) {
        console.error(error);
        document.querySelector("main").innerHTML = `
            <h2>Unable to load questions</h2>
            <p>Make sure the project is running via a local web server (e.g. Live Server extension or <code>npx serve</code>).</p>
        `;
    }
}

function setupEventListeners() {
    document.getElementById("reset-button").addEventListener("click", resetSelection);
    document.getElementById("check-button").addEventListener("click", checkAnswer);
    document.getElementById("next-button")?.addEventListener("click", nextQuestion);
    document.getElementById("previous-button")?.addEventListener("click", previousQuestion);
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    selectedAnswers = [];

    document.getElementById("current-question").textContent = currentQuestionIndex + 1;
    document.getElementById("topic").textContent = question.topic || "AZ-104";
    document.getElementById("scenario").textContent = question.scenario || "";
    document.getElementById("question").textContent = question.question;

    document.getElementById("result-section").classList.add("hidden");
    
    displayOptions(question);
    displaySelectedAnswers();
}

function displayOptions(question) {
    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    // TYPE 1: Sequence / Ordering (Drag/Click to order)
    if (question.type === "ordering") {
        question.options.forEach(option => {
            const button = document.createElement("button");
            button.className = "option-button";
            button.textContent = option;
            button.disabled = selectedAnswers.includes(option);
            button.addEventListener("click", () => {
                selectedAnswers.push(option);
                displayOptions(question);
                displaySelectedAnswers();
            });
            optionsContainer.appendChild(button);
        });
    } 
    
    // TYPE 2: Single Choice / True or False (Radio Style)
    else if (question.type === "single-choice") {
        question.options.forEach(option => {
            const label = document.createElement("label");
            label.className = "option-label";
            label.innerHTML = `
                <input type="radio" name="option" value="${option}" ${selectedAnswers.includes(option) ? 'checked' : ''}>
                <span>${option}</span>
            `;
            label.querySelector("input").addEventListener("change", () => {
                selectedAnswers = [option]; // Only keep one selection
            });
            optionsContainer.appendChild(label);
        });
    }

    // TYPE 3: Multiple Choice (Checkbox Style)
    else if (question.type === "multiple-choice") {
        question.options.forEach(option => {
            const label = document.createElement("label");
            label.className = "option-label";
            label.innerHTML = `
                <input type="checkbox" value="${option}" ${selectedAnswers.includes(option) ? 'checked' : ''}>
                <span>${option}</span>
            `;
            label.querySelector("input").addEventListener("change", (e) => {
                if (e.target.checked) {
                    selectedAnswers.push(option);
                } else {
                    selectedAnswers = selectedAnswers.filter(ans => ans !== option);
                }
            });
            optionsContainer.appendChild(label);
        });
    }
}

function displaySelectedAnswers() {
    const container = document.getElementById("selected-answers");
    container.innerHTML = "";

    if (selectedAnswers.length === 0) {
        container.innerHTML = `<p id="empty-answer">Select answers in the order you want them.</p>`;
        return;
    }

    selectedAnswers.forEach((answer, index) => {
        const item = document.createElement("div");
        item.className = "selected-answer";
        item.innerHTML = `
            <span class="answer-number">${index + 1}</span>
            <span>${answer}</span>
            <button class="remove-answer" onclick="removeAnswer(${index})">&times;</button>
        `;
        container.appendChild(item);
    });
}

function removeAnswer(index) {
    selectedAnswers.splice(index, 1);
    displayOptions(questions[currentQuestionIndex]);
    displaySelectedAnswers();
}

function resetSelection() {
    selectedAnswers = [];
    displayOptions(questions[currentQuestionIndex]);
    displaySelectedAnswers();
}

function checkAnswer() {
    const question = questions[currentQuestionIndex];
    if (selectedAnswers.length === 0) return;

    const isCorrect = JSON.stringify(selectedAnswers) === JSON.stringify(question.correctAnswer);

    if (isCorrect) score++;
    answered++;

    document.getElementById("score").textContent = score;
    document.getElementById("answered").textContent = answered;

    // Show correct answer & explanation details
    const resultSection = document.getElementById("result-section");
    resultSection.classList.remove("hidden");

    const correctContainer = document.getElementById("correct-answer");
    correctContainer.innerHTML = question.correctAnswer.map(ans => `<li>${ans}</li>`).join("");

    document.getElementById("explanation").textContent = question.explanation;

    const wrongContainer = document.getElementById("wrong-answers");
    if (question.wrongAnswers) {
        wrongContainer.innerHTML = question.wrongAnswers.map(wa => 
            `<p><strong>${wa.option}:</strong> ${wa.reason}</p>`
        ).join("");
    }

    document.getElementById("memory-tip").textContent = question.memoryTip || "N/A";
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}