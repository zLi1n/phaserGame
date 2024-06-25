import './style.css'
import './changeCanva.js';
import Phaser, { Loader } from "phaser";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const playerImgs = {
    "playerF1": "/assets/front-walk-null.png",
    "playerF2": "/assets/front-walk-right.png",
    "playerF3": "/assets/front-walk-left.png",
    "playerB1": "/assets/back-walk-null.png",
    "playerB2": "/assets/back-walk-right.png",
    "playerB3": "/assets/back-walk-left.png"
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
        this.gameDuration = 30; 
    }

    preload() {//351 x 456
        for (const key in playerImgs) {
            if (playerImgs.hasOwnProperty(key)) {
                this.load.image(key, playerImgs[key]);
            }
        }
        this.load.image("apple", "/assets/apple.png");
        this.load.image("fence", "/assets/fence.png");
        this.load.image("bg", "/assets/floor.png");
        this.load.image("ball", "/assets/ball.png");
        this.load.image("buff", "/assets/buffBall.png");
        this.load.image('heart', '/assets/heart.png');
    }

    create() {
        this.scene.pause("GameScene");
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        this.resizeBackground();
        // this.permissionText = this.add.text(20, 60, 'Requesting Permission...', { fontSize: '20px', fill: '#ffffff' });

        const button = document.createElement('button');
        button.textContent = 'Request Permission';
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.left = '50%';
        button.style.transform = "translate(-50%, -50%)";
        document.body.appendChild(button);

        // Add event listener to the button
        button.addEventListener('click', () => {
            this.requestPermission();
            button.style.display = "none";
        });

        // Request permission if supported
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            this.requestPermission();
        } else {
            // this.permissionText.setText('Device Motion Events Not Supported');
        }
        this.updateHealthDisplay();
        this.player = this.physics.add.sprite(this.sys.canvas.width / 2, this.sys.canvas.height / 2, 'playerF1').setOrigin(0.5, 0.5);
        const scaleX = sizes.width / 6 / this.player.width;
        const scaleY = sizes.height / 8 / this.player.height;
        const scale = Math.min(scaleX, scaleY);
        this.player.setScale(scale);
        /*const polygon = this.createPolygonFromImage('playerF1');
        this.player.setInteractive(new Phaser.Geom.Polygon(polygon.points), Phaser.Geom.Polygon.Contains);*/
        this.fx = this.player.preFX.addColorMatrix();
        
        this.playerHealth = 5;

        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        this.createBorders();
        const fontSizeFactor = 0.06; // Adjust this factor based on your preference
        const responsiveFontSize = Math.min(this.sys.canvas.width, this.sys.canvas.height) * fontSizeFactor;

        this.timerText = this.add.text(this.sys.canvas.width - 50, 50, `Time: ${this.gameDuration}`, { 
            fontSize: `${responsiveFontSize}px`, 
            fill: '#fff' ,
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

        // Initialize balls
        for (let i = 0; i < this.maxBalls; i++) {
            this.spawnBall();
        }
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
        this.spawnBuff();
        // Draw the polygon outline for visualization
        /* const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xffff00 } }).setScale(0.5);
         graphics.strokePoints(polygon.points, true);
         graphics.x = sprite.x;
         graphics.y = sprite.y;*/
    }
    resizeBackground() {
        const { width, height } = this.sys.game.scale.gameSize;
        const scaleX = sizes.width / this.bg.width;
        const scaleY = sizes.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setPosition(width / 2, height / 2);
    }

    createPolygonFromImage(imageName) {
        const texture = this.textures.get(imageName).getSourceImage();
        const width = texture.width;
        const height = texture.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(texture, 0, 0);
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        const points = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                if (data[index + 3] > 0) {
                    if (x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
                        data[((y - 1) * width + x) * 4 + 3] === 0 ||
                        data[((y + 1) * width + x) * 4 + 3] === 0 ||
                        data[(y * width + (x - 1)) * 4 + 3] === 0 ||
                        data[(y * width + (x + 1)) * 4 + 3] === 0) {
                        points.push({ x: x, y: y });
                    }
                }
            }
        }
        const centerX = width / 2;
        const centerY = height / 2;
        points.sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });
        return new Phaser.Geom.Polygon(points);
    }

    addHoverEffect(sprite) {
        sprite.setTint(0xff0000); //red
    }

    removeHoverEffect(sprite) {
        sprite.clearTint();
    }

    requestPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then((state) => {
                    console.log('Permission request state:', state);
                    if (state === 'granted') {
                        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                        //this.permissionText.setText('Permission Granted');
                        this.scene.resume("GameScene");
                    } else {
                        //this.permissionText.setText('Request Rejected');
                    }
                })
                .catch((error) => {
                    //this.permissionText.setText('Error: ' + error);
                });
        } else {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            //this.permissionText.setText('Permission Granted');
            this.scene.resume("GameScene");
        }
    }

    handleOrientation(event) {
        const alpha = event.alpha;
        const beta = event.beta;
        const gamma = event.gamma;

        const sensitivity = 4;
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

        let targetLeftPosition = this.sys.canvas.width / 2 + (gamma - this.initialGamma) * sensitivity;
        let targetTopPosition = this.sys.canvas.height / 2 + (beta - this.initialBeta) * sensitivity * 2;

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
                this.player.anims.play('walkBack', true);
            } else if (deltaY > 0) {
                this.player.anims.play('walkFront', true);
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

        // Add top border
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

        // Add bottom border
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

        // Add left border
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

        // Add right border
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
            // End game or restart when timer reaches 0
            this.scene.restart();
        }
    }

    increaseBalls() {
        this.maxBalls++;
        this.spawnBall();
    }
    spawnBall() {
        const positions = [
            { x: -50, y: Phaser.Math.Between(0, this.scale.height) },  // left
            { x: this.scale.width + 50, y: Phaser.Math.Between(0, this.scale.height) },  // right
            { x: Phaser.Math.Between(0, this.scale.width), y: -50 },  // top
            { x: Phaser.Math.Between(0, this.scale.width), y: this.scale.height + 50 }  // bottom
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
            const randomSpeed = Phaser.Math.Between(100, 300); // Set random speed between 100 and 300
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
    
    spawnBuff() {
        const positions = [
            { x: -50, y: Phaser.Math.Between(0, this.scale.height) },  // left
            { x: this.scale.width + 50, y: Phaser.Math.Between(0, this.scale.height) },  // right
            { x: Phaser.Math.Between(0, this.scale.width), y: -50 },  // top
            { x: Phaser.Math.Between(0, this.scale.width), y: this.scale.height + 50 }  // bottom
        ];
        const position = Phaser.Utils.Array.GetRandom(positions);
        const targetPosition = { x: Phaser.Math.Between(50, this.scale.width - 50), y: Phaser.Math.Between(50, this.scale.height - 50) };
    
        const buff = this.physics.add.sprite(position.x, position.y, 'buff').setOrigin(0.5, 0.5);
        const scaleX = this.sys.canvas.width / 12 / buff.width;
        const scaleY = this.sys.canvas.height / 16 / buff.height;
        const scale = Math.min(scaleX, scaleY);
        buff.setScale(scale); // Adjust the scale as needed
    
        // Move the buff to a random position inside the screen
        this.physics.moveTo(buff, targetPosition.x, targetPosition.y, 200);
    
        // Timer to manage buff lifecycle
        const buffLifecycleTimer = this.time.addEvent({
            delay: 3000, // 3 seconds
            callback: () => {
                if (buff.active) {
                    buff.destroy();
                }
                const randomDelay = Phaser.Math.Between(1000, 3000); // Random delay before spawning another buff
                this.time.delayedCall(randomDelay, () => this.spawnBuff(), null, this);
            },
            callbackScope: this
        });
    
        // Collision detection with player
        this.physics.add.overlap(this.player, buff, (player, buff) => {
            if (buff.active) {
                buff.destroy(); // Destroy the buff only if it is still active
                this.activateImmunity('buff');
            }
            buffLifecycleTimer.remove(); // Remove the lifecycle timer as the buff is collected
            const randomDelay = Phaser.Math.Between(1000, 3000); // Random delay before spawning another buff
            this.time.delayedCall(randomDelay, () => this.spawnBuff(), null, this);
        }, null, this);
    }
    onPlayerCollectBuff(player, buff) {
        if (buff.active) {
            buff.destroy(); // Destroy the buff only if it is still active
            this.activateImmunity();
        }
    }
    spawnDebuff() {
        const positions = [
            { x: Phaser.Math.Between(50, this.scale.width - 50), y: Phaser.Math.Between(50, this.scale.height - 50) }
        ];
        const position = Phaser.Utils.Array.GetRandom(positions);
    
        const debuff = this.physics.add.sprite(position.x, position.y, 'debuff').setOrigin(0.5, 0.5);
        debuff.setScale(0.5); // Adjust the scale as needed
    
        this.physics.add.overlap(this.player, debuff, this.onPlayerCollectDebuff, null, this);
    }
    
    onBallBounce(ball) {
        ball.bounceCount += 1;
        const bouce = Phaser.Math.Between(1, 4);
        if (ball.bounceCount >= bouce) {
            this.stopBall(ball);
        }
    }
//buff-imute (colorful glay)/ & double score, debuff-dizzy (animation) & slowndown (drop frame), timmer?/ (have hp), score (add by time)
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
        this.tweens.add({
            targets: this.player,
            alpha: { from: 1, to: 0 },
            duration: 100,
            yoyo: true,
            repeat: 5
        });
    }
    
    onBallHitPlayer(player, ball) {
        if (!this.isImmune || this.immunitySource !== 'buff') {
            this.playerHealth -= 1;
            this.updateHealthDisplay();
            console.log('Player hit! Health:', this.playerHealth);
            this.activateImmunity('hit');
    
            if (this.playerHealth <= 0) {
                console.log('Game Over');
                this.scene.restart();
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
        const newStartX = (canvasWidth - ((width * numHearts) + (numHearts - 1) * spacing));

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

const game = new Phaser.Game(config);
function resize(game) {
    game.scale.resize(sizes.width, sizes.height);
}
