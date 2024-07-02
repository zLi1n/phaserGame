import './style.css'
import './changeCanva.js';
import Phaser, { Loader } from "phaser";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const playerFrontFrame = {
    "playerF1": "/assets/front-walk-null.png",
    "playerF2": "/assets/front-walk-right.png",
    "playerF3": "/assets/front-walk-left.png"
}
const playerBackFrame = {
    "playerB1": "/assets/back-walk-null.png",
    "playerB2": "/assets/back-walk-right.png",
    "playerB3": "/assets/back-walk-left.png"
}
let backgroundUrl;
let borderUrl;
let heartUrl;
let ballUrl;
let buffUrl;
let debuffUrl;
async function fetchImages() {
    try {
        const response = await fetch('http://localhost:3001/img/dodgeball');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const imageConfig = await response.json();
        for (const key in imageConfig) {
            if (key.startsWith("playerF")) {
                playerFrontFrame[key] = imageConfig[key];
            } else if (key.startsWith("playerB")) {
                playerBackFrame[key] = imageConfig[key];
            }
        }
        backgroundUrl = imageConfig.background;
        borderUrl = imageConfig.border;
        heartUrl = imageConfig.heart;
        ballUrl = imageConfig.ball;
        buffUrl = imageConfig.buff;
        debuffUrl = imageConfig.debuff;

    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
        this.initialAlpha = null;
        this.initialBeta = null;
        this.initialGamma = null;
        this.initialized = false;
        this.playerHealth = 5;
        this.heartImages = [];
        this.isImmune = false;
        this.immunityDuration = 3000;
        this.immunityTimer = null;
        this.immunitySource = null;
        this.balls = [];
        this.maxBalls = 2;
        this.gameDuration = 20;
        this.quarterTime = this.gameDuration * 1000 / 4;
        this.originalSensitivity = 4;
        this.debuffSensitivity = 2;
        this.debuffDuration = 5000;
        this.isDebuffed = false;
        this.originalFrameRate = 8;
        this.debuffFrameRate = 4;
        this.maxDebuffs = 3;
        this.activeDebuffs = [];
        this.initialDebuffSpawnInterval = 5000;
    }

    preload() {
        for (const key in playerFrontFrame) {
            if (playerFrontFrame.hasOwnProperty(key)) {
                this.load.image(key, playerFrontFrame[key]);
            }
        }
        for (const key in playerBackFrame) {
            if (playerBackFrame.hasOwnProperty(key)) {
                this.load.image(key, playerBackFrame[key]);
            }
        }
        this.load.image("fence", borderUrl);
        this.load.image("bg", backgroundUrl);
        this.load.image("ball", ballUrl);
        this.load.image("buff", buffUrl);
        this.load.image("debuff", debuffUrl);
        this.load.image('heart', heartUrl);
        this.load.audio("bgMusic", "/assets/bgMusic.mp3");
        this.load.audio("hitSound", "/assets/hit-sound-effect.mp3");
        this.load.audio("buffSound", "/assets/power-up-sound.mp3");
        this.load.audio("debuffSound", "/assets/power-down-sound.mp3");
    }

    create() {
        this.scene.pause("GameScene");
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        this.resizeBackground();
        this.bgMusic = this.sound.add("bgMusic", {
            loop: true
        });
        this.hitMusic = this.sound.add("hitSound");
        this.buffMusic = this.sound.add("buffSound");
        this.debuffMusic = this.sound.add("debuffSound");
        this.bgMusic.play();
        const startDiv = document.createElement("div");
        startDiv.id = "startDiv";
        startDiv.style.width = "100%";
        startDiv.style.height = "100%";
        startDiv.style.backgroundColor = "rgba(52, 54, 61, 0.7)";
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
        startBtn.style.position = 'absolute';
        startBtn.style.top = '50%';
        startBtn.style.left = '50%';
        startBtn.style.transform = "translate(-50%, -50%)";

        startBtn.addEventListener("mouseenter", () => {
            if (startBtn.disabled) return;
            startBtn.style.backgroundColor = "#04AA6D";
            startBtn.style.color = "white";
        });

        startBtn.addEventListener("mouseleave", () => {
            if (startBtn.disabled) return;
            startBtn.style.backgroundColor = "white";
            startBtn.style.color = "black";
        })
        document.body.appendChild(startDiv);

        startDiv.appendChild(startBtn);

        startBtn.addEventListener('click', () => {
            this.requestPermission();
            startBtn.style.display = "none";
            startDiv.style.display = "none";

        });

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            this.requestPermission();
        }
        this.updateHealthDisplay();
        this.sensitivity = this.originalSensitivity;
        this.player = this.physics.add.sprite(this.sys.canvas.width / 2, this.sys.canvas.height / 2, 'playerF1').setOrigin(0.5, 0.5);
        const scaleX = sizes.width / 6 / this.player.width;
        const scaleY = sizes.height / 8 / this.player.height;
        const scale = Math.min(scaleX, scaleY);
        this.player.setScale(scale);
        
        this.fx = this.player.preFX.addColorMatrix();

        this.playerHealth = 5;

        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        this.createBorders();
        const fontSizeFactor = 0.06;
        const responsiveFontSize = Math.min(this.sys.canvas.width, this.sys.canvas.height) * fontSizeFactor;

        this.timerText = this.add.text(this.sys.canvas.width - 50, 50, `Time: ${this.gameDuration}`, {
            fontSize: `${responsiveFontSize}px`,
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 10000,
            callback: this.increaseBalls,
            callbackScope: this,
            loop: true
        });
        for (let i = 0; i < this.maxBalls; i++) {
            this.spawnBall();
        }
        this.gameStartTime = this.time.now;

        this.startGameTimers();
        this.physics.add.overlap(this.player, this.ball, this.onBallHitPlayer, null, this);
        this.anims.create({
            key: 'walkFront',
            frames: [
                { key: 'playerF1' },
                { key: 'playerF2' },
                { key: 'playerF1' },
                { key: 'playerF3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'walkBack',
            frames: [
                { key: 'playerB1' },
                { key: 'playerB2' },
                { key: 'playerB1' },
                { key: 'playerB3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'walkFrontDebuffed',
            frames: [
                { key: 'playerF1' },
                { key: 'playerF2' },
                { key: 'playerF1' },
                { key: 'playerF3' }
            ],
            frameRate: this.debuffFrameRate,
            repeat: -1
        });

        this.anims.create({
            key: 'walkBackDebuffed',
            frames: [
                { key: 'playerB1' },
                { key: 'playerB2' },
                { key: 'playerB1' },
                { key: 'playerB3' }
            ],
            frameRate: this.debuffFrameRate,
            repeat: -1
        });

    }
    resizeBackground() {
        const { width, height } = this.sys.game.scale.gameSize;
        const scaleX = sizes.width / this.bg.width;
        const scaleY = sizes.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setPosition(width / 2, height / 2);
    }

    requestPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then((state) => {
                    console.log('Permission request state:', state);
                    if (state === 'granted') {
                        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                        this.scene.resume("GameScene");
                    }
                });
        } else {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            this.scene.resume("GameScene");
        }
    }

    handleOrientation(event) {
        const alpha = event.alpha;
        const beta = event.beta;
        const gamma = event.gamma;

        const border = 50;
        const dampingFactor = 0.1;
        const orientationThreshold = 0.15;
        const stationaryTime = 1000;

        if (!this.initialized) {
            this.initialAlpha = alpha;
            this.initialBeta = beta;
            this.initialGamma = gamma;
            this.lastBeta = beta;
            this.lastGamma = gamma;
            this.lastMoveTime = this.time.now;
            this.initialized = true;
        }

        const betaChange = Math.abs(beta - this.lastBeta);
        const gammaChange = Math.abs(gamma - this.lastGamma);
        const isOrientationChanged = betaChange > orientationThreshold || gammaChange > orientationThreshold;

        let targetLeftPosition = this.sys.canvas.width / 2 + (gamma - this.initialGamma) * this.sensitivity;
        let targetTopPosition = this.sys.canvas.height / 2 + (beta - this.initialBeta) * this.sensitivity * 2;

        const scaledWidth = this.player.width * this.player.scaleX;
        const scaledHeight = this.player.height * this.player.scaleY;

        const effectiveArea = {
            minX: border,
            maxX: this.sys.canvas.width - border,
            minY: border,
            maxY: this.sys.canvas.height - border
        };

        targetLeftPosition = Phaser.Math.Clamp(
            targetLeftPosition,
            effectiveArea.minX + scaledWidth / 2,
            effectiveArea.maxX - scaledWidth / 2
        );
        targetTopPosition = Phaser.Math.Clamp(
            targetTopPosition,
            effectiveArea.minY + scaledHeight / 2,
            effectiveArea.maxY - scaledHeight / 2
        );

        let currentLeftPosition = this.player.x;
        let currentTopPosition = this.player.y;

        let newLeftPosition = currentLeftPosition + (targetLeftPosition - currentLeftPosition) * dampingFactor;
        let newTopPosition = currentTopPosition + (targetTopPosition - currentTopPosition) * dampingFactor;

        this.player.setPosition(newLeftPosition, newTopPosition);

        const currentTime = this.time.now;

        if (isOrientationChanged) {
            const deltaY = newTopPosition - currentTopPosition;
            if (deltaY < 0) {
                this.player.anims.play(this.isDebuffed ? 'walkBackDebuffed' : 'walkBack', true);
            } else if (deltaY > 0) {
                this.player.anims.play(this.isDebuffed ? 'walkFrontDebuffed' : 'walkFront', true);
            }
            this.lastMoveTime = currentTime;
        } else if (currentTime - this.lastMoveTime > stationaryTime) {
            this.player.anims.stop().setFrame(0);
        }

        this.lastBeta = beta;
        this.lastGamma = gamma;
    }

    createBorders() {
        const borderWidth = 50;
        const fenceTexture = this.textures.get('fence');
        const fenceImage = fenceTexture.getSourceImage();
        const scaleFactor = borderWidth / fenceImage.height;

        this.topBorder = this.add.tileSprite(
            this.scale.width / 2,
            borderWidth / 2,
            this.scale.width,
            borderWidth,
            "fence"
        ).setOrigin(0.5, 0.5);
        this.topBorder.setTileScale(scaleFactor, scaleFactor);
        this.physics.add.existing(this.topBorder, true);
        this.topBorder.body.setSize(this.scale.width, borderWidth);

        this.bottomBorder = this.add.tileSprite(
            this.scale.width / 2,
            this.scale.height - borderWidth / 2,
            this.scale.width,
            borderWidth,
            "fence"
        ).setOrigin(0.5, 0.5);
        this.bottomBorder.setTileScale(scaleFactor, scaleFactor);
        this.physics.add.existing(this.bottomBorder, true);
        this.bottomBorder.body.setSize(this.scale.width, borderWidth);

        this.leftBorder = this.add.tileSprite(
            borderWidth / 2,
            this.scale.height / 2,
            this.scale.height,
            borderWidth,
            "fence"
        ).setOrigin(0.5, 0.5);
        this.leftBorder.setTileScale(scaleFactor, scaleFactor);
        this.leftBorder.setRotation(-Math.PI / 2);
        this.physics.add.existing(this.leftBorder, true);
        this.leftBorder.body.setSize(borderWidth, this.scale.height);

        this.rightBorder = this.add.tileSprite(
            this.scale.width - borderWidth / 2,
            this.scale.height / 2,
            this.scale.height,
            borderWidth,
            "fence"
        ).setOrigin(0.5, 0.5);
        this.rightBorder.setTileScale(scaleFactor, scaleFactor);
        this.rightBorder.setRotation(Math.PI / 2);
        this.physics.add.existing(this.rightBorder, true);
        this.rightBorder.body.setSize(borderWidth, this.scale.height);
    }
    updateTimer() {
        if (this.gameDuration > 0) {
            this.gameDuration--;
            this.timerText.setText(`Time: ${this.gameDuration}`);
        } else {
            this.gameOver();
        }
    }

    increaseBalls() {
        this.maxBalls++;
        this.spawnBall();
    }
    startGameTimers() {
        this.time.delayedCall(this.quarterTime, () => {
            this.spawnDebuff();
            this.spawnBuff();
        }, null, this);

        this.startDebuffSpawning();
    }

    startDebuffSpawning() {
        const elapsedTime = this.time.now - this.gameStartTime;
        const remainingTime = this.gameDuration - elapsedTime;
        const spawnInterval = this.calculateDebuffSpawnInterval(remainingTime);

        if (remainingTime > 0) {
            this.time.delayedCall(spawnInterval, () => {
                this.spawnDebuff();
                this.startDebuffSpawning();
            }, null, this);
        }
    }

    calculateDebuffSpawnInterval(remainingTime) {
        const minInterval = 1000;
        const maxInterval = 5000;
        const interval = (remainingTime / this.gameDuration) * (maxInterval - minInterval) + minInterval;
        return interval;
    }

    spawnBall() {
        const positions = [
            { x: -50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: this.scale.width + 50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: Phaser.Math.Between(0, this.scale.width), y: -50 },
            { x: Phaser.Math.Between(0, this.scale.width), y: this.scale.height + 50 }
        ];
        const position = Phaser.Utils.Array.GetRandom(positions);

        if (!this.player) {
            console.error('Player object is null or undefined. Cannot spawn ball.');
            return;
        }

        const ball = this.physics.add.sprite(position.x, position.y, 'ball').setOrigin(0.5, 0.5);
        const scaleX = this.sys.canvas.width / 12 / ball.width;
        const scaleY = this.sys.canvas.height / 16 / ball.height;
        const scale = Math.min(scaleX, scaleY);
        ball.setScale(scale);

        ball.setBounce(1);
        ball.setCollideWorldBounds(true);

        ball.bounceCount = 0;

        if (this.player.active) {
            const speedFactor = this.getSpeedFactor();
            const randomSpeed = Phaser.Math.Between(100 * speedFactor, 300 * speedFactor);
            this.physics.moveToObject(ball, this.player, randomSpeed);

            this.physics.add.overlap(this.player, ball, this.onBallHitPlayer, null, this);
        } else {
            console.error('Player is not active or does not exist. Cannot move ball towards player.');
        }

        this.physics.add.collider(ball, this.topBorder, this.onBallBounce, null, this);
        this.physics.add.collider(ball, this.bottomBorder, this.onBallBounce, null, this);
        this.physics.add.collider(ball, this.leftBorder, this.onBallBounce, null, this);
        this.physics.add.collider(ball, this.rightBorder, this.onBallBounce, null, this);

        this.balls.push(ball);
    }

    getSpeedFactor() {
        const maxDuration = 30;
        const remainingTime = this.gameDuration;
        return 1 + (maxDuration - remainingTime) / maxDuration;
    }


    spawnBuff() {
        const positions = [
            { x: -50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: this.scale.width + 50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: Phaser.Math.Between(0, this.scale.width), y: -50 },
            { x: Phaser.Math.Between(0, this.scale.width), y: this.scale.height + 50 }
        ];
        const position = Phaser.Utils.Array.GetRandom(positions);
        const targetPosition = { x: Phaser.Math.Between(50, this.scale.width - 50), y: Phaser.Math.Between(50, this.scale.height - 50) };
        const buff = this.physics.add.sprite(position.x, position.y, 'buff').setOrigin(0.5, 0.5);
        const scaleX = this.sys.canvas.width / 12 / buff.width;
        const scaleY = this.sys.canvas.height / 16 / buff.height;
        const scale = Math.min(scaleX, scaleY);
        buff.setScale(scale);
        this.physics.moveTo(buff, targetPosition.x, targetPosition.y, 200);
        const buffLifecycleTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (buff.active) {
                    buff.destroy();
                }
                const randomDelay = Phaser.Math.Between(1000, 3000);
                this.time.delayedCall(randomDelay, () => this.spawnBuff(), null, this);
            },
            callbackScope: this
        });
        this.physics.add.overlap(this.player, buff, (player, buff) => {
            if (buff.active) {
                buff.destroy();
                this.activateImmunity('buff');
            }
            buffLifecycleTimer.remove();
            const randomDelay = Phaser.Math.Between(3000, 8000);
            this.time.delayedCall(randomDelay, () => this.spawnBuff(), null, this);
        }, null, this);
    }
    onPlayerCollectBuff(player, buff) {
        if (buff.active) {
            buff.destroy();           
            this.activateImmunity();
        }
    }
    spawnDebuff() {
        if (!this.player) {
            console.error('Player object is null or undefined. Cannot spawn debuff.');
            return;
        }

        if (this.activeDebuffs.length >= this.maxDebuffs) {
            return;
        }

        const positions = [
            { x: -50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: this.scale.width + 50, y: Phaser.Math.Between(0, this.scale.height) },
            { x: Phaser.Math.Between(0, this.scale.width), y: -50 },
            { x: Phaser.Math.Between(0, this.scale.width), y: this.scale.height + 50 }
        ];
        const position = Phaser.Utils.Array.GetRandom(positions);

        const debuff = this.physics.add.sprite(position.x, position.y, 'debuff').setOrigin(0.5, 0.5);
        const scaleX = this.sys.canvas.width / 12 / debuff.width;
        const scaleY = this.sys.canvas.height / 16 / debuff.height;
        const scale = Math.min(scaleX, scaleY);
        debuff.setScale(scale);

        debuff.setBounce(1);
        debuff.setCollideWorldBounds(true);
        debuff.bounceCount = 0;

        this.activeDebuffs.push(debuff);

        this.physics.add.collider(debuff, this.topBorder, this.onDebuffBounce, null, this);
        this.physics.add.collider(debuff, this.bottomBorder, this.onDebuffBounce, null, this);
        this.physics.add.collider(debuff, this.leftBorder, this.onDebuffBounce, null, this);
        this.physics.add.collider(debuff, this.rightBorder, this.onDebuffBounce, null, this);

        this.physics.add.overlap(this.player, debuff, this.onPlayerHitDebuff, null, this);
    }

    onDebuffBounce(debuff) {
        debuff.bounceCount++;
        if (debuff.bounceCount >= 2) {
            const speedFactor = this.getSpeedFactor();
            const randomSpeed = Phaser.Math.Between(200 * speedFactor, 500 * speedFactor);
            this.physics.moveToObject(debuff, this.player, randomSpeed);

            const stopDelay = Phaser.Math.Between(2000, 3000);
            this.time.delayedCall(stopDelay, () => {
                if (debuff.active) {
                    debuff.setVelocity(0, 0);
                    const stayDuration = 2000;
                    this.time.delayedCall(stayDuration, () => {
                        if (debuff.active) {
                            debuff.destroy();
                            this.activeDebuffs = this.activeDebuffs.filter(d => d !== debuff);
                            const randomDelay = Phaser.Math.Between(3000, 8000);
                            this.time.delayedCall(randomDelay, () => this.spawnDebuff(), null, this);
                        }
                    }, null, this);
                }
            }, null, this);
        }
    }

    onPlayerHitDebuff(player, debuff) {
        if (!this.isDebuffed) {
            this.applyDebuff();
            this.debuffMusic.play();
        }
        debuff.destroy();
        this.activeDebuffs = this.activeDebuffs.filter(d => d !== debuff);
        const randomDelay = Phaser.Math.Between(3000, 8000);
        this.time.delayedCall(randomDelay, () => this.spawnDebuff(), null, this);
    }

    applyDebuff() {
        this.isDebuffed = true;
        this.sensitivity = this.debuffSensitivity;

        this.player.anims.play('walkFrontDebuffed', true);
        this.player.anims.play('walkBackDebuffed', true);

        this.time.delayedCall(this.debuffDuration, () => {
            this.isDebuffed = false;
            this.sensitivity = this.originalSensitivity;

            this.player.anims.play('walkFront', true);
            this.player.anims.play('walkBack', true);
        });
    }
    onBallBounce(ball) {
        ball.bounceCount += 1;
        const bouce = Phaser.Math.Between(1, 4);
        if (ball.bounceCount >= bouce) {
            this.stopBall(ball);
        }
    }

    stopBall(ball) {
        const delay = Phaser.Math.Between(1000, 3000);
        this.time.delayedCall(delay, () => {
            if (ball.active) {
                ball.setVelocity(0, 0);
                this.time.delayedCall(3000, () => {
                    if (ball.active) {
                        ball.destroy();
                        this.balls = this.balls.filter(b => b !== ball);
                        this.spawnBall();
                    }
                }, null, this);
            }
        }, null, this);
    }

    activateImmunity(source) {
        if (this.isImmune && this.immunitySource === 'buff' && source !== 'buff') return;
        this.isImmune = true;
        this.immunitySource = source;

        if (source === 'buff') {
            this.immunityTween = this.tweens.addCounter({
                from: 0,
                to: 360,
                duration: 3000,
                loop: -1,
                onUpdate: () => {
                    this.fx.hue(this.immunityTween.getValue());
                }
            });
            this.buffMusic.play();
            this.immunityTimer = this.time.delayedCall(this.immunityDuration, () => {
                this.isImmune = false;
                this.immunityTween.stop();
                this.immunityTween = null;
                this.immunitySource = null;
            });
        } else if (source === 'hit') {
            this.flashPlayer();
            this.immunityTimer = this.time.delayedCall(this.immunityDuration, () => {
                this.isImmune = false;
                this.immunitySource = null;
            });
        }
    }

    flashPlayer() {
        const flashDuration = 3000;
        const flashCount = 10;
        const toggleVisibility = (visible) => {
            return this.tweens.add({
                targets: this.player,
                alpha: visible ? 1 : 0,
                duration: flashDuration / (flashCount * 2),
                ease: 'Linear',
                yoyo: true,
                repeat: flashCount - 1,
                onComplete: () => {
                    this.player.alpha = 1;
                }
            });
        };

        toggleVisibility(false);
    }

    onBallHitPlayer(player, ball) {
        if (!this.isImmune) {
            this.playerHealth -= 1;
            this.updateHealthDisplay();
            this.hitMusic.play();
            this.activateImmunity('hit');

            if (this.playerHealth <= 0) {
                this.gameOver();
            } else {
                ball.destroy();
                this.spawnBall();
            }
        } else {
            ball.destroy();
            this.spawnBall();
        }
    }
    updateHealthDisplay() {
        this.heartImages.forEach(image => image.destroy());
        this.heartImages = [];

        const numHearts = this.playerHealth;
        const spacingFactor = 0.01;
        const canvasWidth = this.sys.canvas.width;
        const startX = 50;
        const startY = 50;

        let width = 0;

        const tempHeart = this.add.image(0, 0, 'heart');
        const scaleX = canvasWidth / 14 / tempHeart.width;
        const scaleY = this.sys.canvas.height / 18 / tempHeart.height;
        const scale = Math.min(scaleX, scaleY);
        tempHeart.setScale(scale);
        width = tempHeart.displayWidth;
        tempHeart.destroy();

        const spacing = spacingFactor * canvasWidth;

        for (let i = 0; i < numHearts; i++) {
            const heart = this.add.image(startX + i * (width + spacing), startY, 'heart');
            const scaleX = canvasWidth / 14 / heart.width;
            const scaleY = this.sys.canvas.height / 18 / heart.height;
            const scale = Math.min(scaleX, scaleY);
            heart.setScale(scale);
            heart.setOrigin(0, 0);

            this.heartImages.push(heart);
        }
    }

    gameOver() {
        this.sys.game.destroy(true);
        let status = "Win";
        let userId = new URLSearchParams(window.location.search).get('userId');
        let points = this.playerHealth;
        let date = Date.now();
        let reward = "basic-reward";
        if (this.playerHealth >= 4) {
            reward = "win-reward";
        } else if (this.playerHealth >= 3) {
            reward = "win-reward2";
        } else if (this.playerHealth >= 1) {
            reward = "basic-reward3";
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
let game;
fetchImages().then(() => {
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
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    callbacks: {
        postBoot: function (game) {
            window.addEventListener('resize', () => resize(game));
            resize(game);
        }
    }
};

game = new Phaser.Game(config);
});
function resize(game) {
    game.scale.resize(sizes.width, sizes.height);
}
