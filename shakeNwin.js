import './style.css';
import './shake.css';
import './changeCanva.js';
import '/node_modules/shake/shake.js';

const bgImg = "/assets/bg.png";
const basicReward = "/assets/basket.png";
const rewards = {
    "reward2": "/assets/apple.png",
    "reward3": "/assets/orange.png",
    "reward4": "/assets/mango.png"
}

let shakeCount = 0;
let time = 10;
let timerSeconds = time;
let timerInterval;

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        return new Promise((resolve, reject) => {
            const playPromise = this.sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                });
            } else {
                reject(new Error('Failed to play sound.'));
            }
        });
    };
    this.stop = function () {
        this.sound.pause();
    };
}


let mySound = new sound("/assets/coin.mp3");
let bgm = new sound("/assets/bgMusic.mp3");

document.addEventListener("DOMContentLoaded", () => {
    const startDiv = document.createElement("div");
    startDiv.id = "startDiv";
    startDiv.style.width = "100%";
    startDiv.style.height = "100%";
    startDiv.style.backgroundColor = "rgba(225, 225, 225, 0.5)";
    startDiv.style.display = "flex";
    startDiv.style.flexDirection = "column";
    startDiv.style.justifyContent = "center";
    startDiv.style.alignItems = "center";
    startDiv.style.position = "absolute";
    startDiv.style.top = "0";
    startDiv.style.left = "0";
    startDiv.style.zIndex = "2";
  
    const startBtn = document.createElement("button");
    startBtn.id = "startBtn";
    startBtn.textContent = "Start";
    startBtn.style.backgroundColor = "white";
    startBtn.style.color = "black";
    startBtn.style.border = "2px solid #04AA6D";
    startBtn.style.borderRadius = "10px";
    startBtn.style.padding = "16px 32px";
    startBtn.style.textAlign = "center";
    startBtn.style.fontSize = "16px";
    startBtn.style.margin = "4px 2px";
    startBtn.style.transitionDuration = "0.4s";
    startBtn.style.cursor = "pointer";
  
    startBtn.addEventListener("mouseenter", () => {
      startBtn.style.backgroundColor = "#04AA6D";
      startBtn.style.color = "white";
    });
  
    startBtn.addEventListener("mouseleave", () => {
      startBtn.style.backgroundColor = "white";
      startBtn.style.color = "black";
    });

    document.body.appendChild(startDiv);
    const main = document.querySelector('main');
    const shakeRequestDiv = document.createElement('div');
    shakeRequestDiv.id = 'shakeRequest';
    shakeRequestDiv.style.backgroundImage = "url(" + bgImg + ")";

    const giftBox = document.createElement('div');
    giftBox.id = 'giftBox';
    giftBox.style.backgroundImage = "url('/assets/giftBox.png')";
    const shakePhone = document.createElement('img');
    shakePhone.id = 'shakePhone';
    shakePhone.src = "/assets/phone.png";
    const timerDiv = document.createElement('div');
    timerDiv.id = 'timerDiv';
    const timer = document.createElement('h2');
    timer.id = 'timer';
    timer.innerHTML = 'Time left: 10s';

    shakeRequestDiv.appendChild(timerDiv);
    timerDiv.appendChild(timer);
    shakeRequestDiv.appendChild(giftBox);
    main.appendChild(shakeRequestDiv);
    startDiv.appendChild(shakePhone);
    startDiv.appendChild(startBtn);

    startBtn.addEventListener('click', handleFirstInteraction, { once: true });

    function startCountdown() {
        startBtn.style.display = 'none';
        shakePhone.style.display = 'none';
        bgm.play();
        const countdownElement = document.createElement('h1');
        countdownElement.textContent = '3';
        startDiv.appendChild(countdownElement);

        setTimeout(() => {
            countdownElement.textContent = '2';
            setTimeout(() => {
                countdownElement.textContent = '1';
                setTimeout(() => {
                    countdownElement.textContent = 'GO!';
                    setTimeout(() => {
                        startDiv.removeChild(countdownElement);
                        startDiv.style.display = 'none';
                        startTimer();
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }

    function handleFirstInteraction() {
        startCountdown();
        mySound.play();
    }
});

var myShakeEvent = new Shake({
    threshold: 2,
    timeout: 1000
});



function startTimer() {
    myShakeEvent.start();
    window.addEventListener('shake', shakeEventDidOccur, false);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timerSeconds--;
    document.getElementById('timer').textContent = 'Time left: ' + timerSeconds + 's';

    if (timerSeconds === time / 1.25) {
        myShakeEvent.options.threshold += 2;
    } else if (timerSeconds === time / 2) {
        myShakeEvent.options.threshold += 2;
    } else if (timerSeconds === 0) {
        clearInterval(timerInterval);
        myShakeEvent.stop();
        const giftBox = document.querySelector('#giftBox');
        const shakeRequest = document.querySelector("#shakeRequest");
        giftBox.style.animation = "none";
        
        let status = "Win";
        let userId = new URLSearchParams(window.location.search).get('userId');
        let points = null;
        let date = Date.now();
        let reward = "basic reward";

        if (shakeCount != 0) {
            giftBox.style.backgroundImage = 'none';
            const explosion = document.createElement('div');
            explosion.id = 'explosion';
            explosion.style.backgroundImage = "url('/assets/explosion-effect.png')";
            const rewardDiv = document.createElement('div');
            rewardDiv.id = 'rewardImg';
            giftBox.appendChild(explosion);
        
            if (shakeCount < 5) {
                rewardDiv.style.backgroundImage = "url('" + basicReward + "')";
            } else {
                reward = getRandomReward();
                rewardDiv.style.backgroundImage = `url('${rewards[reward]}')`;
            }
            explosion.appendChild(reward);
            
        } else {
            status = "Lose";
            reward = null;
        }
        fetch('http://localhost:3001/game/game-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, date, points, status, reward })
        }).then(response => response.json())
            .then(data => {
                window.location.href = `gameOver.html?userId=${userId}`;
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}
function getRandomReward() {
    return Object.keys(rewards)[Math.floor(Math.random() * Object.keys(rewards).length)];
}


function shakeEventDidOccur() {
    shakeCount++;
    mySound.play();

    if (navigator.vibrate) {
        navigator.vibrate([200]);
    } 
    const giftBox = document.getElementById('giftBox');

    if (myShakeEvent.options.threshold <= 5)
        giftBox.style.animationDuration = '1.5s';
    else if (myShakeEvent.options.threshold <= 10)
        giftBox.style.animationDuration = '0.9s';
    else
        giftBox.style.animationDuration = '0.3s';

    //alert('Shake!');
}

