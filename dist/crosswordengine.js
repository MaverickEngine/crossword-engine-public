/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/css/jxword.less":
/*!*****************************!*\
  !*** ./src/css/jxword.less ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./node_modules/xd-crossword-parser/index.js":
/*!***************************************************!*\
  !*** ./node_modules/xd-crossword-parser/index.js ***!
  \***************************************************/
/***/ ((module) => {

// A library for converting .xd Crossword data to JSON (as defined by Saul Pwanson - http://xd.saul.pw) written by Jason Norwood-Young

function XDParser(data) {
    function processData(data) {
        // Split into parts
        let parts = data.split(/^$^$/gm).filter(s => s !== "\n");
        if (parts.length > 4) {
            // console.log(JSON.stringify(data));
            parts = data.split(/\r\n\r\n/g).filter(s => (s.trim()));
            for(let i = 0; i < parts.length; i++) {
                parts[i] = parts[i].replace(/\r\n/g, "\n");
            }
        }
        if (parts.length !== 4) throw (`Too many parts - expected 4, found ${parts.length}`);
        const rawMeta = parts[0];
        const rawGrid = parts[1];
        const rawAcross = parts[2];
        const rawDown = parts[3];
        const meta = processMeta(rawMeta);
        const grid = processGrid(rawGrid);
        const across = processClues(rawAcross);
        const down = processClues(rawDown);
        return { meta, grid, across, down, rawGrid, rawAcross, rawDown, rawMeta, };
    }

    function processMeta(rawMeta) {
        const metaLines = rawMeta.split("\n").filter(s => (s) && s !== "\n");
        let meta = {};
        metaLines.forEach(metaLine => {
            const lineParts = metaLine.split(": ");
            meta[lineParts[0]] = lineParts[1];
        });
        return meta;
    }

    function processGrid(rawGrid) {
        let result = [];
        const lines = rawGrid.split("\n").filter(s => (s) && s !== "\n");
        for (let x = 0; x < lines.length; x++) {
            result[x] = lines[x].split("");
        }
        return result;
    }

    function processClues(rawClues) {
        let result = [];
        const lines = rawClues.split("\n").filter(s => (s) && s !== "\n");
        const regex = /(^.\d*)\.\s(.*)\s~\s(.*)/;
        for (let x = 0; x < lines.length; x++) {
            if (!lines[x].trim()) continue;
            const parts = lines[x].match(regex);
            if (parts.length !== 4) throw (`Could not parse question ${lines[x]}`);
            // Unescape string
            const question = parts[2].replace(/\\/g, "");
            result[x] = {
                num: parts[1],
                question: question,
                answer: parts[3]
            };
        }
        return result;
    }

    return processData(data);
}

module.exports = XDParser;

/***/ }),

/***/ "./src/js/jxword-grid.js":
/*!*******************************!*\
  !*** ./src/js/jxword-grid.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/*
* JXWord Grid - A Crossword System by Jason Norwood-Young <jason@10layer.com>
* Copyright 2020
*/

// Col,   Row
// X,     Y
// width, height
class JXWord {
    constructor(opts) {
        console.log("JXWord, a crossword system by Jason Norwood-Young <jason@10layer.com>");
        if (!opts.container) throw "'container' required";
        if (!opts.data) throw "'data' required";
        // Set some defaults
        this.opts = Object.assign({ 
            width: 500, 
            height: 500, 
            outerBorderWidth: 1.5, 
            innerBorderWidth: 1, 
            margin: 3, 
            outerBorderColour: "black", 
            innerBorderColour: "black", 
            fillColour: "black", 
            cols: opts.data.grid.length,
            rows: opts.data.grid[0].length, 
            fontRatio: 0.7,
            numRatio: 0.33,
            selectCellColour: "#f7f457",
            selectWordColour: "#9ce0fb",
            backgroundColour: "white",
            debug: false,
            restoreState: false
        }, opts);
        this.uid = +new Date();
        this.state = {
            time_taken: 0,
            autocheck: false
        };
        // this.state.time_taken = 0;
        this.is_hidden = false;
        this.is_paused = false;
        // Wait for the document to load
        document.addEventListener("DOMContentLoaded", this.onLoad.bind(this));
    }

    // throwEvent(eventName, detail) {
    //     console.log(this.events, eventName);
    //     this.events.publish(eventName, detail);
    // }

    onLoad() {
        this.containerElement = document.querySelector(this.opts.container);
        if (!this.containerElement) throw (`Could not find ${this.opts.container}`);
        this.totalWidth = this.opts.width + (this.opts.margin * 2);
        this.totalHeight = this.opts.height + (this.opts.margin * 2);
        this.cellWidth = this.opts.width / this.opts.cols;
        this.cellHeight = this.opts.height / this.opts.rows;
        this.fontSize = this.cellWidth * this.opts.fontRatio; // Font size x% size of cell
        this.grid = [];
        this.grid = this.opts.data.grid[0].map((col, i) => this.opts.data.grid.map(row => row[i])); // Transpose our matrix
        this.hash = this.calcHash(this.grid); // Calculate our hash result
        this.storageName = `jxword-${Math.abs(this.hash)}`;
        this.drawLayout();
        this.drawGrid();
        this.drawBorder();
        this.drawNumbers();
        this.drawQuestions();
        this.restoreState();
        this.setAria();
        this.registerActions();
        this.setFocus();
        this.listenQuestions();
        this.setTimer();
        this.drawTimer();
        this.checkOverlay();
    }

    setTimer() {
        setInterval((() => {
            if (this.is_hidden) return;
            if (this.is_paused) return;
            if (!this.state.time_taken) this.state.time_taken = 0;
            this.state.time_taken++;
            this.saveState();
            this.drawTimer();
        }).bind(this), 1000);
    }

    drawLayout() {
        this.containerElement.innerHTML = `
            <div class="jxword-container" id="jxword-container-${this.uid}">
                <div class="jxword-header">
                    <nav class="jxword-controls" role="navigation">
                        <div class="jxword-menu-toggle">
                            <input type="checkbox" />
                            <span class="jxword-hamberder"></span>
                            <span class="jxword-hamberder"></span>
                            <span class="jxword-hamberder"></span>
                            <ul class="jxword-menu">
                                <a href="#" class="jxword-button" id="jxword-info-${this.uid}"><li>Puzzle Info</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" class="jxword-button" id="jxword-autocheck-${this.uid}"><li>Autocheck ${(this.state.autocheck) ? "ON" : "" }</li></a>
                                <a href="#" class="jxword-button" id="jxword-check_square-${this.uid}"><li>Check Square</li></a>
                                <a href="#" class="jxword-button" id="jxword-check_word-${this.uid}"><li>Check Word</li></a>
                                <a href="#" class="jxword-button" id="jxword-check_puzzle-${this.uid}"><li>Check Puzzle</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" class="jxword-button" id="jxword-reset-${this.uid}"><li>Reset</li></a>
                            </ul>
                        </div>
                    </nav>
                    <div id="jxword-pause-${this.uid}" class="jxword-pause">
                        <span class="jxword-pause-text jxword-sr-only">Pause</span>
                    </div> 
                    <div id="jxword-timer-${this.uid}" class="jxword-timer"></div>
                </div>
                <div id="jxword-overlay-${this.uid}" class="jxword-overlay jxword-overlay-hidden">
                    <div class="jxword-overlay-content">
                        <div class="jxword-overlay-title">
                            Your Game is Currently Paused
                        </div>
                        <div id="jxword-overlay-resume-${this.uid}" class="jxword-overlay-button">
                            Resume
                        </div>
                    </div>
                </div>
                <div class="jxword-svg-container">
                    <svg id='jxword-svg-${this.uid}' class='jxword-svg' viewBox="0 0 ${ this.totalWidth } ${ this.totalHeight }">
                        <g class="cell-group" id='jxword-g-container-${this.uid }'></g>
                    </svg>
                </div>
                <div class="jxword-single-question-container jxword-mobile-only">
                    <div class="jxword-arrow jxword-arrow-back" id="jxword-arrow-back-${ this.uid }">&lang;</div>
                    <div class="jxword-single-question" id="jxword-single-question-${ this.uid }"></div>
                    <div class="jxword-arrow jxword-arrow-forward" id="jxword-arrow-forward-${ this.uid }">&rang;</div>
                </div>
                <div class="jxword-keyboard jxword-mobile-only">
                    <div class="jxword-keyboard-row">
                        <div class="jxword-key" data-key="Q">Q</div>
                        <div class="jxword-key" data-key="W">W</div>
                        <div class="jxword-key" data-key="E">E</div>
                        <div class="jxword-key" data-key="R">R</div>
                        <div class="jxword-key" data-key="T">T</div>
                        <div class="jxword-key" data-key="Y">Y</div>
                        <div class="jxword-key" data-key="U">U</div>
                        <div class="jxword-key" data-key="I">I</div>
                        <div class="jxword-key" data-key="O">O</div>
                        <div class="jxword-key" data-key="P">P</div>
                    </div>
                    <div class="jxword-keyboard-row">
                        <div class="jxword-key" data-key="A">A</div>
                        <div class="jxword-key" data-key="S">S</div>
                        <div class="jxword-key" data-key="D">D</div>
                        <div class="jxword-key" data-key="F">F</div>
                        <div class="jxword-key" data-key="G">G</div>
                        <div class="jxword-key" data-key="H">H</div>
                        <div class="jxword-key" data-key="J">J</div>
                        <div class="jxword-key" data-key="K">K</div>
                        <div class="jxword-key" data-key="L">L</div>
                    </div>
                    <div class="jxword-keyboard-row">
                        <div class="jxword-key" data-key="Z">Z</div>
                        <div class="jxword-key" data-key="X">X</div>
                        <div class="jxword-key" data-key="C">C</div>
                        <div class="jxword-key" data-key="V">V</div>
                        <div class="jxword-key" data-key="B">B</div>
                        <div class="jxword-key" data-key="N">N</div>
                        <div class="jxword-key" data-key="M">M</div>
                        <div class="jxword-key jxword-key-backspace" data-key="BACKSPACE">&lArr;</div>
                    </div>
                </div>
                <div class="jxword-question-container jxword-desktop-only" id="jxword-question-container-${ this.uid }">
                    <div class="jxword-questions-across" id="jxword-question-across-${ this.uid }"><h4>Across</h4></div>
                    <div class="jxword-questions-down" id="jxword-question-down-${ this.uid }"><h4>Down</h4></div>
                </div>
            </div>
        `;
        this.svg = document.querySelector(`#jxword-svg-${ this.uid }`);
        this.cellGroup = document.querySelector(`#jxword-g-container-${this.uid }`);
    }

