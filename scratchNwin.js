import './style.css';
import Phaser from "phaser";
import './changeCanva.js';
import FireworksScene from './fireworks.js';

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const bgImg = "/assets/bg.png";
const rewards = {
    "reward1": "/assets/basket.png",
    "reward2": "/assets/apple.png",
    //"reward2": "http://localhost:3000/merchant/m_anakmu/applogo.png",
    "reward3": "/assets/orange.png",
    "reward4": "/assets/mango.png"
}


class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.reward;
        this.rewardKey;
        this.bgMusic;
        this.boxes = [];
        this.currentBoxIndex = 0;
        this.isAnimationRunning = false;
        this.coverImage;
        this.textTitle;
        this.textSubTitle;
    }

    preload() {
        this.load.image("bg", bgImg);
        this.load.image('coverImage', 'assets/background.png');
        this.load.image('box', 'assets/yellow-starburst.png');
        this.load.image('highlight', 'assets/starburst.png');
        this.load.image('stopBtn1', 'assets/stop-btn-1.png');
        this.load.image('stopBtn2', 'assets/stop-btn-2.png');
        for (const key in rewards) {
            if (rewards.hasOwnProperty(key)) {
                this.load.image(key, rewards[key]);
            }
        }
        this.load.audio("blingSound", "/assets/Bling-Sound-Effect.mp3");

    }

    create() {
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        this.resizeBackground();
        this.blingSound = this.sound.add('blingSound', {
            loop: true,
            rate: 1
        });

        let numRow = 3, numCol = 3;

        if (sizes.width > sizes.height) {
            numRow -= 1;
            numCol += 1;
        }

        const boxSize = Math.min(sizes.width, sizes.height) / 5;
        const spacing = Math.min(sizes.width, sizes.height) / 18;
        const totalWidth = numCol * boxSize + (numCol - 1) * spacing;
        const totalHeight = numRow * boxSize + (numRow - 1) * spacing;

        const startX = (sizes.width - totalWidth) / 2;
        const startY = (sizes.height - totalHeight) / 2;

        for (let row = 0; row < numRow; row++) {
            for (let col = 0; col < numCol; col++) {
                const x = startX + col * (boxSize + spacing) + boxSize / 2;
                const y = startY + row * (boxSize + spacing) + boxSize / 2;
                const box = this.add.image(x, y, 'box').setOrigin(0.5);
                const scaleX = sizes.width / 4 / box.width;
                const scaleY = sizes.height / 4 / box.height;
                const scale = Math.min(scaleX, scaleY);
                box.setScale(scale);

                const coverImage = this.add.image(box.x, box.y, 'coverImage').setOrigin(0.5);
                const coverImageScaleX = box.displayWidth / coverImage.width / 2;
                const coverImageScaleY = box.displayHeight / coverImage.height / 2;
                const coverImageScale = Math.min(coverImageScaleX, coverImageScaleY);
                coverImage.setScale(coverImageScale);
                coverImage.setAngle(30);
                this.boxes.push(box);
            }
        }

        this.textTitle = this.add.text(sizes.width / 2, 80, "Scratch and Win", {
            font: "bold 32px Arial",
            fill: "#000000",
        }).setOrigin(0.5, 0.5);
        this.textTitle.postFX.addGlow(0xffffff, 4, 0, false, 0.1, 24);
        this.textSubTitle = this.add.text(sizes.width / 2, 140, "Select One", {
            font: "26px Arial",
            fill: "#000000",
        }).setOrigin(0.5, 0.5);
        this.anims.create({
            key: 'snooze',
            frames: [
                { key: 'stopBtn1' },
                { key: 'stopBtn2' }
            ],
            frameRate: 4,
            repeat: -1
        });
        const stopButton = this.add.sprite(sizes.width / 2, startY + totalHeight + 30, 'stopBtn1').setOrigin(0.5, 0);
        stopButton.setInteractive();
        const scaleX = sizes.width / 4 / stopButton.width;
        const scaleY = sizes.height / 4 / stopButton.height;
        const scale = Math.min(scaleX, scaleY);
        stopButton.setScale(scale).play('snooze');
        stopButton.on('animationupdate', (animation, frame) => {
            stopButton.setDisplaySize(boxSize, boxSize);
        });
        
        let stopButtonClicked = false;

        stopButton.on('pointerdown', () => {
            if (!stopButtonClicked) {
                stopButtonClicked = true;
                this.stopAnimation();
                stopButton.setInteractive(false);
                stopButton.stop("snooze");
            }
        }, this);

        this.startAnimation();
    }

    resizeBackground() {
        const { width, height } = this.sys.game.scale.gameSize;
        const scaleX = sizes.width / this.bg.width;
        const scaleY = sizes.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setPosition(width / 2, height / 2);
    }

    startAnimation() {
        this.isAnimationRunning = true;
        this.highlightNextBox();
        //this.blingSound.play();
    }

    stopAnimation() {
        this.isAnimationRunning = false;
        this.textSubTitle.setVisible(false);
        this.rewardKey = this.getRandomReward();
        this.blingSound.stop();

        const currentBox = this.boxes[this.currentBoxIndex];
        const startX = currentBox.x;
        const startY = currentBox.y;

        this.time.delayedCall(100, () => {
            this.reward = this.add.image(startX, startY, this.rewardKey);
            const rewardOriginalWidth = this.reward.width;
            const rewardOriginalHeight = this.reward.height;
            const rewardScaleX = sizes.width / this.reward.width / 2;
            const rewardScaleY = sizes.height / this.reward.height / 4;
            const rewardScale = Math.min(rewardScaleX, rewardScaleY);
            this.reward.setAlpha(0);
            this.reward.setScale(0);

            let coverImage = this.textures.get('coverImage').getSourceImage();
            this.coverHelperCanvas = this.textures.createCanvas('coverTexture', coverImage.width, coverImage.height);
            this.coverHelperCanvas.draw(0, 0, coverImage);
            this.coverHelperCanvas.context.globalCompositeOperation = 'destination-out';

            this.cover = this.add.image(startX, startY, 'coverTexture');
            this.cover.setAlpha(0);

            const coverScaleX = sizes.width / this.cover.width / 1.5;
            const coverScaleY = sizes.height / this.cover.height / 2;
            const coverScale = Math.min(coverScaleX, coverScaleY);
            this.cover.setScale(0);

            this.tweens.add({
                targets: [this.reward, this.cover],
                x: sizes.width / 2,
                y: sizes.height / 2,
                alpha: 1,
                scale: 1,
                duration: 1000,
                ease: 'Power2',
                onUpdate: (tween) => {
                    const progress = tween.progress;
                    this.reward.setScale(progress * rewardScale);
                    this.cover.setScale(progress * coverScale);
                },
                onComplete: () => {
                    this.cover.setInteractive();

                    this.cover.on('pointerdown', this.startScratching, this);
                    this.input.on('pointermove', this.handlePointerMove, this);
                    this.input.on('pointerup', this.stopScratching, this);

                    this.checkTimer = this.time.addEvent({ delay: 250, loop: true, callback: this.checkPercent, callbackScope: this });

                    this.isScratching = false;
                }
            });
        }, [], this);
    }

    startScratching(pointer) {
        this.isScratching = true;
        this.clearCover(pointer.x, pointer.y);
    }

    handlePointerMove(pointer) {
        if (this.isScratching) {
            this.clearCover(pointer.x, pointer.y);
        }
    }

    stopScratching() {
        this.isScratching = false;
    }

    checkPercent() {
        let full = this.coverHelperCanvas.width * this.coverHelperCanvas.height;
        let imageData = this.coverHelperCanvas.context.getImageData(0, 0, this.coverHelperCanvas.width, this.coverHelperCanvas.height).data;
        let current = imageData.filter((value, index) => (index + 1) % 4 === 0 && value > 0).length;
        let percent = (current / full) * 100;

        if (percent < 40) {
            this.coverHelperCanvas.context.fillRect(0, 0, this.coverHelperCanvas.width, this.coverHelperCanvas.height);
            this.coverHelperCanvas.update();
            this.checkTimer.remove();
            game.scene.start('FireworksScene');
            this.time.delayedCall(5000, this.gameOver, [], this);
        }
    }

    clearCover(x, y) {
        const radius = 20;
        const scale = this.cover.scaleX; 
        let localX = (x - (sizes.width / 2 - (this.coverHelperCanvas.width * scale) / 2)) / scale;
        let localY = (y - (sizes.height / 2 - (this.coverHelperCanvas.height * scale) / 2)) / scale;

        let adjustedRadius = radius / scale;

        if (localX >= 0 && localX <= this.coverHelperCanvas.width && localY >= 0 && localY <= this.coverHelperCanvas.height) {
            this.coverHelperCanvas.context.beginPath();
            this.coverHelperCanvas.context.arc(localX, localY, adjustedRadius, 0, Math.PI * 2, false);
            this.coverHelperCanvas.context.fill();
            this.coverHelperCanvas.update();
        }
    }

    highlightNextBox() {
        if (!this.isAnimationRunning) return;
        const previousBox = this.boxes[this.currentBoxIndex];
        previousBox.setTexture('box');
        this.currentBoxIndex = (this.currentBoxIndex + 1) % this.boxes.length;
        const currentBox = this.boxes[this.currentBoxIndex];
        currentBox.setTexture('highlight');
        this.time.delayedCall(100, this.highlightNextBox, [], this);
    }

    getRandomReward() {
        const keys = Object.keys(rewards);
        const randomIndex = Math.floor(Math.random() * keys.length);
        return keys[randomIndex];
    };


    gameOver() {
        this.sys.game.destroy(true);
        let status = "Win";
        let userId = new URLSearchParams(window.location.search).get('userId');
        let points = null;
        let date = Date.now();
        let reward = this.rewardKey;
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
    scene: [GameScene, FireworksScene],
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
