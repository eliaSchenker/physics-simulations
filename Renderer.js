class Renderer {
    /**
     * Default Constructor of the Renderer
     * @param {Canvas} canvas Canvas object
     * @param {Number} cameraXSize Camera width in meters
     * @param {Number} cameraYSize Camera height in meters
     */
    constructor(canvas, cameraXSize, cameraYSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");    
        this.toRenderObjects = [];
        this.toRenderUI = [];
        
        //Camera Initialization
        this.cameraPosition = new Vector2(0, 0);
        this.cameraXSize = cameraXSize;
        this.cameraYSize = cameraYSize;
        this.isDragging = true;
        this.zoomAmount = 1;
        this.canDrag = true;
        this.lastFrameDraw = new Date();
        this.prepareDragEvent();
        this.prepareScrollEvent();
    }

    /**
     * Reset the render objects array (which objects to render on the next frame)
     */
    reset_render_objects() {
        this.toRenderObjects = [];
    }

    reset_render_ui_queue() {
        this.toRenderUI = [];
    }

    /**
     * Renders the frame
     */
    render_frame() {
        //Prevent the next frame from being drawn if 25 milliseconds haven't passed since the last frame drawn
        if(new Date() - this.lastFrameDraw < 25) {
            return;
        }
        this.clear_frame();
        //Draw the objects
        for(let i = 0;i<this.toRenderObjects.length;i++) {
            this.toRenderObjects[i].draw(this.ctx, this);
        }

        //Draw the UI
        for(let i = 0;i<this.toRenderUI.length;i++) {
            this.toRenderUI[i].draw(this.ctx, this);
        }

        this.lastFrameDraw = new Date();
    }

    /**
     * Clears the canvas
     */
    clear_frame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    
    /**
     * Calculate where a worldPosition is on the canvas using linear conversion
     * @param {Vector2} worldPosition  Position in the world
     * @returns Position on the canvas
     */
    worldToCanvasPosition(worldPosition) {
        //X Coordinate
       let oldMinX = this.cameraPosition.x - (this.cameraXSize / 2 * this.zoomAmount);
       let oldMaxX = this.cameraPosition.x + (this.cameraXSize / 2 * this.zoomAmount);
       let newMinX = 0
       let newMaxX = this.canvas.width;
       let oldValueX = worldPosition.x;
       //Y Coordinate
       let oldMinY = this.cameraPosition.y - (this.cameraYSize / 2 * this.zoomAmount);
       let oldMaxY = this.cameraPosition.y + (this.cameraYSize / 2 * this.zoomAmount);
       let newMinY = this.canvas.height;
       let newMaxY = 0;
       let oldValueY = worldPosition.y;

       let newX =  (((oldValueX - oldMinX) * (newMaxX - newMinX)) / (oldMaxX - oldMinX)) + newMinX;
       let newY =  (((oldValueY - oldMinY) * (newMaxY - newMinY)) / (oldMaxY - oldMinY)) + newMinY;
       return new Vector2(newX, newY)
   }

   /**
    * Calculate where a canvasPosition is in the world using linear conversion
    * @param {Vector2} canvasPosition The canvas position
    * @returns Position in the world
    */
   canvasToWorldPosition(canvasPosition) {
        //X Coordinate
        let oldMinX = 0;
        let oldMaxX = this.canvas.width;
        let newMinX = this.cameraPosition.x - (this.cameraXSize / 2 * this.zoomAmount);
        let newMaxX = this.cameraPosition.x + (this.cameraXSize / 2 * this.zoomAmount);
        let oldValueX = canvasPosition.x;
        //Y Coordinate
        let oldMinY = this.canvas.height;
        let oldMaxY = 0;
        let newMinY = this.cameraPosition.y - (this.cameraYSize / 2 * this.zoomAmount);
        let newMaxY = this.cameraPosition.y + (this.cameraYSize / 2 * this.zoomAmount);
        let oldValueY = canvasPosition.y;

        let newX =  (((oldValueX - oldMinX) * (newMaxX - newMinX)) / (oldMaxX - oldMinX)) + newMinX;
        let newY =  (((oldValueY - oldMinY) * (newMaxY - newMinY)) / (oldMaxY - oldMinY)) + newMinY;
        return new Vector2(newX, newY);
   }

   getUIPosition(isPositionRelative, position, xAnchor, yAnchor) {
       if(isPositionRelative) {
           position = new Vector2(this.canvas.width / 100 * position.x, this.canvas.height / 100 * position.y);
       }

       let x = 0;
       let y = 0;
       if(xAnchor == "left") {
            x = position.x;
       }else if(xAnchor == "middle") {
            x = canvas.width / 2 + position.x;
       }else if(xAnchor == "right") {
            x = canvas.width - position.x;
       }

       if(yAnchor == "top") {
            y = position.y;
       }else if(yAnchor == "middle") {
            y = canvas.height / 2 + position.y;
       }else if(yAnchor == "bottom") {
            y = canvas.height - position.y;
       }

       return new Vector2(x, y);
   }


    //Camera Operations

    /**
     * Initialises the drag event
     */
    prepareDragEvent() {
        this.isDragging = false;

        this.canvas.addEventListener("mousedown", this.onmousedown.bind(this));
        this.canvas.addEventListener("mousemove", this.onmousemove.bind(this));
        this.canvas.addEventListener("mouseup", this.onmouseup.bind(this));
        this.canvas.addEventListener("mouseout", this.onmouseout.bind(this));
    }

    /**
     * Prepare the scroll event
     */
    prepareScrollEvent() {
        this.canvas.addEventListener("wheel", this.onscrollwheel.bind(this));
    }

    /**
     * Scroll wheel event
     * @param {*} e Eventdata
     */
    onscrollwheel(e) {
        e.preventDefault();
        if(e.deltaY > 0) {
            this.zoomAmount += 0.01;
        }else if (e.deltaY < 0){
            if(this.zoomAmount - 0.01 > 0) { //Todo add smaller zooming
                this.zoomAmount -= 0.01;
            }
        }
        this.render_frame();
    }

    /**
     * On mouse down event
     * @param {*} e Eventdata
     */
    onmousedown(e) {
      this.isDragging = true;
      this.originalCameraPosition = this.cameraPosition;
      this.originalX = e.pageX - this.canvas.offsetLeft;
      this.originalY = e.pageY - this.canvas.offsetTop;
      this.checkUIClickEvents(this.originalX, this.originalY);

      //Get the object which is under the mouse and assign it to the currentDragObject
      this.currentDragObject = this.getObjectsUnderMouse(this.originalX, this.originalY);
      //If the currentDragObject exists and its onClickEvent is not undefined, call it
      if(this.currentDragObject != undefined && this.currentDragObject.onClickEvent != undefined) {
        this.currentDragObject.onClickEvent(this.canvasToWorldPosition(new Vector2(this.originalX, this.originalY)));
      }
    }

    /**
     * On mouse move event
     * @param {*} e Eventdata
     */
    onmousemove(e) {
      if(this.isDragging && this.canDrag) {
        //Calculate position of the mouse on the canvas
        var x = e.pageX - this.canvas.offsetLeft;
        var y = e.pageY - this.canvas.offsetTop;

        //Calculate the distance between the start of the drag and the current mouse position
        var distance1 = this.originalX - x;
        var distance2 = this.originalY - y;

        //If the currentDragObject is either undefined or doesn't have a dragEvent, move the camera
        if(this.currentDragObject == undefined || this.currentDragObject.onDragEvent == undefined) {
            //Calculate the new camera position by adding the distance to the originalCameraPosition and accounting for the width of the canvas, the cameraXSize and the zoomAmount
            this.cameraPosition = new Vector2(this.originalCameraPosition.x + distance1 / this.canvas.width * this.cameraXSize * this.zoomAmount, 
                this.originalCameraPosition.y - distance2 / this.canvas.height * this.cameraYSize * this.zoomAmount);
            this.render_frame();
        }else {
            //If it does exist and has a dragEvent, call the event
            this.currentDragObject.onDragEvent(this.canvasToWorldPosition(new Vector2(x, y)));
        }
      }
    }

    getObjectsUnderMouse(mouseX, mouseY) {
        for (let i = 0; i < this.toRenderObjects.length; i++) {
            if(this.toRenderObjects[i].onClickEvent != undefined || this.toRenderObjects[i].onDragEvent != undefined) {
                let collider = this.toRenderObjects[i].getCollisionRect(this.ctx, this);
                if(mouseX > collider[0].x && mouseY < collider[0].y &&
                    mouseX < collider[1].x && mouseY > collider[1].y) {
                        return this.toRenderObjects[i];
                }
            }
        }
        
    }

    checkUIClickEvents(mouseX, mouseY) {
        for(var i = 0;i<this.toRenderUI.length;i++) {
            if(this.toRenderUI[i] instanceof UIButton) {
                let collider = this.toRenderUI[i].getCollisionRect(this.ctx, this);
                if(mouseX > collider[0].x && mouseY > collider[0].y &&
                    mouseX < collider[1].x && mouseY < collider[1].y) {
                    if(this.toRenderUI[i].onClickEvent != undefined) {
                        //Collision hit
                        this.toRenderUI[i].onClickEvent();
                        break;
                    }
                }
            }
        }
    }

    /**
     * On mouse up event
     * @param {*} e Eventdata
     */
    onmouseup(e) {
      this.isDragging = false;

      if(this.currentDragObject != undefined) {
          if(this.currentDragObject.onMouseUpEvent != undefined) {
              let x = e.pageX - this.canvas.offsetLeft;
              let y = e.pageY - this.canvas.offsetTop;
              this.currentDragObject.onMouseUpEvent(this.canvasToWorldPosition(new Vector2(x, y)));
          }
          this.currentDragObject = undefined;
      }
    }

    /**
     * On mouse out event
     * @param {*} e Event data
     */
    onmouseout(e) {
      this.isDragging = false;
      if(this.currentDragObject != undefined) {
          this.currentDragObject = undefined;
      }
    }

    /**
     * Destroy the renderer
     */
    destroy() {
        //Clear the renderObjectQueues
        this.toRenderObjects = [];
        this.toRenderUI = [];
        //Replace the canvas to clear the listeners
        var elem = this.canvas;
        elem.replaceWith(elem.cloneNode(true));
        //Delete the canvas and ctx references
        this.canvas = undefined;
        this.ctx = undefined;
    }
}

