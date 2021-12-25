class MagneticSimulation {
    constructor(renderer) {
        this.magnets = [];
        this.renderer = renderer;
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.paused = false;
        this.lastTickEnd = new Date();
        this.compassPosition = new Vector2(0, -0.025);
    }

    tick() {
        if(!this.paused) {
           
        }
        this.render();
    }

    addMagnet(magnet) {
        this.magnets.push(magnet);
    }

    destroy() {
        clearInterval(this.interval);
    }

    /**
     * Calculates the force a pole has on another
     * @param {Magnet} magnet1 First Magnet
     * @param {Magnet} magnet2 Second Magnet
     * @param {Boolean} magnet1NorthPole [true=North Pole, false=South Pole]
     * @param {Boolean} magnet2NorthPole [true=North Pole, false=South Pole]
     */
    getForceOnMagneticPole(magnet1, magnet2, magnet1NorthPole, magnet2NorthPole) {
        let magnet1Charge = magnet1NorthPole ? magnet1.northPoleMagneticMagnitude : magnet1.southPoleMagneticMagnitude;
        let magnet2Charge = magnet2NorthPole ? magnet2.northPoleMagneticMagnitude : magnet2.southPoleMagneticMagnitude;
        let magnet1PolePoint = magnet1NorthPole ? magnet1.getNorthPolePoint() : magnet1.getSouthPolePoint();
        let magnet2PolePoint = magnet2NorthPole ? magnet2.getNorthPolePoint() : magnet2.getSouthPolePoint()
        let distance = magnet1PolePoint.distanceTo(magnet2PolePoint);
        let force = -1 * magnet1.permeability * magnet1Charge * magnet2Charge / (4 * Math.PI * distance);

        //Calculate the direction of the force
        var dir = new Vector2(magnet2PolePoint.x - magnet1PolePoint.x, magnet2PolePoint.y - magnet1PolePoint.y);
        
        //Calculate the magnitude of the force (Square root of the squared and added values)
        var mag = dir.getMagnitude();
        //Normalized force direction
        var norm = new Vector2(dir.x / mag, dir.y / mag);

        //Return the force as a vector
        return new Vector2(force * norm.x, force * norm.y);
    }

    getForceAtPoint(point) {
        let testMagnet = new Magnet(point, 0, 0, 0, 1, 1);
        let totalForce = new Vector2(0, 0);
        for (let i = 0; i < this.magnets.length; i++) {
            let northNorthForce = this.getForceOnMagneticPole(testMagnet, this.magnets[i], true, true);
            let northSouthForce = this.getForceOnMagneticPole(testMagnet, this.magnets[i], true, false);
            totalForce = new Vector2(totalForce.x + (northNorthForce.x + northSouthForce.x) / 2,
                                     totalForce.y + (northNorthForce.y + northSouthForce.y) / 2)
        }
        return totalForce;
    }

    getMagneticFieldLines(magnet, initialPointCount, distanceBetweenPoints, pointAmount) {
        let initialPoints = [];
        let initialReversePoints = [];

        let reverseResultPoints = [];
        let resultPoints = [];

        //Calculate the initial points of the field lines
        let pointCountPerSide = Math.round(initialPointCount / 3 - 1);

        let cornerPoints = magnet.getCornerPoints();
        let topStep = cornerPoints[0].distanceTo(cornerPoints[1]) / pointCountPerSide / 2;
        for (let i = 0; i <= pointCountPerSide; i++) {
            let newPoint = cornerPoints[0].moveTowardsPoint(cornerPoints[1], topStep * i);
            initialPoints.push(newPoint);
            resultPoints.push([newPoint]);
            //this.renderer.toRenderObjects.push(new CircleRenderObject(0.0025, initialPoints.at(-1), "#FF0000"));
        }

        let leftSideStep = cornerPoints[0].distanceTo(cornerPoints[2]) / pointCountPerSide;
        for (let i = 0; i <= pointCountPerSide; i++) {
            let newPoint = cornerPoints[0].moveTowardsPoint(cornerPoints[2], leftSideStep * i);
            initialPoints.push(newPoint);
            resultPoints.push([newPoint]);
            //this.renderer.toRenderObjects.push(new CircleRenderObject(0.0025, initialPoints.at(-1), "#00FF00"));
        }

        let bottomStep = cornerPoints[2].distanceTo(cornerPoints[3]) / pointCountPerSide / 2;
        for (let i = 0; i <= pointCountPerSide; i++) {
            let newPoint = cornerPoints[2].moveTowardsPoint(cornerPoints[3], bottomStep * i);
            initialPoints.push(newPoint);
            resultPoints.push([newPoint]);
            //this.renderer.toRenderObjects.push(new CircleRenderObject(0.0025, initialPoints.at(-1), "#0000FF"));
        }

        let reversePoint = cornerPoints[1].moveTowardsPoint(cornerPoints[3], magnet.height / 2);
        initialReversePoints.push(reversePoint);
        reverseResultPoints.push([reversePoint]);

        for (let i = 0; i < pointAmount; i++) {
            for (let j = 0; j < initialPoints.length; j++) {
                if(initialPoints[j] != undefined) {
                    let force = this.getForceAtPoint(initialPoints[j]);
                    let angle = force.getAngleRadians();
                    let newPoint = initialPoints[j].moveAtAngle(angle, distanceBetweenPoints);
                    if(newPoint.isPointInRectangle([cornerPoints[0], cornerPoints[1], cornerPoints[3], cornerPoints[2]])) {
                        initialPoints[j] = undefined;
                    }else {
                        initialPoints[j] = newPoint;
                        resultPoints[j].push(newPoint);
                    }
                }
            }
            for (let j = 0; j < initialReversePoints.length; j++) {
                if(initialReversePoints[j] != undefined) {
                    let force = this.getForceAtPoint(initialReversePoints[j]);
                    let angle = force.getAngleRadians() - Math.PI;
                    let newPoint = initialReversePoints[j].moveAtAngle(angle, distanceBetweenPoints);
                    if(newPoint.isPointInRectangle([cornerPoints[0], cornerPoints[1], cornerPoints[3], cornerPoints[2]])) {
                        initialReversePoints[j] = undefined;
                    }else {
                        initialReversePoints[j] = newPoint;
                        reverseResultPoints[j].push(newPoint);
                    }
                }
            }
        }
        //Reverse the reverse result points so that the arrows point in the corect direction
        for (let i = 0; i < reverseResultPoints.length; i++) {
            reverseResultPoints[i].reverse();
        }
        return resultPoints.concat(reverseResultPoints);
    }

    physicsTick() {
        var currentTickStart = new Date(); 
        
        //Based on this, calculate the time difference between the next tick
        let deltaT = (currentTickStart.getTime() - this.lastTickEnd.getTime()) / 1000;

        for (let i = 0; i < this.magnets.length; i++) {
            let finalForce = new Vector2(0, 0);
            for (let j = 0; j < this.magnets.length; j++) {
                if(j != i) {
                    //Calculate the forces acting between the different poles
                    let northNorthForce = this.getForceOnMagneticPole(this.magnets[i], this.magnets[j], true, true);
                    let northSouthForce = this.getForceOnMagneticPole(this.magnets[i], this.magnets[j], true, false);
                    let southNorthForce = this.getForceOnMagneticPole(this.magnets[i], this.magnets[j], false, true);
                    let southSouthForce = this.getForceOnMagneticPole(this.magnets[i], this.magnets[j], false, false);

                    let avgForce = new Vector2((northNorthForce.x + northSouthForce.x + southNorthForce.x + southSouthForce.x) / 4, (northNorthForce.y + northSouthForce.y + southNorthForce.y + southSouthForce.y) / 4);
                    finalForce = new Vector2(finalForce.x + avgForce.x, finalForce.y + avgForce.y);

                    this.renderer.toRenderObjects.push(new ArrowRenderObject(this.magnets[i].getNorthPolePoint(), this.magnets[i].getNorthPolePoint().moveAtAngle(northNorthForce.getAngleRadians(), 0.025)));
                    this.renderer.toRenderObjects.push(new ArrowRenderObject(this.magnets[i].getNorthPolePoint(), this.magnets[i].getNorthPolePoint().moveAtAngle(northSouthForce.getAngleRadians(), 0.025)));
                    this.renderer.toRenderObjects.push(new ArrowRenderObject(this.magnets[i].getSouthPolePoint(), this.magnets[i].getSouthPolePoint().moveAtAngle(southNorthForce.getAngleRadians(), 0.025)));
                    this.renderer.toRenderObjects.push(new ArrowRenderObject(this.magnets[i].getSouthPolePoint(), this.magnets[i].getSouthPolePoint().moveAtAngle(southSouthForce.getAngleRadians(), 0.025)));
                }
            }
            this.magnets[i].applyForceToMagnet(finalForce, deltaT);
            this.magnets[i].updatePosition(deltaT);
            this.magnets[i].applyFriction();
        }
        this.lastTickEnd = new Date();
    }

    render() {
        this.renderer.reset_render_objects();
        if(!this.paused) {
        this.physicsTick();
        }
        for (let i = 0; i < this.magnets.length; i++) {
            let magnetPoints = this.magnets[i].getCornerPoints();
            let topMiddlePoint = new Vector2((magnetPoints[0].x + magnetPoints[1].x) / 2, (magnetPoints[0].y + magnetPoints[1].y) / 2);
            let bottomMiddlePoint = new Vector2((magnetPoints[2].x + magnetPoints[3].x) / 2, (magnetPoints[2].y + magnetPoints[3].y) / 2);
            
            //Render North Pole of the Magnet
            let northPolePoints = [magnetPoints[0], topMiddlePoint, bottomMiddlePoint, magnetPoints[2], magnetPoints[0]];

            //Render South Pole of the Magnet
            let southPolePoints = [magnetPoints[1], topMiddlePoint, bottomMiddlePoint, magnetPoints[3], magnetPoints[1]];
            
            this.renderer.toRenderObjects.push(new PolygonRenderObject(northPolePoints, true, "#eb4034"));
            this.renderer.toRenderObjects.push(new PolygonRenderObject(southPolePoints, true, "#0acc17"));
            let borderObject = new PolygonRenderObject([magnetPoints[0], magnetPoints[1], magnetPoints[3], magnetPoints[2]]);
            let currentIndex = i;
            borderObject.addInteractionEvents(undefined, (
                function(e) {
                    this.magnets[currentIndex].centerPosition = e;
                    this.magnets[currentIndex].fixPosition = true;
                }).bind(this), (function() {
                    this.magnets[currentIndex].fixPosition = false;
                }).bind(this));
            this.renderer.toRenderObjects.push(borderObject);

            this.renderer.toRenderObjects.push(new TextRenderObject("20px Arial", "N", this.magnets[i].getNorthPolePoint(), "center"));
            this.renderer.toRenderObjects.push(new TextRenderObject("20px Arial", "S", this.magnets[i].getSouthPolePoint(), "center"));
        }
        for (let i = 0; i < this.magnets.length; i++) {
            let lines = this.getMagneticFieldLines(this.magnets[i], 20, 0.0008, 2000);
            for (let j = 0; j < lines.length; j++) {
                for (let k = 0; k < lines[j].length - 1; k++) {
                    if(k % 50 == 0 && k != 0) {
                        let angle = lines[j][k].angleTo(lines[j][k - 1]);
                        let leftArrowPoint = lines[j][k].moveAtAngle(angle + 0.785398, 0.0025);
                        let rightArrowPoint = lines[j][k].moveAtAngle(angle - 0.785398, 0.0025);

                        this.renderer.toRenderObjects.push(new LineRenderObject(lines[j][k], leftArrowPoint, 1));
                        this.renderer.toRenderObjects.push(new LineRenderObject(lines[j][k], rightArrowPoint, 1));
                    }
                    this.renderer.toRenderObjects.push(new LineRenderObject(lines[j][k], lines[j][k + 1]));
                }
            }
        }

        //Render the compass
        let forceOnCompass = this.getForceAtPoint(this.compassPosition);
        let compassRadius = 0.01;
        let forceAngle = forceOnCompass.getAngleRadians() - Math.PI;
        //Outer compass circle
        let outerCompassCircle = new CircleRenderObject(compassRadius, this.compassPosition, "#999999", true);
        outerCompassCircle.addInteractionEvents(undefined, (function(e) { this.compassPosition = e;}).bind(this));
        //Inner compass circle
        let innerCompassCircle = new CircleRenderObject(compassRadius * 0.9, this.compassPosition, "#cfcfcf", true);

        let northNeedle = new PolygonRenderObject([this.compassPosition.moveAtAngle(forceAngle, compassRadius * 0.75), 
                                                   this.compassPosition.moveAtAngle(forceAngle + 1.5708, compassRadius * 0.2),
                                                   this.compassPosition.moveAtAngle(forceAngle - 1.5708, compassRadius * 0.2)], true, "#ff4d4d");
        let southNeedle = new PolygonRenderObject([this.compassPosition.moveAtAngle(forceAngle + Math.PI, compassRadius * 0.75), 
                                                   this.compassPosition.moveAtAngle(forceAngle + 1.5708, compassRadius * 0.2),
                                                   this.compassPosition.moveAtAngle(forceAngle - 1.5708, compassRadius * 0.2)], true, "#ffffff");

        this.renderer.toRenderObjects.push(outerCompassCircle);
        this.renderer.toRenderObjects.push(innerCompassCircle);
        this.renderer.toRenderObjects.push(northNeedle);
        this.renderer.toRenderObjects.push(southNeedle);
        
        this.renderer.render_frame();
    }
}

