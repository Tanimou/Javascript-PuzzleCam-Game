//*All capitale variables are global variables
let VIDEO = null; //*used to initialize a video object
let CANVAS = null; //*used to create the Canvas object
let CONTEXT = null; //*add a reference to the canvas context
let PIECES = []; //*to have an array of pieces
let SELECTED_PIECE=null //*to define the selected piece by the user
//!we'll use the scaler to specify how much of space will be used by the image
let SCALER = 0.8; //* set the size margin to 80%
let SIZE = { x: 0, y: 0, width: 0, height: 0, rows: 3, columns: 3 }; //*to keep track of other related information in this size variable
//*we also specify the rows and the columns for the image





function main() {
    CANVAS = document.getElementById("myCanvas"); //*we initialize the canvas object with the one defined in the html page
    CONTEXT = CANVAS.getContext("2d"); //*this 2d context of the canvas provides all drawing methods we'll need to build the game
    //*we add an event listener for the drag and drop fonctionnality
    addEventListeners()
    //*We use promise function to get access to the media devices (here the camera). Then the computer will ask us permission to use the camera.
    let promise = navigator.mediaDevices.getUserMedia({ video: true });

    promise.then(function (signal) {
        //* the code will go here when user gives access to the camera
        //*where we define a callback function in which we have access to the camera signal

        //*we create a video element here
        VIDEO = document.createElement("video");
        //*we then initialize it to the signal coming from the camera
        VIDEO.srcObject = signal;
        //*and we play the video
        VIDEO.play();

        VIDEO.onloadeddata = function () {
            handleResize();
            //!to make the resizing happen automatically
            window.addEventListener("resize", handleResize);

            //*we initialize pieces
            initializePieces(SIZE.rows, SIZE.columns);

            //*when video data is available, we can start updating it on the canvas with updateCanvas() function
            updateCanvas();
        };
    })
        .catch(function (err) {
            //*otherwhise, when the user denied access the browser will display an error
            alert("Camera error:" + err);
        });
}



//!                       DRAG AND DROP PART


function addEventListeners() {
    //*addEventListeners for mouse
    CANVAS.addEventListener("mousedown", onMouseDown)
    CANVAS.addEventListener("mousemove", onMouseMove)
    CANVAS.addEventListener("mouseup", onMouseUp)
    //*addEventListeners for mobile
    CANVAS.addEventListener("touchstart", onTouchStart)
    CANVAS.addEventListener("touchmove", onTouchMove)
    CANVAS.addEventListener("touchend", onTouchEnd)
}

function onTouchStart(evt){
    let loc={x:evt.touches[0].clientX, y:evt.touches[0].clientY}
    onMouseDown(loc)
}

function onTouchMove(evt) {
    let loc = { x: evt.touches[0].clientX, y: evt.touches[0].clientY }
    onMouseMove(loc)
}
function onTouchEnd() {
    onMouseUp()
}

function onMouseDown(evt) {
    SELECTED_PIECE = getPressedPiece(evt)
    if (SELECTED_PIECE != null) {
        const index=PIECES.indexOf(SELECTED_PIECE);
        if(index>-1) {
            PIECES.splice(index,1)
            PIECES.push(SELECTED_PIECE)
        }
        SELECTED_PIECE.offset = {
            x: evt.x - SELECTED_PIECE.x,
            y: evt.y - SELECTED_PIECE.y
        }
    
}
}
function onMouseMove(evt) {
    if (SELECTED_PIECE != null) {
        SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x
        SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y
    }
}

function onMouseUp() {
if (SELECTED_PIECE.isClose()) {
    SELECTED_PIECE.snap()
}    
SELECTED_PIECE=null
}

function getPressedPiece(loc) {
    for (let i = PIECES.length - 1; i >= 0; i--) {
        if ((loc.x > PIECES[i].x && loc.x < (PIECES[i].x + PIECES[i].width)) && (loc.y > PIECES[i].y && loc.y < (PIECES[i].y + PIECES[i].height))) {
            return PIECES[i]
        }

    }
    return null
}
//!


