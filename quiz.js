import './style.css';
import Phaser from "phaser";
import './changeCanva.js';

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const bgImg = "/assets/toy-bg.jpg";
const rewards = {
    "reward1": "/assets/basket.png",
    "reward2": "/assets/apple.png",
    //"reward2": "http://localhost:3000/merchant/m_anakmu/applogo.png",
    "reward3": "/assets/orange.png",
    "reward4": "/assets/mango.png"
}

const questions = [
    {
        question: "Which company does this logo belong to?",
        image: "/assets/LEGO_logo.png",
        answers: ["LEGO", "Hasbro", "Mattel", "Fisher-Price"]
    },
    {
        question: "Guess the Toy:",
        image: "/assets/emoji.png",
        answers: ["Princess Castle Playset", "Enchanted Palace", "Magic Kingdom", "Toy Castle"]
    },
    {
        question: "Fill in the blank",
        image: "/assets/lego-bricks.png",
        answers: ["O", "G", "I", "A"]
    },
    {
        question: "Find the hidden word",
        image: "/assets/Lego-word.jpg",
        answers: ["Minifigure", "Billund", "Ninjago", "Castle"]
    },
    {
        question: "How many cars in the picture?",
        image: "/assets/toy-shop.png",
        answers: ["4", "6", "5", "3", "7"]
    }
];
const questionNum = questions.length;

const btnStyle = {
    "btn1": "/assets/btn-blue.png",
    "btn2": "/assets/btn-green.png",
    "btn3": "/assets/btn-orange.png"
}
const progressBarHeight = 20;

