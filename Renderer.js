class Renderer {
    constructor(canvas, cameraXSize, cameraYSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");    
        this.toRenderObjects = [];
        
        //Camera Initialization
        this.cameraPosition = new Vector2(0, 0);
        this.cameraXSize = cameraXSize;
        this.cameraYSize = cameraYSize;
        this.isDragging = true;
        this.zoomAmount = 1;
        this.canDrag = true;
        this.prepareDragEvent();
    }

    reset_render_objects() {
        this.toRenderObjects = [];
    }
    
    render_text(font, text, position, color="#000000") {
        this.toRenderObjects.push(new TextRenderObject(font, text, position, color));
    }

    render_arrow(thickness, startPosition, finishPosition, color="#000000") {
        this.toRenderObjects.push(new ArrowRenderObject(thickness, startPosition, finishPosition, color));
    }

    render_circle(radius, position, color="#000000") {
        this.toRenderObjects.push(new CircleRenderObject(radius, position, color));
    }

    render_rect(position, size, color="#000000", filled=true) {
        this.toRenderObjects.push(new RectRenderObject(position, size, color, filled));
    }

    render_line(startPosition, endPosition, lineWidth = 1, color="#000000") {
        this.toRenderObjects.push(new LineRenderObject(startPosition, endPosition, lineWidth, color));
    }

    /**
     * Renders the frame
     */
    render_frame() {
        this.clear_frame();
        for(let i = 0;i<this.toRenderObjects.length;i++) {
            this.toRenderObjects[i].draw(this.ctx, this);
        }
    }

    clear_frame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
     * Calculate the position on the canvas using basic linear conversion
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
     * On mouse down event
     * @param {*} e Eventdata
     */
    onmousedown(e) {
      this.isDragging = true;
      this.originalCameraPosition = this.cameraPosition;
      this.originalX = e.pageX - this.canvas.offsetLeft;
      this.originalY = e.pageY - this.canvas.offsetTop;
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

        //Calculate the new camera position by adding the distance to the originalCameraPosition and accounting for the width of the canvas, the cameraXSize and the zoomAmount
        this.cameraPosition = new Vector2(this.originalCameraPosition.x + distance1 / this.canvas.width * this.cameraXSize * this.zoomAmount, 
            this.originalCameraPosition.y - distance2 / this.canvas.height * this.cameraYSize * this.zoomAmount);
        this.render_frame();
      }
    } 

    /**
     * On mouse up event
     * @param {*} e Eventdata
     */
    onmouseup(e) {
      this.isDragging = false;
    }

    /**
     * On mouse out event
     * @param {*} e Event data
     */
    onmouseout(e) {
      this.isDragging = false;
    }

}

class RenderObject {
    constructor(position, color) {
        this.position = position;
        this.color = color;
    }    
}

class TextRenderObject extends RenderObject{
    constructor(font, text, position, color) {
        super(position, color);
        this.font = font;
        this.text = text;
    }

    draw(ctx, rendererReference) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        
        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        ctx.fillText(this.text, canvasPosition.x, canvasPosition.y);
    }
}

class ArrowRenderObject extends RenderObject {
    constructor(startPosition, endPosition, color) {
        super(startPosition, color);
        this.endPosition = endPosition;
    }

    draw(ctx, rendererReference) {
        let canvasStartPosition = rendererReference.worldToCanvasPosition(this.position);
        let canvasEndPosition = rendererReference.worldToCanvasPosition(this.endPosition);

        ctx.fillStyle = this.color;

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
}

class CircleRenderObject extends RenderObject {
    constructor(radius, position, color) {
        super(position, color);
        this.radius = radius;
    }

    draw(ctx, rendererReference) {
        ctx.fillStyle = this.color;

        let canvasPosition = rendererReference.worldToCanvasPosition(this.position);
        let finishPosition = rendererReference.worldToCanvasPosition(new Vector2(this.position.x + this.radius, 0));
        ctx.beginPath();
        ctx.arc(canvasPosition.x, canvasPosition.y, finishPosition.x - canvasPosition.x, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

class RectRenderObject extends RenderObject {
    constructor(position, size, color, filled=true) {
        super(position, color);
        this.size = size;
        this.color = color;
        this.filled = filled;
    }

    draw(ctx, rendererReference) {
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
}

class LineRenderObject extends RenderObject {
    constructor(startPosition, endPosition, lineWidth, color) {
        super(startPosition, color);
        this.endPosition = endPosition;
        this.lineWidth = lineWidth;
    }

    draw(ctx, rendererReference) {
        let canvasStartPosition = rendererReference.worldToCanvasPosition(this.position);
        let canvasEndPosition = rendererReference.worldToCanvasPosition(this.endPosition);

        ctx.fillStyle = this.color;

        ctx.beginPath();
        var originalLineWidth = ctx.lineWidth;
        ctx.lineWidth = this.lineWidth;
        ctx.moveTo(canvasStartPosition.x, canvasStartPosition.y);
        ctx.lineTo(canvasEndPosition.x, canvasEndPosition.y);
        ctx.stroke();
        ctx.lineWidth = originalLineWidth;
    }
}

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    distanceTo(toPosition) {
      let distancepart1 = Math.pow((toPosition.x - this.x), 2);
      let distancepart2 =  Math.pow((toPosition.y - this.y), 2);
      return Math.sqrt(distancepart1 + distancepart2);
    }
}