import Phaser from "phaser";
class FireworksScene extends Phaser.Scene {
    constructor() {
        super('FireworksScene');
        this.colors = {
            red: 0xff0000,
            orange: 0xffa500,
            yellow: 0xffff00,
            lime: 0x00ff00,
            green: 0x008000,
            aqua: 0x00ffff,
            blue: 0x0000ff,
            fuchsia: 0xff00ff
        };

        this.tints = Object.values(this.colors);

        this.slowingFactor = 0.97;
        this.maxY = 20;

        this.emitterConfig = {
            // alpha: { start: 0, end: 1 },
            angle: { start: 0, end: 360, steps: 50 },
            blendMode: "SCREEN",
            emitting: false,
            frequency: -1,
            gravityY: 128,
            lifespan: { min: 2000, max: 4000 },
            quantity: 100,
            reserve: 500,
            rotate: { min: 0, max: 45 },
            speed: { min: 50, max: 300 }
        };
    }

    preload() {
        // Preload any assets if needed
    }

    create() {
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.renderTexture = this.add
            .renderTexture(0, 0, sizes.width, sizes.height)
            .setOrigin(0, 0)
            .setBlendMode("ADD");

        this.emitter1 = this.make.particles(
            { key: "__WHITE", config: this.emitterConfig },
            false
        );
        this.emitter2 = this.make.particles(
            { key: "__WHITE", config: this.emitterConfig },
            false
        );
        this.emitter3 = this.make.particles(
            { key: "__WHITE", config: this.emitterConfig },
            false
        );

        this.time.addEvent({
            delay: 3000,
            startAt: Phaser.Math.Between(0, 3000),
            repeat: -1,
            callback: () => {
                this.updateEmitter(this.emitter1);
            }
        });

        this.time.addEvent({
            delay: 4000,
            startAt: Phaser.Math.Between(0, 4000),
            repeat: -1,
            callback: () => {
                this.updateEmitter(this.emitter2);
            }
        });

        this.time.addEvent({
            delay: 5000,
            startAt: Phaser.Math.Between(0, 5000),
            repeat: -1,
            callback: () => {
                this.updateEmitter(this.emitter3);
            }
        });

        const flareDynamics = (particle, delta, step, t) => {
            particle.velocityX *= this.slowingFactor;
            particle.velocityY *= this.slowingFactor;
            particle.alpha = t > 0.5 ? particle.alpha * 0.9 : Math.min(1, t + 0.5);
            if (t > 0.8 && particle.velocityY > this.maxY) {
                particle.velocityY = this.maxY;
            }
        };

        this.emitter1.addParticleProcessor({ active: true, update: flareDynamics });
        this.emitter2.addParticleProcessor({ active: true, update: flareDynamics });
        this.emitter3.addParticleProcessor({ active: true, update: flareDynamics });
    }

    update(time, delta) {
        this.renderTexture.fill(0, 0.005 * delta).draw([this.emitter1, this.emitter2, this.emitter3]);
    }

    updateEmitter(emitter) {
        emitter.particleX = window.innerWidth * Phaser.Math.FloatBetween(0, 0.75);
        emitter.particleY = window.innerHeight * Phaser.Math.FloatBetween(0, 0.5);
        emitter.setParticleTint(Phaser.Utils.Array.GetRandom(this.tints));
        emitter.explode();
    }
}

export default FireworksScene;