const point = 1;
class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.answerTexts = [];
        this.answerGraphics = [];
        this.currentQuestionIndex;
        this.shuffledQuestions;
        this.totalPoint = 0;
        this.bonus = 1;
        this.timedEvent = null;
        this.progressBarFill = null;
        this.remainingTime = 0;
        this.duration = 5000;
        this.btnStyleKeys = Object.keys(btnStyle);
    }

    preload() {
        this.load.image("bg", bgImg);
        this.load.image("scoreBg", "assets/train-shadow.png");
        this.load.image("bonus2", "assets/robot1.png");
        this.load.image("bonus1", "assets/robot2.png");
        for (const key in rewards) {
            if (rewards.hasOwnProperty(key)) {
                this.load.image(key, rewards[key]);
            }
        }
        for (const key in btnStyle) {
            if (btnStyle.hasOwnProperty(key)) {
                this.load.image(key, btnStyle[key]);
            }
        }
        questions.forEach(question => {
            if (question.image) {
                this.load.image(question.question + '_image', question.image);
            }
        });
        this.load.image('correct', 'assets/correct-ans.png');
        this.load.image('wrong', 'assets/wrong-ans.png');
        this.load.audio("correctSound", "/assets/Correct-Answer-sound-effect.mp3");
        this.load.audio("wrongSound", "/assets/Incorrect-Answer-sound-effect.mp3");
    }

    create() {
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        this.resizeBackground();
        this.correctSound = this.sound.add("correctSound");
        this.wrongSound = this.sound.add("wrongSound");
        this.shuffledQuestions = this.shuffle(questions);
        this.currentQuestionIndex = 0;

        this.questionText = this.add.text(sizes.width / 2, sizes.height / 6, '', {
            font: "bold 24px Arial",
            fill: '#000000',
            align: 'center',
            lineSpacing: 2,
            wordWrap: {
                width: (sizes.width - sizes.width / 4),
                useAdvancedWrap: true
            }
        }).setOrigin(0.5);

        this.progressBarBg = this.add.graphics();
        this.progressBarBg.fillStyle(0x222222, 1);
        this.progressBarBg.fillRect(0, 0, sizes.width, progressBarHeight);

        this.progressBarFill = this.add.graphics();
        this.progressBarFill.fillStyle(0x00ff00, 1);
        this.progressBarFill.fillRect(0, 0, sizes.width, progressBarHeight);

        const bonusImg = this.add.image(sizes.width - sizes.width / 3, progressBarHeight, "bonus1").setOrigin(0.5, 0);
        const bonusScaleX = sizes.width / 8 / bonusImg.width;
        const bonusScaleY = sizes.height / 12 / bonusImg.height;
        const bonusScale = Math.min(bonusScaleX, bonusScaleY);
        bonusImg.setScale(bonusScale);

        const bonusText = this.add.text(bonusImg.x, bonusImg.y + bonusImg.displayHeight / 2, "x2", {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5);

        const bonus2Img = this.add.image(sizes.width / 3, progressBarHeight, "bonus2").setOrigin(0.5, 0);
        const bonus2ScaleX = sizes.width / 8 / bonus2Img.width;
        const bonus2ScaleY = sizes.height / 12 / bonus2Img.height;
        const bonus2Scale = Math.min(bonus2ScaleX, bonus2ScaleY);
        bonus2Img.setScale(bonus2Scale);


        const bonus2Text = this.add.text(bonus2Img.x, bonus2Img.y + bonus2Img.displayHeight / 2, "x3", {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5);



        this.textScore = this.add.text(sizes.width - 10, 50, "Score: 0", {
            font: "20px Arial",
            fill: "#000000",
        }).setOrigin(1, 0.5);


        const fontSize = 24;
        const lineSpacing = 10;
        const numLines = this.questionText.text.split('\n').length;
        const textHeight = numLines * (fontSize + lineSpacing);
        this.textNumber = this.add.text(sizes.width / 2, this.questionText.y - textHeight, (this.currentQuestionIndex + 1) + "/" + questionNum, {
            font: "16px Arial",
            fill: "#000000",
        }).setOrigin(0.5, 0.5);

        this.displayQuestion();

    }


    addSpeechBubble(x, y, width, height, text) {
        const bubbleWidth = width;
        const bubbleHeight = height;
        const bubblePadding = 8;
        const arrowHeight = 5;

        const bubble = this.add.graphics({ x: x - bubbleWidth / 2, y: y - bubbleHeight / 2 - arrowHeight });

        bubble.fillStyle(0xffffff, 1);

        bubble.fillRoundedRect(0, arrowHeight, bubbleWidth, bubbleHeight, 16);

        bubble.beginPath();
        bubble.moveTo(bubbleWidth / 2 - 10, arrowHeight);
        bubble.lineTo(bubbleWidth / 2 + 10, arrowHeight);
        bubble.lineTo(bubbleWidth / 2, 0);
        bubble.closePath();
        bubble.fillPath();

        const content = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#000000',
            align: 'center',
            wordWrap: { width: bubbleWidth - bubblePadding * 2 }
        });

        const b = content.getBounds();
        content.setPosition(
            bubble.x + bubbleWidth / 2 - b.width / 2,
            bubble.y + arrowHeight + bubbleHeight / 2 - b.height / 2
        );
    }

    updateProgressBar() {
        this.remainingTime -= 100;

        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.timedEvent.remove(false);
        } else if (this.remainingTime <= this.duration / 3) {
            this.bonus = 1;
        } else if (this.remainingTime <= this.duration - this.duration / 3) {
            this.bonus = 2;
        } else {
            this.bonus = 3;
        }

        const fillWidth = (this.remainingTime / this.duration) * sizes.width;

        this.progressBarFill.clear();
        this.progressBarFill.fillStyle(0x00ff00, 1);
        this.progressBarFill.fillRect(0, 0, fillWidth, progressBarHeight);
    }

    customShuffle(array) {
        if (array.length <= 1) {
            return array;
        }

        const firstElement = array[0];
        const remainingElements = array.slice(1);

        const shuffledRemaining = this.shuffle(remainingElements);
        const selectedThree = shuffledRemaining.slice(0, 3);

        const newArray = [firstElement, ...selectedThree];
        return this.shuffle(newArray);
    }

    displayQuestion() {
        if (this.timedEvent) {
            this.timedEvent.remove(false);
        }
        this.remainingTime = this.duration;
        this.answerGraphics.forEach(graphic => graphic.destroy());
        this.answerTexts.forEach(text => text.destroy());

        this.answerGraphics = [];
        this.answerTexts = [];
        const shuffledBtnStyles = this.shuffle(this.btnStyleKeys);

        let question = this.shuffledQuestions[this.currentQuestionIndex];
        this.questionText.setText(question.question);

        let shuffledAnswers = this.customShuffle([...question.answers]);
        let correctIndex = shuffledAnswers.indexOf(question.answers[0]);
        if (this.questionImage) {
            this.questionImage.destroy();
        }
        for (let i = 0; i < shuffledAnswers.length; i++) {
            const width = (sizes.width - sizes.width / 4);
            const height = 60;

            const x = (sizes.width / 2) - (width / 2);
            const spacing = sizes.height / 9;
            const y = (sizes.height / 2) - (height / 3) + (i * spacing);

            const buttonStyleKey = shuffledBtnStyles[i % shuffledBtnStyles.length];
            const image = this.add.image(x + width / 2, y + height / 2, buttonStyleKey);
            image.setInteractive({ useHandCursor: true });
            const scaleX = sizes.width / image.width / 1.2;
            const scaleY = sizes.height / image.height / 10;
            const scale = Math.min(scaleX, scaleY);
            image.setScale(scale);

            image.on('pointerdown', () => {
                this.checkAnswer(i);
            });

            let answerText = this.add.text(sizes.width / 2, y + height / 2, shuffledAnswers[i], {
                font: "bold 20px Arial",
                fill: '#fff',
                align: 'center',
                wordWrap: {
                    width: (sizes.width - sizes.width / 3.5),
                    useAdvancedWrap: true
                }
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            answerText.on('pointerdown', () => this.checkAnswer(i));

            this.answerGraphics.push(image);

            this.answerTexts.push(answerText);

            this.answerTexts[i].correct = (i === correctIndex);
        }
        if (question.image) {
            const fontSize = 24;
            const lineSpacing = 6;
            const numLines = this.questionText.text.split('\n').length;
            const textHeight = numLines * (fontSize + lineSpacing);
            const imageX = sizes.width / 2;
            const imageY = this.questionText.y + textHeight;

            this.questionImage = this.add.image(imageX, imageY, question.question + '_image');
            const scaleX = sizes.width / this.questionImage.width / 1.2;
            const scaleY = sizes.height / this.questionImage.height / 5;
            const scale = Math.min(scaleX, scaleY);
            this.questionImage.setScale(scale);
            this.questionImage.setOrigin(0.5, 0);
        }
        this.timedEvent = this.time.addEvent({
            delay: 100,
            callback: this.updateProgressBar,
            callbackScope: this,
            loop: true
        });
    }


    checkAnswer(index) {
        if (this.answerTexts[index].correct) {
            this.totalPoint += (point * this.bonus);
            this.textScore.setText(`Score: ${(this.totalPoint)}`)
            this.showFeedback(true);
            this.correctSound.play();
        } else {
            this.showFeedback(false);
            this.wrongSound.play();
        }
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < questionNum) {
            this.time.delayedCall(1000, () => {
                this.displayQuestion();
                this.textNumber.setText((this.currentQuestionIndex + 1) + "/" + questionNum);
            });
        } else {
            this.timedEvent.remove(false);
            this.time.delayedCall(1000, () => {
                this.gameOver();
            });
        }
    }

    showFeedback(isCorrect) {
        const x = sizes.width / 2;
        const y = sizes.height / 2;
        const feedbackImageKey = isCorrect ? 'correct' : 'wrong';
        const feedbackImage = this.add.image(x, y, feedbackImageKey);
        const scaleX = sizes.width / feedbackImage.width / 1.2;
        const scaleY = sizes.height / feedbackImage.height / 1.2;
        const scale = Math.min(scaleX, scaleY);
        feedbackImage.setOrigin(0.5);
        feedbackImage.setScale(scale);
        this.tweens.add({
            targets: feedbackImage,
            alpha: 0,
            duration: 300,
            delay: 800,
            ease: 'Power1',
            onComplete: () => {
                feedbackImage.destroy();
            }
        });
    }


    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    resizeBackground() {
        const { width, height } = this.sys.game.scale.gameSize;
        const scaleX = sizes.width / this.bg.width;
        const scaleY = sizes.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setPosition(width / 2, height / 2);
    }

    gameOver() {
        this.sys.game.destroy(true);
        let status;
        if (this.totalPoint != 0)
            status = "Win";
        else
            status = "Lose";
        let userId = new URLSearchParams(window.location.search).get('userId');
        let points = this.totalPoint;
        let date = Date.now();
        let reward = "basic-reward";
        if (this.totalPoint >= 8) {
            reward = "win-reward";
        } else if (this.totalPoint >= 5) {
            reward = "win-reward2";
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

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: sizes.width,
        height: sizes.height,
    },
    scene: [GameScene],
    parent: 'gameCanvas',
    callbacks: {
        postBoot: function (game) {
            window.addEventListener('resize', () => resize(game));
            resize(game);
        }
    }
};

const game = new Phaser.Game(config);

function resize(game) {
    game.scale.resize(sizes.width, sizes.height);
}