/**
 * RenderObject (parent class of various render objects)
 */
class RenderObject {
    /**
     * Default constructor of Renderobject
     * @param {Vector2} position 
     * @param {String} color 
     */
    constructor(position, color) {
        this.position = position;
        this.color = color;
    }

    addInteractionEvents(onClickEvent=undefined, onDragEvent=undefined, onMouseUpEvent=undefined) {
        this.onClickEvent = onClickEvent;
        this.onDragEvent = onDragEvent;
        this.onMouseUpEvent = onMouseUpEvent;
    }
}

/**
 * TextRenderObject class responsible for drawing a text
 */
class TextRenderObject extends RenderObject{
    /**
     * Default constructor of the TextRenderObject
     * @param {String} font The font of the text
     * @param {String} text The text to draw
     * @param {Vector2} position The position of the text
     * @param {String} color The color of the text (optional)
     */
    constructor(font, text, position, color="#000000") {
        super(position, color);
        this.font = font;
        this.text = text;
    }

    /**
     * Draw the Text
     * @param {CanvasRenderingContext2D} ctx Rendering Context
     * @param {Renderer} rendererReference Reference to the Renderer Object
     */
    draw(ctx, rendererReference) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        ctx.fillText(this.text, canvasPosition.x, canvasPosition.y);
        ctx.stroke();
    }

    getCollisionRect(ctx, rendererReference) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        let textWidth = ctx.measureText(this.text);
        let textHeight = parseInt(ctx.font.match(/\d+/), 10);
        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        return [canvasPosition, new Vector2(canvasPosition.x + textWidth, canvasPosition.y + textHeight)];
    }
}