class Magnet {
    /**
     * Default Constructor of the magnet class
     * @param {Vector2} centerPosition Center position of the magnet
     * @param {Number} rotation Rotation of the magnet in radians
     * @param {Number} width Width of the magnet
     * @param {Number} height height of the magnet
     * @param {Number} northPoleMagneticMagnitude Charge of the north pole (ampere-meter)
     * @param {Number} southPoleMagneticMagnitude Charge of the south pole (ampere-meter)
     * @param {Number} permeability Permeability
     * @param {Number} mass Mass
     */
    constructor(centerPosition, rotation, width, height, northPoleMagneticMagnitude=80, southPoleMagneticMagnitude=-80, permeability=6.3e-3, mass=1) {
        this.centerPosition = centerPosition;
        this.rotation = rotation;
        this.width = width;
        this.velocity = new Vector2(0, 0);
        this.height = height;
        this.northPoleMagneticMagnitude = northPoleMagneticMagnitude;
        this.southPoleMagneticMagnitude = southPoleMagneticMagnitude;
        this.permeability = permeability;
        this.mass = mass;
        this.fixPosition = false;
    }

    getNorthPolePoint() {
        let point = new Vector2(this.centerPosition.x - this.width / 4, this.centerPosition.y);
        return point.rotateAroundPoint(this.centerPosition, this.rotation);
    }

