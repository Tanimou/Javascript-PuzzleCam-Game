//*All capitale variables are global variables
let VIDEO = null; //*used to initialize a video object
let CANVAS = null; //*used to create the Canvas object
let CONTEXT = null; //*add a reference to the canvas context
let PIECES = []; //*to have an array of pieces
let SELECTED_PIECE = null //*to define the selected piece by the user
let START_TIME = null; //* the time when the user start the game
let END_TIME = null; // *the time when the game is over

let POP_SOUND = new Audio('pop.mp3')//*variable for sound effect
POP_SOUND.volume = 0.1
//*to generate a sound at the end of the game
let AUDIO_CONTEXT = new (AudioContext || webkitAudioContext || window.webkitAudioContext)()
//*keysnote of the sounds
let keys = {
    DO: 261.6,
    RE: 293.7,
    MI: 329.6
}

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



//!                                                                    INITIALIZATION OF PIECES PART
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



    //!Advanced cropping part
    let cnt = 0 //count each piece
    for (let i = 0; i < SIZE.rows; i++) {
        for (let j = 0; j < SIZE.columns; j++) {
            //*select the piece by the index
            const piece = PIECES[cnt]
            //*if we are on the last row, we don't have any bottom tabs
            //*so we set this to null
            if (i == SIZE.rows - 1)
                piece.bottom = null
            else {
                //*we decide ramdomly wether a piece has inner or outer tabs
                const sign = (Math.random() - 0.5) < 0 ? -1 : 1   //if -1 it's a inner tab, otherwise it's a outer one   
                //*we also need to decide where will the tab be locted on the edge
                //*we will allow the tab to be betwwen 30% and 70%
                piece.bottom = sign * (Math.random() * 0.4 + 0.3)
            }
            //*we do the same for the right most column
            if (j == SIZE.columns - 1) {
                piece.right = null
            } else {
                const sign = (Math.random() - 0.5) < 0 ? -1 : 1
                piece.right = sign * (Math.random() * 0.4 + 0.3)
            }
            //*same thing for the left part
            if (j == 0)
                piece.left = null
            else {
                //*we don't need to random the left of the piece
                piece.left = -PIECES[cnt - 1].right
            }
            //*if we are on the first row we don't have a tab on the top
            if (i == 0)
                piece.top = null
            else {
                //*we don't need to random the top of the piece
                piece.top = -PIECES[cnt - SIZE.columns].bottom
            }


            cnt++
        }
    }
}
//!

//!                                                                      RANDOMIZE THE LOCATION OF PIECES PART
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
        PIECES[i].correct = false // the pieces are not in the correct location because we randomize them
    }
}
//!


//!                 UPDATE CANVAS PART  
function updateCanvas() {

    //*we need to clear the canvas before drawing
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    //*we set a 50% of transparency
    CONTEXT.globalAlpha = 0.5
    //*the updateCanvas() function needs to draw the video onto the canvas,
    //*that's why we'll use the drawImage() method of the canvas context to do that
    //!we must update the draw image method to display the new size of the video
    CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height)
    //*and we reset the transparency so that only the video is semi transparent but the pieces are drawn normarly after that
    CONTEXT.globalAlpha = 1

    //*but this method doesn't pick up any movement yet
    //*we need to update the canvas many times per second to see this happen
    //*then we use the requestAnimationFrame() method to make it work

    //*drawing pieces
    for (let i = 0; i < PIECES.length; i++) {
        PIECES[i].draw(CONTEXT); //see class Piece
    }
    updateTime()
    window.requestAnimationFrame(updateCanvas);
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