    drawGrid() {
        for (let row = 0; row < this.opts.rows; row++) {
            for (let col = 0; col < this.opts.cols; col++) {
                this.cellGroup.innerHTML += this.drawCell(this.grid[col][row], col, row);
            }
        }
    }

    drawCell(letter, col, row) {
        const x = (this.cellWidth * col) + this.opts.margin;
        const y = (this.cellHeight * row) + this.opts.margin;
        const width = this.cellWidth;
        const height = this.cellHeight;
        const letterX = x + (width / 2);
        const letterY = y + height - (height * 0.1);
        let fill = this.opts.backgroundColour;
        let isBlank = "is-letter";
        let containerClass="is-letter-container";
        if (letter == "#") {
            fill = this.opts.fillColour;
            isBlank = "is-blank";
            containerClass="";
        }
        return `<g id="jxword-cell-${this.uid}-${col}-${row}" class="jxword-cell ${containerClass}" style="z-index: 20"><rect class="jxword-cell-rect ${isBlank}" role="cell" tabindex="-1" aria-label="" x="${x}" y="${y}" width="${width}" height="${height}" stroke="${this.opts.innerBorderColour}" stroke-width="${this.opts.innerBorderWidth}" fill="${fill}" data-col="${col}" data-row="${row }" contenteditable="true"></rect><text id="jxword-letter-${this.uid}-${col}-${row}" x="${ letterX }" y="${ letterY }" text-anchor="middle" font-size="${ this.fontSize }" width="${ width }"></text></g>`;
    }

    drawLetter(letter, col, row) {
        const letterEl = document.querySelector(`#jxword-letter-${this.uid}-${col}-${row}`);
        const txt = document.createTextNode(letter);
        while(letterEl.firstChild) {
            letterEl.removeChild(letterEl.lastChild);
        }
        letterEl.appendChild(txt);
    }

    drawTimer() {
        function fillZeros(num) {
            return ("0" + num).slice(-2);
        }
        function formatTime(secs) {
            const minutes = Math.floor(secs / 60);
            const seconds = secs % 60;
            const hours = Math.floor(minutes / 60);
            return `${fillZeros(hours)}:${fillZeros(minutes)}:${fillZeros(seconds)}`;
        }
        const timerEl = document.querySelector(`#jxword-timer-${this.uid}`);
        timerEl.innerHTML = `<span id="jxword-timer-text-${this.uid}">${formatTime(this.state.time_taken)}</span>`;
    }

    isStartOfAcross(col, row) {
        if (this.grid[col][row] === "#") return false;
        if ((col === 0) || (this.grid[col - 1][row] == "#")) {
            // if (row < this.grid[0].length - 1) {
                // if (this.grid[col][row + 1] !== "#") {
                    return true;
                // }
            // }
        }
        return false;
    }
    
    isStartOfDown(col, row) {
        if (this.grid[col][row] === "#") return false;
        if ((row === 0) || (this.grid[col][row - 1] == "#")) {
            // if (col < this.grid.length - 1) {
                // if (this.grid[col + 1][row] !== "#") {
                   return true;
                // }
            // }
        }
        return false;
    }

    drawNumbers() {
        // A cell gets a number if it has a block or edge above or to the left of it, and a blank letter to the bottom or right of it respectively
        // Populate a number grid while we're at it
        let num = 1;
        for (let row = 0; row < this.opts.rows; row++) {
            for (let col = 0; col < this.opts.cols; col++) {
                let drawNum = this.isStartOfAcross(col, row) || this.isStartOfDown(col, row);
                if (drawNum) {
                    this.drawNumber(col, row, num++);
                }
            }
        }
    }

    drawNumber(col, row, num) {
        const numFontSize = this.cellWidth * this.opts.numRatio;
        const x = (this.cellWidth * col) + this.opts.margin + 2;
        const y = (this.cellHeight * row) + this.opts.margin + numFontSize;
        const cellEl = document.querySelector(`#jxword-cell-${ this.uid }-${ col }-${ row }`);
        
        cellEl.innerHTML += `<text x="${ x }" y="${ y }" text-anchor="left" font-size="${ numFontSize }">${ num }</text>`
    }

    drawBorder() {
        this.cellGroup.innerHTML += `<rect x="${this.opts.margin}" y="${this.opts.margin}" width="${this.opts.width}" height="${this.opts.height}" stroke="${this.opts.outerBorderColour }" stroke-width="${this.opts.outerBorderWidth }" fill="none">`;
    }

    drawQuestions() {
        let across = `<ol id="jxword-questions-across-${this.uid}" class="jxword-questions-list">`
        this.opts.data.across.forEach(q => {
            across += this.drawQuestion(q);
        })
        document.querySelector(`#jxword-question-across-${this.uid}`).innerHTML += across;
        let down = `<ol id="jxword-questions-down-${this.uid}" class="jxword-questions-list">`
        this.opts.data.down.forEach(q => {
            down += this.drawQuestion(q);
        })
        document.querySelector(`#jxword-question-down-${this.uid}`).innerHTML += down;
    }

    drawQuestion(q) {
        return `<li class="jxword-questions-list-item" id="jxword-question-across-${q.num}-${this.uid}" data-q="${q.num}"><span class="jxword-questions-list-item-num">${q.num.replace(/^\D/, "")}</span><span class="jxword-questions-list-item-question">${q.question}</span></li>`;
    }

    showOverlay() {
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.add("jxword-overlay-show");
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.remove("jxword-overlay-hide");
    }

    hideOverlay() {
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.add("jxword-overlay-hide");
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.remove("jxword-overlay-show");
    }

    checkOverlay() {
        if (this.is_paused) {
            this.showOverlay();
        } else {
            this.hideOverlay();
        }
    }

    setState() {
        this.state.direction = 0; // 0 = across, 1 = down
        this.state.complete = false; // Are we done yet?
        this.state.hints = false; // Had any help?
        this.state.currentCell = [0, 0]; // col, row
        this.state.time_taken = 0; // How long have we been playing?
        this.state.graph = new Array(this.opts.cols).fill("").map(() => new Array(this.opts.rows).fill("")); // A matrix filled with empty chars
        for (let col = 0; col < this.opts.cols; col++) {
            for (let row = 0; row < this.opts.rows; row++) {
                if (this.grid[col][row] === "#") {
                    this.state.graph[col][row] = "#";
                }
            }
        }
        this.state.hash = this.calcHash(this.state.graph);
        // We need to scalars (for across and down) that we use when deciding which cell to go to in the event that a letter is typed, tab is pressed etc. 
        // Down Scalar
        this.state.scalarDown = [];
        let index = 0;
        let q = 0;
        for (let row = 0; row < this.opts.rows; row++) {
            for (let col = 0; col < this.opts.cols; col++) {
                if (this.isStartOfAcross(col, row) || this.isStartOfDown(col, row)) q++;
                if (this.isStartOfDown(col, row)) {
                    let y = row;
                    while ((this.grid[col][y] !== "#") && (y < this.opts.rows)) {
                        let cell = {
                            col,
                            row: y,
                            letter: "",
                            startOfWord: this.isStartOfDown(col, y),
                            index: index++,
                            q,
                            correct: false,
                        }
                        this.state.scalarDown.push(cell);
                        y++;
                    }
                }
            }
        }
        if (this.debug) console.log(this.state.scalarDown);
        this.state.scalarAcross = [];
        index = 0;
        let num = 0;
        q = 0;
        for (let row = 0; row < this.opts.rows; row++) {
            for (let col = 0; col < this.opts.cols; col++) {
                if (this.isStartOfAcross(col, row) || this.isStartOfDown(col, row)) num++;
                if (this.isStartOfAcross(col, row)) q = num;
                if (this.grid[col][row] !== "#") {
                    let cell = {
                        row,
                        col,
                        letter: "",
                        startOfWord: this.isStartOfAcross(col, row),
                        index: index++,
                        q,
                        correct: false,
                    }
                    this.state.scalarAcross.push(cell);
                }
            }
        }
        // console.log(this.state.scalarAcross);
        this.markCells();
    }

    saveState() {
        if (this.debug) console.log("Saving State");
        window.localStorage.setItem(this.storageName, JSON.stringify(this.state));
    }

    restoreState() {
        const data = window.localStorage.getItem(this.storageName);
        if (data) {
            this.state = JSON.parse(data);
            for (let row = 0; row < this.opts.rows; row++) {
                for (let col = 0; col < this.opts.cols; col++) {
                    let letter = this.state.graph[col][row];
                    if (letter !== "#") {
                        this.drawLetter(letter, col, row);
                    }
                }
            }
            this.markCells();
            this.stateRestored = true;
            if (this.debug) console.log("State Restored");
        } else {
            this.setState();
        }
    }

