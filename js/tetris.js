// Functions

// Draws a square with a black stroke
function drawSquare(x, y, color){
    ctx.fillStyle = color;
    ctx.fillRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);
}

// Draws the board
function drawBoard() {
    for (r = 0; r < BOARD_ROWS; r++) {
        for (c = 0; c < BOARD_COLS; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

// Spawns a new, random piece at the top of the board
function spawnNewPiece() {
    // Create random number between 0 and 6
    let r = randomN = Math.floor(Math.random() * PIECES.length)
    // Return a newly created piece
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

// Piece object class/constructor
function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;
    // Set the default pattern
    this.tetrominoPattern = 0;
    this.activeTetromino = this.tetromino[this.tetrominoPattern];
    
    // Position of the top left square of the piece pattern
    this.x = 3;
    this.y = -2;
}

// Fill all squares of the active piece with the provided color
Piece.prototype.fill = function(color) {
    for ( r = 0; r < this.activeTetromino.length; r++) {
        for (c = 0; c < this.activeTetromino.length; c++) {
            // Only fill the occupied squares of the pattern
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, this.y + r, color);
            }
        }
    }
}

// Draws active piece to the board
Piece.prototype.draw = function() {
    this.fill(this.color);
}

// "Undraws" active piece by filling it's squares with EMPTY color
Piece.prototype.unDraw = function() {
    this.fill(EMPTY);
}

// Move piece down by one row
Piece.prototype.moveDown = function() {
    // If there would be no collision after moving, move 
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        this.draw();
    // Else lock piece in current position and spawn new piece
    } else {
        this.lock();
        p = spawnNewPiece();
    }
}

// Move piece right by one column
Piece.prototype.moveRight = function() {
    // Only move piece if there would be no collision
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        this.draw();
    }
}

// Move piece left by one column
Piece.prototype.moveLeft = function() {
    // Only move piece if there would be no collision
    if(!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        this.draw();
    }
}

// Rotate the piece. If piece is touching a wall, kick it off by 1 column and then rotate.
Piece.prototype.rotate = function() {
    // Set next pattern of the piece
    let nextPattern = this.tetromino[(this.tetrominoPattern + 1) % this.tetromino.length];
    // Initialize kick as 0
    let kick = 0;
    
    // If there would be a collision after the rotation
    if (this.collision(0, 0, nextPattern)) {
        // Kick off to the left if the collision happened at the right boundary
        if(this.x > COL / 2) {
            kick = -1;
        // Else kick off to the right
        } else {
            kick = 1;
        }
    }
    
    // Check if there would be a collision. Only rotate if not.
    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoPattern = (this.tetrominoPattern + 1) % this.tetromino.length;
        this.activeTetromino = this.tetromino[this.tetrominoPattern];
        this.draw();
    }
}

// Locks pieces into place and removes all full rows if there are any
Piece.prototype.lock = function() {
    for (r = 0; r < this.activeTetromino.length; r++) {
        for (c = 0; c < this.activeTetromino.length; c++) {
            // Skip empty squares of the pattern
            if (!this.activeTetromino[r][c]) {
                continue;
            }
            // If any square of the piece to lock is above row 0, game is over
            if (this.y + r < 0) {
                alert("Game Over");
                // Set gameOver flag to true (this will terminate drop() function)
                gameOver = true;
                break;
            }
            // "Lock" piece into current place
            board[this.y + r][this.x + c] = this.color;
        }
    }
    // Remove full rows from board
    for (r = 0; r < BOARD_ROWS; r++) {
        // Initialize flag as true 
        let isRowFull = true;

        for (c = 0; c < BOARD_COLS; c++) {
            // If any square of the row is EMPTY, set flag to false
            if (board[r][c] == EMPTY) {
                isRowFull = false;
                break;
            }
        }

        // If row is full
        if (isRowFull) {
            // Move all squares above full row down by 1 row, overriding full row
            for (y = r; y > 1; y--) {
                for (c = 0; c < BOARD_COLS; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            // This leaves an empty line at the top that we have to redraw
            for (c = 0; c < BOARD_COLS; c++) {
                board[0][c] = EMPTY;
            }

            // Increase score by 10 points
            score += 10;
        }
    }

    // Draw updated board
    drawBoard();
    
    // Update score label on the page
    scoreLabel.innerHTML = score;
}

// Collision detection
Piece.prototype.collision = function(x, y, piece) {
    for (r = 0; r < piece.length; r++) {
        for (c = 0; c < piece.length; c++) {
            // Skip EMPTY squares of pattern
            if (!piece[r][c]) {
                continue;
            }
            // Position of the square after move
            let newX = this.x + c + x;
            let newY = this.y + r + y;
            
            // If new square position would be outside of board bounds return true
            if (newX < 0 || newX >= BOARD_COLS || newY >= BOARD_ROWS) {
                return true;
            }

            // Skip Y values less than 0 to prevent crash (index out of range error)
            if (newY < 0) {
                continue;
            }

            // If new square position would be inside of already occupied space return true
            if (board[newY][newX] != EMPTY) {
                return true;
            }
        }
    }
    // If all checks pass, return false
    return false;
}

// Move the active piece down one row each 1000ms (Serves as our game loop)
function drop() {
    // Get current timestamp
    let now = Date.now();
    // Calculate amount of time between this timestamnp and last one
    let delta = now - dropStart;

    // If more than 1000ms have passed
    if (delta > 1000) {
        // Move piece down one row
        p.moveDown();
        // Set timestamp to current time
        dropStart = Date.now();
    }
    // Request animation frames until gameOver flag is set to true
    if (!gameOver) {
        requestAnimationFrame(drop);
    }
}

// Gets called each time a key is pressed
function CONTROL(event) {
    if (event.keyCode == 37) {
        p.moveLeft();
        //dropStart = Date.now();
    } else if (event.keyCode == 38) {
        p.rotate();
        //dropStart = Date.now();
    } else if (event.keyCode == 39) {
        p.moveRight();
        //dropStart = Date.now();
    } else if (event.keyCode == 40) {
        p.moveDown();
    }
}

// Constants

// Game canvas
const cvs = document.getElementById("tetris-canvas");
// Context
const ctx = cvs.getContext("2d");
// Score label
const scoreLabel = document.getElementById("tetris-score");

// Size of the board
const BOARD_ROWS = 20;
const BOARD_COLS = 10;
// Size of each square
const SQ_SIZE = 20;
// Color of empty square
const EMPTY = "white";

// Pieces selection and thair colors
const PIECES = [
    [Z, "red"],
    [S, "green"],
    [T, "yellow"],
    [O, "blue"],
    [L, "purple"],
    [I, "cyan"],
    [J, "orange"]
];

// Initializing Game

// Create the board logic
let board = [];
for (r = 0; r < BOARD_ROWS; r++) {
    board[r] = [];
    for (c = 0; c < BOARD_COLS; c++) {
        // Set each square to EMPTY color
        board[r][c] = EMPTY;
    }
}

// Draw fresh board
drawBoard();
// Set score to 0
let score = 0;
// Set gameOver flag to false
let gameOver = false;

// Spawn random starter piece, take timestamp and start dropping the piece
let p = spawnNewPiece();
let dropStart = Date.now();
drop();

// Listen for keypress events and execute CONTROL function each time a key is pressed
document.addEventListener("keydown", CONTROL);