//!                                                      CROPPING THE VIDEO INTO PIECES PART

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
        //*the correct location should be stored here because when initializing the pieces will be at the correct location
        this.xCorrect = this.x
        this.yCorrect = this.y
        this.correct = true //*it will say if the location of the piece is correct or not. At the start all pieces are in the correct location
    }
    //*To be able to draw the pieces
    draw(context) {
        context.beginPath();



        //*drawig the piece in rectangle way
        //  context.rect(this.x, this.y, this.width, this.height); //*we set the location (x,y) and the size of the pieces, which are calculated in the constructor
       //!             Advanced cropping
        //*sizing the tab of the piece
        const sz = Math.min(this.width, this.height)
        const neck = 0.05 * sz
        const tabWidth = 0.2 * sz
        const tabHeight = 0.2 * sz

        //*drawing new shapes for the pieces
        //!from top left
        context.moveTo(this.x, this.y)

        //!to top right
        if (this.top)  //*we need to check if we need to draw the tab, if there is a inner or outer tab

        {
            context.lineTo(this.x + this.width * Math.abs(this.top) - neck, this.y)

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) - neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) - tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top),
                this.y - tabHeight * Math.sign(this.top)
            )

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) + tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top) + neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) + neck, this.y
            )

        }

        context.lineTo(this.x + this.width, this.y)


        //!to bottom right
        if (this.right) {
            context.lineTo(this.x + this.width, this.y + this.height * Math.abs(this.right) - neck)

            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) - neck,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) - tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right)

            )

            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) + tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) + neck,

                this.x + this.width,
                this.y + this.height * Math.abs(this.right) + neck

            )
        }
        context.lineTo(this.x + this.width, this.y + this.height)

        //!to bottom left
        if (this.bottom) {
            context.lineTo(this.x + this.width * Math.abs(this.bottom) + neck, this.y + this.height)
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) + tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom),
                this.y + this.height + tabHeight * Math.sign(this.bottom),

            )

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) - tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) - neck,

                this.y + this.height

            )

        }
        context.lineTo(this.x, this.y + this.height)

        //!to top left
        if (this.left) {
            context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck)

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) + neck,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) + tabWidth,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left)

            )

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) - tabWidth,

                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) - neck,

                this.x,
                this.y + this.height * Math.abs(this.left) - neck

            )
        }
        context.lineTo(this.x, this.y)

        context.save()

        context.clip()

        const scaledTabHeight = Math.min(VIDEO.videoWidth / SIZE.columns, VIDEO.videoHeight / SIZE.rows) * tabHeight / sz
//!


        //*each piece needs to crop a specific part of the video and show it, crop means rogner
        //*this function has 9 arguments: the VIDEO,where to take image data from(the left part where the cropping happens
        //*then the top part, then width and height) and where to draw it(x, y, width, height)
        context.drawImage(
            VIDEO,
            (this.colIndex * VIDEO.videoWidth) / SIZE.columns - scaledTabHeight,
            (this.rowIndex * VIDEO.videoHeight) / SIZE.rows - scaledTabHeight,
            VIDEO.videoWidth / SIZE.columns + scaledTabHeight * 2,
            VIDEO.videoHeight / SIZE.rows + scaledTabHeight * 2,
            this.x - tabHeight,
            this.y - tabHeight,
            this.width + tabHeight * 2,
            this.height + tabHeight * 2
        );
        context.restore()
        context.stroke();
    }

    isClose() {
        if (distance({ x: this.x, y: this.y }, { x: this.xCorrect, y: this.yCorrect }) < this.width / 3) {  
            return true
        }
        return false
    }
    //*the snap() method just put the pieces in the correct location
    snap() {
        this.x = this.xCorrect
        this.y = this.yCorrect
        this.correct = true //*we set to true when snapping
        POP_SOUND.play()//*playing a song when snapping at the right location

    }
}

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}



//!sound effect part
function playNote(key, duration) {
    let osc = AUDIO_CONTEXT.createOscillator()
    osc.frequency.value = key
    osc.start(AUDIO_CONTEXT.currentTime)
    osc.stop(AUDIO_CONTEXT.currentTime + duration / 1000)


    let enveloppe = AUDIO_CONTEXT.createGain()
    osc.connect(enveloppe)
    osc.type = "triangle"
    enveloppe.connect(AUDIO_CONTEXT.destination)
    enveloppe.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime)
    enveloppe.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1)
    enveloppe.gain.linearRampToValueAtTime(0, AUDIO_CONTEXT.currentTime + duration / 1000)

    setTimeout(function () {
        osc.disconnect()
    }, duration)
}

function PlayMelody() {
    playNote(keys.MI, 300)

    setTimeout(function () {
        playNote(keys.DO, 300)
    }, 300)

    setTimeout(function () {
        playNote(keys.RE, 150)
    }, 450)

    setTimeout(function () {
        playNote(keys.MI, 600)
    }, 600)
}

//!
//!




//!                                                                      DRAG AND DROP PART

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

