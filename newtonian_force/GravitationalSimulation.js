class GravitationalSimulation {
    //Newtons gravitational constant
    static gravitationalConstant = 6.67408e-11;

    /**
     * Default Constructor of the GravitationalSimulation
     * @param {Renderer} renderer the renderer object
     * @param {Number} physicsTickSpeed the tick speed (time between ticks)
     */
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

        //Use Average DeltaT for calculation (to avoid problems with lag)
        this.simRuntimeRealtime = 0;
        this.physicsCalculationCount = 0;
        this.simRuntimeSimTime = 0;

        this.isDocumentHidden = false;

        this.initUI();
    }

    initUI() {
        this.renderer.toRenderUI.push(new UIText(true, new Vector2(10, 10), "", "20px Arial", "left", "bottom"));
        this.renderer.toRenderUI.push(new UIButton(true, new Vector2(10, 10), "", "20px Arial", (function() {this.toggleSimPause(); }).bind(this), "left", "top"))
    }

    /**
     * Add a body to the physicalBodies array
     * @param {PhysicalBody} body The body to add
     */
    addBody(body) {
        this.physicalBodies.push(body);
    }


    /**
     * One tick
     */
    tick() {
        if(document.hidden && !this.isDocumentHidden) {
            this.isDocumentHidden = true;
        }

        //When the document becomes visible again reset the time
        if(!document.hidden && this.isDocumentHidden) {
            this.isDocumentHidden = false;
            this.lastTickEnd = new Date();
        }

        //If the simulation isn't paused and the window is active call the physicstick
        if(!this.paused && ! this.isDocumentHidden) {
          this.physicsTick();
        }
        //Render the objects
        this.render();
    }

    /**
     * Finishes the simulation of this Simulation Object
     */
    destroy() {
        clearInterval(this.interval);
    }

    /**
     * Physicstick: Calculate all the forces between the bodies and updates the velocities and positions using the acceleration
     */
    physicsTick() {
        //Get the current time and date
        var currentTickStart = new Date(); 
        
        //Based on this, calculate the time difference between the next tick
        let deltaT = (currentTickStart.getTime() - this.lastTickEnd.getTime()) / 1000;
        this.simRuntimeRealtime += deltaT;
        this.physicsCalculationCount++;
        deltaT = this.simRuntimeRealtime / this.physicsCalculationCount; //Use average deltat as deltat
        //console.log(    deltaT);

        for(var i = 0;i<this.physicalBodies.length;i++) {
            var finalAcceleration = new Vector2(0, 0);

            for(var j = 0;j<this.physicalBodies.length;j++) {
                //Don't calculate the influence the body has on itself
                if(i != j) {
                    //Calculate the force between the two bodies
                    var force = this.calculateForce(this.physicalBodies[i], this.physicalBodies[j]);
                    //Calculate the acceleration using the force
                    var newAcceleration = this.calculateAcceleration(this.physicalBodies[i], this.physicalBodies[j], force);
                    //Add the new acceleration to the final acceleration
                    finalAcceleration = new Vector2(finalAcceleration.x + newAcceleration.x, finalAcceleration.y + newAcceleration.y);
                }
            }

            //Update the velocity of the body using acceleration and deltaT (multiply deltaT by the timeWarp)
            this.physicalBodies[i].updateVelocity(finalAcceleration, deltaT * this.timeWarp);
            //Update the position of the body using deltaT (multiply deltaT by the timeWarp)
            this.physicalBodies[i].updatePosition(deltaT * this.timeWarp);

            if(this.trailCounter == 1) {
                //If the trail point limit is exceeded, delete the first trail point 
                if(this.physicalBodies[i].trailPoints.length == this.trailPointLimit) {
                    this.physicalBodies[i].trailPoints.shift();
                }
                this.physicalBodies[i].trailPoints.push(this.physicalBodies[i].position);
            }
        }
        this.simRuntimeSimTime += deltaT * this.timeWarp;
        if(this.trailCounter == 1) {
            this.trailCounter = 0;         
        }else {
            this.trailCounter+=1;
        }
        this.lastTickEnd = new Date();
    }

    /**
     * Calculates the force between two bodies
     * @param {PhysicalBody} body1 The first body
     * @param {PhysicalBody} body2 The second body
     * @returns The force in newtons
     */
    calculateForce(body1, body2) {
        var distance = body1.position.distanceTo(body2.position);
        return GravitationalSimulation.gravitationalConstant * body1.mass * body2.mass / Math.pow(distance, 2)
    }

    /**
     * Calculates the acceleration acting on body 1 in direction of body2 using a force F
     * @param {PhysicalBody} body1 The first body
     * @param {PhysicalBody} body2 The second body
     * @param {Number} force The force in newtons
     * @returns Acceleration in (m/s)^2
     */
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

    /**
     * Renders the physicalBodies using the renderer
     */
    render() {
        this.renderer.reset_render_objects();
        for(var i = 0;i<this.physicalBodies.length;i++) {
            //Render Objects
            let body = new CircleRenderObject(this.physicalBodies[i].radius, this.physicalBodies[i].position);
            this.renderer.toRenderObjects.push(body);
            this.renderer.toRenderObjects.push(new TextRenderObject("15px Arial", this.physicalBodies[i].name, new Vector2(this.physicalBodies[i].position.x + this.physicalBodies[i].radius * 1.2, this.physicalBodies[i].position.y)));

            //Render Trails
            if(this.displayTrails) {
                for(var j = 0; j<this.physicalBodies[i].trailPoints.length - 1;j++) {
                    this.renderer.toRenderObjects.push(new LineRenderObject(this.physicalBodies[i].trailPoints[j], this.physicalBodies[i].trailPoints[j + 1], 0.25));
                }
            }
        }

        this.renderer.toRenderUI[0].text = "Simulation has been running for " + DateUtil.secondsToText(Math.round(this.simRuntimeSimTime));
        this.renderer.toRenderUI[1].text = this.paused ? "Play" : "Pause";

        this.renderer.render_frame();
    }

    toggleSimPause() {
        if(this.paused) {
            this.playSim();
        }else {
            this.pauseSim();
        }
    }

    pauseSim() {
        this.paused = true;
    }

    playSim() {
        this.paused = false;
    }
}

