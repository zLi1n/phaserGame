import './style.css'
import './changeCanva.js';
import Phaser, { Loader } from "phaser";
const body = document.querySelector('body');
body.style.backgroundImage = "url('/assets/bakery-shop.png')";
body.style.backgroundSize = "cover";
body.style.backgroundPosition = "center";
const items = {
  "item1": "/assets/gemstones1.png",
  "item2": "/assets/gemstones2.png",
  "item3": "/assets/gemstones3.png",
  "item4": "/assets/gemstones4.png"
}
let game;
let gameOptions = {
  fieldSize: 7,
  gemColors: items.length,
  gemSize: 60,
  swapSpeed: 200,
  fallSpeed: 100,
  destroySpeed: 200
}
let point = 0;
let move = 5;
const HORIZONTAL = 1;
const VERTICAL = 2;

const sizes = {
  width: gameOptions.fieldSize * gameOptions.gemSize,
  height: gameOptions.fieldSize * gameOptions.gemSize,
};
window.onload = function () {
  let gameConfig = {
    width: gameOptions.fieldSize * gameOptions.gemSize,
    height: gameOptions.fieldSize * gameOptions.gemSize,
    scene: playGame,
  }
  game = new Phaser.Game(gameConfig);
  window.focus()
  resize();
  window.addEventListener("resize", resize, false);
}

class playGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
    this.highlightMatchCount = 0;
  }
  preload() {
    this.load.image("bg", "/assets/bg.png");
    this.load.image("frame", "/assets/box-frame.png");
    this.load.image("light", "/assets/fire.png");
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        this.load.image(key, items[key]);
      }
    }
  }
  create() {
    this.bg = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
    this.resizeBackground();
    this.frameSprite = this.add.sprite(0, 0, "frame");
    this.frameSprite.setVisible(false);
    const scaleX = sizes.width / (gameOptions.fieldSize) / this.frameSprite.width;
    const scaleY = sizes.height / (gameOptions.fieldSize) / this.frameSprite.height;
    const scale = Math.min(scaleX, scaleY);
    this.frameSprite.setScale(scale);
    this.canPick = false;
    this.dragging = false;
    this.selectedGem = null;

    this.input.on("pointerdown", this.gemSelect, this);
    this.input.on("pointermove", this.startSwipe, this);
    this.input.on("pointerup", this.stopSwipe, this);

    this.drawField();
    this.lightEffectGroup = this.add.group();
    this.calculatePotentialMatches()
    if (this.matchInBoard()) {
      this.time.addEvent({
        delay: 250,
        callback: this.handleMatches.bind(this)
      });
    } else {
      this.canPick = true;
      this.border = null;
      this.noSwapTimer = this.time.addEvent({
        delay: 3000,
        callback: this.highlightMatch,
        callbackScope: this,
        loop: false
      });
      this.checkAndReshuffle();
    }

  }
  resizeBackground() {
    const { width, height } = this.sys.game.scale.gameSize;
    const scaleX = width / this.bg.width;
    const scaleY = height / this.bg.height;
    const scale = Math.max(scaleX, scaleY);
    this.bg.setScale(scale).setScrollFactor(0);
    this.bg.setPosition(width / 2, height / 2);
  }
  resetNoSwapTimer() {
    if (this.noSwapTimer) {
      this.noSwapTimer.remove();
    }
    this.noSwapTimer = this.time.addEvent({
      delay: 3000,
      callback: this.highlightMatch,
      callbackScope: this,
      loop: false
    });
    this.highlightMatchCount = 0; // Reset the counter here
  }
  drawField() {
    this.gameArray = [];
    this.poolArray = [];
    this.gemGroup = this.add.group();
    const itemKeys = Object.keys(items);
    const numItems = itemKeys.length;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      this.gameArray[i] = [];
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let gemImageKey = "item" + Phaser.Math.Between(1, numItems);
        let gem = this.add.sprite(gameOptions.gemSize * j + gameOptions.gemSize / 2, gameOptions.gemSize * i + gameOptions.gemSize / 2, gemImageKey);
        const gemScaleX = sizes.width / (gameOptions.fieldSize + 2) / gem.width;
        const gemScaleY = sizes.height / (gameOptions.fieldSize + 2) / gem.height;
        const gemScale = Math.min(gemScaleX, gemScaleY);
        gem.setScale(gemScale);
        gem.setOrigin(0.5);
        this.gemGroup.add(gem);

        this.gameArray[i][j] = {
          gemColor: gemImageKey,
          gemSprite: gem,
          isEmpty: false
        };
      }
    }
  }
  isMatch(row, col) {
    return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
  }

  isHorizontalMatch(row, col) {
    return this.gemAt(row, col).gemColor == this.gemAt(row, col - 1).gemColor && this.gemAt(row, col).gemColor == this.gemAt(row, col - 2).gemColor;
  }

  isVerticalMatch(row, col) {
    return this.gemAt(row, col).gemColor == this.gemAt(row - 1, col).gemColor && this.gemAt(row, col).gemColor == this.gemAt(row - 2, col).gemColor;
  }

  gemAt(row, col) {
    if (row < 0 || row >= gameOptions.fieldSize || col < 0 || col >= gameOptions.fieldSize) {
      return -1;
    }
    return this.gameArray[row][col];
  }
  set canPick(value) {
    this._canPick = value;
    if (value) {
      this.resetNoSwapTimer();
      this.checkAndReshuffle();
    } else if (this.noSwapTimer) {
      this.noSwapTimer.remove();
    }
  }

  get canPick() {
    return this._canPick;
  }
  gemSelect(pointer) {
    if (this.canPick) {
      this.dragging = true;
      this.clearAnimations();
      this.resetNoSwapTimer();
      let row = Math.floor(pointer.y / gameOptions.gemSize);
      let col = Math.floor(pointer.x / gameOptions.gemSize);
      let pickedGem = this.gemAt(row, col)
      if (pickedGem != -1) {
        if (this.selectedGem == null) {
          this.frameSprite.setVisible(true);
          this.frameSprite.setPosition(pickedGem.gemSprite.x, pickedGem.gemSprite.y);
          this.frameSprite.setDepth(1);
          this.selectedGem = pickedGem;
        } else {
          if (this.areTheSame(pickedGem, this.selectedGem)) {
            this.frameSprite.setVisible(false);
            this.selectedGem = null;
          } else {
            if (this.areNext(pickedGem, this.selectedGem)) {
              this.frameSprite.setVisible(false);
              this.swapGems(this.selectedGem, pickedGem, true);
            } else {
              this.frameSprite.setPosition(pickedGem.gemSprite.x, pickedGem.gemSprite.y);
              this.selectedGem = pickedGem;
            }
          }
        }
      }

    }
  }
  calculatePotentialMatches() {
    let potentialMatches = {
      '5': [],
      '4': [],
      '3': []
    };

    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let gem = this.gameArray[i][j];

        if (j < gameOptions.fieldSize - 1) {
          let adjacentGemRight = this.gameArray[i][j + 1];
          if (this.areNext(gem, adjacentGemRight)) {
            this.swapGemsForCalculation(gem, adjacentGemRight);

            let matchLength = this.getMatchLength();
            //console.log(`Match length for swap (${i},${j}) with (${i},${j + 1}):`, matchLength);

            if (matchLength >= 3 && matchLength <= 5) {
              potentialMatches[matchLength.toString()].push({
                from: { row: i, col: j },
                to: { row: i, col: j + 1 }
              });
            }
            this.swapGemsForCalculation(gem, adjacentGemRight);
          }
        }

        if (i < gameOptions.fieldSize - 1) {
          let adjacentGemDown = this.gameArray[i + 1][j];
          if (this.areNext(gem, adjacentGemDown)) {
            this.swapGemsForCalculation(gem, adjacentGemDown);

            let matchLength = this.getMatchLength();
            //console.log(`Match length for swap (${i},${j}) with (${i + 1},${j}):`, matchLength);

            if (matchLength >= 3 && matchLength <= 5) {
              potentialMatches[matchLength.toString()].push({
                from: { row: i, col: j },
                to: { row: i + 1, col: j }
              });
            }
            this.swapGemsForCalculation(gem, adjacentGemDown);
          }
        }
      }
    }

    return potentialMatches;
  }


  swapGemsForCalculation(gem1, gem2) {
    let fromColor = gem1.gemColor;
    let toColor = gem2.gemColor;
    gem1.gemColor = toColor;
    gem2.gemColor = fromColor;
  }
  reshuffleField() {
    this.canPick = false;
    let allGems = [];

    // Collect all gems
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        allGems.push(this.gameArray[i][j]);
      }
    }

    // Shuffle the array
    for (let i = allGems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
    }

    // Place gems back in the field
    let index = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        this.gameArray[i][j] = allGems[index];
        index++;
      }
    }

    // Redraw the field with animations
    this.animateReshuffle();
  }

  animateReshuffle() {
    // Hide gems with fade-out effect
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let gem = this.gameArray[i][j];
        this.tweens.add({
          targets: gem.gemSprite,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (i === gameOptions.fieldSize - 1 && j === gameOptions.fieldSize - 1) {
              // Show reshuffling text after fade-out is complete
              this.showReshufflingText();
            }
          }
        });
      }
    }
  }

  showReshufflingText() {
    let reshufflingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Reshuffling...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.time.delayedCall(1000, () => {
      reshufflingText.destroy();
      this.redrawFieldWithFadeIn();
    });
  }

  redrawFieldWithFadeIn() {
    // Reposition gems and fade them in
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let gem = this.gameArray[i][j];
        gem.gemSprite.setPosition(j * gameOptions.gemSize + gameOptions.gemSize / 2, i * gameOptions.gemSize + gameOptions.gemSize / 2);
        this.tweens.add({
          targets: gem.gemSprite,
          alpha: 1,
          duration: 500,
          onComplete: () => {
            if (i === gameOptions.fieldSize - 1 && j === gameOptions.fieldSize - 1) {
              this.canPick = true;
              if (this.matchInBoard()) {
                this.time.addEvent({
                  delay: 250,
                  callback: this.handleMatches.bind(this)
                });
              }
            }
          }
        });
      }
    }
  }

  checkAndReshuffle() {
    let potentialMatches;
    let hasMatches = false;

    do {
      potentialMatches = this.calculatePotentialMatches();
      hasMatches = false;

      for (let key in potentialMatches) {
        if (potentialMatches[key].length > 0) {
          hasMatches = true;
          break;
        }
      }

      if (!hasMatches) {
        this.reshuffleField();
      }

    } while (!hasMatches);
  }

  getMatchLength() {
    let matchLength = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.isMatch(i, j)) {
          let length = this.getMatchCount(i, j);
          if (length > matchLength) {
            matchLength = length;
          }
        }
      }
    }
    return matchLength;
  }

  getMatchCount(row, col) {
    let count = 1;
    let color = this.gemAt(row, col).gemColor;

    for (let i = col - 1; i >= 0 && this.gemAt(row, i).gemColor === color; i--) {
      count++;
    }
    for (let i = col + 1; i < gameOptions.fieldSize && this.gemAt(row, i).gemColor === color; i++) {
      count++;
    }

    for (let i = row - 1; i >= 0 && this.gemAt(i, col).gemColor === color; i--) {
      count++;
    }
    for (let i = row + 1; i < gameOptions.fieldSize && this.gemAt(i, col).gemColor === color; i++) {
      count++;
    }

    return count;
  }
  highlightMatch() {
    if (this.highlightMatchCount < 2) {
      let potentialMatches = this.calculatePotentialMatches();
      let highestPriorityMatch = null;

      if (potentialMatches['5'].length > 0) {
        highestPriorityMatch = potentialMatches['5'][0];
      } else if (potentialMatches['4'].length > 0) {
        highestPriorityMatch = potentialMatches['4'][0];
      } else if (potentialMatches['3'].length > 0) {
        highestPriorityMatch = potentialMatches['3'][0];
      }

      if (highestPriorityMatch) {
        let fromGem = this.gemAt(highestPriorityMatch.from.row, highestPriorityMatch.from.col);
        let toGem = this.gemAt(highestPriorityMatch.to.row, highestPriorityMatch.to.col);

        // Shake and blink animations for both gems
        this.shakeGem(fromGem.gemSprite);
        this.blinkGem(fromGem.gemSprite);
        this.shakeGem(toGem.gemSprite);
        this.blinkGem(toGem.gemSprite);
      }

      this.highlightMatchCount++;
    } else {
      this.clearAnimations();
    }

    // this.resetNoSwapTimer();
  }

  shakeGem(gemSprite) {
    this.tweens.add({
      targets: gemSprite,
      x: gemSprite.x + 5, // Adjust as needed
      duration: 220,
      yoyo: true,
      repeat: -1, // Adjust repeat count as needed
      ease: 'Power1',
    });
  }

  blinkGem(gemSprite) {
    this.tweens.add({
      targets: gemSprite,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  clearAnimations() {
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let gem = this.gameArray[i][j];
        if (gem && gem.gemSprite) {
          let gemSprite = gem.gemSprite;

          this.tweens.killTweensOf(gemSprite);

          gemSprite.setAlpha(1);
          gemSprite.setPosition(gameOptions.gemSize * j + gameOptions.gemSize / 2, gameOptions.gemSize * i + gameOptions.gemSize / 2);
        }
      }
    }
  }

  startSwipe(pointer) {
    if (this.dragging && this.selectedGem != null) {
      let deltaX = pointer.downX - pointer.x;
      let deltaY = pointer.downY - pointer.y;
      let deltaRow = 0;
      let deltaCol = 0;
      if (deltaX > gameOptions.gemSize / 2 && Math.abs(deltaY) < gameOptions.gemSize / 4) {
        deltaCol = -1;
      }
      if (deltaX < -gameOptions.gemSize / 2 && Math.abs(deltaY) < gameOptions.gemSize / 4) {
        deltaCol = 1;
      }
      if (deltaY > gameOptions.gemSize / 2 && Math.abs(deltaX) < gameOptions.gemSize / 4) {
        deltaRow = -1;
      }
      if (deltaY < -gameOptions.gemSize / 2 && Math.abs(deltaX) < gameOptions.gemSize / 4) {
        deltaRow = 1;
      }
      if (deltaRow + deltaCol != 0) {
        let pickedGem = this.gemAt(this.getGemRow(this.selectedGem) + deltaRow, this.getGemCol(this.selectedGem) + deltaCol);
        if (pickedGem != -1) {
          this.frameSprite.setVisible(false);
          this.swapGems(this.selectedGem, pickedGem, true);
          this.dragging = false;
        }
      }
    }
  }

  stopSwipe() {
    this.dragging = false;
  }
  areTheSame(gem1, gem2) {
    return this.getGemRow(gem1) == this.getGemRow(gem2) && this.getGemCol(gem1) == this.getGemCol(gem2);
  }
  getGemRow(gem) {
    return Math.floor(gem.gemSprite.y / gameOptions.gemSize);
  }
  getGemCol(gem) {
    return Math.floor(gem.gemSprite.x / gameOptions.gemSize);
  }
  areNext(gem1, gem2) {
    return Math.abs(this.getGemRow(gem1) - this.getGemRow(gem2)) + Math.abs(this.getGemCol(gem1) - this.getGemCol(gem2)) == 1;
  }
  swapGems(gem1, gem2, swapBack) {
    this.swappingGems = 2;
    this.canPick = false;
    this.clearAnimations();
    let fromColor = gem1.gemColor;
    let fromSprite = gem1.gemSprite;
    let toColor = gem2.gemColor;
    let toSprite = gem2.gemSprite;
    let gem1Row = this.getGemRow(gem1);
    let gem1Col = this.getGemCol(gem1);
    let gem2Row = this.getGemRow(gem2);
    let gem2Col = this.getGemCol(gem2);
    this.gameArray[gem1Row][gem1Col].gemColor = toColor;
    this.gameArray[gem1Row][gem1Col].gemSprite = toSprite;
    this.gameArray[gem2Row][gem2Col].gemColor = fromColor;
    this.gameArray[gem2Row][gem2Col].gemSprite = fromSprite;
    this.tweenGem(gem1, gem2, swapBack);
    this.tweenGem(gem2, gem1, swapBack);
  }

  tweenGem(gem1, gem2, swapBack) {
    let row = this.getGemRow(gem1);
    let col = this.getGemCol(gem1);
    this.tweens.add({
      targets: this.gameArray[row][col].gemSprite,
      x: col * gameOptions.gemSize + gameOptions.gemSize / 2,
      y: row * gameOptions.gemSize + gameOptions.gemSize / 2,
      duration: gameOptions.swapSpeed,
      callbackScope: this,
      onComplete: function () {
        this.swappingGems--;
        if (this.swappingGems == 0) {
          if (!this.matchInBoard() && swapBack) {
            this.swapGems(gem1, gem2, false);
          }
          else {
            if (this.matchInBoard()) {
              this.handleMatches();

              move--;
              this.updateMoveText();
            }
            else {
              this.canPick = true;
              this.selectedGem = null;
            }
          }
        }
      }
    });
  }
  matchInBoard() {
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.isMatch(i, j)) {
          return true;
        }
      }
    }
    return false;
  }

  handleMatches() {
    this.removeMap = [];
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      this.removeMap[i] = [];
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        this.removeMap[i].push(0);
      }
    }
    this.markMatches(HORIZONTAL);
    this.markMatches(VERTICAL);
    this.destroyGems();

  }
  markMatches(direction) {
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      let colorStreak = 1;
      let currentColor = -1;
      let startStreak = 0;
      let colorToWatch = 0;
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (direction == HORIZONTAL) {
          colorToWatch = this.gemAt(i, j).gemColor;
        } else {
          colorToWatch = this.gemAt(j, i).gemColor;
        }
        if (colorToWatch == currentColor) {
          colorStreak++;
        }
        if (colorToWatch != currentColor || j == gameOptions.fieldSize - 1) {
          if (colorStreak >= 3) {
            point += (colorStreak * 10);
            if (direction == HORIZONTAL) {
              //console.log("HORIZONTAL :: Length = " + colorStreak + " :: Start = (" + i + "," + startStreak + ") :: Color = " + currentColor);
              if (colorStreak == 4)
                this.clearRow(i);
            } else {
              //console.log("VERTICAL :: Length = " + colorStreak + " :: Start = (" + startStreak + "," + i + ") :: Color = " + currentColor);
              if (colorStreak == 4)
                this.clearCol(i);
            }
            if (colorStreak == 5) {
              this.clearBoard();
            }
            for (let k = 0; k < colorStreak; k++) {
              if (direction == HORIZONTAL) {
                this.removeMap[i][startStreak + k]++;
              } else {
                this.removeMap[startStreak + k][i]++;
              }
            }

          }
          this.updatePointText();
          startStreak = j;
          colorStreak = 1;
          currentColor = colorToWatch;
        }
      }
    }
  }
  clearRow(row) {
    for (let col = 0; col < gameOptions.fieldSize; col++) {
      this.removeMap[row][col] = 1;
    }
  }

  clearCol(col) {
    for (let row = 0; row < gameOptions.fieldSize; row++) {
      this.removeMap[row][col] = 1;
    }
  }
  clearBoard() {
    for (let row = 0; row < gameOptions.fieldSize; row++) {
      for (let col = 0; col < gameOptions.fieldSize; col++) {
        this.removeMap[row][col] = 1;
      }
    }
  }
  updatePointText() {
    const scoreFill = document.getElementById('scoreFill');
    const maxPoints = 1000;
    const fillPercentage = (point / maxPoints) * 100;
    scoreFill.style.width = fillPercentage + '%';

    const stars = [star1, star2, star3];
    const thresholds = [maxPoints / 4, maxPoints / 2, maxPoints - maxPoints / 4];
    stars.forEach((star, index) => {
      if (point >= thresholds[index]) {
        star.style.filter = 'none';
      } else {
        star.style.filter = 'grayscale(100%)';
      }
    });
  }

  updateMoveText() {
    const moveTextElement = document.getElementById("moveText");
    if (moveTextElement) {
      moveTextElement.textContent = "Move: " + move;
    }
  }
  destroyGems() {
    let destroyed = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.removeMap[i][j] > 0) {
          destroyed++;
          const gem = this.gameArray[i][j];
          const lightEffect = this.lightEffectGroup.create(gem.gemSprite.x, gem.gemSprite.y, "light");
          lightEffect.setScale(0);

          const gemScaleX = sizes.width / (gameOptions.fieldSize + 2) / lightEffect.width;
          const gemScaleY = sizes.height / (gameOptions.fieldSize + 2) / lightEffect.height;
          const gemScale = Math.min(gemScaleX, gemScaleY);
          this.tweens.add({
            targets: lightEffect,
            scale: gemScale,
            alpha: 0,
            duration: gameOptions.destroySpeed,
            onComplete: () => {
              lightEffect.destroy();
            }
          });

          this.tweens.add({
            targets: this.gameArray[i][j].gemSprite,
            alpha: 0.5,
            duration: gameOptions.destroySpeed,
            callbackScope: this,
            onComplete: function () {
              if (this.gameArray[i][j].isSpecial) {
                this.activateSpecialItem(this.gameArray[i][j]);
              } else {
                this.poolArray.push(this.gameArray[i][j].gemSprite);
                this.gameArray[i][j].gemSprite.visible = false;
              }

              this.gameArray[i][j].isEmpty = true;

              destroyed--;
              if (destroyed == 0) {
                this.makeGemsFall();
                this.replenishField();
              }
            }
          });
        }
      }
    }
  }
  makeGemsFall() {
    for (let i = gameOptions.fieldSize - 2; i >= 0; i--) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (!this.gameArray[i][j].isEmpty) {
          let fallTiles = this.holesBelow(i, j);
          if (fallTiles > 0) {
            this.tweens.add({
              targets: this.gameArray[i][j].gemSprite,
              y: this.gameArray[i][j].gemSprite.y + fallTiles * gameOptions.gemSize,
              duration: gameOptions.fallSpeed * fallTiles
            });
            this.gameArray[i + fallTiles][j] = {
              gemSprite: this.gameArray[i][j].gemSprite,
              gemColor: this.gameArray[i][j].gemColor,
              isEmpty: false
            }
            this.gameArray[i][j].isEmpty = true;
          }
        }
      }
    }
  }
  holesBelow(row, col) {
    let result = 0;
    for (let i = row + 1; i < gameOptions.fieldSize; i++) {
      if (this.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }
  replenishField() {
    let replenished = 0;
    const itemKeys = Object.keys(items);
    const numItems = itemKeys.length;
    for (let j = 0; j < gameOptions.fieldSize; j++) {
      let emptySpots = this.holesInCol(j);
      if (emptySpots > 0) {
        for (let i = 0; i < emptySpots; i++) {
          replenished++;
          let randomColor = Phaser.Math.Between(1, numItems);
          this.gameArray[i][j].gemColor = "item" + randomColor;
          let gemSprite = this.poolArray.length > 0 ? this.poolArray.pop() : this.add.sprite(0, 0, this.gameArray[i][j].gemColor);

          gemSprite.setTexture(this.gameArray[i][j].gemColor);
          const gemScaleX = sizes.width / (gameOptions.fieldSize + 2) / gemSprite.width;
          const gemScaleY = sizes.height / (gameOptions.fieldSize + 2) / gemSprite.height;
          const gemScale = Math.min(gemScaleX, gemScaleY);
          gemSprite.setScale(gemScale);
          gemSprite.setOrigin(0.5);
          gemSprite.visible = true;

          gemSprite.x = gameOptions.gemSize * j + gameOptions.gemSize / 2;
          gemSprite.y = gameOptions.gemSize / 2 - (emptySpots - i) * gameOptions.gemSize;
          gemSprite.alpha = 1;

          this.gameArray[i][j].gemSprite = gemSprite;
          this.gameArray[i][j].isEmpty = false;

          this.tweens.add({
            targets: gemSprite,
            y: gameOptions.gemSize * i + gameOptions.gemSize / 2,
            duration: gameOptions.fallSpeed * emptySpots,
            callbackScope: this,
            onComplete: function () {
              replenished--;
              if (replenished == 0) {
                if (this.matchInBoard()) {
                  this.time.addEvent({
                    delay: 250,
                    callback: this.handleMatches.bind(this)
                  });
                } else {
                  if (move != 0) {
                    this.checkAndReshuffle();
                    this.canPick = true;
                    this.selectedGem = null;
                  } else {
                    this.time.delayedCall(1000, this.gameOver, [], this);
                  }
                }
              }
            }
          });
        }
      }
    }
  }

  holesInCol(col) {
    var result = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      if (this.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }
  gameOver() {
    this.sys.game.destroy(true);
    let status = "Win";
    let userId = new URLSearchParams(window.location.search).get('userId');
    let points = point;
    let date = Date.now();
    let reward = "basic-reward";
    /*if (this.points >= this.goals) {
      reward = "win-reward";
    } else if (this.points >= this.goals / 2) {
      reward = "win-reward2";
    } else {
      reward = "basic-reward";
    }
*/
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
} function resize() {
  var canvas = document.querySelector("canvas");
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + "px";
    canvas.style.height = (windowWidth / gameRatio) + "px";
  }
  else {
    canvas.style.width = (windowHeight * gameRatio) + "px";
    canvas.style.height = (windowHeight - 50) + "px";
  }
}

const insDiv = document.createElement("div");
const pointText = document.createElement("p");
pointText.id = "pointText";
pointText.style.fontSize = "20px";
pointText.style.fontWeight = "bold";
pointText.style.color = "black";
pointText.style.padding = "5px";
const moveText = document.createElement("p");
moveText.id = "moveText";
moveText.style.fontSize = "20px";
moveText.style.fontWeight = "bold";
moveText.style.color = "black";
moveText.style.padding = "5px";
moveText.textContent = "Move: " + move;
pointText.textContent = "Score: " + point;
const main = document.querySelector('main');
body.style.flexDirection = "column";
insDiv.style.width = "100%";
insDiv.style.display = "flex";
insDiv.style.justifyContent = "space-between";
insDiv.style.margin = "20px 10px";


const scoreContainer = document.createElement('div');
scoreContainer.id = 'scoreContainer';
scoreContainer.style.display = 'flex';
scoreContainer.style.justifyContent = 'center';
scoreContainer.style.alignItems = 'center';

const scoreBar = document.createElement('div');
scoreBar.id = 'scoreBar';
scoreBar.style.position = 'relative';
scoreBar.style.width = '200px';
scoreBar.style.height = '40px';
scoreBar.style.backgroundColor = 'lightgray';
scoreBar.style.borderRadius = '20px';
scoreBar.style.margin = '5px';
scoreBar.style.overflow = 'hidden';

const scoreFill = document.createElement('div');
scoreFill.id = 'scoreFill';
scoreFill.style.position = 'absolute';
scoreFill.style.top = '0';
scoreFill.style.left = '0';
scoreFill.style.width = '0';
scoreFill.style.height = '100%';
scoreFill.style.backgroundColor = 'gold';
scoreFill.style.borderRadius = '20px';
scoreFill.style.transition = 'width 0.3s ease';

const createStar = (id, position, img) => {
  const star = document.createElement('img');
  star.id = id;
  star.className = 'star';
  star.src = img;
  star.style.position = 'absolute';
  star.style.top = '50%';
  star.style.transform = 'translateY(-50%)';
  star.style.width = '30px';
  star.style.height = '30px';
  star.style.zIndex = '1';
  star.style.left = `calc(100% / 4 * ${position} - 15px)`;
  star.style.filter = 'grayscale(100%)';
  return star;
};

const star1 = createStar('star1', 1, '/assets/giftBox.png');
const star2 = createStar('star2', 2, '/assets/giftBox.png');
const star3 = createStar('star3', 3, '/assets/giftBox.png');

body.appendChild(insDiv);
insDiv.appendChild(moveText);
scoreBar.appendChild(scoreFill);
scoreBar.appendChild(star1);
scoreBar.appendChild(star2);
scoreBar.appendChild(star3);
scoreContainer.appendChild(scoreBar);
insDiv.appendChild(scoreContainer);
