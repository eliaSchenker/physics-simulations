class ElectricalCircuitVisualizer {
    constructor(renderer) {
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.renderer = renderer;
        this.startPoint = new CircuitStartPoint(new Vector2(-5, 5));
        this.endPoint = new CircuitEndPoint(new Vector2(20, 0.5));
        let r1 = new Resistor(new Vector2(1.5, 7.5), 200);
        let r2 = new Resistor(new Vector2(10, 5), 100);
        let r3 = new Resistor(new Vector2(10, 0), 125);
        let r4 = new Resistor(new Vector2(10, -5), 500);
        let r5 = new Resistor(new Vector2(5, -12), 1000);
        this.startPoint.addConnection(r1);
        this.startPoint.addConnection(r5);
        r1.addConnection(r2);
        r1.addConnection(r3);
        r1.addConnection(r4);
        r2.addConnection(this.endPoint);
        r3.addConnection(this.endPoint);
        r4.addConnection(this.endPoint);
        r5.addConnection(this.endPoint);
        this.resistors = [r1, r2, r3, r4, r5];

        this.isConnecting = false;
        //testResistor.addConnection(testResistor2);
        //testResistor2.addConnection(this.endPoint)

        this.initUI();

        //Initialize the tick interval
        this.interval = setInterval(this.tick.bind(this), 0.01);

        //Initialize modes (currentMode can be add, edit, connect, rotate, delete)
        this.currentMode = "";
    }


    initUI() {
        this.addButton = new UIButton(true, new Vector2(10, 10), "Add", "20px Arial", (function() {this.toggleMode("add"); }).bind(this), "left", "top");
        this.editButton = new UIButton(true, new Vector2(70, 10), "Edit", "20px Arial", (function() {this.toggleMode("edit"); }).bind(this), "left", "top");
        this.connectButton = new UIButton(true, new Vector2(130, 10), "Connect", "20px Arial", (function() {this.toggleMode("connect"); }).bind(this), "left", "top");
        this.rotateButton = new UIButton(true, new Vector2(230, 10), "Rotate", "20px Arial", (function() {this.toggleMode("rotate"); }).bind(this), "left", "top");
        this.deleteButton = new UIButton(true, new Vector2(315, 10), "Delete", "20px Arial", (function() {this.toggleMode("delete"); }).bind(this), "left", "top");
        this.renderer.toRenderUI.push(this.addButton);
        this.renderer.toRenderUI.push(this.editButton);
        this.renderer.toRenderUI.push(this.connectButton);
        this.renderer.toRenderUI.push(this.rotateButton);
        this.renderer.toRenderUI.push(this.deleteButton);
    }

    toggleMode(modeName) {
        this.currentMode = this.currentMode == modeName ? "" : modeName;
    }

    /**
     * Finishes the simulation of this Simulation Object
     */
    destroy() {
        clearInterval(this.interval);
    }

    tick () {
        this.renderFrame();
    }

    renderFrame() {
        this.renderer.reset_render_objects();

        //Create the start and end point render objects
        let startPointRenderObject = new CircleRenderObject(1, this.startPoint.position);
        let endPointRenderObject = new CircleRenderObject(1, this.endPoint.position);
        //Register drag events for the render objects
        if(this.currentMode == "connect") {
            startPointRenderObject.addInteractionEvents(undefined, (function(e) { 
                this.isConnecting = true; 
                this.connectionObject = this.startPoint; 
                this.connectionPosition = e;}).bind(this));
            
            endPointRenderObject.addInteractionEvents(undefined, undefined, undefined, 
                (function() {
                    if(this.isConnecting) {
                        this.isConnecting = false; 
                        this.connectionObject.addConnection(this.endPoint); 
                    }
                }).bind(this));
            this.renderer.globalMouseUpEvent = (function() {this.isConnecting = false;}).bind(this);
        }else {
            startPointRenderObject.addInteractionEvents(undefined, (function(e) { this.startPoint.position = e}).bind(this));
            endPointRenderObject.addInteractionEvents(undefined, (function(e) { this.endPoint.position = e}).bind(this));
        }
        //Add the start and end point to the render queue
        this.renderer.toRenderObjects.push(startPointRenderObject);
        this.renderer.toRenderObjects.push(endPointRenderObject);
        this.renderer.toRenderObjects.push(new TextRenderObject("25px Arial", "+", this.startPoint.position, "center"));
        this.renderer.toRenderObjects.push(new TextRenderObject("25px Arial", "-", this.endPoint.position, "center"));

        //Renderer all the resistors
        for (let i = 0; i < this.resistors.length; i++) {
            let resistorCornerPoints = this.resistors[i].getCornerPoints();
            let resistorDrawObject = new PolygonRenderObject([resistorCornerPoints[0], resistorCornerPoints[2], resistorCornerPoints[3], resistorCornerPoints[1]]);
            let tempIndex = i;

            if(this.currentMode == "") {
                resistorDrawObject.addInteractionEvents(undefined, (function(e) { this.resistors[tempIndex].position = e}).bind(this));
            }else if(this.currentMode == "edit") {
                resistorDrawObject.addInteractionEvents((function() { this.resistors[tempIndex].value = parseInt(prompt("Bitte den Widerstand in Ohm angeben:", ""));renderer.isDragging = false;}).bind(this));
            }else if(this.currentMode == "rotate") {
                resistorDrawObject.addInteractionEvents((function() { this.resistors[tempIndex].rotation += this.resistors[tempIndex].rotation == Math.PI / 2 ? -Math.PI / 2 : Math.PI / 2}).bind(this));
            }else if(this.currentMode == "delete") {
                resistorDrawObject.addInteractionEvents((function() { this.deleteResistor(tempIndex)}).bind(this));
            }else if(this.currentMode == "connect") {
                resistorDrawObject.addInteractionEvents(undefined, (function(e) { 
                    this.isConnecting = true; 
                    this.connectionObject = this.resistors[tempIndex]; 
                    this.connectionPosition = e;}).bind(this), 
                    undefined,
                    (function() {
                        if(this.isConnecting) {
                            this.isConnecting = false; this.connectionObject.addConnection(this.resistors[tempIndex])
                        }
                    }).bind(this));
            }

            this.renderer.toRenderObjects.push(resistorDrawObject);
            this.renderer.toRenderObjects.push(new TextRenderObject("25px Arial", "R" + (tempIndex + 1) + " " + this.resistors[i].value + "Ω", this.resistors[i].position, "center"));
        }

        if(this.isConnecting) {
            let lineStartPoint = this.calculateInputOutputPoints(this.connectionObject, new Resistor(this.connectionPosition, 0))[0];
            this.renderer.toRenderObjects.push(new LineRenderObject(lineStartPoint, this.connectionPosition));
        }

        //Render all circuit lines
        let lines = this.getAllCircuitLines();
        for (let i = 0; i < lines.length; i++) {
            this.renderer.toRenderObjects.push(lines[i]);
        }

        //Update UI
        //Set the button color based on if the mode is active
        this.addButton.color = this.currentMode == "add" ? "#3d87ff" : "#D3D3D3";
        this.editButton.color = this.currentMode == "edit" ? "#3d87ff" : "#D3D3D3";
        this.connectButton.color = this.currentMode == "connect" ? "#3d87ff" : "#D3D3D3";
        this.rotateButton.color = this.currentMode == "rotate" ? "#3d87ff" : "#D3D3D3";
        this.deleteButton.color = this.currentMode == "delete" ? "#3d87ff" : "#D3D3D3";

        this.reff = this.calculateEffectiveResistance();

        this.renderer.render_frame();
    }

    deleteResistor(index) {
        this.deleteResistorInConnections(index);
        this.resistors.splice(index, 1);
    }

    deleteResistorInConnections(index, circuitObject=this.startPoint) {
        let childrenConnection = circuitObject.connections;
        for (let i = 0; i < childrenConnection.length; i++) {
            this.deleteResistorInConnections(index, childrenConnection[i]);
            if(childrenConnection[i] == this.resistors[index]) {
                childrenConnection.splice (i, 1);
                break;
            }
        }
    }

    deleteConnection(circuitObject1, circuitObject2) {
        let childrenConnection = circuitObject1.connections;
        for (let i = 0; i < childrenConnection.length; i++) {
            if(childrenConnection[i] == circuitObject2) {
                childrenConnection.splice (i, 1);
                break;
            }
        }
    }

    /**
     * Returns all connections of a circuitObject
     * @param {CircuitObject} circuitObject 
     */
    getAllResistors(circuitObject=this.startPoint) {
        let result = [];
        let childrenConnection = circuitObject.connections;
        for (let i = 0; i < childrenConnection.length; i++) {
            if(!(childrenConnection[i] instanceof CircuitEndPoint)) {
                result.push(childrenConnection[i]);
                let children = this.getAllResistors(childrenConnection[i]);
                result = result.concat(children);
            }
        }
        return result;
    }

    getAllCircuitLines() {
        let result = [];
        let array = [this.startPoint].concat(this.resistors);
        array.push(this.endPoint);

        for (let i = 0; i < array.length; i++) {
            let childrenConnection = array[i].connections;
            for (let j = 0; j < childrenConnection.length; j++) {
                let inputOutputPoints = this.calculateInputOutputPoints(array[i], childrenConnection[j]);
                let circuitLines = this.calculateCircuitLine(inputOutputPoints[0], inputOutputPoints[1]);

                //If the delete mode is active, add a click event on the connecting lines which deletes the connection
                if(this.currentMode == "delete") {
                    for (let k = 0; k < circuitLines.length; k++) {
                        let tempIndexI = i;
                        let tempIndexJ = j;
                        circuitLines[k].addInteractionEvents((function() { this.deleteConnection(array[tempIndexI], childrenConnection[tempIndexJ])}).bind(this));
                    }
                }

                result = result.concat(circuitLines);
            }
        }

        return result;
    }

    calculateInputOutputPoints(circuitObject1, circuitObject2) {
        let startPoint;
        if(circuitObject1 instanceof CircuitStartPoint || circuitObject1 instanceof CircuitEndPoint) {
            let angle = circuitObject1.position.angleTo(circuitObject2.position);
            if((angle < Math.PI / 4 && angle > 0) || (angle > Math.PI * 2 - Math.PI / 4 && angle < Math.PI * 2)) {
                startPoint = new Vector2(circuitObject1.position.x + 1, circuitObject1.position.y);
            }else if(angle > Math.PI / 4 && angle < Math.PI / 2 + Math.PI / 4) {
                startPoint = new Vector2(circuitObject1.position.x, circuitObject1.position.y + 1);
            }else if(angle > Math.PI / 2 + Math.PI / 4 && angle < Math.PI + Math.PI / 4) {
                startPoint = new Vector2(circuitObject1.position.x - 1, circuitObject1.position.y);
            }else {
                startPoint = new Vector2(circuitObject1.position.x, circuitObject1.position.y - 1);
            }
        }else if(circuitObject1 instanceof Resistor) {
            startPoint = circuitObject1.getLineOutputPoint();
        }

        let endPoint;
        if(circuitObject2 instanceof CircuitStartPoint || circuitObject2 instanceof CircuitEndPoint) {
            let angle = circuitObject2.position.angleTo(circuitObject1.position);
            if((angle < Math.PI / 4 && angle > 0) || (angle > Math.PI * 2 - Math.PI / 4 && angle < Math.PI * 2)) {
                endPoint = new Vector2(circuitObject2.position.x + 1, circuitObject2.position.y);
            }else if(angle > Math.PI / 4 && angle < Math.PI / 2 + Math.PI / 4) {
                endPoint = new Vector2(circuitObject2.position.x, circuitObject2.position.y + 1);
            }else if(angle > Math.PI / 2 + Math.PI / 4 && angle < Math.PI + Math.PI / 4) {
                endPoint = new Vector2(circuitObject2.position.x - 1, circuitObject2.position.y);
            }else {
                endPoint = new Vector2(circuitObject2.position.x, circuitObject2.position.y - 1);
            }
        }else if(circuitObject2 instanceof Resistor) {
            endPoint = circuitObject2.getLineInputPoint();
        }

        return [startPoint, endPoint];
    }

    /**
     * Calculates the line points between two points in the circuit
     * @param {Vector2} point1 
     * @param {Vector2} point2 
     */
    calculateCircuitLine(point1, point2) {
        return [new LineRenderObject(point1, point2, 1)];
    }

    calculateEffectiveResistance() {
        this.changesMade = [];

        let dataStructure = this.createDataStructure();

        if(this.hasInvalidConnections(dataStructure)) {
            return undefined;
        }

        while(dataStructure.connections[0].connections[0].type != "end" || dataStructure.connections.length != 1) {
            this.iteratethroughChildren(dataStructure);
        }
        
        return dataStructure.connections[0].value;
    }

    hasInvalidConnections(point) {
        if(point.connections.length == 0 && point.type != "end") {
            return true;
        }
        let invalidConnection = false;
        for (let i = 0; i < point.connections.length; i++) {
            invalidConnection = this.hasInvalidConnections(point.connections[i]);
            if(invalidConnection) {
                break;
            }
        }
        return invalidConnection;
    }

    createDataStructure() {
        this.temporaryDict = [];
        this.iterateTroughConnectionsAndFillDict(this.startPoint);
        let newPoint = this.createHierarchyFromDict(this.startPoint);
        return newPoint;
    }

    makeid(length=5) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * 
     charactersLength));
       }
       return result;
    }

    hasKey(point) {
        for (let i = 0; i < this.temporaryDict.length; i++) {
            if(this.temporaryDict[i][0] == point) {
                return true;
            }
        }
        return false;
    }

    getByPoint(point) {
        for (let i = 0; i < this.temporaryDict.length; i++) {
            if(this.temporaryDict[i][0] == point) {
                return this.temporaryDict[i];
            }    
        }
    }

    iterateTroughConnectionsAndFillDict(point) {
        if(!this.hasKey(point)) {
            let objectType = "res";
            if(point instanceof CircuitStartPoint) {
                objectType = "start";
            }else if(point instanceof CircuitEndPoint) {
                objectType = "end";
            }
            this.temporaryDict.push([point, {id: this.makeid(), type: objectType, value: point.value, connections:[], position: point.position}]);
        }
        for (let i = 0; i < point.connections.length; i++) {
            this.iterateTroughConnectionsAndFillDict(point.connections[i]);
        }
    }

    createHierarchyFromDict(point) {
        let newPoint = this.getByPoint(point)[1];
        for (let i = 0; i < point.connections.length; i++) {
            newPoint.connections.push(this.createHierarchyFromDict(point.connections[i]));
        }
        return newPoint;
    }

    iteratethroughChildren(point) {
        if(point.type != "start") {
            //Serielle schaltung
            if(point.connections.length == 1 && point.connections[0].type == "res") {
                this.changesMade.push(ObjectUtil.clone({type: 's', object1: point, object2: point.connections[0]}));
                point.value += point.connections[0].value;
                point.connections = point.connections[0].connections;
                return;
            }
        }
        //Parallele Schaltung
        if(point.connections.lenth != 1) {
            for (let i = 0; i < point.connections.length - 1; i++) {
                for (let j = i + 1; j < point.connections.length; j++) {
                        if(point.connections[i].connections.length == 1 && point.connections[j].connections.length == 1) {
                            if(point.connections[i].connections[0].id == point.connections[j].connections[0].id) {
                                this.changesMade.push(ObjectUtil.clone({type: 'p', object1: point.connections[i], object2: point.connections[j]}));
                                point.connections[i].value = 1 / (1 / point.connections[i].value + 1 / point.connections[j].value);
                                point.connections.splice(j, 1);
                                return;
                            }
                        }
                }
            }
        }

        for (let i = 0; i < point.connections.length; i++) {
            if(point.connections[i].type == "res") {
                this.iteratethroughChildren(point.connections[i]);
            }
        }
    }


}