/**
 * Object which represents a Physicalbody
 */
class PhysicalBody {
    /**
     * Default constructor of the PhysicalBody Object
     * @param {Number} mass Mass of the body
     * @param {Number} radius Radius of the body
     * @param {Vector2} initialPosition Position of the body (vector)
     * @param {Vector2} initialVelocity Velocity of the body (vector)
     * @param {String} name Name of the body
     * @param {Boolean} fixPosition Should the position of the body be fixed (not affected by other bodies)
     */
    constructor(mass, radius, initialPosition, initialVelocity, name, fixPosition=false) {
        this.mass = mass;
        this.radius = radius;
        this.position = initialPosition;
        this.velocity = initialVelocity;
        this.name = name;
        this.fixPosition = fixPosition;
        this.trailPoints = [];
    }

    /**
     * Update the velocity of the body using an acceleration and the change in time
     * @param {Vector2} acceleration Acceleration
     * @param {Number} deltaT Change in time
     */
    updateVelocity(acceleration, deltaT) {
        //new velocity = current velocity + Δv
        //Δv = a * Δt
        this.velocity = new Vector2(this.velocity.x + acceleration.x * deltaT, 
            this.velocity.y + acceleration.y * deltaT);
    }

    /**
     * Update the position of the body using the current velocity and a change in time
     * @param {Number} deltaT Change in time
     */
    updatePosition(deltaT) {
        //new position = current position + Δs
        //Δs = v * Δt
        if(!this.fixPosition) {
            this.position = new Vector2(this.position.x + this.velocity.x * deltaT,
            this.position.y + this.velocity.y * deltaT);
        }
    }
}