class ArrowRenderObject extends RenderObject {
    /**
     * Default Constructor of the ArrowRenderObject
     * @param {Vector2} startPosition the position of the bottom of the arrow
     * @param {Vector2} endPosition the position of the top of the arrow
     * @param {String} color The color of the arrow (optional)
     */
    constructor(startPosition, endPosition, color="#000000") {
        super(startPosition, color);
        this.endPosition = endPosition;
    }

    /**
     * Draw the Arrow
     * @param {CanvasRenderingContext2D} ctx Rendering Context
     * @param {Renderer} rendererReference Reference to the Renderer Object
     */
    draw(ctx, rendererReference) {
        let canvasStartPosition = rendererReference.worldToCanvasPosition(this.position);
        let canvasEndPosition = rendererReference.worldToCanvasPosition(this.endPosition);

        ctx.strokeStyle = this.color;

        //Draws an Arrow. Code from https://riptutorial.com/html5-canvas/example/18136/line-with-arrowheads
        var aWidth = 5;
        var aLength = 8;
        
        var dx=canvasEndPosition.x-canvasStartPosition.x;
        var dy=canvasEndPosition.y-canvasStartPosition.y;
        var angle=Math.atan2(dy,dx);
        var length=Math.sqrt(dx*dx+dy*dy);

        ctx.translate(canvasStartPosition.x,canvasStartPosition.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(length,0);
        ctx.moveTo(length-aLength,-aWidth);
        ctx.lineTo(length,0);
        ctx.lineTo(length-aLength,aWidth);

        ctx.stroke();
        ctx.setTransform(1,0,0,1,0,0);
    }

    getCollisionRect(ctx, rendererReference) {
        let canvasEndPosition = rendererReference.worldToCanvasPosition(this.endPosition);
        return [new Vector2(canvasEndPosition.x - 5, canvasEndPosition.y + 10), new Vector2(canvasEndPosition.x + 5, canvasEndPosition.y - 5)];
    }
}

class CircleRenderObject extends RenderObject {
    /**
     * Default Constructor of the CircleRenderObject
     * @param {Number} radius Radius of the circle
     * @param {Vector2} position Position of the center of the circle
     * @param {String} color Color of the circle (optional)
     */
    constructor(radius, position, color="#000000") {
        super(position, color);
        this.radius = radius;
        this.color = color;
    }