//*function that resize the canvas and the video
function handleResize() {
    //*our canvas will fill the entire window, we'll need to resize to the middle of the window
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    //!used to find out the minimum ratio between the screen size and the video size
    let resizer =
        SCALER *
        Math.min(
            window.innerWidth / VIDEO.videoWidth,
            window.innerHeight / VIDEO.videoHeight
        );
    //!then we set the SIZE attributes accordingly
    SIZE.width = resizer * VIDEO.videoWidth;
    SIZE.height = resizer * VIDEO.videoHeight;
    SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
    SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}




//!                      UPDATE CANVAS PART
function updateCanvas() {
        //*we need to clear the canvas before drawing
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    //*we set a 50% of transparency
    CONTEXT.globalAlpha = 0.5
    //*the updateCanvas() function needs to draw the video onto the canvas,
    //*that's why we'll use the drawImage() method of the canvas context to do that
    //!we must update the draw image method to display the new size of the video
      CONTEXT.drawImage(VIDEO,SIZE.x,SIZE.y,SIZE.width,SIZE.height)
    //*and we reset the transparency so that only the video is semi transparent but the pieces are drawn normarly after that
        CONTEXT.globalAlpha = 1

    //*but this method doesn't pick up any movement yet
    //*we need to update the canvas many times per second to see this happen
    //*then we use the requestAnimationFrame() method to make it work

    //*drawing pieces
    for (let i = 0; i < PIECES.length; i++) {
        PIECES[i].draw(CONTEXT); //see class Piece
    }

    window.requestAnimationFrame(updateCanvas);
}
//!




//!                   CROPPING THE VIDEO INTO PIECES PART

//*Creation of Piece object
class Piece {
    constructor(rowIndex, colIndex) {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        //*the width and height of each piece is just the width and height of the area divided by the columns and rows
        this.width = SIZE.width / SIZE.columns;
        this.height = SIZE.height / SIZE.rows;
        //*the x and y are set so that each piece is defined to be at the correct location at first
        this.x = SIZE.x + this.width * this.colIndex;
        this.y = SIZE.y + this.height * this.rowIndex;
        this.xCorrect=this.x
        this.yCorrect=this.y
    }
    //*To be able to draw the pieces
    draw(context) {
        context.beginPath();
        //*each piece needs to crop a specific part of the video and show it, crop means rogner
        //*this function has 9 arguments: the VIDEO,where to take image data from(the left part where the cropping happens
        //*then the top part, then width and height) and where to draw it(x, y, width, height)
        context.drawImage(
            VIDEO,
            (this.colIndex * VIDEO.videoWidth) / SIZE.columns,
            (this.rowIndex * VIDEO.videoHeight) / SIZE.rows,
            VIDEO.videoWidth / SIZE.columns,
            VIDEO.videoHeight / SIZE.rows,
            this.x,
            this.y,
            this.width,
            this.height
        );

        context.rect(this.x, this.y, this.width, this.height); //*we set the location (x,y) and the size of the pieces, which are calculated in the constructor
        context.stroke();
    }
    isClose(){
        if(distance({x:this.x,y:this.y},{x:this.xCorrect,y:this.yCorrect})<this.width/3)
        {
            return true
        }
        return false
    }

    snap(){
        this.x=this.xCorrect
        this.y=this.yCorrect
    }
}

function distance(p1,p2){
    return Math.sqrt((p1.x - p2.x) * (p1.x -p2.x) + (p1.y - p2.y)*(p1.y -p2.y))
}
//!


//!           INITIALIZATION OF PIECES PART
function initializePieces(rows, cols) {
    SIZE.columns = cols;
    SIZE.rows = rows;
    PIECES = [];
    //*adding new pieces into the array
    for (let i = 0; i < SIZE.rows; i++) {
        for (let j = 0; j < SIZE.columns; j++) {
            PIECES.push(new Piece(i, j));
        }
    }
}
//!




//!          RANDOMIZE THE LOCATION OF PIECES PART
function randomizePieces() {
    //we iterate trhough all of pieces and generate a random location for each piece
    for (let i = 0; i < PIECES.length; i++) {
        let loc = {
            //*because the random values are between 0 and 1, the pieces will be in the top left corner
            //*to prevent it we scale them with the canvas width and height
            //*but some pieces go outside of the screen, so we subtract them with pieces width and height when scaling
            x: Math.random() * (CANVAS.width - PIECES[i].width),
            y: Math.random() * (CANVAS.height - PIECES[i].height),
        };
        PIECES[i].x = loc.x;
        PIECES[i].y = loc.y;
    }
}
//!


