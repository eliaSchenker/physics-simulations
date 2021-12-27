/**
 * © 2021 Elia Schenker
 */
class GravitationalFieldVisualizer {
    /**
     * Default Constructor of the GravitationalFieldVisualizer
     * @param {Renderer} renderer 
     */
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

    /**
     * Returns the acceleration on a test body at a point
     * @param {Vector2} point The point
     * @returns The acceleration vector
     */
    getAccelerationAtPoint(point) {
        let tempBody = new PhysicalBody(1, 0, point, new Vector2(0 ,0), ""); //Testbody with mass 1
        let finalAcceleration = new Vector2(0, 0);
        //Iterate through all the bodies and add the acceleration from every body to the final acceleration
        for (let i = 0; i < this.physicalBodies.length; i++) {
            let force = GravitationalSimulation.calculateForce(tempBody, this.physicalBodies[i]);
            let acceleration = GravitationalSimulation.calculateAcceleration(tempBody, this.physicalBodies[i], force);
            finalAcceleration = new Vector2(finalAcceleration.x + acceleration.x, finalAcceleration.y + acceleration.y);
        }
        return finalAcceleration;
    }

    /**
     * Returns an array of field lines
     * @param {Array} bodies The bodies of which to create the field lines
     * @param {Number} pointAmount How many starting points should be generated
     * @param {Number} startDistance How far away should the starting points be generated
     * @param {Number} arrowDistance Distance between the lines generated
     * @returns 
     */
    getFieldLines(bodies, pointAmount, startDistance, arrowDistance) {
        let result = []; //Result array consisting of arrays of points
        let initialPoints = []; //Initial Points array consisting of the starting points of the lines

        //Calculate the average position (barycenter) of the bodies
        let averagePosX = 0;
        let averagePosY = 0;
        for (let i = 0; i < bodies.length; i++) {
            averagePosX += bodies[i].position.x;
            averagePosY += bodies[i].position.y;
        }
        averagePosX /= bodies.length;
        averagePosY /= bodies.length;

        let centerPoint = new Vector2(averagePosX, averagePosY);
        //The angle step in radians is 180 Degrees in radians (PI) divded by the amount of poitns
        let step = Math.PI/ pointAmount;

        //Create the top side of the initial circle
        for (let i = 0; i < pointAmount; i++) {
            let radiansAngle = Math.PI / 2 + step * i - Math.PI / 2;
            let newPoint = centerPoint.moveAtAngle(radiansAngle, startDistance);
            initialPoints.push(newPoint);
            result.push([newPoint]);
        }

        //Create the bottom side of the initial circle
        for (let i = 0; i < pointAmount; i++) {
            let radiansAngle = Math.PI / 2 + step * i + Math.PI / 2;
            let newPoint = centerPoint.moveAtAngle(radiansAngle, startDistance);
            initialPoints.push(newPoint);
            result.push([newPoint]);
        }

        //Draw the lines
        let safteyCounter = 0;
        while (true) {
            safteyCounter+=1;
            if(safteyCounter == 200) {
                break;
            }

            //If all the inital points are undefined, all the lines have arrived inside a body, in which case the calculation is finished
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

            //Iterate through all the inital points
            for(let j = 0;j<initialPoints.length;j++) {
                if(initialPoints[j] != undefined) {
                    //Calculate the force at this point
                    let acceleration = this.getAccelerationAtPoint(initialPoints[j]);
                    let radianAngle = acceleration.getAngleRadians();
                    //Calculate the new point by moving the original point by a distance at the force angle
                    let newPoint = initialPoints[j].moveAtAngle(radianAngle, arrowDistance);
                    //Replace the initialpoint with the new point
                    initialPoints[j] = newPoint;
                    
                    //Check if the new point lies within any of the bodies
                    let inRadiusBodyIndex = -1;
                    for (let k = 0; k < bodies.length; k++) {
                        //By checking if the distance to the body is smaller than its radius
                        if(newPoint.distanceTo(bodies[k].position) < bodies[k].radius) {
                            inRadiusBodyIndex = k;
                            initialPoints[j] = undefined; //Set this initialPoint to undefined so that no more lines will be drawn from it
                        }
                    }

                    //If the point lies within a body calculate the distance to the border (circle) of the body
                    if(inRadiusBodyIndex != -1) {
                        
                        let distance = result[j][result[j].length - 1].distanceTo(bodies[inRadiusBodyIndex].position);
                        let distanceToBodyBorder = distance - bodies[inRadiusBodyIndex].radius;
                        let angleToBody = result[j][result[j].length - 1].angleTo(bodies[inRadiusBodyIndex].position);
                        //And update the newPoint to the point which lies on the circle
                        newPoint = result[j][result[j].length - 1].moveAtAngle(angleToBody, distanceToBodyBorder);
                    }
                    //Add the force magnitude to the body (for calculating the color later)
                    newPoint["forceAmount"] = acceleration.getMagnitude();
                    result[j].push(newPoint); //Add the point to the result array
                }
            }
        }
        return result;
    }