class CircuitObject {
    /**
     * Default constructor of the CircuitObject
     * @param {Vector2} position The world position of the object 
     */
    constructor(position) {
        this.position = position;
        this.connections = [];
    }

    /**
     * Adds a connection to the circuit object
     * @param {CircuitObject} toConnectObject 
     */
    addConnection(toConnectObject) {
        if(!this.connections.includes(toConnectObject) && toConnectObject != this) {
            this.connections.push(toConnectObject);
        }
    }
}

class CircuitStartPoint extends CircuitObject {
    constructor(position) {
        super(position);
    }
}

class CircuitEndPoint extends CircuitObject {
    constructor(position) {
        super(position);
    }
}

class Resistor extends CircuitObject{
    /**
     * Default constructor of the resistor
     * @param {Vector2} position The position of the resistor
     * @param {Number} rotation The rotation of the resistor in radians
     * @param {Number} value The value of the resistor in ohms
     */
    constructor(position, value, rotation=0, width=5, height=3) {
        super(position);
        this.value = value;
        this.rotation = rotation;
        this.width = width;
        this.height = height;
    }

    getCornerPoints() {
        let leftTopCornerPoint = new Vector2(this.position.x - this.width / 2, this.position.y + this.height / 2);
        let rightTopCornerPoint = new Vector2(this.position.x + this.width / 2, this.position.y + this.height / 2);
        let leftBottomCornerPoint = new Vector2(this.position.x - this.width / 2, this.position.y - this.height / 2);
        let rightBottomCornerPoint = new Vector2(this.position.x + this.width / 2, this.position.y - this.height / 2);
        return [leftTopCornerPoint.rotateAroundPoint(this.position, this.rotation),
                rightTopCornerPoint.rotateAroundPoint(this.position, this.rotation),
                leftBottomCornerPoint.rotateAroundPoint(this.position, this.rotation),
                rightBottomCornerPoint.rotateAroundPoint(this.position, this.rotation)];
    }

    getLineInputPoint() {
        let cornerPoints = this.getCornerPoints();
        return new Vector2((cornerPoints[0].x + cornerPoints[2].x) / 2, (cornerPoints[0].y + cornerPoints[2].y) / 2);
    }

    getLineOutputPoint() {
        let cornerPoints = this.getCornerPoints();
        return new Vector2((cornerPoints[1].x + cornerPoints[3].x) / 2, (cornerPoints[1].y + cornerPoints[3].y) / 2);
    }
}