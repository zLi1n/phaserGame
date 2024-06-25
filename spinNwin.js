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
    //"reward1": "/assets/basket.png",
    "APPLE": "/assets/apple.png",
    //"reward2": "http://localhost:3000/merchant/m_anakmu/applogo.png",
    "ORANGE": "/assets/orange.png",
    "BERRY": "/assets/basket.png",
    "MANGO": "/assets/mango.png",
    "MANGO #": "/assets/mango.png",
    "reward4": "/assets/basket.png"
}

const rewardColors = {
    "APPLE": [0xff0000, 0x8a2be2],
    "ORANGE": 0xffa500, 
    "BERRY": 0x8a2be2, 
    "MANGO": 0xffd700, 
    "MANGO #": 0xffd700, 
    "reward4": 0x0000ff
};

const rewardKeys = Object.keys(rewards);
const numberOfSlices = rewardKeys.length;
const sliceDegree = 360 / numberOfSlices;

let gameOptions = {
    slices: rewardKeys.map((reward, index) => {
        const defaultColor = Phaser.Display.Color.HSVColorWheel()[index * (360 / numberOfSlices)].color;
        let startColor, endColor;

        if (Array.isArray(rewardColors[reward])) {
            [startColor, endColor] = rewardColors[reward];
        } else {
            startColor = rewardColors[reward] || defaultColor;
            endColor = startColor; 
        }

        return {
            degrees: sliceDegree,
            startColor: startColor,
            endColor: endColor,
            rings: 100,
            text: reward,
            iconFrame: index,
            enabled: true
        };
    }),
    rotationTimeRange: {
        min: 3000,
        max: 4500
    },
    wheelRounds: {
        min: 2,
        max: 11
    },
    backSpin: {
        min: 1,
        max: 4
    },
    wheelRadius: 160,

    strokeColor: 0xffffff,
    strokeWidth: 5
}
gameOptions.slices[2].enabled = false;
class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.bgMusic;
        this.wheelContainer;
        this.pin;
        this.prize;
        this.prizeText;
        this.canSpin;
        this.allowedDegrees = [];
    }

    preload() {
        this.load.image("bg", bgImg);
        this.load.image("pin", "/assets/pin.png");
        this.load.image("starburst", "/assets/yellow-starburst.png");
        this.load.image("wheelOutline", "/assets/wheel.png");
        for (const key in rewards) {
            if (rewards.hasOwnProperty(key)) {
                this.load.image(key, rewards[key]);
            }
        }
        this.load.audio("bgMusic", "/assets/bgMusic.mp3");
        this.load.audio("spinSound", "/assets/Spinning-Loop.mp3");
    }

    create() {
        const { width, height } = this.sys.game.scale.gameSize;
        gameOptions.wheelRadius = Math.min(width, height) / 3;
        const iconSize = Math.min(width, height) / 10;
        
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        this.resizeBackground();
        this.bgMusic = this.sound.add("bgMusic", {
            loop: true
        });
        this.spinSound = this.sound.add("spinSound", {
            loop: true
        });
        //this.bgMusic.play();

        let startDegrees = -90;
        let graphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });
        this.allowedDegrees = [];
        this.wheelContainer = this.add.container(game.config.width / 2, game.config.height / 2);

        let iconArray = [];
        const rewardKeys = Object.keys(rewards);
        let currentRewardIndex = 0;

        for (let i = 0; i < gameOptions.slices.length; i++) {
            if (gameOptions.slices[i].enabled) {
                for (let j = 0; j < gameOptions.slices[i].degrees; j++) {
                    this.allowedDegrees.push(270 - startDegrees - j);
                }
            }

            let startColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].startColor);
            let endColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].endColor)

            for (let j = gameOptions.slices[i].rings; j > 0; j--) {
                let ringColor = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, gameOptions.slices[i].rings, j);
                let ringColorString = Phaser.Display.Color.RGBToString(Math.round(ringColor.r), Math.round(ringColor.g), Math.round(ringColor.b), 0, "0x");
                graphics.fillStyle(ringColorString, 1);
                graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, j * gameOptions.wheelRadius / gameOptions.slices[i].rings, Phaser.Math.DegToRad(startDegrees), Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees), false);
                graphics.fillPath();
            }

            graphics.lineStyle(gameOptions.strokeWidth, gameOptions.strokeColor, 1);

            graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius, Phaser.Math.DegToRad(startDegrees), Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees), false);

            graphics.strokePath();

            if (gameOptions.slices[i].iconFrame != undefined) {
                const rewardKey = gameOptions.slices[i].text;
                let icon = this.add.image(
                    gameOptions.wheelRadius * 0.75 * Math.cos(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)),
                    gameOptions.wheelRadius * 0.75 * Math.sin(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)),
                    rewardKey
                );
                const originalWidth = icon.width;
                const originalHeight = icon.height;
                const scaleX = iconSize / originalWidth;
                const scaleY = iconSize / originalHeight;
                const scale = Math.min(scaleX, scaleY);
                icon.setScale(scale);
                icon.angle = startDegrees + gameOptions.slices[i].degrees / 2 + 90;

                iconArray.push(icon);
                currentRewardIndex = (currentRewardIndex + 1) % rewardKeys.length;
            }

            if (gameOptions.slices[i].sliceText != undefined) {
                let text = this.add.text(gameOptions.wheelRadius * 0.75 * Math.cos(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)), gameOptions.wheelRadius * 0.75 * Math.sin(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)), gameOptions.slices[i].sliceText, gameOptions.slices[i].sliceTextStyle);

                text.setOrigin(0.5);

                text.angle = startDegrees + gameOptions.slices[i].degrees / 2 + 90;

                if (gameOptions.slices[i].sliceTextStroke && gameOptions.slices[i].sliceTextStrokeColor) {
                    text.setStroke(gameOptions.slices[i].sliceTextStrokeColor, gameOptions.slices[i].sliceTextStroke);
                }

                iconArray.push(text);
            }

            startDegrees += gameOptions.slices[i].degrees;

        }

        graphics.generateTexture("wheel", (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2, (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2);

        let wheel = this.add.sprite(0, 0, "wheel");
        this.wheelContainer.add(wheel);
        this.wheelContainer.add(iconArray);
        const wheelDiameter = (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2.2;

this.pin = this.add.sprite(game.config.width / 2, game.config.height / 2, "pin");
this.pin.setScale(Math.min(this.sys.game.scale.gameSize.width, this.sys.game.scale.gameSize.height) / (5 * 200));

this.wheelOutline = this.add.sprite(game.config.width / 2, game.config.height / 2, "wheelOutline");
this.wheelOutline.setDisplaySize(wheelDiameter, wheelDiameter);
this.wheelOutline.setPosition(game.config.width / 2, game.config.height / 2);

        const fontSize = Math.min(this.sys.game.scale.gameSize.width, this.sys.game.scale.gameSize.height) * 0.07; 

        this.prizeText = this.add.text(
            this.sys.game.scale.gameSize.width / 2,
            gameOptions.wheelRadius + 100,
            "Tap Anywhere to Spin the Wheel",
            {
                font: `bold ${fontSize}px Arial`, 
                align: "center",
                color: "white",
                lineSpacing: 10,
                wordWrap: {
                    width: this.sys.game.scale.gameSize.width - this.sys.game.scale.gameSize.width / 10,
                    useAdvancedWrap: true
                }
            }
        );
        this.prizeText.setOrigin(0.5);
        this.prizeText.setPosition(width / 2, height / 2 + gameOptions.wheelRadius + 70);
        const textAlphaTween = this.tweens.add({
            targets: this.prizeText,
            alpha: {
                from: 1.0,
                to: 0.5,
                duration: 500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
            }
        });

        this.canSpin = true;

        this.input.on("pointerdown", () => {
            this.spinWheel();
            textAlphaTween.stop();
        }, this);
    }

    spinWheel() {
        if (this.canSpin) {
            this.spinSound.play();
            this.prizeText.setText("");
            this.prizeText.setAlpha(1);
            let rounds = Phaser.Math.Between(gameOptions.wheelRounds.min, gameOptions.wheelRounds.max);
            let degrees = Phaser.Utils.Array.GetRandom(this.allowedDegrees);
            let backDegrees = Phaser.Math.Between(gameOptions.backSpin.min, gameOptions.backSpin.max);
            let prizeDegree = 0;
            for (let i = gameOptions.slices.length - 1; i >= 0; i--) {
                prizeDegree += gameOptions.slices[i].degrees;
                if (prizeDegree > degrees - backDegrees) {
                    this.prize = i;
                    break;
                }
            }

            this.canSpin = false;
            this.tweens.add({
                targets: [this.wheelContainer],
                angle: 360 * rounds + degrees,
                duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max),
                ease: "Cubic.easeOut",
                callbackScope: this,
                onUpdate: (tween) => {
                    const progress = tween.progress;
                    const newVolume = 1 - progress; 
                    this.spinSound.setVolume(newVolume);
                },
                onComplete: function (tween) {
                    this.tweens.add({
                        targets: [this.wheelContainer],
                        angle: this.wheelContainer.angle - backDegrees,
                        duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max) / 2,
                        ease: "Cubic.easeIn",
                        callbackScope: this,
                        onComplete: function (tween) {
                            this.spinSound.stop();
                            const { width, height } = this.sys.game.scale.gameSize;
                            const iconSize = Math.min(width, height) / 5;
                            let graphics = this.add.graphics();
                            graphics.fillStyle(0x000000, 0.5);
                            graphics.fillEllipse(
                                this.sys.game.config.width / 2,
                                this.sys.game.config.height / 2,
                                gameOptions.wheelRadius * 2,
                                gameOptions.wheelRadius * 2
                            );

                            let starburstImage = this.add.image(
                                this.sys.game.config.width / 2,
                                this.sys.game.config.height / 2,
                                'starburst'
                            );
                            starburstImage.setDisplaySize(iconSize + 100, iconSize + 100);
                            let prizeImage = this.add.image(
                                this.sys.game.config.width / 2,
                                this.sys.game.config.height / 2,
                                gameOptions.slices[this.prize].text
                            );
                            prizeImage.setDisplaySize(iconSize, iconSize);
                            game.scene.start('FireworksScene');
                            this.timedEvent = this.time.delayedCall(5000, this.gameOver, [], this);
                        }
                    })
                }
            });
        }
    }
    resizeBackground() {
        const { width, height } = this.sys.game.scale.gameSize;
        const scaleX = sizes.width / this.bg.width;
        const scaleY = sizes.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setPosition(width / 2, height / 2);
    }

    update() {

    }

    gameOver() {
        this.sys.game.destroy(true);
        let status = "Win";
        let userId = new URLSearchParams(window.location.search).get('userId');
        let points = null;
        let date = Date.now();
        let reward = gameOptions.slices[this.prize].text;
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