    calcHash(matrix) {
        let s = "";
        for (let row = 0; row < this.opts.rows; row++) {
            for (let col = 0; col < this.opts.cols; col++) {
                s += matrix[col][row];
            }
        }
        let hash = 0, i, chr;
        for (let i = 0; i < s.length; i++) {
            chr = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        // console.log(hash, s);
        return hash;
    }

    markCells() {
        let allCells = document.querySelectorAll(".jxword-cell-rect.is-letter");
        allCells.forEach(cell => {
            cell.setAttribute("fill", this.opts.backgroundColour);
            cell.setAttribute("tabindex", -1);
        })
        let currentCellRect = document.querySelector(`#jxword-cell-${this.uid}-${this.state.currentCell[0] }-${ this.state.currentCell[1] } > rect`);
        currentCellRect.setAttribute("fill", this.opts.selectCellColour);
        currentCellRect.setAttribute("tabindex", 1);
        let markedCell = null;
        if (!this.state.direction) {
            for (let count = this.state.currentCell[0] + 1; count < this.opts.cols; count ++) {
                markedCell = document.querySelector(`#jxword-cell-${this.uid}-${count}-${this.state.currentCell[1]} > rect`);
                if (markedCell.classList.contains("is-blank")) break;
                markedCell.setAttribute("fill", this.opts.selectWordColour);
            }
            for (let count = this.state.currentCell[0] - 1; count >= 0; count--) {
                markedCell = document.querySelector(`#jxword-cell-${this.uid}-${count}-${this.state.currentCell[1]} > rect`);
                if (markedCell.classList.contains("is-blank")) break;
                markedCell.setAttribute("fill", this.opts.selectWordColour);
            }
        } else {
            for (let count = this.state.currentCell[1] + 1; count < this.opts.rows; count++) {
                markedCell = document.querySelector(`#jxword-cell-${this.uid}-${this.state.currentCell[0]}-${count} > rect`);
                if (markedCell.classList.contains("is-blank")) break;
                markedCell.setAttribute("fill", this.opts.selectWordColour);
            }
            for (let count = this.state.currentCell[1] - 1; count >= 0; count--) {
                markedCell = document.querySelector(`#jxword-cell-${this.uid}-${this.state.currentCell[0]}-${count} > rect`);
                if (markedCell.classList.contains("is-blank")) break;
                markedCell.setAttribute("fill", this.opts.selectWordColour);
            }
        }
        this.highlightQuestion(this.state.currentCell[0], this.state.currentCell[1]);
        this.saveState();
    }

    registerActions() {
        document.addEventListener("visibilitychange", this.visibilityChanged.bind(this));
        let allCells = document.querySelectorAll("rect.is-letter");
        for(let cell of allCells) {
            cell.addEventListener("click", this.catchCellClick.bind(this));
        }
        document.addEventListener("keydown", this.catchKeyPress.bind(this));
        document.querySelector(`#jxword-arrow-forward-${this.uid}`).addEventListener("click", this.moveToNextWord.bind(this));
        document.querySelector(`#jxword-arrow-back-${this.uid}`).addEventListener("click", this.moveToPreviousWord.bind(this));
        document.querySelector(`#jxword-reset-${this.uid}`).addEventListener("click", this.reset.bind(this));
        document.querySelector(`#jxword-autocheck-${this.uid}`).addEventListener("click", this.toggleAutocheck.bind(this));
        document.querySelector(`#jxword-single-question-${this.uid}`).addEventListener("click", this.changeDirection.bind(this));
        const keys = document.querySelectorAll(".jxword-key");
        for (let key of keys) {
            if (this.debug) console.log(key);
            key.addEventListener("click", this.keyClick.bind(this));
        }
        document.querySelector(`#jxword-pause-${this.uid}`).addEventListener("click", this.pause.bind(this));
        document.querySelector(`#jxword-overlay-resume-${this.uid}`).addEventListener("click", this.play.bind(this));
    }

    visibilityChanged(e) {
        // console.log(document.visibilityState);
        if (document.visibilityState === "hidden") {
            this.is_hidden = true;
        } else if (document.visibilityState === "visible") {
            this.is_hidden = false;
        }
    }

    pause() {
        if (this.debug) console.log("Pause");
        if (this.is_paused) {
            this.is_paused = false;
            document.querySelector(`#jxword-pause-${this.uid} > .jxword-pause-text`).innerHTML = "Pause";
            // add class to pause button
            document.querySelector(`#jxword-pause-${this.uid}`).classList.remove("jxword-play");
        } else {
            this.is_paused = true;
            document.querySelector(`#jxword-pause-${this.uid} > .jxword-pause-text`).innerHTML = "Play";
            document.querySelector(`#jxword-pause-${this.uid}`).classList.add("jxword-play");
        }
        this.checkOverlay();
    }

    play() {
        if (this.debug) console.log("Play");
        if (this.is_paused) {
            this.is_paused = false;
            document.querySelector(`#jxword-pause-${this.uid} > .jxword-pause-text`).innerHTML = "Pause";
            // add class to pause button
            document.querySelector(`#jxword-pause-${this.uid}`).classList.remove("jxword-play");
        }
        this.checkOverlay();
    }

    catchCellClick(e) {
        const col = Number(e.target.dataset.col);
        const row = Number(e.target.dataset.row);
        if ((col === this.state.currentCell[0]) && (row === this.state.currentCell[1])) { // Clicked on already selected cell
            this.changeDirection();
        } else {
            this.state.currentCell[0] = col;
            this.state.currentCell[1] = row;
        }
        this.markCells();
    }

    typeLetter(letter) {
        this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]] = letter;
        this.setScalars(letter, this.state.currentCell[0], this.state.currentCell[1])
        this.drawLetter(letter, this.state.currentCell[0], this.state.currentCell[1]);
        // this.checkHint();
        this.checkWin();
        this.moveToNext();
    }

    catchKeyPress(e) {
        const keycode = e.keyCode;
        // console.log(e);
        if (e.metaKey) return;
        const printable = 
            ((keycode > 47 && keycode < 58)   || // number keys
            (keycode > 64 && keycode < 91)   || // letter keys
            (keycode > 95 && keycode < 112)  || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223));   // [\]' (in order)
        if (this.is_paused) return; // Don't do anything if paused
        if (printable && !this.state.complete) {
            const letter = e.key.toUpperCase();
            this.typeLetter(letter);
        } else if (keycode === 8) { // Backspace
            e.preventDefault();
            if (!this.state.complete) { // Don't allow changes if we've finished our puzzle
                this.delete();
            }
        } else if (keycode == 32) {
            e.preventDefault();
            this.moveToNext();
        } else if ((keycode === 9) || (keycode === 13)) { // Tab or Enter
            e.preventDefault();
            if (e.shiftKey) {
                this.moveToPreviousWord();
            } else {
                this.moveToNextWord();
            }
        } else if (keycode === 37) {
            e.preventDefault();
            this.moveLeft();
        } else if (keycode === 38) {
            e.preventDefault();
            this.moveUp();
        } else if (keycode === 39) {
            e.preventDefault();
            this.moveRight();
        } else if (keycode === 40) {
            e.preventDefault();
            this.moveDown();
        }
    }

    moveLeft() {
        if (this.state.direction) {
            this.state.direction = 0;
            this.setAria();
        } else {
            let x = this.state.currentCell[0];
            while (x > 0) {
                x--;
                if (this.state.graph[x][this.state.currentCell[1]] !== "#") {
                    this.state.currentCell[0] = x;
                    break;
                }
            }
        }
        this.markCells();
    }

    moveUp() {
        if (!this.state.direction) {
            this.state.direction = 1;
            this.setAria();
        } else {
            let y = this.state.currentCell[1];
            while (y > 0) {
                y--;
                if (this.state.graph[this.state.currentCell[0]][y] !== "#") {
                    this.state.currentCell[1] = y;
                    break;
                }
            }
        }
        this.markCells();
    }

    moveRight() {
        if (this.state.direction) {
            this.state.direction = 0;
            this.setAria();
        } else {
            let x = this.state.currentCell[0];
            while (x < this.opts.cols - 1) {
                x++;
                if (this.state.graph[x][this.state.currentCell[1]] !== "#") {
                    this.state.currentCell[0] = x;
                    break;
                }
            }
        }
        this.markCells();
    }

    moveDown() {
        if (!this.state.direction) {
            this.state.direction = 1;
            this.setAria();
        } else {
            let y = this.state.currentCell[1];
            while (y < this.opts.cols - 1) {
                y++;
                if (this.state.graph[this.state.currentCell[0]][y] !== "#") {
                    this.state.currentCell[1] = y;
                    break;
                }
            }
        }
        this.markCells();
    }

    setScalars(letter, col, row) {
        this.state.scalarAcross.find(cell => (cell.col === col && cell.row === row)).letter = letter;
        let down = this.state.scalarDown.find(cell => (cell.col === col && cell.row === row));
        if (down) down.letter = letter;
    }

    moveToNext() {
        let nextCell = null;
        let scalar = null;
        let otherScalar = null;
        if (!this.state.direction) { // Across
            scalar = this.state.scalarAcross;
            otherScalar = this.state.scalarDown;
        } else { // Down
            scalar = this.state.scalarDown;
            otherScalar = this.state.scalarAcross;
        }
        let cursor = scalar.find(cell => (cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]));
        // console.log(cursor);
        for (let x = cursor.index + 1; x < scalar.length; x++) {
            // console.log(x, scalar[x]);
            if (scalar[x].letter === "") {
                nextCell = scalar[x];
                break;
            }
        }
        if (nextCell) { // Found a cell to move to
            this.state.currentCell[0] = nextCell.col;
            this.state.currentCell[1] = nextCell.row;
        } else { // Change direction
            nextBlank = otherScalar.find(cell => cell.letter === "");
            if (nextBlank) { // Is there still a blank down?
                this.state.currentCell[0] = nextBlank.col;
                this.state.currentCell[1] = nextBlank.row;
                this.changeDirection()
            }
        }
        this.markCells();
    }

    moveToPreviousLetter() {
        let scalar = null;
        if (!this.state.direction) {
            scalar = this.state.scalarAcross;
        } else {
            scalar = this.state.scalarDown;
        }
        let currentCell = scalar.find(cell => cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]);
        let cursor = currentCell.index - 1;
        for (let x = cursor; x >= 0; x--) {
            if (scalar[x].letter !== "#") {
                this.state.currentCell[0] = scalar[x].col;
                this.state.currentCell[1] = scalar[x].row;
                break;
            }
        }
        this.markCells();
    }

    delete() {
        if (!this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]]) {
            // Move back and then delete
            this.moveToPreviousLetter();
        }
        this.drawLetter("", this.state.currentCell[0], this.state.currentCell[1]);
        this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]] = "";
        this.setScalars("", this.state.currentCell[0], this.state.currentCell[1]);
        this.saveState();
    }
    
    moveToNextWord() {
        let nextCell = null;
        let scalar = null;
        let otherScalar = null;
        if (!this.state.direction) { // Across
            scalar = this.state.scalarAcross;
            otherScalar = this.state.scalarDown;
        } else { // Down
            scalar = this.state.scalarDown;
            otherScalar = this.state.scalarAcross;
        }
        let cursor = scalar.find(cell => (cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]));
        for (let x = cursor.index + 1; x < scalar.length; x++) {
            if (scalar[x].startOfWord) {
                nextCell = scalar[x];
                break;
            }
        }
        if (nextCell && nextCell.letter !== "") { // First letter is not blank, 
            for (let x = nextCell.index + 1; x < scalar.length; x++) {
                if (scalar[x].letter === "") {
                    nextCell = scalar[x];
                    break;
                }
            }
        }
        if (nextCell) { // Found a cell to move to
            this.state.currentCell[0] = nextCell.col;
            this.state.currentCell[1] = nextCell.row;
        } else { // Change direction
            nextBlank = otherScalar.find(cell => cell.letter === "");
            if (nextBlank) { // Is there still a blank down?
                this.state.currentCell[0] = nextBlank.col;
                this.state.currentCell[1] = nextBlank.row;
                this.changeDirection();
            }
        }
        this.markCells();
    }

    moveToPreviousWord() {
        function findLast(array, predicate) {
            for (let i = array.length - 1; i >= 0; --i) {
                const x = array[i];
                if (predicate(x)) {
                    return x;
                }
            }
        }
        // Move to fist letter of current word, then search backward for a free space, then move to the start of that word, then move forward until a free space
        let nextCell = null;
        let scalar = null;
        let otherScalar = null;
        if (!this.state.direction) { // Across
            scalar = this.state.scalarAcross;
            otherScalar = this.state.scalarDown;
        } else { // Down
            scalar = this.state.scalarDown;
            otherScalar = this.state.scalarAcross;
        }
        let cursor = scalar.find(cell => (cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]));
        // Start of current word
        let startOfCurrentWord = null;
        for (let x = cursor.index; x >= 0; x--) {
            if (scalar[x].startOfWord) {
                startOfCurrentWord = scalar[x];
                break;
            }
        }
        let blankSpace = null;
        // Keep going back until we hit a blank space
        if (startOfCurrentWord) {
            for (let x = startOfCurrentWord.index - 1; x >= 0; x--) {
                if (scalar[x].letter === "") {
                    blankSpace = scalar[x];
                    break;
                }
            }
        }
        let startOfLastWord = null;
        if (blankSpace) {
            // Now find start of this word
            for (let x = blankSpace.index; x >= 0; x--) {
                if (scalar[x].startOfWord) {
                    startOfLastWord = scalar[x];
                    break;
                }
            }
        }
        if (startOfLastWord) {
            for (let x = startOfLastWord.index; x < scalar.length; x++) {
                if (scalar[x].letter === "") {
                    nextCell = scalar[x];
                    break;
                }
            }
        }
        if (nextCell) { // Found a cell to move to
            this.state.currentCell[0] = nextCell.col;
            this.state.currentCell[1] = nextCell.row;
        } else { // Change direction
            nextBlank = findLast(otherScalar, cell => cell.letter === "");
            if (nextBlank) { // Is there still a blank down?
                let startOfWord = null;
                for (let x = nextBlank.index; x >= 0; x--) { // Move to start of word
                    if (otherScalar[x].startOfWord) {
                        startOfWord = otherScalar[x];
                        break;
                    }
                }
                this.state.currentCell[0] = startOfWord.col;
                this.state.currentCell[1] = startOfWord.row;
                this.changeDirection();
            }
        }
        this.markCells();
    }

    setFocus() {
        document.querySelector(".jxword-cell-rect").focus();
        // this.containerElement.focus();
    }

    checkWin() {
        let win = true;
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                if (this.grid[x][y] === "#") continue;
                if (this.grid[x][y] === this.state.graph[x][y]) {
                    this.state.scalarAcross.find(scalar => scalar.row == y && scalar.col == x).correct = true;
                    this.state.scalarDown.find(scalar => scalar.row == y && scalar.col == x).correct = true;
                } else {
                    this.state.scalarAcross.find(scalar => scalar.row == y && scalar.col == x).correct = false;
                    this.state.scalarDown.find(scalar => scalar.row == y && scalar.col == x).correct = false;
                    win = false;
                }
            }
        }
        // this.state.hash = this.calcHash(this.state.graph);
        if (win) {
            alert("You Win!");
            this.state.complete = true;
        }
    }

    highlightQuestion(col, row) {
        let d = null;
        let cell = null;
        let data = null;
        if (!this.state.direction) {
            cell = this.state.scalarAcross.find(cell => (cell.col === col && cell.row === row));
            d = "A";
            data = this.opts.data.across;
        } else {
            cell = this.state.scalarDown.find(cell => (cell.col === col && cell.row === row));
            d = "D";
            data = this.opts.data.down;
        }
        let q = cell.q;
        var elems = document.querySelectorAll(".jxword-questions-list-item.active");
        [].forEach.call(elems, function (el) {
            el.classList.remove("active");
        });
        const questionEl = document.querySelector(`#jxword-question-across-${d}${q}-${this.uid}`);
        questionEl.classList.add("active");
        if (this.debug) console.log({ questionEl });
        if (this.debug)  console.log(`#jxword-question-${d}-${this.uid}`);
        this.ensureVisibility(questionEl, questionEl.parentElement.parentElement);
        let question = data.find(q => q.num === `${d}${cell.q}`);
        document.querySelector(".jxword-single-question").innerHTML = `${question.question}`;
    }

    ensureVisibility(el, container) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.bottom > containerRect.bottom) {
            el.scrollIntoView(false);
        }
        if (rect.top < containerRect.top) {
            el.scrollIntoView(true);
        }
    }

    listenQuestions() {
        const questions = document.querySelectorAll(".jxword-questions-list-item");
        for(let question of questions) {
            question.addEventListener("click", this.clickQuestion.bind(this));
        }
    }

    clickQuestion(e) {
        const q = e.currentTarget.dataset.q;
        const dir = q[0];
        const num = Number(q.substring(1));
        let scalar = null;
        if (dir === "A") {
            scalar = this.state.scalarAcross;
            this.state.direction = 0;
            this.setAria();
        } else {
            scalar = this.state.scalarDown;
            this.state.direction = 1;
            this.setAria();
        }
        for (let cell of scalar) {
            if (cell.q === num) {
                // Move to the first empty letter in a word. If there isn't an empty letter, move to start of word.
                let emptyletters = scalar.filter(wordcell => wordcell.q === num && wordcell.letter === "");
                if (emptyletters.length) {
                    this.state.currentCell[0] = emptyletters[0].col;
                    this.state.currentCell[1] = emptyletters[0].row;
                } else {
                    this.state.currentCell[0] = cell.col;
                    this.state.currentCell[1] = cell.row;
                }
                break;
            }
        }
        this.markCells();
    }

    setAria() {
        let th = num => {
            if (num === 1) return "1st";
            if (num === 2) return "2nd";
            if (num === 3) return "3rd";
            return `${num}th`;
        }
        let fullstop = s => {
            if (s.match(/[\.\?]$/)) return s;
            return `${s}.`;
        }
        let scalar = null;
        let dirLetter = null;
        let data = null;
        if (!this.state.direction) {
            scalar = this.state.scalarAcross;
            dirLetter ="A";
            data = this.opts.data.across;
        } else {
            scalar = this.state.scalarDown;
            dirLetter = "D";
            data = this.opts.data.down;
        }
        let letterCount = 1;
        for (let cell of scalar) {
            if (cell.startOfWord) {
                letterCount = 1;
            }
            let question = data.find(q => q.num === `${dirLetter}${cell.q}`);
            let wordLength = question.question.length;
            let s = `${question.num}. ${fullstop(question.question)} ${wordLength} letters, ${th(letterCount)} letter.`
            letterCount++;
            document.querySelector(`#jxword-cell-${this.uid}-${cell.col}-${cell.row} > .jxword-cell-rect`) .setAttribute("aria-label", s);
        }
    }

    reset(e) {
        e.preventDefault();
        this.setState();
        this.saveState();
        this.restoreState();
        this.closeMenu();
    }

    changeDirection() {
        this.state.direction = !this.state.direction;
        this.markCells();
        this.setAria();

    }

    keyClick(e) {
        e.preventDefault();
        const el = e.target;
        let letter = el.dataset.key;
        if (this.debug) console.log({ letter });
        if (letter === "BACKSPACE") {
            this.delete();
        } else {
            this.typeLetter(letter);
        }
    }

    checkTile() { //TODO

    }

    checkWord() { //TODO

    }

    checkPuzzle() { //TODO

    }

    toggleAutocheck(e) { //TODO
        e.preventDefault();
        this.state.autocheck = !this.state.autocheck;
        this.saveState();
        this.closeMenu();
    }

    closeMenu() {
        document.querySelector(".jxword-menu-toggle input:checked").checked = false;
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (JXWord);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _js_jxword_grid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./js/jxword-grid */ "./src/js/jxword-grid.js");
/* harmony import */ var xd_crossword_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! xd-crossword-parser */ "./node_modules/xd-crossword-parser/index.js");
/* harmony import */ var xd_crossword_parser__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(xd_crossword_parser__WEBPACK_IMPORTED_MODULE_1__);