    getSouthPolePoint() {
        let point = new Vector2(this.centerPosition.x + this.width / 4, this.centerPosition.y);
        return point.rotateAroundPoint(this.centerPosition, this.rotation); 
    }

    getCornerPoints() {
        let leftTopCornerPoint = new Vector2(this.centerPosition.x - this.width / 2, this.centerPosition.y + this.height / 2);
        let rightTopCornerPoint = new Vector2(this.centerPosition.x + this.width / 2, this.centerPosition.y + this.height / 2);
        let leftBottomCornerPoint = new Vector2(this.centerPosition.x - this.width / 2, this.centerPosition.y - this.height / 2);
        let rightBottomCornerPoint = new Vector2(this.centerPosition.x + this.width / 2, this.centerPosition.y - this.height / 2);
        return [leftTopCornerPoint.rotateAroundPoint(this.centerPosition, this.rotation),
                rightTopCornerPoint.rotateAroundPoint(this.centerPosition, this.rotation),
                leftBottomCornerPoint.rotateAroundPoint(this.centerPosition, this.rotation),
                rightBottomCornerPoint.rotateAroundPoint(this.centerPosition, this.rotation)];
    }

    applyForceToMagnet(force, deltaT) {
        if(!this.fixPosition) {
            this.velocity = new Vector2(this.velocity.x + force.x * deltaT, 
                this.velocity.y + force.y * deltaT);
        }
    }

    updatePosition(deltaT) {
        if(!this.fixPosition) {
            this.centerPosition = new Vector2(this.centerPosition.x + this.velocity.x * deltaT,
                this.centerPosition.y + this.velocity.y * deltaT);
        }
    }
    
    applyFriction() {
        if(!this.fixPosition) {
            this.velocity = new Vector2(this.velocity.x * 0.99, this.velocity.y * 0.99);
        }
    }

    applyForceToNorthPole() {

    }

    applyForceToSouthPole() {

    }
}