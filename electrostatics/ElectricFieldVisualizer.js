class ElectricFieldVisualizer {
    static electricConstant = 8.988e9;

    constructor(renderer) {
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.renderer = renderer;
        this.particles = [];
        this.testCharge = new Particle(-1.60217662e-19, 1, 2.18e-16, new Vector2(0, 4.7e-15));
        this.lineAmount = 25;
        this.arrowStartDistance = 8e-16;
        this.areLinesColored = false;
    }

    /**
     * Physics tick
     */
    tick() {
        this.render();
    }

    /**
     * Finishes the simulation of this Simulation Object
     */
     destroy() {
        clearInterval(this.interval);
    }

    static calculateForce(particle1, particle2) {
        var distance = particle1.position.distanceTo(particle2.position);
        return ElectricFieldVisualizer.electricConstant * particle1.charge * particle2.charge / Math.pow(distance, 2);
    }

    static calculateDirectionalForce(particle1, particle2, force) {
        //Calculate the direction of the force
        var dir = new Vector2(particle2.position.x - particle1.position.x, 
            particle2.position.y - particle1.position.y);

        //Calculate the magnitude of the force (Square root of the squared and added values)
        var mag = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2));
        var norm = new Vector2(dir.x / mag, dir.y / mag);

        //Calculate the electric potential
        var acceleration = new Vector2(force * norm.x, force * norm.y);

        return acceleration;
    }

    getForceAtPoint(point) {
        let tempParticle = new Particle(-1.60217662e-19, 1, 0, point); //Testparticle
        let finalForce = new Vector2(0, 0);

        for (let i = 0; i < this.particles.length; i++) {
            let force = ElectricFieldVisualizer.calculateForce(tempParticle, this.particles[i]);
            let forceDir = ElectricFieldVisualizer.calculateDirectionalForce(tempParticle, this.particles[i], force);
            finalForce = new Vector2(finalForce.x + forceDir.x, finalForce.y + forceDir.y);
        }
        return finalForce;
    }

    getFieldPoints(particles, pointAmount, startDistance, arrowDistance) {
        let finalResult = [];

       
        let averagePosX = 0;
        let averagePosY = 0;
        for (let i = 0; i < particles.length; i++) {
            averagePosX += particles[i].position.x;
            averagePosY += particles[i].position.y;
        }
        averagePosX /= particles.length;
        averagePosY /= particles.length;

        //Create a cloned version of the original particles array
        let clonedArray = ObjectUtil.clone(particles);

        //Sort the array by charge (calculate the field lines of positivly charged particles first)
        clonedArray.sort(function(a, b) { if(a.charge < 0) {return 1} else { return -1}});

        for (let index = 0; index < clonedArray.length; index++) {
            
            let result = [];
            let initialPoints = [];

            let pointA = clonedArray[index].position;
            let step = 360 / pointAmount;
            for (let i = 0; i < pointAmount; i++) {
                let angle = 1.5708 + step * i * Math.PI / 180;

                let point = pointA.moveAtAngle(angle, clonedArray[index].radius * 1.01);
                if(clonedArray[index].hitpoints != undefined) {
                    let angleCloseToOtherAngle = false;
                    for (let i = 0; i < clonedArray[index].hitpoints.length; i++) {
                        let distance = clonedArray[index].hitpoints[i].distanceTo(point);
                        if(distance < clonedArray[index].radius / 5) {
                            angleCloseToOtherAngle = true;
                            break;
                        }
                    }
                    if(angleCloseToOtherAngle) {
                        continue;
                    }
                }
                initialPoints.push(point);
                result.push([point]);
            }


            let safteyCounter = 0;
            while (true) {
                safteyCounter+=1;
                if(safteyCounter == 700) {
                    break;
                }

                let allUndefined = true;
                for (let i = 0; i < initialPoints.length; i++) {
                    if(initialPoints[i] != undefined) {
                        allUndefined = false;
                        break;
                    }
                }
                if(allUndefined) {
                    break;
                }
                for(let j = 0;j<initialPoints.length;j++) {
                    if(initialPoints[j] != undefined) {
                        let force = this.getForceAtPoint(initialPoints[j]);
                        let radianAngle = force.getAngleRadians();
                        //If the charge is negative, calculate the lines backwards (invert the angle)
                        if(clonedArray[index].charge < 0) {
                            radianAngle -= Math.PI;
                        }
                        let newPoint = initialPoints[j].moveAtAngle(radianAngle, arrowDistance);
                        newPoint["forceAmount"] = force.getMagnitude();
                        initialPoints[j] = newPoint;
                        
                        //Check if the line hits any particle
                        let inRadiusBodyIndex = -1;
                        for (let k = 0; k < clonedArray.length; k++) {
                            if(newPoint.distanceTo(clonedArray[k].position) < clonedArray[k].radius) {
                                inRadiusBodyIndex = k;
                                initialPoints[j] = undefined;
                                break;
                            }
                        }
                        if(inRadiusBodyIndex == -1) {
                            result[j].push(newPoint);
                        }else {
                            let distance = result[j][result[j].length - 1].distanceTo(clonedArray[inRadiusBodyIndex].position);
                            let distanceToBodyBorder = distance - clonedArray[inRadiusBodyIndex].radius;
                            let angleToBody = result[j][result[j].length - 1].angleTo(clonedArray[inRadiusBodyIndex].position);
                            newPoint = result[j][result[j].length - 1].moveAtAngle(angleToBody, distanceToBodyBorder);
                            newPoint["forceAmount"] = force.getMagnitude();
                            result[j].push(newPoint);

                            if(clonedArray[inRadiusBodyIndex].charge < 0) {
                                if(clonedArray[inRadiusBodyIndex].hitpoints == undefined) {
                                    clonedArray[inRadiusBodyIndex].hitpoints = [];
                                }
                                clonedArray[inRadiusBodyIndex].hitpoints.push(newPoint);
                            }
                        }
                    }
                }
            }
            if(clonedArray[index].charge < 0) {
                for (let i = 0; i < result.length; i++) {
                    result[i].reverse();
                }
            }
            finalResult = finalResult.concat(result);
        }
        return finalResult;
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    render() {
        //Reset the render objects
        this.renderer.reset_render_objects();

        //Display Test Charge
        let testBody = new CircleRenderObject(this.testCharge.radius, this.testCharge.position, "#FF0000");
        testBody.addInteractionEvents(undefined, (function(e) {this.testCharge.position = e}).bind(this));
        let acc = this.getForceAtPoint(testBody.position);
        this.acceleration = acc;
        this.testAcc = acc.x / acc.y;
        this.angle = acc.getAngleRadians();
        this.renderer.toRenderObjects.push(new ArrowRenderObject(testBody.position, testBody.position.moveAtAngle(acc.getAngleRadians(), 8e-16), "#FF0000"))
        this.renderer.toRenderObjects.push(testBody);

        //Display all the charges
        for (let i = 0; i < this.particles.length; i++) {
            let body = new CircleRenderObject(this.particles[i].radius, this.particles[i].position);
            let tempIndex = i;
            body.addInteractionEvents(undefined, (function(e) {this.particles[tempIndex].position = e}).bind(this));
            this.renderer.toRenderObjects.push(new TextRenderObject("45px Arial", this.particles[i].charge < 0 ? "-" : "+", body.position, "center"));
            this.renderer.toRenderObjects.push(body);
        }

        
        
        let fieldPoints = this.getFieldPoints(this.particles, this.lineAmount, this.arrowStartDistance, 1e-16);

        let minForce = Number.MAX_VALUE;
        let maxForce = Number.MIN_VALUE;

        for (let i = 0; i < fieldPoints.length; i++) {
            for (let j = 0; j < fieldPoints[i].length; j++) {
                let force = fieldPoints[i][j]["forceAmount"];
                if(force < minForce) {
                    minForce = force;
                }
                if(force > maxForce) {
                    maxForce = force;
                }
            }
        }
        

        for (let i = 0; i < fieldPoints.length; i++) {
            for (let j = 0; j < fieldPoints[i].length - 1; j++) {
                let hexColor = "#000000";
                if(this.areLinesColored) {
                    let factor = ((fieldPoints[i][j].forceAmount - minForce) / (maxForce - minForce))
                    let color = ColorUtil.interpolateColor([0, 189, 252], [255, 0, 0], factor);
                    hexColor = ColorUtil.rgbToHex(color[0], color[1], color[2]);
                }
                
                if(j % 20 == 0 && j != 0) {
                    let angle = fieldPoints[i][j].angleTo(fieldPoints[i][j - 1]);
                    let leftArrowPoint = fieldPoints[i][j].moveAtAngle(angle + 0.785398, 4e-16);
                    let rightArrowPoint = fieldPoints[i][j].moveAtAngle(angle - 0.785398, 4e-16);

                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], leftArrowPoint, 1, hexColor));
                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], rightArrowPoint, 1, hexColor));
                }
                if(j != fieldPoints[i].length - 2) {
                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], fieldPoints[i][j + 1], 1, hexColor));
                }else {
                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], fieldPoints[i][j + 1], 1, hexColor));
                }
            }
        }

        this.renderer.render_frame();
    }
}

class Particle {
    constructor(charge, mass, radius, initialPosition) {
        this.charge = charge;
        this.mass = mass;
        this.radius = radius;
        this.position = initialPosition;
    }
}