__webpack_require__(/*! ./css/jxword.less */ "./src/css/jxword.less");

async function _add_crossword(crossword_data, container_id, debug = false) {
    if (!crossword_data) return;
    const unencoded_data = atob(crossword_data);
    const data = await xd_crossword_parser__WEBPACK_IMPORTED_MODULE_1___default()(unencoded_data);
    window.jxword = new _js_jxword_grid__WEBPACK_IMPORTED_MODULE_0__["default"]({ 
        container: `#${container_id}`,
        data,
        debug
    });
}
window.add_crossword = _add_crossword;
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7OztBQ05zQztBQUNLO0FBQzNDLG1CQUFPLENBQUMsZ0RBQW1COztBQUUzQjtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsMERBQVE7QUFDL0Isd0JBQXdCLHVEQUFNO0FBQzlCLHVCQUF1QixhQUFhO0FBQ3BDO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxzQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvY3NzL2p4d29yZC5sZXNzP2M5YmQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL25vZGVfbW9kdWxlcy94ZC1jcm9zc3dvcmQtcGFyc2VyL2luZGV4LmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvanMvanh3b3JkLWdyaWQuanMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIvLyBBIGxpYnJhcnkgZm9yIGNvbnZlcnRpbmcgLnhkIENyb3Nzd29yZCBkYXRhIHRvIEpTT04gKGFzIGRlZmluZWQgYnkgU2F1bCBQd2Fuc29uIC0gaHR0cDovL3hkLnNhdWwucHcpIHdyaXR0ZW4gYnkgSmFzb24gTm9yd29vZC1Zb3VuZ1xuXG5mdW5jdGlvbiBYRFBhcnNlcihkYXRhKSB7XG4gICAgZnVuY3Rpb24gcHJvY2Vzc0RhdGEoZGF0YSkge1xuICAgICAgICAvLyBTcGxpdCBpbnRvIHBhcnRzXG4gICAgICAgIGxldCBwYXJ0cyA9IGRhdGEuc3BsaXQoL14kXiQvZ20pLmZpbHRlcihzID0+IHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gNCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgcGFydHMgPSBkYXRhLnNwbGl0KC9cXHJcXG5cXHJcXG4vZykuZmlsdGVyKHMgPT4gKHMudHJpbSgpKSk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYXJ0c1tpXSA9IHBhcnRzW2ldLnJlcGxhY2UoL1xcclxcbi9nLCBcIlxcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYFRvbyBtYW55IHBhcnRzIC0gZXhwZWN0ZWQgNCwgZm91bmQgJHtwYXJ0cy5sZW5ndGh9YCk7XG4gICAgICAgIGNvbnN0IHJhd01ldGEgPSBwYXJ0c1swXTtcbiAgICAgICAgY29uc3QgcmF3R3JpZCA9IHBhcnRzWzFdO1xuICAgICAgICBjb25zdCByYXdBY3Jvc3MgPSBwYXJ0c1syXTtcbiAgICAgICAgY29uc3QgcmF3RG93biA9IHBhcnRzWzNdO1xuICAgICAgICBjb25zdCBtZXRhID0gcHJvY2Vzc01ldGEocmF3TWV0YSk7XG4gICAgICAgIGNvbnN0IGdyaWQgPSBwcm9jZXNzR3JpZChyYXdHcmlkKTtcbiAgICAgICAgY29uc3QgYWNyb3NzID0gcHJvY2Vzc0NsdWVzKHJhd0Fjcm9zcyk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBwcm9jZXNzQ2x1ZXMocmF3RG93bik7XG4gICAgICAgIHJldHVybiB7IG1ldGEsIGdyaWQsIGFjcm9zcywgZG93biwgcmF3R3JpZCwgcmF3QWNyb3NzLCByYXdEb3duLCByYXdNZXRhLCB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NNZXRhKHJhd01ldGEpIHtcbiAgICAgICAgY29uc3QgbWV0YUxpbmVzID0gcmF3TWV0YS5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGxldCBtZXRhID0ge307XG4gICAgICAgIG1ldGFMaW5lcy5mb3JFYWNoKG1ldGFMaW5lID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVQYXJ0cyA9IG1ldGFMaW5lLnNwbGl0KFwiOiBcIik7XG4gICAgICAgICAgICBtZXRhW2xpbmVQYXJ0c1swXV0gPSBsaW5lUGFydHNbMV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWV0YTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzR3JpZChyYXdHcmlkKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdHcmlkLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgcmVzdWx0W3hdID0gbGluZXNbeF0uc3BsaXQoXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQ2x1ZXMocmF3Q2x1ZXMpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0NsdWVzLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgY29uc3QgcmVnZXggPSAvKF4uXFxkKilcXC5cXHMoLiopXFxzflxccyguKikvO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoIWxpbmVzW3hdLnRyaW0oKSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IGxpbmVzW3hdLm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgQ291bGQgbm90IHBhcnNlIHF1ZXN0aW9uICR7bGluZXNbeF19YCk7XG4gICAgICAgICAgICAvLyBVbmVzY2FwZSBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uID0gcGFydHNbMl0ucmVwbGFjZSgvXFxcXC9nLCBcIlwiKTtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IHtcbiAgICAgICAgICAgICAgICBudW06IHBhcnRzWzFdLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxdWVzdGlvbixcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IHBhcnRzWzNdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NEYXRhKGRhdGEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFhEUGFyc2VyOyIsIi8qXG4qIEpYV29yZCBHcmlkIC0gQSBDcm9zc3dvcmQgU3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlxuKiBDb3B5cmlnaHQgMjAyMFxuKi9cblxuLy8gQ29sLCAgIFJvd1xuLy8gWCwgICAgIFlcbi8vIHdpZHRoLCBoZWlnaHRcbmNsYXNzIEpYV29yZCB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkpYV29yZCwgYSBjcm9zc3dvcmQgc3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlwiKTtcbiAgICAgICAgaWYgKCFvcHRzLmNvbnRhaW5lcikgdGhyb3cgXCInY29udGFpbmVyJyByZXF1aXJlZFwiO1xuICAgICAgICBpZiAoIW9wdHMuZGF0YSkgdGhyb3cgXCInZGF0YScgcmVxdWlyZWRcIjtcbiAgICAgICAgLy8gU2V0IHNvbWUgZGVmYXVsdHNcbiAgICAgICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7IFxuICAgICAgICAgICAgd2lkdGg6IDUwMCwgXG4gICAgICAgICAgICBoZWlnaHQ6IDUwMCwgXG4gICAgICAgICAgICBvdXRlckJvcmRlcldpZHRoOiAxLjUsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJXaWR0aDogMSwgXG4gICAgICAgICAgICBtYXJnaW46IDMsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBpbm5lckJvcmRlckNvbG91cjogXCJibGFja1wiLCBcbiAgICAgICAgICAgIGZpbGxDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBjb2xzOiBvcHRzLmRhdGEuZ3JpZC5sZW5ndGgsXG4gICAgICAgICAgICByb3dzOiBvcHRzLmRhdGEuZ3JpZFswXS5sZW5ndGgsIFxuICAgICAgICAgICAgZm9udFJhdGlvOiAwLjcsXG4gICAgICAgICAgICBudW1SYXRpbzogMC4zMyxcbiAgICAgICAgICAgIHNlbGVjdENlbGxDb2xvdXI6IFwiI2Y3ZjQ1N1wiLFxuICAgICAgICAgICAgc2VsZWN0V29yZENvbG91cjogXCIjOWNlMGZiXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3VyOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgICAgICByZXN0b3JlU3RhdGU6IGZhbHNlXG4gICAgICAgIH0sIG9wdHMpO1xuICAgICAgICB0aGlzLnVpZCA9ICtuZXcgRGF0ZSgpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdGltZV90YWtlbjogMCxcbiAgICAgICAgICAgIGF1dG9jaGVjazogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgdGhpcy5pc19oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIGRvY3VtZW50IHRvIGxvYWRcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgdGhpcy5vbkxvYWQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLy8gdGhyb3dFdmVudChldmVudE5hbWUsIGRldGFpbCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyh0aGlzLmV2ZW50cywgZXZlbnROYW1lKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudHMucHVibGlzaChldmVudE5hbWUsIGRldGFpbCk7XG4gICAgLy8gfVxuXG4gICAgb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMub3B0cy5jb250YWluZXIpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyRWxlbWVudCkgdGhyb3cgKGBDb3VsZCBub3QgZmluZCAke3RoaXMub3B0cy5jb250YWluZXJ9YCk7XG4gICAgICAgIHRoaXMudG90YWxXaWR0aCA9IHRoaXMub3B0cy53aWR0aCArICh0aGlzLm9wdHMubWFyZ2luICogMik7XG4gICAgICAgIHRoaXMudG90YWxIZWlnaHQgPSB0aGlzLm9wdHMuaGVpZ2h0ICsgKHRoaXMub3B0cy5tYXJnaW4gKiAyKTtcbiAgICAgICAgdGhpcy5jZWxsV2lkdGggPSB0aGlzLm9wdHMud2lkdGggLyB0aGlzLm9wdHMuY29scztcbiAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5vcHRzLmhlaWdodCAvIHRoaXMub3B0cy5yb3dzO1xuICAgICAgICB0aGlzLmZvbnRTaXplID0gdGhpcy5jZWxsV2lkdGggKiB0aGlzLm9wdHMuZm9udFJhdGlvOyAvLyBGb250IHNpemUgeCUgc2l6ZSBvZiBjZWxsXG4gICAgICAgIHRoaXMuZ3JpZCA9IFtdO1xuICAgICAgICB0aGlzLmdyaWQgPSB0aGlzLm9wdHMuZGF0YS5ncmlkWzBdLm1hcCgoY29sLCBpKSA9PiB0aGlzLm9wdHMuZGF0YS5ncmlkLm1hcChyb3cgPT4gcm93W2ldKSk7IC8vIFRyYW5zcG9zZSBvdXIgbWF0cml4XG4gICAgICAgIHRoaXMuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5ncmlkKTsgLy8gQ2FsY3VsYXRlIG91ciBoYXNoIHJlc3VsdFxuICAgICAgICB0aGlzLnN0b3JhZ2VOYW1lID0gYGp4d29yZC0ke01hdGguYWJzKHRoaXMuaGFzaCl9YDtcbiAgICAgICAgdGhpcy5kcmF3TGF5b3V0KCk7XG4gICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcbiAgICAgICAgdGhpcy5kcmF3Qm9yZGVyKCk7XG4gICAgICAgIHRoaXMuZHJhd051bWJlcnMoKTtcbiAgICAgICAgdGhpcy5kcmF3UXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQWN0aW9ucygpO1xuICAgICAgICB0aGlzLnNldEZvY3VzKCk7XG4gICAgICAgIHRoaXMubGlzdGVuUXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMuc2V0VGltZXIoKTtcbiAgICAgICAgdGhpcy5kcmF3VGltZXIoKTtcbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzZXRUaW1lcigpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzX2hpZGRlbikgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUudGltZV90YWtlbikgdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbisrO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd1RpbWVyKCk7XG4gICAgICAgIH0pLmJpbmQodGhpcyksIDEwMDApO1xuICAgIH1cblxuICAgIGRyYXdMYXlvdXQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWNvbnRhaW5lclwiIGlkPVwianh3b3JkLWNvbnRhaW5lci0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxuYXYgY2xhc3M9XCJqeHdvcmQtY29udHJvbHNcIiByb2xlPVwibmF2aWdhdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1tZW51LXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cImp4d29yZC1tZW51XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtaW5mby0ke3RoaXMudWlkfVwiPjxsaT5QdXp6bGUgSW5mbzwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPjxocj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfVwiPjxsaT5BdXRvY2hlY2sgJHsodGhpcy5zdGF0ZS5hdXRvY2hlY2spID8gXCJPTlwiIDogXCJcIiB9PC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfc3F1YXJlLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFNxdWFyZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWNoZWNrX3dvcmQtJHt0aGlzLnVpZH1cIj48bGk+Q2hlY2sgV29yZDwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWNoZWNrX3B1enpsZS0ke3RoaXMudWlkfVwiPjxsaT5DaGVjayBQdXp6bGU8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj48aHI+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1yZXNldC0ke3RoaXMudWlkfVwiPjxsaT5SZXNldDwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1wYXVzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtcGF1c2UtdGV4dCBqeHdvcmQtc3Itb25seVwiPlBhdXNlPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC10aW1lclwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXkganh3b3JkLW92ZXJsYXktaGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VyIEdhbWUgaXMgQ3VycmVudGx5IFBhdXNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktcmVzdW1lLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXN1bWVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXN2Zy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHN2ZyBpZD0nanh3b3JkLXN2Zy0ke3RoaXMudWlkfScgY2xhc3M9J2p4d29yZC1zdmcnIHZpZXdCb3g9XCIwIDAgJHsgdGhpcy50b3RhbFdpZHRoIH0gJHsgdGhpcy50b3RhbEhlaWdodCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZyBjbGFzcz1cImNlbGwtZ3JvdXBcIiBpZD0nanh3b3JkLWctY29udGFpbmVyLSR7dGhpcy51aWQgfSc+PC9nPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXNpbmdsZS1xdWVzdGlvbi1jb250YWluZXIganh3b3JkLW1vYmlsZS1vbmx5XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWJhY2tcIiBpZD1cImp4d29yZC1hcnJvdy1iYWNrLSR7IHRoaXMudWlkIH1cIj4mbGFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIiBpZD1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHsgdGhpcy51aWQgfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWFycm93IGp4d29yZC1hcnJvdy1mb3J3YXJkXCIgaWQ9XCJqeHdvcmQtYXJyb3ctZm9yd2FyZC0keyB0aGlzLnVpZCB9XCI+JnJhbmc7PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZCBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJRXCI+UTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIldcIj5XPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRVwiPkU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJSXCI+UjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlRcIj5UPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWVwiPlk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJVXCI+VTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIklcIj5JPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiT1wiPk88L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJQXCI+UDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJBXCI+QTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlNcIj5TPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRFwiPkQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJGXCI+RjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkdcIj5HPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiSFwiPkg8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJKXCI+SjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIktcIj5LPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiTFwiPkw8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWlwiPlo8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJYXCI+WDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkNcIj5DPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiVlwiPlY8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJCXCI+QjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk5cIj5OPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiTVwiPk08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5IGp4d29yZC1rZXktYmFja3NwYWNlXCIgZGF0YS1rZXk9XCJCQUNLU1BBQ0VcIj4mbEFycjs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbi1jb250YWluZXIganh3b3JkLWRlc2t0b3Atb25seVwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWNvbnRhaW5lci0keyB0aGlzLnVpZCB9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWFjcm9zc1wiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0keyB0aGlzLnVpZCB9XCI+PGg0PkFjcm9zczwvaDQ+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd25cIiBpZD1cImp4d29yZC1xdWVzdGlvbi1kb3duLSR7IHRoaXMudWlkIH1cIj48aDQ+RG93bjwvaDQ+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICAgICAgdGhpcy5zdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0keyB0aGlzLnVpZCB9YCk7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1nLWNvbnRhaW5lci0ke3RoaXMudWlkIH1gKTtcbiAgICB9XG5cbiAgICBkcmF3R3JpZCgpIHtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxHcm91cC5pbm5lckhUTUwgKz0gdGhpcy5kcmF3Q2VsbCh0aGlzLmdyaWRbY29sXVtyb3ddLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3Q2VsbChsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IHggPSAodGhpcy5jZWxsV2lkdGggKiBjb2wpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3QgeSA9ICh0aGlzLmNlbGxIZWlnaHQgKiByb3cpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5jZWxsSGVpZ2h0O1xuICAgICAgICBjb25zdCBsZXR0ZXJYID0geCArICh3aWR0aCAvIDIpO1xuICAgICAgICBjb25zdCBsZXR0ZXJZID0geSArIGhlaWdodCAtIChoZWlnaHQgKiAwLjEpO1xuICAgICAgICBsZXQgZmlsbCA9IHRoaXMub3B0cy5iYWNrZ3JvdW5kQ29sb3VyO1xuICAgICAgICBsZXQgaXNCbGFuayA9IFwiaXMtbGV0dGVyXCI7XG4gICAgICAgIGxldCBjb250YWluZXJDbGFzcz1cImlzLWxldHRlci1jb250YWluZXJcIjtcbiAgICAgICAgaWYgKGxldHRlciA9PSBcIiNcIikge1xuICAgICAgICAgICAgZmlsbCA9IHRoaXMub3B0cy5maWxsQ29sb3VyO1xuICAgICAgICAgICAgaXNCbGFuayA9IFwiaXMtYmxhbmtcIjtcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzPVwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGA8ZyBpZD1cImp4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31cIiBjbGFzcz1cImp4d29yZC1jZWxsICR7Y29udGFpbmVyQ2xhc3N9XCIgc3R5bGU9XCJ6LWluZGV4OiAyMFwiPjxyZWN0IGNsYXNzPVwianh3b3JkLWNlbGwtcmVjdCAke2lzQmxhbmt9XCIgcm9sZT1cImNlbGxcIiB0YWJpbmRleD1cIi0xXCIgYXJpYS1sYWJlbD1cIlwiIHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCIgc3Ryb2tlPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJDb2xvdXJ9XCIgc3Ryb2tlLXdpZHRoPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJXaWR0aH1cIiBmaWxsPVwiJHtmaWxsfVwiIGRhdGEtY29sPVwiJHtjb2x9XCIgZGF0YS1yb3c9XCIke3JvdyB9XCIgY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiPjwvcmVjdD48dGV4dCBpZD1cImp4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fVwiIHg9XCIkeyBsZXR0ZXJYIH1cIiB5PVwiJHsgbGV0dGVyWSB9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmb250LXNpemU9XCIkeyB0aGlzLmZvbnRTaXplIH1cIiB3aWR0aD1cIiR7IHdpZHRoIH1cIj48L3RleHQ+PC9nPmA7XG4gICAgfVxuXG4gICAgZHJhd0xldHRlcihsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IGxldHRlckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fWApO1xuICAgICAgICBjb25zdCB0eHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZXR0ZXIpO1xuICAgICAgICB3aGlsZShsZXR0ZXJFbC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5yZW1vdmVDaGlsZChsZXR0ZXJFbC5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGxldHRlckVsLmFwcGVuZENoaWxkKHR4dCk7XG4gICAgfVxuXG4gICAgZHJhd1RpbWVyKCkge1xuICAgICAgICBmdW5jdGlvbiBmaWxsWmVyb3MobnVtKSB7XG4gICAgICAgICAgICByZXR1cm4gKFwiMFwiICsgbnVtKS5zbGljZSgtMik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGltZShzZWNzKSB7XG4gICAgICAgICAgICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihzZWNzIC8gNjApO1xuICAgICAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHNlY3MgJSA2MDtcbiAgICAgICAgICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW51dGVzIC8gNjApO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpbGxaZXJvcyhob3Vycyl9OiR7ZmlsbFplcm9zKG1pbnV0ZXMpfToke2ZpbGxaZXJvcyhzZWNvbmRzKX1gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXRpbWVyLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRpbWVyRWwuaW5uZXJIVE1MID0gYDxzcGFuIGlkPVwianh3b3JkLXRpbWVyLXRleHQtJHt0aGlzLnVpZH1cIj4ke2Zvcm1hdFRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKX08L3NwYW4+YDtcbiAgICB9XG5cbiAgICBpc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgoY29sID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbCAtIDFdW3Jvd10gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAocm93IDwgdGhpcy5ncmlkWzBdLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbF1bcm93ICsgMV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIGlzU3RhcnRPZkRvd24oY29sLCByb3cpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgocm93ID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbF1bcm93IC0gMV0gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAoY29sIDwgdGhpcy5ncmlkLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbCArIDFdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBkcmF3TnVtYmVycygpIHtcbiAgICAgICAgLy8gQSBjZWxsIGdldHMgYSBudW1iZXIgaWYgaXQgaGFzIGEgYmxvY2sgb3IgZWRnZSBhYm92ZSBvciB0byB0aGUgbGVmdCBvZiBpdCwgYW5kIGEgYmxhbmsgbGV0dGVyIHRvIHRoZSBib3R0b20gb3IgcmlnaHQgb2YgaXQgcmVzcGVjdGl2ZWx5XG4gICAgICAgIC8vIFBvcHVsYXRlIGEgbnVtYmVyIGdyaWQgd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgbGV0IG51bSA9IDE7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRyYXdOdW0gPSB0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykgfHwgdGhpcy5pc1N0YXJ0T2ZEb3duKGNvbCwgcm93KTtcbiAgICAgICAgICAgICAgICBpZiAoZHJhd051bSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdOdW1iZXIoY29sLCByb3csIG51bSsrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3TnVtYmVyKGNvbCwgcm93LCBudW0pIHtcbiAgICAgICAgY29uc3QgbnVtRm9udFNpemUgPSB0aGlzLmNlbGxXaWR0aCAqIHRoaXMub3B0cy5udW1SYXRpbztcbiAgICAgICAgY29uc3QgeCA9ICh0aGlzLmNlbGxXaWR0aCAqIGNvbCkgKyB0aGlzLm9wdHMubWFyZ2luICsgMjtcbiAgICAgICAgY29uc3QgeSA9ICh0aGlzLmNlbGxIZWlnaHQgKiByb3cpICsgdGhpcy5vcHRzLm1hcmdpbiArIG51bUZvbnRTaXplO1xuICAgICAgICBjb25zdCBjZWxsRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHsgdGhpcy51aWQgfS0keyBjb2wgfS0keyByb3cgfWApO1xuICAgICAgICBcbiAgICAgICAgY2VsbEVsLmlubmVySFRNTCArPSBgPHRleHQgeD1cIiR7IHggfVwiIHk9XCIkeyB5IH1cIiB0ZXh0LWFuY2hvcj1cImxlZnRcIiBmb250LXNpemU9XCIkeyBudW1Gb250U2l6ZSB9XCI+JHsgbnVtIH08L3RleHQ+YFxuICAgIH1cblxuICAgIGRyYXdCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwLmlubmVySFRNTCArPSBgPHJlY3QgeD1cIiR7dGhpcy5vcHRzLm1hcmdpbn1cIiB5PVwiJHt0aGlzLm9wdHMubWFyZ2lufVwiIHdpZHRoPVwiJHt0aGlzLm9wdHMud2lkdGh9XCIgaGVpZ2h0PVwiJHt0aGlzLm9wdHMuaGVpZ2h0fVwiIHN0cm9rZT1cIiR7dGhpcy5vcHRzLm91dGVyQm9yZGVyQ29sb3VyIH1cIiBzdHJva2Utd2lkdGg9XCIke3RoaXMub3B0cy5vdXRlckJvcmRlcldpZHRoIH1cIiBmaWxsPVwibm9uZVwiPmA7XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9ucygpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcy0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+YFxuICAgICAgICB0aGlzLm9wdHMuZGF0YS5hY3Jvc3MuZm9yRWFjaChxID0+IHtcbiAgICAgICAgICAgIGFjcm9zcyArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHt0aGlzLnVpZH1gKS5pbm5lckhUTUwgKz0gYWNyb3NzO1xuICAgICAgICBsZXQgZG93biA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdFwiPmBcbiAgICAgICAgdGhpcy5vcHRzLmRhdGEuZG93bi5mb3JFYWNoKHEgPT4ge1xuICAgICAgICAgICAgZG93biArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1kb3duLSR7dGhpcy51aWR9YCkuaW5uZXJIVE1MICs9IGRvd247XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9uKHEpIHtcbiAgICAgICAgcmV0dXJuIGA8bGkgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke3EubnVtfS0ke3RoaXMudWlkfVwiIGRhdGEtcT1cIiR7cS5udW19XCI+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1udW1cIj4ke3EubnVtLnJlcGxhY2UoL15cXEQvLCBcIlwiKX08L3NwYW4+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1xdWVzdGlvblwiPiR7cS5xdWVzdGlvbn08L3NwYW4+PC9saT5gO1xuICAgIH1cblxuICAgIHNob3dPdmVybGF5KCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1vdmVybGF5LWhpZGVcIik7XG4gICAgfVxuXG4gICAgaGlkZU92ZXJsYXkoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtb3ZlcmxheS1oaWRlXCIpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICB9XG5cbiAgICBjaGVja092ZXJsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5zaG93T3ZlcmxheSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlT3ZlcmxheSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0U3RhdGUoKSB7XG4gICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDsgLy8gMCA9IGFjcm9zcywgMSA9IGRvd25cbiAgICAgICAgdGhpcy5zdGF0ZS5jb21wbGV0ZSA9IGZhbHNlOyAvLyBBcmUgd2UgZG9uZSB5ZXQ/XG4gICAgICAgIHRoaXMuc3RhdGUuaGludHMgPSBmYWxzZTsgLy8gSGFkIGFueSBoZWxwP1xuICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsID0gWzAsIDBdOyAvLyBjb2wsIHJvd1xuICAgICAgICB0aGlzLnN0YXRlLnRpbWVfdGFrZW4gPSAwOyAvLyBIb3cgbG9uZyBoYXZlIHdlIGJlZW4gcGxheWluZz9cbiAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaCA9IG5ldyBBcnJheSh0aGlzLm9wdHMuY29scykuZmlsbChcIlwiKS5tYXAoKCkgPT4gbmV3IEFycmF5KHRoaXMub3B0cy5yb3dzKS5maWxsKFwiXCIpKTsgLy8gQSBtYXRyaXggZmlsbGVkIHdpdGggZW1wdHkgY2hhcnNcbiAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gPSBcIiNcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FsYXJzIChmb3IgYWNyb3NzIGFuZCBkb3duKSB0aGF0IHdlIHVzZSB3aGVuIGRlY2lkaW5nIHdoaWNoIGNlbGwgdG8gZ28gdG8gaW4gdGhlIGV2ZW50IHRoYXQgYSBsZXR0ZXIgaXMgdHlwZWQsIHRhYiBpcyBwcmVzc2VkIGV0Yy4gXG4gICAgICAgIC8vIERvd24gU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93biA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgcSA9IDA7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB8fCB0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpKSBxKys7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHkgPSByb3c7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgodGhpcy5ncmlkW2NvbF1beV0gIT09IFwiI1wiKSAmJiAoeSA8IHRoaXMub3B0cy5yb3dzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNlbGwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdzogeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaChjZWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2codGhpcy5zdGF0ZS5zY2FsYXJEb3duKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MgPSBbXTtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICBsZXQgbnVtID0gMDtcbiAgICAgICAgcSA9IDA7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB8fCB0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpKSBudW0rKztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpKSBxID0gbnVtO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdyksXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5wdXNoKGNlbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyk7XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTYXZpbmcgU3RhdGVcIik7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnN0b3JhZ2VOYW1lLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlKSk7XG4gICAgfVxuXG4gICAgcmVzdG9yZVN0YXRlKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxldHRlciA9IHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVSZXN0b3JlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTdGF0ZSBSZXN0b3JlZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhbGNIYXNoKG1hdHJpeCkge1xuICAgICAgICBsZXQgcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgcyArPSBtYXRyaXhbY29sXVtyb3ddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBoYXNoID0gMCwgaSwgY2hyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNociA9IHMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICAgICAgICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coaGFzaCwgcyk7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cblxuICAgIG1hcmtDZWxscygpIHtcbiAgICAgICAgbGV0IGFsbENlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtY2VsbC1yZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgYWxsQ2VsbHMuZm9yRWFjaChjZWxsID0+IHtcbiAgICAgICAgICAgIGNlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuYmFja2dyb3VuZENvbG91cik7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIC0xKTtcbiAgICAgICAgfSlcbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsUmVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gfS0keyB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIH0gPiByZWN0YCk7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RDZWxsQ29sb3VyKTtcbiAgICAgICAgY3VycmVudENlbGxSZWN0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDEpO1xuICAgICAgICBsZXQgbWFya2VkQ2VsbCA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLmNvbHM7IGNvdW50ICsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvdW50fS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV19ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLnJvd3M7IGNvdW50KyspIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXX0tJHtjb3VudH0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gLSAxOyBjb3VudCA+PSAwOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0UXVlc3Rpb24odGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJBY3Rpb25zKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCB0aGlzLnZpc2liaWxpdHlDaGFuZ2VkLmJpbmQodGhpcykpO1xuICAgICAgICBsZXQgYWxsQ2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwicmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGZvcihsZXQgY2VsbCBvZiBhbGxDZWxscykge1xuICAgICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jYXRjaENlbGxDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmNhdGNoS2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctZm9yd2FyZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb05leHRXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWFycm93LWJhY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcmVzZXQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5yZXNldC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy50b2dnbGVBdXRvY2hlY2suYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hhbmdlRGlyZWN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICBjb25zdCBrZXlzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQta2V5XCIpO1xuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKGtleSk7XG4gICAgICAgICAgICBrZXkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMua2V5Q2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnBhdXNlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktcmVzdW1lLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucGxheS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICB2aXNpYmlsaXR5Q2hhbmdlZChlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSk7XG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLmlzX2hpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBhdXNlXCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBsYXlcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLXBsYXlcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJQbGF5XCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIGNhdGNoQ2VsbENsaWNrKGUpIHtcbiAgICAgICAgY29uc3QgY29sID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQuY29sKTtcbiAgICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQucm93KTtcbiAgICAgICAgaWYgKChjb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0pICYmIChyb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKSB7IC8vIENsaWNrZWQgb24gYWxyZWFkeSBzZWxlY3RlZCBjZWxsXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSByb3c7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICB0eXBlTGV0dGVyKGxldHRlcikge1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gbGV0dGVyO1xuICAgICAgICB0aGlzLnNldFNjYWxhcnMobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKVxuICAgICAgICB0aGlzLmRyYXdMZXR0ZXIobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgLy8gdGhpcy5jaGVja0hpbnQoKTtcbiAgICAgICAgdGhpcy5jaGVja1dpbigpO1xuICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICB9XG5cbiAgICBjYXRjaEtleVByZXNzKGUpIHtcbiAgICAgICAgY29uc3Qga2V5Y29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZSk7XG4gICAgICAgIGlmIChlLm1ldGFLZXkpIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJpbnRhYmxlID0gXG4gICAgICAgICAgICAoKGtleWNvZGUgPiA0NyAmJiBrZXljb2RlIDwgNTgpICAgfHwgLy8gbnVtYmVyIGtleXNcbiAgICAgICAgICAgIChrZXljb2RlID4gNjQgJiYga2V5Y29kZSA8IDkxKSAgIHx8IC8vIGxldHRlciBrZXlzXG4gICAgICAgICAgICAoa2V5Y29kZSA+IDk1ICYmIGtleWNvZGUgPCAxMTIpICB8fCAvLyBudW1wYWQga2V5c1xuICAgICAgICAgICAgKGtleWNvZGUgPiAxODUgJiYga2V5Y29kZSA8IDE5MykgfHwgLy8gOz0sLS4vYCAoaW4gb3JkZXIpXG4gICAgICAgICAgICAoa2V5Y29kZSA+IDIxOCAmJiBrZXljb2RlIDwgMjIzKSk7ICAgLy8gW1xcXScgKGluIG9yZGVyKVxuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHJldHVybjsgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgcGF1c2VkXG4gICAgICAgIGlmIChwcmludGFibGUgJiYgIXRoaXMuc3RhdGUuY29tcGxldGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGUua2V5LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLnR5cGVMZXR0ZXIobGV0dGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSA4KSB7IC8vIEJhY2tzcGFjZVxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmNvbXBsZXRlKSB7IC8vIERvbid0IGFsbG93IGNoYW5nZXMgaWYgd2UndmUgZmluaXNoZWQgb3VyIHB1enpsZVxuICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PSAzMikge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGtleWNvZGUgPT09IDkpIHx8IChrZXljb2RlID09PSAxMykpIHsgLy8gVGFiIG9yIEVudGVyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNXb3JkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dFdvcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSAzNykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM4KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVVcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM5KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVSaWdodCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDQwKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVEb3duKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlTGVmdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXTtcbiAgICAgICAgICAgIHdoaWxlICh4ID4gMCkge1xuICAgICAgICAgICAgICAgIHgtLTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt4XVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVVcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV07XG4gICAgICAgICAgICB3aGlsZSAoeSA+IDApIHtcbiAgICAgICAgICAgICAgICB5LS07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1beV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF07XG4gICAgICAgICAgICB3aGlsZSAoeCA8IHRoaXMub3B0cy5jb2xzIC0gMSkge1xuICAgICAgICAgICAgICAgIHgrKztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt4XVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVEb3duKCkge1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXTtcbiAgICAgICAgICAgIHdoaWxlICh5IDwgdGhpcy5vcHRzLmNvbHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3ldICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0geTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0U2NhbGFycyhsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSkubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICBsZXQgZG93biA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICBpZiAoZG93bikgZG93bi5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgfVxuXG4gICAgbW92ZVRvTmV4dCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhjdXJzb3IpO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coeCwgc2NhbGFyW3hdKTtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgbmV4dEJsYW5rID0gb3RoZXJTY2FsYXIuZmluZChjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0QmxhbmsuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Qmxhbmsucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVUb1ByZXZpb3VzTGV0dGVyKCkge1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIGxldCBjdXJzb3IgPSBjdXJyZW50Q2VsbC5pbmRleCAtIDE7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3I7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3hdLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3hdLnJvdztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIGRlbGV0ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSB7XG4gICAgICAgICAgICAvLyBNb3ZlIGJhY2sgYW5kIHRoZW4gZGVsZXRlXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGV0dGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3TGV0dGVyKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gXCJcIjtcbiAgICAgICAgdGhpcy5zZXRTY2FsYXJzKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICBtb3ZlVG9OZXh0V29yZCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCAmJiBuZXh0Q2VsbC5sZXR0ZXIgIT09IFwiXCIpIHsgLy8gRmlyc3QgbGV0dGVyIGlzIG5vdCBibGFuaywgXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gbmV4dENlbGwuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVUb1ByZXZpb3VzV29yZCgpIHtcbiAgICAgICAgZnVuY3Rpb24gZmluZExhc3QoYXJyYXksIHByZWRpY2F0ZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IGFycmF5W2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE1vdmUgdG8gZmlzdCBsZXR0ZXIgb2YgY3VycmVudCB3b3JkLCB0aGVuIHNlYXJjaCBiYWNrd2FyZCBmb3IgYSBmcmVlIHNwYWNlLCB0aGVuIG1vdmUgdG8gdGhlIHN0YXJ0IG9mIHRoYXQgd29yZCwgdGhlbiBtb3ZlIGZvcndhcmQgdW50aWwgYSBmcmVlIHNwYWNlXG4gICAgICAgIGxldCBuZXh0Q2VsbCA9IG51bGw7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgb3RoZXJTY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHsgLy8gRG93blxuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3Vyc29yID0gc2NhbGFyLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKTtcbiAgICAgICAgLy8gU3RhcnQgb2YgY3VycmVudCB3b3JkXG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSBudWxsO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4OyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0T2ZDdXJyZW50V29yZCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgYmxhbmtTcGFjZSA9IG51bGw7XG4gICAgICAgIC8vIEtlZXAgZ29pbmcgYmFjayB1bnRpbCB3ZSBoaXQgYSBibGFuayBzcGFjZVxuICAgICAgICBpZiAoc3RhcnRPZkN1cnJlbnRXb3JkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gc3RhcnRPZkN1cnJlbnRXb3JkLmluZGV4IC0gMTsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBibGFua1NwYWNlID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0T2ZMYXN0V29yZCA9IG51bGw7XG4gICAgICAgIGlmIChibGFua1NwYWNlKSB7XG4gICAgICAgICAgICAvLyBOb3cgZmluZCBzdGFydCBvZiB0aGlzIHdvcmRcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBibGFua1NwYWNlLmluZGV4OyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZkxhc3RXb3JkID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0T2ZMYXN0V29yZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHN0YXJ0T2ZMYXN0V29yZC5pbmRleDsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgbmV4dEJsYW5rID0gZmluZExhc3Qob3RoZXJTY2FsYXIsIGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0T2ZXb3JkID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gbmV4dEJsYW5rLmluZGV4OyB4ID49IDA7IHgtLSkgeyAvLyBNb3ZlIHRvIHN0YXJ0IG9mIHdvcmRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG90aGVyU2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydE9mV29yZCA9IG90aGVyU2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHN0YXJ0T2ZXb3JkLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc3RhcnRPZldvcmQucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRGb2N1cygpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY2VsbC1yZWN0XCIpLmZvY3VzKCk7XG4gICAgICAgIC8vIHRoaXMuY29udGFpbmVyRWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIGNoZWNrV2luKCkge1xuICAgICAgICBsZXQgd2luID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmdyaWQubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5ncmlkW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gXCIjXCIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IHRoaXMuc3RhdGUuZ3JhcGhbeF1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCkuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKHNjYWxhciA9PiBzY2FsYXIucm93ID09IHkgJiYgc2NhbGFyLmNvbCA9PSB4KS5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKHNjYWxhciA9PiBzY2FsYXIucm93ID09IHkgJiYgc2NhbGFyLmNvbCA9PSB4KS5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKHNjYWxhciA9PiBzY2FsYXIucm93ID09IHkgJiYgc2NhbGFyLmNvbCA9PSB4KS5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzLnN0YXRlLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuc3RhdGUuZ3JhcGgpO1xuICAgICAgICBpZiAod2luKSB7XG4gICAgICAgICAgICBhbGVydChcIllvdSBXaW4hXCIpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoaWdobGlnaHRRdWVzdGlvbihjb2wsIHJvdykge1xuICAgICAgICBsZXQgZCA9IG51bGw7XG4gICAgICAgIGxldCBjZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgICAgIGQgPSBcIkFcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5hY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgICAgICBkID0gXCJEXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuZG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcSA9IGNlbGwucTtcbiAgICAgICAgdmFyIGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS5hY3RpdmVcIik7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtcywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25FbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7ZH0ke3F9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHF1ZXN0aW9uRWwuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgcXVlc3Rpb25FbCB9KTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpICBjb25zb2xlLmxvZyhgI2p4d29yZC1xdWVzdGlvbi0ke2R9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRoaXMuZW5zdXJlVmlzaWJpbGl0eShxdWVzdGlvbkVsLCBxdWVzdGlvbkVsLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCk7XG4gICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkfSR7Y2VsbC5xfWApO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIikuaW5uZXJIVE1MID0gYCR7cXVlc3Rpb24ucXVlc3Rpb259YDtcbiAgICB9XG5cbiAgICBlbnN1cmVWaXNpYmlsaXR5KGVsLCBjb250YWluZXIpIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJSZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBpZiAocmVjdC5ib3R0b20gPiBjb250YWluZXJSZWN0LmJvdHRvbSkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnRvcCA8IGNvbnRhaW5lclJlY3QudG9wKSB7XG4gICAgICAgICAgICBlbC5zY3JvbGxJbnRvVmlldyh0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblF1ZXN0aW9ucygpIHtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiKTtcbiAgICAgICAgZm9yKGxldCBxdWVzdGlvbiBvZiBxdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHF1ZXN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNsaWNrUXVlc3Rpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGlja1F1ZXN0aW9uKGUpIHtcbiAgICAgICAgY29uc3QgcSA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnE7XG4gICAgICAgIGNvbnN0IGRpciA9IHFbMF07XG4gICAgICAgIGNvbnN0IG51bSA9IE51bWJlcihxLnN1YnN0cmluZygxKSk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoZGlyID09PSBcIkFcIikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5xID09PSBudW0pIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBmaXJzdCBlbXB0eSBsZXR0ZXIgaW4gYSB3b3JkLiBJZiB0aGVyZSBpc24ndCBhbiBlbXB0eSBsZXR0ZXIsIG1vdmUgdG8gc3RhcnQgb2Ygd29yZC5cbiAgICAgICAgICAgICAgICBsZXQgZW1wdHlsZXR0ZXJzID0gc2NhbGFyLmZpbHRlcih3b3JkY2VsbCA9PiB3b3JkY2VsbC5xID09PSBudW0gJiYgd29yZGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZW1wdHlsZXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gZW1wdHlsZXR0ZXJzWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGVtcHR5bGV0dGVyc1swXS5yb3c7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNlbGwuY29sO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gY2VsbC5yb3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0QXJpYSgpIHtcbiAgICAgICAgbGV0IHRoID0gbnVtID0+IHtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDEpIHJldHVybiBcIjFzdFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMikgcmV0dXJuIFwiMm5kXCI7XG4gICAgICAgICAgICBpZiAobnVtID09PSAzKSByZXR1cm4gXCIzcmRcIjtcbiAgICAgICAgICAgIHJldHVybiBgJHtudW19dGhgO1xuICAgICAgICB9XG4gICAgICAgIGxldCBmdWxsc3RvcCA9IHMgPT4ge1xuICAgICAgICAgICAgaWYgKHMubWF0Y2goL1tcXC5cXD9dJC8pKSByZXR1cm4gcztcbiAgICAgICAgICAgIHJldHVybiBgJHtzfS5gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgZGlyTGV0dGVyID0gbnVsbDtcbiAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIGRpckxldHRlciA9XCJBXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuYWNyb3NzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgZGlyTGV0dGVyID0gXCJEXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuZG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbGV0dGVyQ291bnQgPSAxO1xuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwuc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZGlyTGV0dGVyfSR7Y2VsbC5xfWApO1xuICAgICAgICAgICAgbGV0IHdvcmRMZW5ndGggPSBxdWVzdGlvbi5xdWVzdGlvbi5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgcyA9IGAke3F1ZXN0aW9uLm51bX0uICR7ZnVsbHN0b3AocXVlc3Rpb24ucXVlc3Rpb24pfSAke3dvcmRMZW5ndGh9IGxldHRlcnMsICR7dGgobGV0dGVyQ291bnQpfSBsZXR0ZXIuYFxuICAgICAgICAgICAgbGV0dGVyQ291bnQrKztcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NlbGwuY29sfS0ke2NlbGwucm93fSA+IC5qeHdvcmQtY2VsbC1yZWN0YCkgLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSgpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLnJlc3RvcmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoYW5nZURpcmVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAhdGhpcy5zdGF0ZS5kaXJlY3Rpb247XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuXG4gICAgfVxuXG4gICAga2V5Q2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGVsID0gZS50YXJnZXQ7XG4gICAgICAgIGxldCBsZXR0ZXIgPSBlbC5kYXRhc2V0LmtleTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgbGV0dGVyIH0pO1xuICAgICAgICBpZiAobGV0dGVyID09PSBcIkJBQ0tTUEFDRVwiKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50eXBlTGV0dGVyKGxldHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1RpbGUoKSB7IC8vVE9ET1xuXG4gICAgfVxuXG4gICAgY2hlY2tXb3JkKCkgeyAvL1RPRE9cblxuICAgIH1cblxuICAgIGNoZWNrUHV6emxlKCkgeyAvL1RPRE9cblxuICAgIH1cblxuICAgIHRvZ2dsZUF1dG9jaGVjayhlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc3RhdGUuYXV0b2NoZWNrID0gIXRoaXMuc3RhdGUuYXV0b2NoZWNrO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNsb3NlTWVudSgpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWVudS10b2dnbGUgaW5wdXQ6Y2hlY2tlZFwiKS5jaGVja2VkID0gZmFsc2U7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBKWFdvcmQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBKWFdvcmQgZnJvbSBcIi4vanMvanh3b3JkLWdyaWRcIjtcbmltcG9ydCB4ZHBhcnNlciBmcm9tIFwieGQtY3Jvc3N3b3JkLXBhcnNlclwiO1xucmVxdWlyZShcIi4vY3NzL2p4d29yZC5sZXNzXCIpO1xuXG5hc3luYyBmdW5jdGlvbiBfYWRkX2Nyb3Nzd29yZChjcm9zc3dvcmRfZGF0YSwgY29udGFpbmVyX2lkLCBkZWJ1ZyA9IGZhbHNlKSB7XG4gICAgaWYgKCFjcm9zc3dvcmRfZGF0YSkgcmV0dXJuO1xuICAgIGNvbnN0IHVuZW5jb2RlZF9kYXRhID0gYXRvYihjcm9zc3dvcmRfZGF0YSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHhkcGFyc2VyKHVuZW5jb2RlZF9kYXRhKTtcbiAgICB3aW5kb3cuanh3b3JkID0gbmV3IEpYV29yZCh7IFxuICAgICAgICBjb250YWluZXI6IGAjJHtjb250YWluZXJfaWR9YCxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgZGVidWdcbiAgICB9KTtcbn1cbndpbmRvdy5hZGRfY3Jvc3N3b3JkID0gX2FkZF9jcm9zc3dvcmQ7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9