function onTouchStart(evt) {
    let loc = { x: evt.touches[0].clientX, y: evt.touches[0].clientY }
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
        //*because sometimes the selected piece is drawn underneath the others
        //*depending on the order we are drawing the pieces
        //*since the top left one is the first in the array, all others will be drawn on top of it
        //*so we need to fix it by moving the selected piece at the last index in the array

        //*we first find out the index it's currently at
        const index = PIECES.indexOf(SELECTED_PIECE);
        //*then we remove it using the splice() and adding it again at the end of the array using the push() method
        if (index > -1) {
            PIECES.splice(index, 1)
            PIECES.push(SELECTED_PIECE)
        }
        //*if a piece is selected, we calculate what is the offset to the top left corner of piece
        SELECTED_PIECE.offset = {
            x: evt.x - SELECTED_PIECE.x,
            y: evt.y - SELECTED_PIECE.y
        }
        //*it possible that the user grabs the piece from the correct location
        //*so we need to set it back to false 
        SELECTED_PIECE.correct = false
    }
}

function onMouseMove(evt) {
    if (SELECTED_PIECE != null) {
        //*if the piece is selected, we update the location to the new mouse location and consider the offset as well
        SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x
        SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y
    }
}


function onMouseUp() {

    //*so before we release the piece, we need to check if the piece is close to the correct location
    //*if so, we snap it in place, snap means lâcher
    //*it is very unlikely that the player will place the pieces in the pixel perfect way, that's why we use snap() to help
    if (SELECTED_PIECE && SELECTED_PIECE.isClose()) {
        SELECTED_PIECE.snap()
        //*we check if all pieces are in the correct place and also the time because we don't want to update the time when the user completed the game
        if (isComplete() && END_TIME == null) {
            let now = new Date().getTime()
            END_TIME = now //*so we set the END_TIME when the game is over(when isComplete() is true)
            setTimeout(PlayMelody, 500)
        }

    }

    //*if the piece is not close to the correct location
    //*we just let it to the current location by setting SELECTED_PIECE to null
    SELECTED_PIECE = null

}
//*to find out if a piece have been pressed, we just iterate through all pieces
//*and check to see if the click location is within the bounds of any of them
//*then we return the piece
function getPressedPiece(loc) {
    //*because when the player click where multiple pieces overlap, it selects the bottom most pieces
    //*we fix it by iterating in reverse order
    //*in this way we stop at the top most piece that the user is clicking on
    for (let i = PIECES.length - 1; i >= 0; i--) {
        if ((loc.x > PIECES[i].x && loc.x < (PIECES[i].x + PIECES[i].width)) && (loc.y > PIECES[i].y && loc.y < (PIECES[i].y + PIECES[i].height))) {
            return PIECES[i]
        }

    }
    return null
}
//!




//!                                                                        GAME COMPONENTS PART
//*set difficulty function for game
function setDifficulty() {
    let diff = document.getElementById("difficulty").value
    switch (diff) {
        case "easy":
            initializePieces(3, 3)
            break
        case "medium":
            initializePieces(5, 5)
            break
        case "hard":
            initializePieces(10, 10)
            break
        case "insane":
            initializePieces(15, 15)
            break
    }
}
//*restart function for game
function restart() {
    START_TIME = new Date().getTime()//get the time when starting playing
    END_TIME = null
    randomizePieces()
    document.getElementById("menuItems").style.display = "none"//*we hide the start menu when the game begin
}

//*updateTime function for game
function updateTime() {
    now = new Date().getTime() //*the getTime() function give the current time in milliseconds
    if (START_TIME != null) {
        if (END_TIME != null) { //*if the game finished we stop updating the time
            document.getElementById("time").innerHTML = formatTime(END_TIME - START_TIME)

        } else {
            document.getElementById("time").innerHTML = formatTime(now - START_TIME)

        }

    }
}
//*checking if all pieces are in the correct location
function isComplete() {
    for (let i = 0; i < PIECES.length; i++) {
        if (PIECES[i].correct == false)
            return false
    }
    return true
}

//*formatTime function for game to format in 00:00:00 format
function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000)//only keep the integer part of the result when dividing by 1000
    let s = Math.floor(seconds % 60)
    let m = Math.floor((seconds % (60 * 60)) / 60)
    let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60))

    let formattedTime = h.toString().padStart(2, '0')
    formattedTime += ":"
    formattedTime += m.toString().padStart(2, '0')
    formattedTime += ":"
    formattedTime += s.toString().padStart(2, '0')

    return formattedTime
}
//!

                                                    //TODO       Database part








