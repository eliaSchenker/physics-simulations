class GravitationalFieldVisualizer {
    constructor(renderer) {
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.renderer = renderer;
        this.physicalBodies = [];
        this.lineAmount = 50;
        this.arrowStartDistance = 100000000;
        this.areLinesColored = false;
        this.testBody = new PhysicalBody(1, 1000000, new Vector2(0, 40000000), new Vector2(0, 0), "");
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

    getAccelerationAtPoint(point) {
        let tempBody = new PhysicalBody(1, 0, point, new Vector2(0 ,0), "");
        let finalAcceleration = new Vector2(0, 0);
        for (let i = 0; i < this.physicalBodies.length; i++) {
            let force = GravitationalSimulation.calculateForce(tempBody, this.physicalBodies[i]);
            let acceleration = GravitationalSimulation.calculateAcceleration(tempBody, this.physicalBodies[i], force);
            finalAcceleration = new Vector2(finalAcceleration.x + acceleration.x, finalAcceleration.y + acceleration.y);
        }
        return finalAcceleration;
    }

    getFieldLines(bodies, pointAmount, startDistance, arrowDistance) {
        let result = []; //Result array consisting of arrays of points
        let initialPoints = [];
        let averagePosX = 0;
        let averagePosY = 0;
        for (let i = 0; i < bodies.length; i++) {
            averagePosX += bodies[i].position.x;
            averagePosY += bodies[i].position.y;
        }
        averagePosX /= bodies.length;
        averagePosY /= bodies.length;

        let centerPoint = new Vector2(averagePosX, averagePosY);
        let step = Math.PI/ pointAmount

        for (let i = 0; i < pointAmount; i++) {
            let radiansAngle = Math.PI / 2 + step * i - Math.PI / 2;
            let newPoint = centerPoint.moveAtAngle(radiansAngle, startDistance);
            if(i == 0) {
            this.renderer.toRenderObjects.push(new CircleRenderObject(1000000, newPoint))
            }
            initialPoints.push(newPoint);
            result.push([newPoint]);
        }

        for (let i = 0; i < pointAmount; i++) {
            let radiansAngle = Math.PI / 2 + step * i + Math.PI / 2;
            let newPoint = centerPoint.moveAtAngle(radiansAngle, startDistance);
            if(i == 0) {
            this.renderer.toRenderObjects.push(new CircleRenderObject(1000000, newPoint))
            }
            initialPoints.push(newPoint);
            result.push([newPoint]);
        }

        let safteyCounter = 0;
        while (true) {
            safteyCounter+=1;
            if(safteyCounter == 200) {
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
                    let acceleration = this.getAccelerationAtPoint(initialPoints[j]);
                    let radianAngle = acceleration.getAngleRadians();
                    let newPoint = initialPoints[j].moveAtAngle(radianAngle, arrowDistance);
                    initialPoints[j] = newPoint;
                    
                    let inRadiusBodyIndex = -1;
                    for (let k = 0; k < bodies.length; k++) {
                        if(newPoint.distanceTo(bodies[k].position) < bodies[k].radius) {
                            inRadiusBodyIndex = k;
                            initialPoints[j] = undefined;
                        }
                    }
                    if(inRadiusBodyIndex == -1) {
                        newPoint["forceAmount"] = acceleration.getMagnitude();
                        result[j].push(newPoint);
                    }else {
                        let distance = result[j][result[j].length - 1].distanceTo(bodies[inRadiusBodyIndex].position);
                        let distanceToBodyBorder = distance - bodies[inRadiusBodyIndex].radius;
                        let angleToBody = result[j][result[j].length - 1].angleTo(bodies[inRadiusBodyIndex].position);
                        newPoint = result[j][result[j].length - 1].moveAtAngle(angleToBody, distanceToBodyBorder);
                        newPoint["forceAmount"] = acceleration.getMagnitude();
                        result[j].push(newPoint);
                    }
                }
            }
        }
        return result;
    }

    addBody(body) {
        this.physicalBodies.push(body);
    }

    render() {
        this.renderer.reset_render_objects();
        for (let i = 0; i < this.physicalBodies.length; i++) {
            let body = new CircleRenderObject(this.physicalBodies[i].radius, this.physicalBodies[i].position);
            let tempIndex = i;
            body.addInteractionEvents(undefined, (function(e) {this.physicalBodies[tempIndex].position = e}).bind(this));
            this.renderer.toRenderObjects.push(body);
        }

        //Display Test Charge
        let testBody = new CircleRenderObject(this.testBody.radius, this.testBody.position, "#FF0000");
        testBody.addInteractionEvents(undefined, (function(e) {this.testBody.position = e}).bind(this));
        let acc = this.getAccelerationAtPoint(testBody.position);
        this.angle = acc.getAngleRadians();
        this.renderer.toRenderObjects.push(new ArrowRenderObject(testBody.position, testBody.position.moveAtAngle(acc.getAngleRadians(), 5000000), "#FF0000"))
        this.renderer.toRenderObjects.push(testBody);

        
        let fieldPoints = this.getFieldLines(this.physicalBodies, this.lineAmount, this.arrowStartDistance, 1000000);
        
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
                    let leftArrowPoint = fieldPoints[i][j].moveAtAngle(angle + 0.785398, 1000000);
                    let rightArrowPoint = fieldPoints[i][j].moveAtAngle(angle - 0.785398, 1000000);

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