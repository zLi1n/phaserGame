import './style.css'
import Phaser, { Loader } from "phaser";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const speedDown = 250;
const time = 15000;
const goal = 30;
const iconSize = Math.min(sizes.width, sizes.height) / 10;

const items = {
  "item1": "/assets/apple.png",
  "item2": "/assets/orange.png",
  "item3": "/assets/mango.png"
}

let backgroundUrl;
let debuffUrl;
let basketUrl;
async function fetchImages() {
  try {
    const response = await fetch('http://localhost:3001/img/drop-n-catch');
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const imageConfig = await response.json();
    backgroundUrl = imageConfig.background;
    for (const key in imageConfig) {
      if (items.hasOwnProperty(key)) {
        items[key] = imageConfig[key];
      }
    }
    debuffUrl = imageConfig.debuff;
    basketUrl = imageConfig.basket;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.targets = [];
    this.remainingItems = [];
    this.targetDebuff;
    this.freeze;
    this.playerSpeed = speedDown + 50;
    this.goals = goal;
    this.points = 0;
    this.textScore;
    this.textTime;
    this.textGoals;
    this.timedEvent;
    this.remainingTime;
    this.coinMusic;
    this.freezeMusic;
    this.bgMusic;
  }

  preload() {
    this.load.image("bg", backgroundUrl);
    this.load.image("basket", basketUrl);
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        this.load.image(key, items[key]);
      }
    }
    this.load.image("targetDebuff", debuffUrl);
    this.load.image("freezing", "/assets/freezing.png");
    this.load.audio("coin", "/assets/coin.mp3");
    this.load.audio("freeze", "/assets/Freeze-Sound.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");
  }

  create() {
    this.scene.pause("scene-game");
    this.coinMusic = this.sound.add("coin");
    this.freezeMusic = this.sound.add("freeze");
    this.bgMusic = this.sound.add("bgMusic", {
      loop: true
    });
    this.bgMusic.play();
    this.remainingItems = Object.keys(items);

    this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
    this.resizeBackground();

    const playerWidth = 200;
    const initialScale = Math.min(this.sys.game.scale.gameSize.width, this.sys.game.scale.gameSize.height) / (2 * playerWidth);

    const initialPlayerX = sizes.width / 3;
    const initialPlayerY = sizes.height - (playerWidth * initialScale / 2);

    this.player = this.physics.add.image(initialPlayerX, initialPlayerY, "basket").setOrigin(0, 0).setScale(initialScale);
    this.createRandomTarget(0, speedDown, 1);
    this.time.addEvent({
      delay: time / 4, callback: () =>
        this.createRandomTarget(0, speedDown + 50, 2),
      callbackScope: this
    });
    this.time.addEvent({
      delay: time / 2.5, callback: () => {
        this.createRandomTarget(0, speedDown + 100, 3);
        this.targetDebuff = this.physics.add.image(this.getRandomX(), 30, "targetDebuff").setOrigin(0, 0);
        this.targetDebuff.setMaxVelocity(0, speedDown + 80);
        const scale = iconSize / this.targetDebuff.width;
        this.targetDebuff.setScale(scale);
        this.physics.add.overlap(this.targetDebuff, this.player, this.targetDebuffHit, null, this);
      }, callbackScope: this
    });
    this.player.body.allowGravity = false;
    this.player.setInteractive({ draggable: true });
    this.player.setSize(this.player.width - this.player.width / 8, this.player.height / 6).setOffset(this.player.width / 16, this.player.height - this.player.height / 1.5);

    this.input.on('drag', (pointer, gameObject, dragX) => {
      dragX = Phaser.Math.Clamp(dragX, 0, (sizes.width - gameObject.displayWidth));
      gameObject.x = dragX;
    });
    const fontSize = Math.min(this.sys.game.scale.gameSize.width, this.sys.game.scale.gameSize.height) * 0.05;
    this.textScore = this.add.text(sizes.width - 20, 10, "Score: 0", {
      font: `${fontSize}px Arial`,
      fill: "#000000",
    }).setOrigin(1, 0);

    this.textTime = this.add.text(10, 10, "Remaining Time: 00", {
      font: `${fontSize}px Arial`,
      fill: "#000000",
    });

    this.timedEvent = this.time.delayedCall(time, this.gameOver, [], this);
    
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
    this.targets.forEach(target => {
      if (target.sprite.y >= sizes.height) {
        this.resetTarget(target.sprite);
      }
    });
    if (this.targetDebuff && this.targetDebuff.y >= sizes.height) {
      this.targetDebuff.setY(30);
      this.targetDebuff.setX(this.getRandomX());
    }

    this.remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`);

    const speedIncreaseFactor = this.getSpeedIncreaseFactor(this.remainingTime);
    this.targets.forEach(target => {
      target.sprite.setMaxVelocity(0, target.baseSpeed + speedIncreaseFactor);
    });
    if (this.targetDebuff) {
      this.targetDebuff.setMaxVelocity(0, speedDown + speedIncreaseFactor);
    }
  }

  getRandomX() {
    return Math.floor(Math.random() * (sizes.width - iconSize));
  };

  getRandomGoals() {
    const randomValue = Math.random() * 11;
    return Math.floor(randomValue) + 20;
  }

  createTarget(key, x, speed, points) {
    const target = this.physics.add.image(this.getRandomX(), 30, key).setOrigin(0, 0);
    target.setMaxVelocity(0, speed);
    const scale = iconSize / target.width;
    target.setScale(scale);
    target.points = points;
    this.physics.add.overlap(target, this.player, () => this.targetHit(target), null, this);
    this.targets.push({ sprite: target, baseSpeed: speed });
  }

  createRandomTarget(x, speed, points) {
    const key = this.getRandomTargetKey();
    const target = this.physics.add.image(this.getRandomX(), 30, key).setOrigin(0, 0);
    target.setMaxVelocity(0, speed);
    const scale = iconSize / target.width;
    target.setScale(scale);
    target.points = points;
    this.physics.add.overlap(target, this.player, () => this.targetHit(target), null, this);
    this.targets.push({ sprite: target, baseSpeed: speed });
  }

  getRandomTargetKey() {
    if (this.remainingItems.length === 0) {
      this.remainingItems = Object.keys(items);
    }
    const randomIndex = Phaser.Math.RND.between(0, this.remainingItems.length - 1);
    const randomKey = this.remainingItems[randomIndex];
    this.remainingItems.splice(randomIndex, 1);
    return randomKey;
  }

  targetHit(target) {
    if (target.hit) return;
    target.hit = true;
    this.resetTarget(target);
    this.points += target.points;
    this.textScore.setText(`Score: ${this.points}`);
    this.coinMusic.play();
  }

  resetTarget(target) {
    if (!target || !target.setY) return;
    target.hit = false;
    target.setY(30);
    target.setX(this.getRandomX());
  }

  targetDebuffHit() {
    this.targetDebuff.setY(30);
    this.targetDebuff.setX(this.getRandomX());
    this.player.disableInteractive();
    this.freezeMusic.play();

    if (!this.freeze) {
      this.freeze = this.add.image(this.player.x, this.player.y, "freezing").setOrigin(0, -1);
    }

    this.freeze.setScale(this.player.scaleX, this.player.scaleY);
    this.freeze.setDisplaySize(this.player.displayWidth, this.player.displayHeight / 2);

    this.freeze.setVisible(true);
    this.freeze.setPosition(this.player.x, this.player.y);

    this.time.delayedCall(2000, () => {
      this.player.setInteractive({ draggable: true });
      this.freeze.setVisible(false);
    }, null, this);
  }

  getSpeedIncreaseFactor(remainingTime) {
    if (remainingTime <= time / 4) {
      return 100;
    } else if (remainingTime <= time / 2) {
      return 50;
    } else if (remainingTime <= time / 1.5) {
      return 20;
    } else {
      return 0;
    }
  }
  gameOver() {
    this.sys.game.destroy(true);
    let status;
    if (this.points >= this.goals) {
      status = "Win";
    } else {
      status = "Lose";
    }
    let userId = new URLSearchParams(window.location.search).get('userId');
    let points = this.points;
    let date = Date.now();
    let reward = "basic-reward";
    if (this.points >= this.goals) {
      reward = "win-reward";
    } else if (this.points >= this.goals / 2) {
      reward = "win-reward2";
    } else {
      reward = "basic-reward";
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
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    canvas: gameCanvas,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: speedDown },
        debug: true,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: sizes.width,
      height: sizes.height,
    },
    scene: [GameScene],
    callbacks: {
      postBoot: function (phaserGame) {
        window.addEventListener('resize', () => resize(phaserGame));
        resize(phaserGame);
      }
    }
  };
  function resize(game) {
    game.scale.resize(sizes.width, sizes.height);
  }
  game = new Phaser.Game(config); 
});

document.addEventListener("DOMContentLoaded", () => {
  const startDiv = document.createElement("div");
  startDiv.id = "startDiv";
  startDiv.style.width = "100%";
  startDiv.style.height = "100%";
  startDiv.style.backgroundColor = "rgba(46, 46, 46, 0.6)";
  startDiv.style.display = "flex";
  startDiv.style.flexDirection = "column";
  startDiv.style.justifyContent = "center";
  startDiv.style.alignItems = "center";
  startDiv.style.position = "absolute";
  startDiv.style.top = "0";
  startDiv.style.left = "0";
  startDiv.style.zIndex = "2";

  const countdownText = document.createElement("div");
  countdownText.id = "countdownText";
  countdownText.style.fontSize = "48px";
  countdownText.style.fontWeight = "bold";
  countdownText.style.color = "white";
  countdownText.style.textAlign = "center";

  startDiv.appendChild(countdownText);
  document.body.appendChild(startDiv);

  let countdown = 3;
  countdownText.textContent = countdown;

  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownText.textContent = countdown;
    } else {
      countdownText.textContent = "GO!";
      clearInterval(countdownInterval);
      setTimeout(() => {
        startDiv.style.display = "none";
        if (game) {
          game.scene.resume("scene-game");
        } else {
          console.error("Game instance not found.");
        }
      }, 1000);
    }
  }, 1000);
});