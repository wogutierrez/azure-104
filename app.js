let allQuestions = [];
let filteredQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];

let score = 0;
let answered = 0;
let bookmarkedQuestions = JSON.parse(localStorage.getItem("az104_bookmarks")) || [];

window.addEventListener("DOMContentLoaded", loadQuestions);

async function loadQuestions() {
    try {
        const response = await fetch("questions.json");
        if (!response.ok) throw new Error("Could not load questions.json");

        allQuestions = await response.json();
        filteredQuestions = [...allQuestions];

        setupEventListeners();
        updateQuizState();
    } catch (error) {
        console.error(error);
        document.querySelector("main").innerHTML = `
            <h2>Unable to load questions</h2>
            <p>Make sure the project is running via Live Server or a local HTTP server.</p>
        `;
    }
}

function setupEventListeners() {
    document.getElementById("reset-button").addEventListener("click", resetSelection);
    document.getElementById("check-button").addEventListener("click", checkAnswer);
    document.getElementById("next-button").addEventListener("click", nextQuestion);
    document.getElementById("previous-button").addEventListener("click", previousQuestion);
    document.getElementById("bookmark-button").addEventListener("click", toggleBookmark);
    document.getElementById("type-filter").addEventListener("change", filterQuestions);
}

function filterQuestions(e) {
    const selectedType = e.target.value;
    if (selectedType === "all") {
        filteredQuestions = [...allQuestions];
    } else {
        filteredQuestions = allQuestions.filter(q => q.type === selectedType);
    }

    currentQuestionIndex = 0;
    updateQuizState();
}

function updateQuizState() {
    if (filteredQuestions.length === 0) {
        document.getElementById("total-questions").textContent = 0;
        document.getElementById("question").textContent = "No questions found for this filter.";
        document.getElementById("options").innerHTML = "";
        return;
    }

    document.getElementById("total-questions").textContent = filteredQuestions.length;
    showQuestion();
}

function showQuestion() {
    const question = filteredQuestions[currentQuestionIndex];
    selectedAnswers = [];

    document.getElementById("current-question").textContent = currentQuestionIndex + 1;
    document.getElementById("topic").textContent = `${question.topic} (${question.type || "standard"})`;
    document.getElementById("scenario").textContent = question.scenario || "";
    document.getElementById("question").textContent = question.question;

    document.getElementById("result-section").classList.add("hidden");

    // Bookmark status update
    updateBookmarkButton(question.id);

    displayOptions(question);
    displaySelectedAnswers();
}

function displayOptions(question) {
    const optionsContainer = document.getElementById("options");
    const selectedAnswersSection = document.getElementById("selected-answers-section");
    optionsContainer.innerHTML = "";

    // Show/Hide "Your Answer" section based on question type
    if (question.type === "ordering") {
        selectedAnswersSection.style.display = "block";
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
    } else if (question.type === "single-choice") {
        selectedAnswersSection.style.display = "none";
        question.options.forEach(option => {
            const label = document.createElement("label");
            label.style.cssText = "display: block; padding: 12px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer;";
            label.innerHTML = `
                <input type="radio" name="option" value="${option}" ${selectedAnswers.includes(option) ? 'checked' : ''}>
                <span style="margin-left: 8px;">${option}</span>
            `;
            label.querySelector("input").addEventListener("change", () => {
                selectedAnswers = [option];
            });
            optionsContainer.appendChild(label);
        });
    } else if (question.type === "multiple-choice") {
        selectedAnswersSection.style.display = "none";
        question.options.forEach(option => {
            const label = document.createElement("label");
            label.style.cssText = "display: block; padding: 12px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer;";
            label.innerHTML = `
                <input type="checkbox" value="${option}" ${selectedAnswers.includes(option) ? 'checked' : ''}>
                <span style="margin-left: 8px;">${option}</span>
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
    displayOptions(filteredQuestions[currentQuestionIndex]);
    displaySelectedAnswers();
}

function resetSelection() {
    selectedAnswers = [];
    displayOptions(filteredQuestions[currentQuestionIndex]);
    displaySelectedAnswers();
}

function checkAnswer() {
    const question = filteredQuestions[currentQuestionIndex];
    if (selectedAnswers.length === 0) return;

    let isCorrect = false;

    if (question.type === "ordering") {
        isCorrect = JSON.stringify(selectedAnswers) === JSON.stringify(question.correctAnswer);
    } else {
        isCorrect = JSON.stringify([...selectedAnswers].sort()) === JSON.stringify([...question.correctAnswer].sort());
    }

    if (isCorrect) score++;
    answered++;

    document.getElementById("score").textContent = score;
    document.getElementById("answered").textContent = answered;

    const resultSection = document.getElementById("result-section");
    resultSection.classList.remove("hidden");

    const correctContainer = document.getElementById("correct-answer");
    correctContainer.innerHTML = question.correctAnswer.map(ans => `<li>${ans}</li>`).join("");

    document.getElementById("explanation").textContent = question.explanation;

    const wrongContainer = document.getElementById("wrong-answers");
    if (question.wrongAnswers && question.wrongAnswers.length > 0) {
        wrongContainer.innerHTML = question.wrongAnswers.map(wa => 
            `<p><strong>${wa.option}:</strong> ${wa.reason}</p>`
        ).join("");
    } else {
        wrongContainer.innerHTML = "<p>N/A</p>";
    }

    document.getElementById("memory-tip").textContent = question.memoryTip || "N/A";
}

function toggleBookmark() {
    const question = filteredQuestions[currentQuestionIndex];
    if (bookmarkedQuestions.includes(question.id)) {
        bookmarkedQuestions = bookmarkedQuestions.filter(id => id !== question.id);
    } else {
        bookmarkedQuestions.push(question.id);
    }
    localStorage.setItem("az104_bookmarks", JSON.stringify(bookmarkedQuestions));
    updateBookmarkButton(question.id);
}

function updateBookmarkButton(questionId) {
    const btn = document.getElementById("bookmark-button");
    if (bookmarkedQuestions.includes(questionId)) {
        btn.textContent = "★ Bookmarked";
        btn.style.backgroundColor = "#ffeb3b";
    } else {
        btn.textContent = "🔖 Bookmark for Review";
        btn.style.backgroundColor = "";
    }
}

function nextQuestion() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
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