import './gameOverStyle.css'

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameEnd = document.querySelector("#gameEnd");
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");
const rewardSpan = document.querySelector("#reward");

if (userId) {
    fetch(`http://localhost:3001/game/game-result/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No result found');
            }
            return response.json();
        })
        .then(data => {
            if (data.points != null) {
                gameEndScoreSpan.innerHTML = "Final Score: " + data.points;
            }
            if (data.reward != null)
                rewardSpan.innerHTML = data.reward;

            gameWinLoseSpan.innerHTML = data.status + "!";
            countDown();
        })
        .catch(error => {
            gameEnd.innerHTML = `<p>Error: ${error.message}</p>`;
        });
} else {
    gameEnd.innerHTML = '<p>Error: No user ID provided in the URL</p>';
}

const gameBgImg = document.querySelector(".gameEndDiv");
gameBgImg.style.backgroundImage = "url('/assets/bg.png')";

const redirectBtn = document.querySelector("#redirectBtn");
function countDown() {
    let redirectCount = 3;

    const redirectElement = document.getElementById('redirectCount');
    const redirectDiv = document.getElementById('redirectDiv');

    const interval = setInterval(() => {
        redirectCount--;
        redirectElement.textContent = redirectCount;

        if (redirectCount === 0) {
            clearInterval(interval);
            redirectDiv.style.display = 'flex';
            gameEndDiv.style.display = 'none';
        }
    }, 1000);
    redirectBtn.addEventListener("click", () => {
        redirectDiv.style.display = 'flex';
        gameEndDiv.style.display = 'none';
    });
}