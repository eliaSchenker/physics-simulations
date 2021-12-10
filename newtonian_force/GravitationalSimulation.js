class GravitationalSimulation {
    static gravitationalConstant = 6.672e-11;

    constructor(renderer, physicsTickSpeed=0.01) {
        this.renderer = renderer;
        this.physicalBodies = [];
        
        this.paused = false;
        
        //Initialize Physics Ticks
        this.lastTickEnd = new Date();

        this.interval = setInterval(this.tick.bind(this), physicsTickSpeed);

        //Setup trails
        this.displayTrails = true;
        this.trailCounter = 0;
        this.trailPointLimit = 1000;

        //Setup timewarp
        this.timeWarp = 1;
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
                    var force = this.calculateForce(this.physicalBodies[i], this.physicalBodies[j]);
                    var newAcceleration = this.calculateAcceleration(this.physicalBodies[i], this.physicalBodies[j], force);
                    acceleration = new Vector2(acceleration.x + newAcceleration.x, acceleration.y + newAcceleration.y);
                }
            }
            this.physicalBodies[i].updateVelocity(acceleration, deltaT * this.timeWarp);
            this.physicalBodies[i].updatePosition(deltaT * this.timeWarp);

            if(this.trailCounter == 10) {
                //If the trail point limit is exceeded, delete the first trail point 
                if(this.physicalBodies[i].trailPoints.length == this.trailPointLimit) {
                    this.physicalBodies[i].trailPoints.shift();
                }
                this.physicalBodies[i].trailPoints.push(this.physicalBodies[i].position);
            }
        }
        if(this.trailCounter == 10) {
            this.trailCounter = 0;         
        }else {
            this.trailCounter+=1;
        }
        this.lastTickEnd = new Date();
    }

    calculateForce(body1, body2) {
        var distance = body1.position.distanceTo(body2.position);
        return GravitationalSimulation.gravitationalConstant * body1.mass * body2.mass / Math.pow(distance, 2)
    }

    calculateAcceleration(body1, body2, force) {
        //Calculate the direction of the force
        var dir = new Vector2(body2.position.x - body1.position.x, 
            body2.position.y - body1.position.y);
        
        //Calculate the magnitude of the force (Square root of the squared and added values)
        var mag = Math.sqrt(dir.x*dir.x + dir.y*dir.y);
        var norm = new Vector2(dir.x / mag, dir.y / mag);

        //Calculate the acceleration of the body by using the formula A = F/M
        var acceleration = new Vector2(force * norm.x / body1.mass, force * norm.y  / body1.mass);

        return acceleration;
    }

    render() {
        this.renderer.reset_render_objects();
        for(var i = 0;i<this.physicalBodies.length;i++) {
            //Render Objects
            this.renderer.render_circle(this.physicalBodies[i].radius, this.physicalBodies[i].position);

            //Render Trails
            if(this.displayTrails) {
                for(var j = 0; j<this.physicalBodies[i].trailPoints.length - 1;j++) {
                    this.renderer.render_line(this.physicalBodies[i].trailPoints[j], this.physicalBodies[i].trailPoints[j + 1]);
                }
            }
        }
        this.renderer.render_frame();
    }
}

class PhysicalBody {
    constructor(mass, radius, initialPosition, initialVelocity, fixPosition=false) {
        this.mass = mass;
        this.radius = radius;
        this.position = initialPosition;
        this.velocity = initialVelocity;
        this.trailPoints = [];
        this.fixPosition = fixPosition
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
        if(!this.fixPosition) {
            this.position = new Vector2(this.position.x + this.velocity.x * timeDifference,
            this.position.y + this.velocity.y * timeDifference);
        }
    }
}