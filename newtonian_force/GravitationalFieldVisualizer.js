class GravitationalFieldVisualizer {
    constructor(renderer) {
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.renderer = renderer;
        this.physicalBodies = [];
        this.testBody = new PhysicalBody(1, 1000000, new Vector2(0, 0), new Vector2(0, 0), "");
        this.lineAmount = 50;
        this.arrowDistance = 7000000;
        this.arrowStartDistance = 100000000;
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
        var count = 0;
        for (let i = 0; i < this.physicalBodies.length; i++) {
            let force = GravitationalSimulation.calculateForce(tempBody, this.physicalBodies[i]);
            let acceleration = GravitationalSimulation.calculateAcceleration(tempBody, this.physicalBodies[i], force);
            finalAcceleration = new Vector2(finalAcceleration.x + acceleration.x, finalAcceleration.y + acceleration.y);
            count +=1;
        }
        return finalAcceleration;
    }

    getFieldPoints(bodies, pointAmount, startDistance, arrowDistance) {
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
        let step = 360 / pointAmount;

        for (let i = 0; i < pointAmount; i++) {
            let radiansAngle = step * i * Math.PI / 180;
            let newPoint = centerPoint.moveAtAngle(radiansAngle, startDistance);
            initialPoints.push(newPoint);
            result.push([newPoint]);
        }

        let safteyCounter = 0;
        while (true) {
            safteyCounter+=1;
            if(safteyCounter == 1000) {
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
                    let radianAngle = this.getAccelerationAtPoint(initialPoints[j]).getAngleRadians();
                    let newPoint = initialPoints[j].moveAtAngle(radianAngle, arrowDistance);
                    initialPoints[j] = newPoint;
                    for (let k = 0; k < bodies.length; k++) {
                        if(newPoint.distanceTo(bodies[k].position) < bodies[k].radius) {
                            initialPoints[j] = undefined;
                        }
                    }
                    result[j].push(newPoint);
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
        let fieldPoints = this.getFieldPoints(this.physicalBodies, this.lineAmount, this.arrowStartDistance, this.arrowDistance);
        for (let i = 0; i < fieldPoints.length; i++) {
            for (let j = 0; j < fieldPoints[i].length - 1; j++) {
                this.renderer.toRenderObjects.push(new ArrowRenderObject(fieldPoints[i][j], fieldPoints[i][j + 1]));
            }
        }

        this.renderer.render_frame();
    }
}