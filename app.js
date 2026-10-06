let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];

let score = 0;
let answered = 0;
let questionAnswered = false;


// Load questions from questions.json
async function loadQuestions() {

    try {

        const response = await fetch("questions.json");

        if (!response.ok) {
            throw new Error("Could not load questions.json");
        }

        questions = await response.json();

        document.getElementById("total-questions").textContent =
            questions.length;

        showQuestion();

    } catch (error) {

        console.error(error);

        document.querySelector("main").innerHTML = `
            <h2>Unable to load questions</h2>

            <p>
                The quiz could not read questions.json.
            </p>

            <p>
                Make sure the project is being opened through a local
                web server rather than opening index.html directly.
            </p>
        `;
    }
}


// Display the current question
function showQuestion() {

    const question = questions[currentQuestionIndex];

    selectedAnswers = [];
    questionAnswered = false;

    document.getElementById("current-question").textContent =
        currentQuestionIndex + 1;

    document.getElementById("topic").textContent =
        question.topic;

    document.getElementById("scenario").textContent =
        question.scenario;

    document.getElementById("question").textContent =
        question.question;

    document.getElementById("result-section")
        .classList.add("hidden");

    displayOptions(question);
    displaySelectedAnswers();
}


// Display available answers
function displayOptions(question) {

    const optionsContainer =
        document.getElementById("options");

    optionsContainer.innerHTML = "";

    question.options.forEach(option => {

        const button = document.createElement("button");

        button.className = "option-button";
        button.textContent = option;

        if (selectedAnswers.includes(option)) {
            button.disabled = true;
        }

       