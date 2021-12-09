class GravitationalSimulation {
    static gravitationalConstant = 6.672e-11;

    constructor(renderer, physicsTickSpeed=0.01) {
        this.renderer = renderer;
        this.physicalBodies = [];
        
        this.paused = false;
        
        //Initialize Physics Ticks
        this.lastTickEnd = new Date();

        this.interval = setInterval(this.tick.bind(this), physicsTickSpeed);
    }



    addBody(body) {
        this.physicalBodies.push(body);
    }

    tick() {
        if(!this.paused) {
          this.physicsTick();
        }
        this.render();
    }

    physicsTick() {
        //Get the current time and date
        var currentTickStart = new Date(); 
        
        //Based on this, calculate the time difference between the next tick
        let deltaT = (currentTickStart.getTime() - this.lastTickEnd.getTime()) / 1000;

        for(var i = 0;i<this.physicalBodies.length;i++) {
            var acceleration = new Vector2(0, 0);

            for(var j = 0;j<this.physicalBodies.length;j++) {
                //Don't calculate the influence the body has on itself
                if(i != j) {
                    var distance = this.physicalBodies[i].position.distanceTo(this.physicalBodies[j].position);
                    var force = (GravitationalSimulation.gravitationalConstant * ((this.physicalBodies[i].mass * this.physicalBodies[j].mass) / distance^2))
                    //Calculate the direction of the force
                    var dir = new Vector2(this.physicalBodies[j].position.x - this.physicalBodies[i].position.x, 
                        this.physicalBodies[j].position.y - this.physicalBodies[i].position.y)
                    //Calculate the magnitude of the force (Square root of the squared and added values)
                    var mag = Math.sqrt(dir.x*dir.x + dir.y*dir.y)
                    var norm = new Vector2(dir.x / mag, dir.y / mag);                  
                    //Calculate the acceleration of the body by using the formula A = F/M
                    acceleration = new Vector2(acceleration.x + (force * norm.x / this.physicalBodies[i].mass), acceleration.y + (force * norm.y  / this.physicalBodies[i].mass));
                }
            }
            this.physicalBodies[i].updateVelocity(acceleration, deltaT);
            this.physicalBodies[i].updatePosition(deltaT);
        }
        this.lastTickEnd = new Date();
    }

    render() {
        this.renderer.reset_render_objects();
        for(var i = 0;i<this.physicalBodies.length;i++) {
            this.renderer.render_circle(this.physicalBodies[i].radius, this.physicalBodies[i].position);
        }
        this.renderer.render_frame();
    }
}

class PhysicalBody {
    constructor(mass, radius, initialPosition, initialVelocity) {
        this.mass = mass;
        this.radius = radius;
        this.position = initialPosition;
        this.velocity = initialVelocity
    }

    updateVelocity(acceleration, timeDifference) {
        //new velocity = current velocity + Δv
        //Δv = a * Δt
        this.velocity = new Vector2(this.velocity.x + acceleration.x * timeDifference, 
            this.velocity.y + acceleration.y * timeDifference);
    }

    updatePosition(timeDifference) {
        //new position = current position + Δs
        //Δs = v * Δt
        this.position = new Vector2(this.position.x + this.velocity.x * timeDifference,
            this.position.y + this.velocity.y * timeDifference);
    }
}