    /**
     * Adds a body to the simulation
     * @param {PhysicalBody} body 
     */
    addBody(body) {
        this.physicalBodies.push(body);
    }

    /**
     * Renders the frame
     */
    render() {
        this.renderer.reset_render_objects(); //Reset the render objects in the Renderer

        //Iterate through the bodies of the simulation and draw them
        for (let i = 0; i < this.physicalBodies.length; i++) {
            let body = new CircleRenderObject(this.physicalBodies[i].radius, this.physicalBodies[i].position);
            let tempIndex = i;
            body.addInteractionEvents(undefined, (function(e) {this.physicalBodies[tempIndex].position = e}).bind(this)); //Add the drag event
            this.renderer.toRenderObjects.push(body);
        }

        //Display Test Charge
        let testBody = new CircleRenderObject(this.testBody.radius, this.testBody.position, "#FF0000");
        testBody.addInteractionEvents(undefined, (function(e) {this.testBody.position = e}).bind(this));
        let acc = this.getAccelerationAtPoint(testBody.position);
        this.angle = acc.getAngleRadians();
        this.renderer.toRenderObjects.push(new ArrowRenderObject(testBody.position, testBody.position.moveAtAngle(acc.getAngleRadians(), 5000000), "#FF0000"))
        this.renderer.toRenderObjects.push(testBody);

        //Calculate field lines
        let fieldPoints = this.getFieldLines(this.physicalBodies, this.lineAmount, this.arrowStartDistance, 1000000);
        
        //Calculate minimum and maximum force of the lines to color code them
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

        //Draw the field points
        for (let i = 0; i < fieldPoints.length; i++) {
            for (let j = 0; j < fieldPoints[i].length - 1; j++) {
                let hexColor = "#000000";
                //If the line coloring is on
                if(this.areLinesColored) {
                    //Calculate the factor of the force between 0 and 1 (0=minimum force, 1=maximum force)
                    let factor = ((fieldPoints[i][j].forceAmount - minForce) / (maxForce - minForce))
                    //Interpolate between the two colors using the factor
                    let color = ColorUtil.interpolateColor([0, 189, 252], [255, 0, 0], factor);
                    //Convert the color to hex
                    hexColor = ColorUtil.rgbToHex(color[0], color[1], color[2]);
                }

                //Draw an arrowhead every 20 points
                if(j % 20 == 0 && j != 0) {
                    //Calculate the arrow head points by adding/subtracting 45 degrees (0.78 radians) from the line angle
                    let angle = fieldPoints[i][j].angleTo(fieldPoints[i][j - 1]);
                    let leftArrowPoint = fieldPoints[i][j].moveAtAngle(angle + 0.785398, 1000000);
                    let rightArrowPoint = fieldPoints[i][j].moveAtAngle(angle - 0.785398, 1000000);

                    //Push the render objects
                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], leftArrowPoint, 1, hexColor));
                    this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], rightArrowPoint, 1, hexColor));
                }
                this.renderer.toRenderObjects.push(new LineRenderObject(fieldPoints[i][j], fieldPoints[i][j + 1], 1, hexColor));
            }
        }

        this.renderer.render_frame();
    }
}