    /**
     * Draw the circle
     * @param {CanvasRenderingContext2D} ctx Rendering Context
     * @param {Renderer} rendererReference Reference to the Renderer Object
     */
    draw(ctx, rendererReference) {
        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        let finishPosition = rendererReference.worldToCanvasPosition(new Vector2(this.position.x + this.radius, 0));
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.arc(canvasPosition.x, canvasPosition.y, finishPosition.x - canvasPosition.x, 0, 2 * Math.PI);
        ctx.stroke();
    }

    getCollisionRect(ctx, rendererReference) {
        return [rendererReference.worldToCanvasPosition(new Vector2(this.position.x - this.radius, this.position.y - this.radius)),
            rendererReference.worldToCanvasPosition(new Vector2(this.position.x + this.radius, this.position.y + this.radius))];
    }
}

class RectRenderObject extends RenderObject {
    /**
     * Default Constructor of the RectRenderObject
     * @param {Vector2} position Position of the bottom left corner of the rectangle
     * @param {Vector2} size Size of the rectangle
     * @param {String} color Color of the rectangle (optional)
     * @param {Boolean} filled Is the rectangle filled (optional)
     */
    constructor(position, size, color="#000000", filled=true) {
        super(position, color);
        this.size = size;
        this.color = color;
        this.filled = filled;
    }

    /**
     * Draw the rect
     * @param {CanvasRenderingContext2D} ctx Rendering Context
     * @param {Renderer} rendererReference Reference to the Renderer Object
     */
    draw(ctx, rendererReference) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;

        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        let targetPosition = rendererReference.worldToCanvasPosition(new Vector2(this.position.x + this.size.x, this.position.y + this.size.y));
        ctx.beginPath();
        if(this.filled) {
            ctx.fillRect(canvasPosition.x, canvasPosition.y, targetPosition.x - canvasPosition.x, targetPosition.y - canvasPosition.y);
        }else {
            ctx.rect(canvasPosition.x, canvasPosition.y, targetPosition.x - canvasPosition.x, targetPosition.y - canvasPosition.y);
        }
        ctx.stroke();
    }

    getCollisionRect(ctx, rendererReference) {
        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        let targetPosition = rendererReference.worldToCanvasPosition(new Vector2(this.position.x + this.size.x, this.position.y + this.size.y));
        return [canvasPosition, targetPosition];
    }
}

class LineRenderObject extends RenderObject {
    /**
     * Default constructor of the LineRenderObject
     * @param {Vector2} startPosition Startposition of the line
     * @param {Vector2} endPosition Endposition of the line
     * @param {Number} lineWidth Width of the line
     * @param {String} color Color of the line
     */
    constructor(startPosition, endPosition, lineWidth, color="#000000") {
        super(startPosition, color);
        this.endPosition = endPosition;
        this.lineWidth = lineWidth;
    }

    /**
     * Draw the line
     * @param {CanvasRenderingContext2D} ctx Rendering Context
     * @param {Renderer} rendererReference Reference to the Renderer Object
     */
    draw(ctx, rendererReference) {
        let canvasStartPosition = rendererReference.worldToCanvasPosition(this.position);
        let canvasEndPosition = rendererReference.worldToCanvasPosition(this.endPosition);

        ctx.strokeStyle = this.color;

        ctx.beginPath();
        var originalLineWidth = ctx.lineWidth;
        ctx.lineWidth = this.lineWidth;
        ctx.moveTo(canvasStartPosition.x, canvasStartPosition.y);
        ctx.lineTo(canvasEndPosition.x, canvasEndPosition.y);
        ctx.stroke();
        ctx.lineWidth = originalLineWidth;
    }
}

class UIElement {
    constructor(isPositionRelative, position, xAnchor, yAnchor, color) {
        this.calculateRelative = isPositionRelative;
        this.position = position;
        this.xAnchor = xAnchor;
        this.yAnchor = yAnchor;
        this.color = color;
    }
}

