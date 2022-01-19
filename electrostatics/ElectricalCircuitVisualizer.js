class ElectricalCircuitVisualizer {
    constructor(renderer, onConnectionsUpdateEvent) {
        this.interval = setInterval(this.tick.bind(this), 0.01);
        this.renderer = renderer;
        this.renderer.cameraPosition = new Vector2(3.16, 0.08);
        this.startPoint = new CircuitStartPoint(new Vector2(-10, 4.85));
        this.endPoint = new CircuitEndPoint(new Vector2(-10, -5));
        /*
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
        this.resistors = [r1, r2, r3, r4, r5];*/

        let r1 = new Resistor(new Vector2(-4.4, 5), 2);
        let r2 = new Resistor(new Vector2(0.5, 0.75), 2, -Math.PI / 2);
        let r3 = new Resistor(new Vector2(4, 5), 2);
        let r4 = new Resistor(new Vector2(8, 0.75), 3, -Math.PI / 2);
        let r5 = new Resistor(new Vector2(12, 5), 3);
        let r6 = new Resistor(new Vector2(16, 0.75), 3, -Math.PI / 2);

        this.startPoint.addConnection(r1);
        r1.addConnection(r2);
        r1.addConnection(r3);
        r2.addConnection(this.endPoint);
        r3.addConnection(r4);
        r3.addConnection(r5);
        r4.addConnection(this.endPoint);
        r5.addConnection(r6);
        r6.addConnection(this.endPoint);

        this.resistors = [r1, r2, r3, r4, r5, r6];

        this.onConnectionsUpdateEvent = onConnectionsUpdateEvent;

        this.isConnecting = false;
        
        this.interactable = true;

        this.refTutorialStep = 0;
        //testResistor.addConnection(testResistor2);
        //testResistor2.addConnection(this.endPoint)

        this.initUI();

        //Initialize the tick interval
        this.interval = setInterval(this.tick.bind(this), 0.01);

        //Initialize modes (currentMode can be add, edit, connect, rotate, delete)
        this.currentMode = "";
    }


    initUI() {
        this.addButton = new UIButton(true, new Vector2(10, 10), "Add", "20px Arial", 
        (function() {
            let input = this.getIntInput("Bitte den Widerstandin Ohm angeben.");
            if(input != undefined) {
                this.resistors.push(new Resistor(new Vector2(0 ,0), input));
            }
            this.renderer.isDragging = false;
        }).bind(this), "left", "top");
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
                        this.onConnectionsUpdateEvent();
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

        this.renderer.interactable = this.interactable;

        //Renderer all the resistors
        for (let i = 0; i < this.resistors.length; i++) {
            let resistorCornerPoints = this.resistors[i].getCornerPoints();

            //If the resistor color is not black make it half filled
            let isResistorFilled = this.resistors[i].color != "#000000";
            let resistorColor = this.resistors[i].color == "#000000" ? "#000000" : this.resistors[i].color + "7F";

            let resistorDrawObject = new PolygonRenderObject([resistorCornerPoints[0], resistorCornerPoints[2], resistorCornerPoints[3], resistorCornerPoints[1]], isResistorFilled, resistorColor);
            let tempIndex = i;

            if(this.currentMode == "") {
                resistorDrawObject.addInteractionEvents(undefined, (function(e) { this.resistors[tempIndex].position = e}).bind(this));
            }else if(this.currentMode == "edit") {
                resistorDrawObject.addInteractionEvents(
                    (function() {
                        let input = this.getIntInput("Bitte den Widerstand in Ohm angeben:");
                        if(input != undefined) {
                            this.resistors[tempIndex].value = input;
                            this.onConnectionsUpdateEvent();
                        }
                        this.renderer.isDragging = false;
                    }).bind(this));
            }else if(this.currentMode == "rotate") {
                resistorDrawObject.addInteractionEvents((function() { this.resistors[tempIndex].rotation += this.resistors[tempIndex].rotation == -Math.PI / 2 ? Math.PI / 2 : -Math.PI / 2}).bind(this));
            }else if(this.currentMode == "delete") {
                resistorDrawObject.addInteractionEvents((function() { this.deleteResistor(tempIndex); this.onConnectionsUpdateEvent();}).bind(this));
            }else if(this.currentMode == "connect") {
                resistorDrawObject.addInteractionEvents(undefined, (function(e) { 
                    this.isConnecting = true; 
                    this.connectionObject = this.resistors[tempIndex]; 
                    this.connectionPosition = e;}).bind(this), 
                    undefined,
                    (function() {
                        if(this.isConnecting) {
                            this.isConnecting = false; 
                            this.connectionObject.addConnection(this.resistors[tempIndex]); 
                            this.onConnectionsUpdateEvent();
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


        this.renderer.render_frame();
    }

    getIntInput(message) {
        let input = prompt(message);
        let result = parseInt(input);
        return isNaN(result) ? undefined : result;
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
                        circuitLines[k].addInteractionEvents((function() { this.deleteConnection(array[tempIndexI], childrenConnection[tempIndexJ]); this.onConnectionsUpdateEvent();}).bind(this));
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
            startPoint = circuitObject1.position.moveAtAngle(angle, 1);
            /*
            if((angle < Math.PI / 4 && angle > 0) || (angle > Math.PI * 2 - Math.PI / 4 && angle < Math.PI * 2)) {
                startPoint = new Vector2(circuitObject1.position.x + 1, circuitObject1.position.y);
            }else if(angle > Math.PI / 4 && angle < Math.PI / 2 + Math.PI / 4) {
                startPoint = new Vector2(circuitObject1.position.x, circuitObject1.position.y + 1);
            }else if(angle > Math.PI / 2 + Math.PI / 4 && angle < Math.PI + Math.PI / 4) {
                startPoint = new Vector2(circuitObject1.position.x - 1, circuitObject1.position.y);
            }else {
                startPoint = new Vector2(circuitObject1.position.x, circuitObject1.position.y - 1);
            }*/
        }else if(circuitObject1 instanceof Resistor) {
            startPoint = circuitObject1.getLineOutputPoint();
        }

        let endPoint;
        if(circuitObject2 instanceof CircuitStartPoint || circuitObject2 instanceof CircuitEndPoint) {
            let angle = circuitObject2.position.angleTo(circuitObject1.position);
            endPoint = circuitObject2.position.moveAtAngle(angle, 1);
            /*
            if((angle < Math.PI / 4 && angle > 0) || (angle > Math.PI * 2 - Math.PI / 4 && angle < Math.PI * 2)) {
                endPoint = new Vector2(circuitObject2.position.x + 1, circuitObject2.position.y);
            }else if(angle > Math.PI / 4 && angle < Math.PI / 2 + Math.PI / 4) {
                endPoint = new Vector2(circuitObject2.position.x, circuitObject2.position.y + 1);
            }else if(angle > Math.PI / 2 + Math.PI / 4 && angle < Math.PI + Math.PI / 4) {
                endPoint = new Vector2(circuitObject2.position.x - 1, circuitObject2.position.y);
            }else {
                endPoint = new Vector2(circuitObject2.position.x, circuitObject2.position.y - 1);
            }*/
        }else if(circuitObject2 instanceof Resistor) {
            endPoint = circuitObject2.getLineInputPoint();
        }

        return [startPoint, endPoint];
    }

    /**
     * Calculates the line points between two points in the circuit
     * @param {Vector2} point1 The first point
     * @param {Vector2} point2 The second point
     * @param {Boolean} direction The direction (right=false, left=true)
     */
    calculateCircuitLine(point1, point2, direction) {
        return [new LineRenderObject(point1, point2, 1)];
    }

    /**
     * Calculates the effective resistance
     * @returns The effective resistance
     */
    calculateEffectiveResistance() {
        this.changesMade = [];

        let dataStructure = this.createDataStructure();

        if(this.hasInvalidConnections(dataStructure)) {
            return undefined;
        }

        let safteyCounter = 0;
        while(dataStructure.connections[0].connections[0].type != "end" || dataStructure.connections.length != 1) {
            this.iteratethroughChildren(dataStructure);
            if(safteyCounter == 100) {
                this.changesMade = [];
                break;
            }
        }

        this.changesMade.reverse();

        return dataStructure.connections[0].value;
    }

    /**
     * Generates the math ml of the reff
     * @param {Number} layer The start layer of the changesMade
     * @param {Boolean} useValues Use the values in the equations or just the variables
     * @returns The MathML code
     */
    generateRefMathML(layer, useValues=true, maximumLayer=this.changesMade.length) {
        if(this.changesMade.length == 0) {
            return undefined;
        }
        let id1 = this.changesMade[layer].object1.id;
        let id2 = this.changesMade[layer].object2.id;
        let id1FoundLayer = -1;
        let id2FoundLayer = -1;
        for (let i = layer + 1; i < maximumLayer; i++) {
            if(id1FoundLayer == -1 && (this.changesMade[i].object1.id == id1 || this.changesMade[i].object2.id == id1)) {
                id1FoundLayer = i;
            }
            if(id2FoundLayer == -1 && (this.changesMade[i].object1.id == id2 || this.changesMade[i].object2.id == id2)) {
                id2FoundLayer = i;
            }
        }
        
        let object1Value = id1FoundLayer == -1 ? useValues ? this.changesMade[layer].object1.value + "Ω" : this.changesMade[layer].object1.rValue != -1 ? "R" + this.changesMade[layer].object1.rValue : '' : this.generateRefMathML(id1FoundLayer, useValues, maximumLayer);
        let object2Value = id2FoundLayer == -1 ? useValues ? this.changesMade[layer].object2.value + "Ω" : this.changesMade[layer].object2.rValue != -1 ? "R" + this.changesMade[layer].object2.rValue : '' : this.generateRefMathML(id2FoundLayer, useValues, maximumLayer);

        if(object1Value == "") {
            object1Value = "Rest";
        }else if(object2Value == "") {
            object2Value = "Rest";
        }

        if(this.changesMade[layer].type == 's') {
            return "<mn>" + object1Value + "</mn><mo>+</mo><mn>" + object2Value + "</mn>";
        }else {
            return "<mfrac><mn>1</mn><mi><mfrac><mn>1</mn><mi>" + object1Value + "</mi></mfrac><mo>+</mo>" + 
            "<mfrac><mn>1</mn><mi>" + object2Value + "</mi></mfrac></mi></mfrac>";
        }
    }

    /**
     * Generates the amperages and voltages of the resistors in the hierarchy
     * @param {Number} layer The start layer of the changesMade
     * @param {Number} voltage The voltage put through the circuit
     * @returns True/False if the calculation is successfull
     */
    calculatePartialAmperageVoltage(layer=0, voltage=100) {
        if(this.changesMade.length == 0) {
            return false;
        }
        let item = this.changesMade[layer];
        let id1 = item.object1.id;
        let id2 = item.object2.id;

        let amp1;
        let amp2;
        let volt1;
        let volt2;
        if(item.type == 's') {
            amp1 = amp2 = voltage / (item.object1.value + item.object2.value);
            volt1 = item.object1.value * amp1;
            volt2 = item.object2.value * amp2;
        }else {
            volt1 = volt2 = voltage;
            amp1 = volt1 / item.object1.value;
            amp2 = volt2 / item.object2.value;
        }

        item.object1.amp = amp1;
        item.object1.volt = volt1;
        item.object2.amp = amp2;
        item.object2.volt = volt2;

        let id1FoundLayer = -1;
        let id2FoundLayer = -1;
        for (let i = layer + 1; i < this.changesMade.length; i++) {
            if(id1FoundLayer == -1 && (this.changesMade[i].object1.id == id1 || this.changesMade[i].object2.id == id1)) {
                id1FoundLayer = i;
            }
            if(id2FoundLayer == -1 && (this.changesMade[i].object1.id == id2 || this.changesMade[i].object2.id == id2)) {
                id2FoundLayer = i;
            }
        }

        if(id1FoundLayer != -1) {
            this.calculatePartialAmperageVoltage(id1FoundLayer, volt1);
        }
        if(id2FoundLayer != -1) {
            this.calculatePartialAmperageVoltage(id2FoundLayer, volt2);
        }

        return true;
    }

    /**
     * Returns mathml code of the amperage and voltage
     * @returns The MathML code
     */
    generateAmperageVoltageMathML() {
        let finalResistors = {}
        for (let i = 0; i < this.changesMade.length; i++) {
            let item = this.changesMade[i];

            if(item.object1.rValue != -1 && finalResistors[item.object1.id] == undefined) {
                let resistorIndex = item.object1.rValue;
                finalResistors[item.object1.id] = {index: resistorIndex, voltage:  Math.round(item.object1.volt * 1000) / 1000, amperage: Math.round(item.object1.amp * 1000) / 1000, resistance:  Math.round(item.object1.value * 1000) / 1000}
            } 

            if(item.object2.rValue != -1 && finalResistors[item.object2.id] == undefined) {
                let resistorIndex = item.object2.rValue;
                finalResistors[item.object2.id] = {index: resistorIndex, voltage: Math.round(item.object2.volt * 1000) / 1000, amperage: Math.round(item.object2.amp * 1000) / 1000, resistance:  Math.round(item.object2.value * 1000) / 1000}
            } 
        }
        let values = [];
        for (var key in finalResistors){
            values.push(finalResistors[key]);
        }

        values.sort((a, b)=> a.index - b.index);

        let result = [];
        
        for (let i = 0; i < values.length; i++) {
            result.push("<math><mrow><msub><mi>U</mi><mn>" + values[i].index + 
            "</mn></msub><mo>=</mo><msub><mi>R</mi><mn>" + values[i].index + 
            "</mn></msub><mo>*</mo><msub><mi>I</mi><mn>" + values[i].index + "</mn></msub><mo>=</mo><mn>" + values[i].resistance + "Ω</mn><mo>*</mo><mn>" + values[i].amperage + "A</mn><mo>=</mo><mn>" + values[i].voltage + "V</mn></mrow></math>");
        }
        return result;
    }

    /**
     * Checks if a circuitObject has a valid connection to the end
     * @param {CircuitObject} point The point
     * @returns True/False - is the connection valid
     */
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

    /**
     * Generates a random id with a length
     * @param {Number} length The length
     * @returns The id
     */
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

    /**
     * Checks if the temporaryDict has a certain point
     * @param {CircuitObject} point 
     * @returns 
     */
    hasKey(point) {
        for (let i = 0; i < this.temporaryDict.length; i++) {
            if(this.temporaryDict[i][0] == point) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a value from the temporaryDict with a point
     * @param {CircuitObject} point The point
     * @returns The value of the dictionary
     */
    getByPoint(point) {
        for (let i = 0; i < this.temporaryDict.length; i++) {
            if(this.temporaryDict[i][0] == point) {
                return this.temporaryDict[i];
            }    
        }
    }

    /**
     * Iterate through the connections and fill the tempDictionary
     * @param {CircuitObject} point The start point 
     */
    iterateTroughConnectionsAndFillDict(point) {
        if(!this.hasKey(point)) {
            let objectType = "res";
            if(point instanceof CircuitStartPoint) {
                objectType = "start";
            }else if(point instanceof CircuitEndPoint) {
                objectType = "end";
            }
            //Insert the rValue into the point (represents which resistor this is, -1 meaning its either a combination of resistors or a start, end point)
            let rValue = -1;
            if(objectType == "res") {
                rValue = this.resistors.indexOf(point) + 1;
            }
            this.temporaryDict.push([point, {id: this.makeid(), type: objectType, value: point.value, connections:[], position: point.position, rValue:rValue}]);
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

    /**
     * Iterate through the children of a node in the circuit hierarchy and check for seriell or parallel ciruits and replace them with one resistor
     * @param {*} point The start point
     */
    iteratethroughChildren(point) {
        if(point.type != "start") {
            //Serielle schaltung
            if(point.connections.length == 1 && point.connections[0].type == "res") {
                this.changesMade.push(ObjectUtil.clone({type: 's', object1: point, object2: point.connections[0]}));

                point.rValue = -1;
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

                                point.connections[i].rValue = -1;
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

    /**
     * Returns the sub r values (sub resistors) of any resistor in the changesMade array
     */
    getSubRValues(layer, isObject1) {
        let result = [];
        let initialItem = isObject1 ? this.changesMade[layer].object1 : this.changesMade[layer].object2;

        for (let i = layer + 1; i < this.changesMade.length; i++) {
            let item = this.changesMade[i];

            if(item.object1.id == initialItem.id || item.object2.id == initialItem.id) {
                if(item.object1.rValue == -1) {
                    result = result.concat(this.getSubRValues(i, true));
                }else {
                    result.push(item.object1.rValue);
                }

                if(item.object2.rValue == -1) {
                    result = result.concat(this.getSubRValues(i, false));
                }else {
                    result.push(item.object2.rValue);
                }
                break;
            }
        }
        return result;
    }

    updateReffTutorialColors(step=0) {
        let values = [];
        for(let key in this.changesMade) {
            values.push(this.changesMade[key]);
        }
        let appearingIndices = [];
        for (let i = 0; i < step; i++) {
            appearingIndices.push(this.changesMade[i].object1.rValue - 1);
            appearingIndices.push(this.changesMade[i].object2.rValue - 1);
        }
        for (let i = 0; i < this.resistors.length; i++) {
            if(appearingIndices.includes(i)) {
                this.resistors[i].color = "#FF0000";
            }else {
                this.resistors[i].color = "#000000";
            }
        }
    }

    getReffTutorialStep(step=0) {
        let changesMadeReversed = this.changesMade.slice().reverse();
        
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
        this.color = "#000000";
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