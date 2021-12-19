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
        this.renderer.toRenderUI.push(new UIButton(true, new Vector2(100, 10), "Edit", "20px Arial", (function() {this.toggleEditMode(); }).bind(this), "left", "top"))
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

        //89 8324
        for(var i = 0;i<this.physicalBodies.length;i++) {
            var finalAcceleration = new Vector2(0, 0);

            for(var j = 0;j<this.physicalBodies.length;j++) {
                //Don't calculate the influence the body has on itself
                if(i != j) {
                    //Calculate the force between the two bodies
                    var force = GravitationalSimulation.calculateForce(this.physicalBodies[i], this.physicalBodies[j]);
                    //Calculate the acceleration using the force
                    var newAcceleration = GravitationalSimulation.calculateAcceleration(this.physicalBodies[i], this.physicalBodies[j], force);
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
    static calculateForce(body1, body2) {
        var distance = body1.position.distanceTo(body2.position);
        return GravitationalSimulation.gravitationalConstant * body1.mass * body2.mass / Math.pow(distance, 2);
    }

    /**
     * Calculates the acceleration acting on body 1 in direction of body2 using a force F
     * @param {PhysicalBody} body1 The first body
     * @param {PhysicalBody} body2 The second body
     * @param {Number} force The force in newtons
     * @returns Acceleration in (m/s)^2
     */
    static calculateAcceleration(body1, body2, force) {
        //Calculate the direction of the force
        var dir = new Vector2(body2.position.x - body1.position.x, 
            body2.position.y - body1.position.y);
        
        //Calculate the magnitude of the force (Square root of the squared and added values)
        var mag = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2));
        var norm = new Vector2(dir.x / mag, dir.y / mag);

        //Calculate the acceleration of the body by using the formula A = F/M
        var acceleration = new Vector2(force * norm.x / body1.mass, force * norm.y  / body1.mass);

        return acceleration;
    }

    /**
     * Returns the predict positions of the bodies in the next (deltaT * calcAmount) seconds
     * @param {Number} deltaT Passed time between calculations
     * @param {Number} calcAmount How many calculations should be done
     * @returns An array of arrays which contain every point for each physicalBody
     */
    getPredictedPositions(deltaT, calcAmount) { 
        let result = [];
        //Initialize the result array with an empty array for each physicalBody
        for (let i = 0; i < this.physicalBodies.length; i++) {
            result.push([]);
        }

        //Create a deep copy of the physicalBodies array
        let tempBodies = ObjectUtil.clone(this.physicalBodies);

        for(let i = 0; i<calcAmount;i++) {
            for(let j = 0; j<tempBodies.length;j++) {
                let finalAcceleration = new Vector2(0, 0);
                for(let k = 0; k<tempBodies.length;k++) {
                    if(j != k) {
                        let force = GravitationalSimulation.calculateForce(tempBodies[j], tempBodies[k]);
                        let acceleration = GravitationalSimulation.calculateAcceleration(tempBodies[j], tempBodies[k], force);
                        finalAcceleration = new Vector2(finalAcceleration.x + acceleration.x, finalAcceleration.y + acceleration.y);
                    }
                }
                //Update the velocity of the body using acceleration and deltaT (multiply deltaT by the timeWarp)
                tempBodies[j].updateVelocity(finalAcceleration, deltaT);
                //Update the position of the body using deltaT (multiply deltaT by the timeWarp)
                tempBodies[j].updatePosition(deltaT);

                //Add the position to the result array
                result[j].push(tempBodies[j].position);
            }
        }
        return result;
    }

    /**
     * Renders the physicalBodies using the renderer
     */
    render() {
        this.renderer.reset_render_objects();
        for(var i = 0;i<this.physicalBodies.length;i++) {
            //Render Objects
            let body = new CircleRenderObject(this.physicalBodies[i].radius, this.physicalBodies[i].position);

            

            if(this.isEditModeActive) {
                this.renderer.toRenderUI[2].color = "#3d87ff";
                let currentIndex = i;
                body.addInteractionEvents(undefined, (function(position) { this.physicalBodies[currentIndex].position = position;}).bind(this));

                let arrowObject = new ArrowRenderObject(this.physicalBodies[i].position, 
                    new Vector2(this.physicalBodies[i].position.x + this.physicalBodies[i].velocity.x * 30000, this.physicalBodies[i].position.y + this.physicalBodies[i].velocity.y * 30000));
                arrowObject.addInteractionEvents(undefined, (function(position) {
                    this.physicalBodies[currentIndex].velocity = new Vector2((position.x - this.physicalBodies[currentIndex].position.x) / 30000,
                                                                   (position.y - this.physicalBodies[currentIndex].position.y) / 30000);
                }).bind(this));
                this.renderer.toRenderObjects.push(arrowObject);
            }else {
                this.renderer.toRenderUI[2].color = "#D3D3D3";
            }

            this.renderer.toRenderObjects.push(body);
            this.renderer.toRenderObjects.push(new TextRenderObject("15px Arial", this.physicalBodies[i].name, new Vector2(this.physicalBodies[i].position.x + this.physicalBodies[i].radius * 1.2, this.physicalBodies[i].position.y)));

            //If the edit mode is not active, render the past trails
            if(!this.isEditModeActive) {
                //Render Trails
                if(this.displayTrails) {
                    for(var j = 0; j<this.physicalBodies[i].trailPoints.length - 1;j++) {
                        this.renderer.toRenderObjects.push(new LineRenderObject(this.physicalBodies[i].trailPoints[j], this.physicalBodies[i].trailPoints[j + 1], 0.25));
                    }
                }
            }
        }

        //If edit mode is active render the predicted trails
        if(this.isEditModeActive) {
            let predicted = this.getPredictedPositions(10000, 2000);
            for (let i = 0; i < predicted.length; i++) {
                for(var j = 0; j<predicted[i].length - 1;j++) {
                    this.renderer.toRenderObjects.push(new LineRenderObject(predicted[i][j], predicted[i][j + 1], 0.25, "#ba2318"));
                }
            }
        }

        this.renderer.toRenderUI[0].text = "Simulation has been running for " + DateUtil.secondsToText(Math.round(this.simRuntimeSimTime));
        this.renderer.toRenderUI[1].text = this.paused ? "Play" : "Pause";

        this.renderer.render_frame();
    }

    toggleSimPause() {
        if(this.paused && !this.isEditModeActive) {
            this.playSim();
        }else {
            this.pauseSim();
        }
    }
    
    toggleEditMode() {
        if(this.isEditModeActive) {
            this.isEditModeActive = false;
            this.playSim();
        }else {
            this.isEditModeActive = true;
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