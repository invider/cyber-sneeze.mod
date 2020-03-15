// @depends(dna/Body)

const defaults = {
    Z: 1,
    solid: true,
    team: 0,
    timer: 0,
    receiver: 10,
    transponder: 100,
    speed: 40,
}

let id = 0

class Bot extends dna.Body {

    constructor(st, df) {
        super(st, augment( augment({}, df), defaults) )
        this.name = 'bot' + (++id)
        this.fq = .8 + rnd(.4)
        this.charger = env.tune.chargePower
        this.cpu = new lib.arch.CPU()
        this.cpu.bot = this
    }

    hit(source) {
        if (source instanceof dna.EnergyDroplet) {
            this.receiver += source.charge
            log(`${this.name} energy: +${source.charge}(${round(this.receiver)})`)
            source.kill()
        }
    }

    infect(bot, force) {
        if (force > this.receiver) {

            const infected = this

            setTimeout(() => {
                this.dir = 0
                this.team = bot.team
                this.cpu.replace(bot.cpu.chipset)
                this.__.spawn('Emitter', {
                    Z: this.Z+1,
                    x: this.x,
                    y: this.y,
                    r: 100,
                    color: '#ff6000',
                    lifespan: .04,
                    force: 10000,
                    radius: 10,
                    size: 1, vsize: 0,
                    speed: 150, vspeed: 0,
                    angle: 0, spread: TAU,
                    minLifespan: 0.2, vLifespan: 0,
                })

            }, 1000 + RND(1000))
            return true
        }
    }

    sneeze() {
        // determine force
        const force = this.transponder
        if (force === 0) return 0
        this.transponder = 0

        for (let i = 0; i < this.__._ls.length; i++) {
            const bot = this.__._ls[i]
            if (bot instanceof dna.Bot && !bot.dead && bot !== this) {
                const dist = this.distTo(bot)
                if (dist < force) {
                    bot.infect(this, force - dist)
                }
            }
        }

        // fx
        const speed = 100
        const estLife = force / speed
        this.__.spawn('Emitter', {
            Z: this.Z+1,
            x: this.x,
            y: this.y,
            r: 200,
            color: '#ff0000',
            lifespan: .04,
            force: 15000,
            radius: 10,
            size: 1, vsize: 0,
            speed: speed, vspeed: 0,
            angle: 0, spread: TAU,
            minLifespan: 0.2, vLifespan: estLife,
        })

        return force
    }

    next() {
        if (this.player) this.cpu.simulate()
        else this.cpu.next()
    }

    activate(dir) {
        switch(dir) {
            case 7: this.sneeze(); break;
        }
    }

    deactivate(dir) {
    }

    act(dir, dt) {
        switch(dir) {
            case 1: this.y -= this.speed * dt; break;
            case 2: this.x -= this.speed * dt; break;
            case 3: this.y += this.speed * dt; break;
            case 4: this.x += this.speed * dt; break;
        }
        this.moveFlag = dir
    }

    move(dir) {
        this.dir = dir
    }

    charge(dt) {
        if (this.moveFlag) {
            // transfer to receiver
            let q = this.charger * dt
            if (this.transponder < q) q = this.transponder
            this.transponder -= q
            this.receiver += q

        } else {
            // transfer to transponder
            let q = this.charger * dt
            if (this.receiver < q) q = this.receiver
            this.receiver -= q
            this.transponder += q
        }
    }

    evo(dt) {
        super.evo(dt)
        if (!this.player) this.act(this.dir, dt)
        this.charge(dt)

        this.timer -= dt
        if (this.timer <= 0) {
            this.next()
            this.timer = this.fq
        }

        this.moveFlag = 0
    }

    draw() {
        fill(env.style.teams[this.team])
        rect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2)
    }

    distTo(target) {
        return dist(this.x, this.y, target.x, target.y)
    }
}