class UIText extends UIElement {
    constructor(isPositionRelative, position, text, font, xAnchor="left", yAnchor="bottom", textAlignment="left", color="#000000") {
        super(isPositionRelative, position, xAnchor, yAnchor, color);
        this.text = text;
        this.font = font;
        this.textAlignment = textAlignment;
    }

    draw(ctx, rendererReference) {
        ctx.textAlign = this.textAlignment;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        
        let canvasPosition = rendererReference.getUIPosition(this.isPositionRelative, this.position, this.xAnchor, this.yAnchor);
        ctx.fillText(this.text, canvasPosition.x, canvasPosition.y);
    }

    getCollisionRect(ctx, rendererReference) {
        ctx.textAlign = this.textAlignment;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        let measuredText = ctx.measureText(this.text);
        var textWidth = measuredText.width;
        var textHeight = parseInt(ctx.font.match(/\d+/), 10);
        let canvasPosition = rendererReference.getUIPosition(this.isPositionRelative, this.position, this.xAnchor, this.yAnchor);
        return [new Vector2(canvasPosition.x, canvasPosition.y), new Vector2(canvasPosition.x + textWidth, canvasPosition.y + textHeight)];
    }
}

class UIButton extends UIElement {
    constructor(isPositionRelative, position, text, font, onClickEvent, xAnchor="left", yAnchor="bottom", textColor="#000000", color="#D3D3D3") {
        super(isPositionRelative, position, xAnchor, yAnchor, color);
        this.text = text;
        this.onClickEvent = onClickEvent;
        this.font = font;
        this.textColor = textColor;
    }

    draw(ctx, rendererReference) {
        ctx.textAlign = this.textAlignment;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        let measuredText = ctx.measureText(this.text);
        var textWidth = measuredText.width;
        var textHeight = parseInt(ctx.font.match(/\d+/), 10);

        let canvasPosition = rendererReference.getUIPosition(this.isPositionRelative, this.position, this.xAnchor, this.yAnchor);

        let rectWidth = textWidth + 20;
        let rectHeight = textHeight + 10;
        ctx.fillRect(canvasPosition.x, canvasPosition.y, rectWidth, rectHeight);
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.text, canvasPosition.x + (rectWidth - textWidth) / 2,  canvasPosition.y + rectHeight - (rectHeight - textHeight) / 1.1);
    }

    getCollisionRect(ctx, rendererReference) {
        ctx.textAlign = this.textAlignment;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        let measuredText = ctx.measureText(this.text);
        var textWidth = measuredText.width;
        var textHeight = parseInt(ctx.font.match(/\d+/), 10);

        let canvasPosition = rendererReference.getUIPosition(this.isPositionRelative, this.position, this.xAnchor, this.yAnchor);

        let rectWidth = textWidth + 20;
        let rectHeight = textHeight + 10;
        return [canvasPosition, new Vector2(canvasPosition.x + rectWidth, canvasPosition.y + rectHeight)];
    }
}

/**
 * Vector2 Class (Represents coordinates in 2D Space)
 */
class Vector2 {
    /**
     * Default constructor of the Vector2
     * @param {Number} x The X-Position
     * @param {Number} y The Y-Position
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Calculates the distance between this Vector2 and another
     * @param {Vector2} toPosition The other Vector2 Object
     * @returns The Distance
     */
    distanceTo(toPosition) {
      let distancepart1 = Math.pow((toPosition.x - this.x), 2);
      let distancepart2 =  Math.pow((toPosition.y - this.y), 2);
      return Math.sqrt(distancepart1 + distancepart2);
    }

    /**
     * Calculates the angle to another position
     * @param {Vector2} toPosition 
     * @returns The angle in radians
     */
    angleTo(toPosition) {
        return Math.atan2(toPosition.y - this.y, toPosition.x - this.x);
    }

    /**
     * Returns the angle of the vector in radians
     * @returns Angle in radians
     */
    getAngleRadians() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Returns the angle of the vector in degrees
     * @returns Angle in degrees
     */
    getAngleDegrees() {
        return this.getAngleRadians() * (180/Math.PI);
    }

    /**
     * Returns the magnitude of the vector
     * @returns Magnitude
     */
    getMagnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    /**
     * Moves the point in direction of an angle with a distance
     * @param {Number} angle The angle in radians
     * @param {Number} distance The distance
     * @returns the new point
     */
    moveAtAngle(angle, distance) {
        return new Vector2(this.x + (distance * Math.cos(angle)), this.y + (distance * Math.sin(angle)));
    }

}