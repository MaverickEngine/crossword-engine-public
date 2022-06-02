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
* Copyright 2020 Jason Norwood-Young
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
            autocheck: false,
            cheated: false
        };
        this.across_questions = [];
        this.down_questions = [];
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
            if (this.state.complete) return;
            if (!this.state.time_taken) this.state.time_taken = 0;
            this.state.time_taken++;
            this.saveState();
            this.drawTimer();
        }).bind(this), 1000);
    }

    drawLayout() {
        this.containerElement.innerHTML = `
            <div class="jxword-container" id="jxword-container-${this.uid}">
                <div id="jxword-overlay-${this.uid}" class="jxword-overlay jxword-overlay-hidden">
                    <div class="jxword-overlay-content">
                        <div id="jxword-paused-${this.uid}" class="jxword-paused">
                            <div class="jxword-overlay-title">
                                Your Game is Currently Paused
                            </div>
                            <div id="jxword-overlay-resume-${this.uid}" class="jxword-overlay-button">
                                Resume
                            </div>
                        </div>
                        <div id="jxword-complete_overlay-${this.uid}" class="jxword-complete_overlay">
                            <div class="jxword-overlay-title">
                                Congratulations! You've Won!
                            </div>
                            <div id="jxword-overlay-restart-${this.uid}" class="jxword-overlay-button jxword-reset">
                                Restart
                            </div>
                            <div class="jxword-overlay-button jxword-close-overlay">
                                Close
                            </div>
                        </div>
                        <div id="jxword-meta_overlay-${this.uid}" class="jxword-meta_overlay">
                            <div class="jxword-overlay-title">
                                ${this.opts.data.meta.Title}
                            </div>
                            <div class="jxword-overlay-text">
                                <ul>
                                    ${ Object.keys(this.opts.data.meta).map(k => k === "Title" ? "" : `<li>${k}: ${this.opts.data.meta[k]}</li>` ).join("\n") }
                                </ul>
                            </div>
                            <div class="jxword-overlay-button jxword-close-overlay">
                                Close
                            </div>
                        </div>
                    </div>
                </div>
                <div class="jxword-play-area">
                    <div class="jxword-grid-container">
                    <div class="jxword-header">
                    <nav class="jxword-controls" role="navigation">
                        <div class="jxword-menu-toggle">
                            <input type="checkbox" />
                            <span class="jxword-hamberder"></span>
                            <span class="jxword-hamberder"></span>
                            <span class="jxword-hamberder"></span>
                            <ul class="jxword-menu">
                                <a href="#" aria-label="About This Puzzle" class="jxword-button" id="jxword-meta-${this.uid}"><li>About This Puzzle</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" aria-label="Toggle Autocheck" class="jxword-button" id="jxword-autocheck-${this.uid}"><li>Autocheck</li></a>
                                <a href="#" aria-label="Check Square" class="jxword-button" id="jxword-check_square-${this.uid}"><li>Check Square</li></a>
                                <a href="#" aria-label="Check Puzzle" class="jxword-button" id="jxword-check_word-${this.uid}"><li>Check Word</li></a>
                                <a href="#" aria-label="Check Puzzle" class="jxword-button" id="jxword-check_puzzle-${this.uid}"><li>Check Puzzle</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" aria-label="Print (Blank)" class="jxword-button" id="jxword-print_blank-${this.uid}"><li>Print (Blank)</li></a>
                                <a href="#" aria-label="Print (Filled)" class="jxword-button" id="jxword-print_filled-${this.uid}"><li>Print (Filled)</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" aria-label="Reset Puzzle" class="jxword-button jxword-reset" id="jxword-reset-${this.uid}"><li>Reset</li></a>
                            </ul>
                        </div>
                    </nav>
                    <div id="jxword-pause-${this.uid}" class="jxword-pause">
                        <span class="jxword-pause-text jxword-sr-only">Pause</span>
                    </div> 
                    <div id="jxword-timer-${this.uid}" class="jxword-timer"></div>
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
                    </div>
                    <div class="jxword-question-container jxword-desktop-only" id="jxword-question-container-${ this.uid }">
                        <div class="jxword-questions-across" id="jxword-question-across-${ this.uid }"><h4>Across</h4></div>
                        <div class="jxword-questions-down" id="jxword-question-down-${ this.uid }"><h4>Down</h4></div>
                    </div>
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
        return `<g id="jxword-cell-${this.uid}-${col}-${row}" class="jxword-cell ${containerClass}" style="z-index: 20"><rect class="jxword-cell-rect ${isBlank}" role="cell" tabindex="-1" aria-label="" x="${x}" y="${y}" width="${width}" height="${height}" stroke="${this.opts.innerBorderColour}" stroke-width="${this.opts.innerBorderWidth}" fill="${fill}" data-col="${col}" data-row="${row }" contenteditable="true"></rect><text id="jxword-letter-${this.uid}-${col}-${row}" class="jxword-letter" x="${ letterX }" y="${ letterY }" text-anchor="middle" font-size="${ this.fontSize }" width="${ width }"></text></g>`;
    }

    drawLetter(letter, col, row) {
        const letterEl = document.querySelector(`#jxword-letter-${this.uid}-${col}-${row}`);
        const correct = this.state.correctGrid[col][row];
        if (correct) {
            letterEl.classList.add("jxword-letter-is-correct");
        } else {
            letterEl.classList.remove("jxword-letter-is-correct");
        }
        const txt = document.createTextNode(letter);
        while(letterEl.firstChild) {
            letterEl.removeChild(letterEl.lastChild);
        }
        letterEl.appendChild(txt);
    }

    drawTimer() {
        function formatTime(t) {
            var sec_num = parseInt(t, 10); // don't forget the second param
            var hours   = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);
        
            if (hours   < 10) {hours   = "0"+hours;}
            if (minutes < 10) {minutes = "0"+minutes;}
            if (seconds < 10) {seconds = "0"+seconds;}
            return hours + ':' + minutes + ':' + seconds;
        }
        const timerEl = document.querySelector(`#jxword-timer-${this.uid}`);
        timerEl.innerHTML = `<span id="jxword-timer-text-${this.uid}">${formatTime(this.state.time_taken)}</span>`;
    }

    isStartOfAcross(col, row) {
        if ((col === 0) && (this.grid[col][row] !== "#") && (this.grid[col + 1][row] !== "#")) return true;
        if (this.grid[col][row] === "#") return false;
        if (!this.grid[col + 1]) return false;
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
        if (!this.grid[col][row + 1]) return false;
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
                let drawNum = false;
                if (this.isStartOfAcross(col, row)) {
                    if (col !== this.opts.cols - 1 && this.grid[col+1][row] !== "#") {
                        drawNum = true;
                        this.across_questions.push({
                            num,
                            col,
                            row,
                            data: this.opts.data.across.find(q => q.num === `A${num}`)
                        });
                    }
                } 
                if (this.isStartOfDown(col, row)) {
                    if (row !== this.opts.rows - 1 && this.grid[col][row+1] !== "#") {
                        drawNum = true;
                        this.down_questions.push({
                            num,
                            col,
                            row,
                            data: this.opts.data.down.find(q => q.num === `D${num}`)
                        });
                    }
                }
                // let drawNum = this.isStartOfAcross(col, row) || this.isStartOfDown(col, row);
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

    showOverlay(state = "paused") {
        document.querySelector(".jxword-paused").style.display = "none";
        document.querySelector(".jxword-complete_overlay").style.display = "none";
        document.querySelector(".jxword-meta_overlay").style.display = "none";
        if (state === "paused") {
            document.querySelector(".jxword-paused").style.display = "block";
        } else if (state === "complete") {
            document.querySelector(".jxword-complete_overlay").style.display = "block";
        } else if (state === "meta") {
            document.querySelector(".jxword-meta_overlay").style.display = "block";
        }
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.add("jxword-overlay-show");
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.remove("jxword-overlay-hide");
    }

    hideOverlay() {
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.add("jxword-overlay-hide");
        document.querySelector(`#jxword-overlay-${this.uid}`).classList.remove("jxword-overlay-show");
    }

    checkOverlay() {
        if (this.is_paused) {
            this.showOverlay("paused");
        } else {
            this.hideOverlay();
        }
    }

    setState() {
        this.state.direction = 0; // 0 = across, 1 = down
        this.state.complete = false; // Are we done yet?
        this.state.hints = false; // Had any help?
        this.state.time_taken = 0; // How long have we been playing?
        this.state.graph = new Array(this.opts.cols).fill("").map(() => new Array(this.opts.rows).fill("")); // A matrix filled with empty chars
        for (let col = 0; col < this.opts.cols; col++) { // Fill in the #'s
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
        for (let question of this.down_questions) {
            this.state.scalarDown.push({
                col: question.col,
                row: question.row,
                letter: "",
                startOfWord: true,
                index: index++,
                q: question.num,
                correct: false
            });
            for (let i = 1; i < question.data.answer.length; i++) {
                this.state.scalarDown.push({
                    col: question.col,
                    row: question.row + i,
                    letter: "",
                    startOfWord: false,
                    index: index++,
                    q: question.num,
                    correct: false
                });
            }
        }
        if (this.debug) console.log(this.state.scalarDown);
        // Across Scalar
        this.state.scalarAcross = [];
        index = 0;
        for (let question of this.across_questions) {
            this.state.scalarAcross.push({
                col: question.col,
                row: question.row,
                letter: "",
                startOfWord: true,
                index: index++,
                q: question.num,
                correct: false
            });
            for (let i = 1; i < question.data.answer.length; i++) {
                this.state.scalarAcross.push({
                    col: question.col + i,
                    row: question.row,
                    letter: "",
                    startOfWord: false,
                    index: index++,
                    q: question.num,
                    correct: false
                });
            }
        }
        if (this.debug) console.log(this.state.scalarAcross);
        this.state.currentCell = [this.state.scalarAcross[0].col, this.state.scalarAcross[0].row]; // Start at first across
        // Correct grid
        this.state.correctGrid = new Array(this.opts.cols).fill(false).map(() => new Array(this.opts.rows).fill(false));
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
            this.setAutocheck();
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
        let hash = 0, chr;
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
        const self = this;
        document.addEventListener("visibilitychange", this.visibilityChanged.bind(this));
        let allCells = document.querySelectorAll("rect.is-letter");
        for(let cell of allCells) {
            cell.addEventListener("click", this.catchCellClick.bind(this));
        }
        document.addEventListener("keydown", this.catchKeyPress.bind(this));
        document.querySelector(`#jxword-arrow-forward-${this.uid}`).addEventListener("click", this.moveToNextWord.bind(this));
        document.querySelector(`#jxword-arrow-back-${this.uid}`).addEventListener("click", this.moveToPreviousWord.bind(this));
        document.querySelectorAll(`.jxword-reset`).forEach(btn => btn.addEventListener("click", self.reset.bind(self)));
        document.querySelector(`#jxword-meta-${this.uid}`).addEventListener("click", this.showMeta.bind(this));
        document.querySelector(`#jxword-autocheck-${this.uid}`).addEventListener("click", this.toggleAutocheck.bind(this));
        document.querySelector(`#jxword-check_word-${this.uid}`).addEventListener("click", this.checkWord.bind(this));
        document.querySelector(`#jxword-check_square-${this.uid}`).addEventListener("click", this.checkSquare.bind(this));
        document.querySelector(`#jxword-check_puzzle-${this.uid}`).addEventListener("click", this.checkPuzzle.bind(this));
        document.querySelector(`#jxword-single-question-${this.uid}`).addEventListener("click", this.changeDirection.bind(this));
        const keys = document.querySelectorAll(".jxword-key");
        for (let key of keys) {
            if (this.debug) console.log(key);
            key.addEventListener("click", this.keyClick.bind(this));
        }
        document.querySelector(`#jxword-pause-${this.uid}`).addEventListener("click", this.pause.bind(this));
        document.querySelector(`#jxword-overlay-resume-${this.uid}`).addEventListener("click", this.play.bind(this));
        document.querySelectorAll(`.jxword-close-overlay`).forEach(btn => btn.addEventListener('click', self.hideOverlay.bind(self)));
        document.querySelector(`#jxword-print_blank-${this.uid}`).addEventListener("click", this.printBlank.bind(this));
        document.querySelector(`#jxword-print_filled-${this.uid}`).addEventListener("click", this.printFilled.bind(this));
    }

    visibilityChanged() {
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

    showMeta(e) {
        e.preventDefault();
        this.showOverlay("meta");
        this.closeMenu()
    }

    printBlank(e) {
        e.preventDefault();
        this.closeMenu()
        const svg = document.querySelector(`#jxword-svg-${this.uid}`).cloneNode(true);
        const letters = svg.querySelectorAll(`.jxword-letter`);
        for (let letter of letters) {
            letter.remove();
        }
        this.print(svg);
    }

    printFilled(e) {
        e.preventDefault();
        this.closeMenu();
        const svg = document.querySelector(`#jxword-svg-${this.uid}`);
        this.print(svg);
    }

    print(svg) {
        // console.log(svg);
        const svg_text = svg.outerHTML.replace(/fill="#f7f457"/g, `fill="#ffffff"`).replace(/fill="#9ce0fb"/g, `fill="#ffffff"`);
        const questions_across = document.querySelector(`#jxword-questions-across-${this.uid}`).outerHTML;
        const questions_down = document.querySelector(`#jxword-questions-down-${this.uid}`).outerHTML;
        let printWindow = window.open();
        printWindow.document.write(`<html><head><title>${this.opts.data.meta.Title}</title>`);
        printWindow.document.write(`<style>
            .svg-container {
                height: 35em;
                display:block;
            }
            .jxword-svg {
                height: 100%;
                width: 100%;
            }
            .jxword-questions-list {
                list-style: none;
                line-height: 1.5;
                font-size: 12px;
                padding-left: 0px;
                display: flex;
                flex-direction: column;
                margin-right: 20px;
            }
            .jxword-questions-list-item-num {
                margin-right: 5px;
                text-align: right;
                width: 25px;
                min-width: 25px;
                font-weight: bold;
            }
            .questions {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
            }
        </style>`);
        printWindow.document.write(`<div class="svg-container">${svg_text}</div>`);
        printWindow.document.write(`<div class="questions">\n`);
        printWindow.document.write(`<div><h4>Across</h4>\n${questions_across}</div>`);
        printWindow.document.write(`<div><h4>Down</h4>\n${questions_down}</div>`);
        printWindow.document.write(`</div>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    catchCellClick(e) {
        const col = Number(e.target.dataset.col);
        const row = Number(e.target.dataset.row);
        if ((col === this.state.currentCell[0]) && (row === this.state.currentCell[1])) { // Clicked on already selected cell
            this.changeDirection();
        } else {
            this.state.currentCell[0] = col;
            this.state.currentCell[1] = row;
            const word = this.getWord(this.state.direction, col, row);
            if (!word) this.changeDirection();
        }
        this.markCells();
    }

    moveToNextCell() {
        let scalar;
        if (this.state.direction) {
            scalar = this.state.scalarDown;
        } else {
            scalar = this.state.scalarAcross;
        }
        const currentScalarIndex = scalar.findIndex(item => item.col === this.state.currentCell[0] && item.row === this.state.currentCell[1]);
        if (currentScalarIndex < scalar.length - 1) {
            this.state.currentCell[0] = scalar[currentScalarIndex + 1].col;
            this.state.currentCell[1] = scalar[currentScalarIndex + 1].row;
        } else {
            this.state.currentCell[0] = scalar[0].col;
            this.state.currentCell[1] = scalar[0].row;
        }
        this.markCells();
    }

    typeLetter(letter) {
        if (this.state.correctGrid[this.state.currentCell[0]][this.state.currentCell[1]] === true) {
            this.moveToNextCell();
            return;
        }
        const hasLetter = (this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]]);
        this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]] = letter;
        this.setScalars(letter, this.state.currentCell[0], this.state.currentCell[1])
        this.drawLetter(letter, this.state.currentCell[0], this.state.currentCell[1]);
        // this.checkHint();
        this.checkWin();
        if (!hasLetter) {
            this.moveToNext();
        } else {
            this.moveToNextCell();
        }
    }

    catchKeyPress(e) {
        const keycode = e.keyCode;
        // console.log(e);
        if (e.metaKey) return;
        const printable = (keycode > 64 && keycode < 91);
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
            let scalar = this.state.scalarAcross;
            let currentCell = scalar.find(cell => cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]);
            if (currentCell) {
                let index = currentCell.index;
                if (index !== null) {
                    if (scalar[index - 1]) {
                        this.state.currentCell[0] = scalar[index - 1].col;
                        this.state.currentCell[1] = scalar[index - 1].row;
                    } else {
                        this.state.currentCell[0] = scalar[scalar.length - 1].col;
                        this.state.currentCell[1] = scalar[scalar.length - 1].row;
                    }
                }
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
        }
        this.markCells();
    }

    moveUp() {
        if (!this.state.direction) {
            this.state.direction = 1;
            this.setAria();
        } else {
            let scalar = this.state.scalarDown;
            let currentCell = scalar.find(cell => cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]);
            if (currentCell) {
                let index = currentCell.index;
                if (index !== null) {
                    if (scalar[index - 1]) {
                        this.state.currentCell[0] = scalar[index - 1].col;
                        this.state.currentCell[1] = scalar[index - 1].row;
                    } else {
                        this.state.currentCell[0] = scalar[scalar.length - 1].col;
                        this.state.currentCell[1] = scalar[scalar.length - 1].row;
                    }
                }
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
        }
        
        this.markCells();
    }

    moveRight() {
        if (this.state.direction) {
            this.state.direction = 0;
            this.setAria();
        } else {
            let scalar = this.state.scalarAcross;
            let currentCell = scalar.find(cell => cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]);
            if (currentCell) {
                let index = currentCell.index;
                if (index !== null) {
                    if (scalar[index +1]) {
                        this.state.currentCell[0] = scalar[index +1].col;
                        this.state.currentCell[1] = scalar[index +1].row;
                    } else {
                        this.state.currentCell[0] = scalar[0].col;
                        this.state.currentCell[1] = scalar[0].row;
                    }
                }
            } else {
                let x = this.state.currentCell[0];
                while (x < this.opts.rows - 1) {
                    x++;
                    if (this.state.graph[x][this.state.currentCell[1]] !== "#") {
                        this.state.currentCell[0] = x;
                        break;
                    }
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
            let scalar = this.state.scalarDown;
            let currentCell = scalar.find(cell => cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]);
            if (currentCell) {
                let index = currentCell.index;
                if (index !== null) {
                    if (scalar[index +1]) {
                        this.state.currentCell[0] = scalar[index +1].col;
                        this.state.currentCell[1] = scalar[index +1].row;
                    } else {
                        this.state.currentCell[0] = scalar[0].col;
                        this.state.currentCell[1] = scalar[0].row;
                    }
                }
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
        }
        this.markCells();
    }

    setScalars(letter, col, row) {
        let across = this.state.scalarAcross.find(cell => (cell.col === col && cell.row === row));
        if (across) {
            across.letter = letter;
        }
        let down = this.state.scalarDown.find(cell => (cell.col === col && cell.row === row));
        if (down) {
            down.letter = letter;
        }
        if (this.state.autocheck) {
            if (letter === this.grid[col][row]) {
                if (down) down.correct = true;
                if (across) across.correct = true;
                this.state.correctGrid[col][row] = true;
            }
        }
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
            const nextBlank = otherScalar.find(cell => cell.letter === "");
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
        if (this.state.correctGrid[this.state.currentCell[0]][this.state.currentCell[1]])  {
            this.moveToPreviousLetter();
            return;
        }
        if (!this.state.graph[this.state.currentCell[0]][this.state.currentCell[1]]) {
            // Move back and then delete
            this.moveToPreviousLetter();
            if (this.state.correctGrid[this.state.currentCell[0]][this.state.currentCell[1]]) return;
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
        if (!cursor) return;
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
            const nextBlank = otherScalar.find(cell => cell.letter === "");
            if (nextBlank) { // Is there still a blank down?
                this.state.currentCell[0] = nextBlank.col;
                this.state.currentCell[1] = nextBlank.row;
                this.changeDirection();
            }
        }
        this.markCells();
    }

    findStartOfCurrentWord() {
        let scalar;
        if (!this.state.direction) { // Across
            scalar = this.state.scalarAcross;
        } else { // Down
            scalar = this.state.scalarDown;
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
        return startOfCurrentWord;
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
        // let cursor = scalar.find(cell => (cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]));
        // Start of current word
        let startOfCurrentWord = this.startOfCurrentWord();
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
            const nextBlank = findLast(otherScalar, cell => cell.letter === "");
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
                let scalarAcross = this.state.scalarAcross.find(scalar => scalar.row == y && scalar.col == x);
                let scalarDown = this.state.scalarDown.find(scalar => scalar.row == y && scalar.col == x);
                if (this.grid[x][y] === this.state.graph[x][y]) {
                    if (scalarAcross) scalarAcross.correct = true;
                    if (scalarDown) scalarDown.correct = true;
                } else {
                    if (scalarAcross) scalarAcross.correct = false;
                    if (scalarDown) scalarDown.correct = false;
                    win = false;
                }
            }
        }
        // this.state.hash = this.calcHash(this.state.graph);
        if (win) {
            document.querySelector(".jxword-overlay-title").innerHTML = "You Win!";
            this.showOverlay("complete");
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
        if (!cell) return;
        let q = cell.q;
        var elems = document.querySelectorAll(".jxword-questions-list-item.active");
        [].forEach.call(elems, function (el) {
            el.classList.remove("active");
        });
        const questionEl = document.querySelector(`#jxword-question-across-${d}${q}-${this.uid}`);
        if (!questionEl) return;
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
            if (s.match(/[.?]$/)) return s;
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
            if (!question) continue;
            let wordLength = question.question.length;
            let s = `${question.num}. ${fullstop(question.question)} ${wordLength} letters, ${th(letterCount)} letter.`
            letterCount++;
            document.querySelector(`#jxword-cell-${this.uid}-${cell.col}-${cell.row} > .jxword-cell-rect`) .setAttribute("aria-label", s);
        }
    }

    reset(e) {
        e.preventDefault();
        const cheated = this.state.cheated;
        this.setState();
        this.state.cheated = cheated; // Nice try!
        this.saveState();
        this.restoreState();
        this.hideOverlay();
        this.closeMenu();
    }

    changeDirection() {
        // Make sure we can change direction.
        const word = this.getWord(!this.state.direction, this.state.currentCell[0], this.state.currentCell[1]);
        if (!word) return;
        this.state.direction = !this.state.direction;
        this.markCells();
        this.setAria();

    }

    getWord(direction, col, row) {
        let cell = null;
        if (!direction) { // Across
            cell = this.state.scalarAcross.find(cell => (col === cell.col && row === cell.row));
        } else {
            cell = this.state.scalarDown.find(cell => (col === cell.col && row === cell.row));
        }
        return cell;
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

    checkTile(x, y) {
        if (this.grid[x][y] === "#") return;
        if (this.state.correctGrid[x][y]) return;
        if (this.grid[x][y] === this.state.graph[x][y]) {
            this.state.correctGrid[x][y] = true;
            this.drawLetter(this.grid[x][y], x, y);
        }
    }

    checkSquare(e) {
        e.preventDefault();
        this.checkTile(this.state.currentCell[0], this.state.currentCell[1]);
        this.state.cheated = true;
        this.saveState();
        this.closeMenu();
    }

    checkWord(e) { //TODO
        e.preventDefault();
        let scalar = "";
        if (this.state.direction) {
            scalar = this.state.scalarDown;
        } else {
            scalar = this.state.scalarAcross;
        }
        let startOfCurrentWord = this.findStartOfCurrentWord();
        this.checkTile(startOfCurrentWord.col, startOfCurrentWord.row);
        let i = startOfCurrentWord.index + 1;
        while(scalar[i] && !scalar[i].startOfWord) {
            // console.log(scalar[i]);
            this.checkTile(scalar[i].col, scalar[i].row);
            i++;
        }
        this.state.cheated = true;
        this.saveState();
        this.closeMenu();
    }

    checkPuzzle(e) {
        if (e) e.preventDefault();
        for(let x = 0; x < this.state.correctGrid.length; x++) {
            for(let y = 0; y < this.state.correctGrid[x].length; y++) {
                this.checkTile(x, y);
            }
        }
        if (e) {
            this.state.cheated = true;
            this.saveState();
            this.closeMenu();
        }
    }

    setAutocheck() {
        if (this.state.autocheck) {
            document.querySelector(`#jxword-autocheck-${this.uid} > li`).innerHTML = "Autocheck &check;";
            this.checkPuzzle();
        } else {
            document.querySelector(`#jxword-autocheck-${this.uid} > li`).innerHTML = "Autocheck";
        }
    }

    toggleAutocheck(e) { //TODO
        e.preventDefault();
        this.state.autocheck = !this.state.autocheck;
        if (this.state.autocheck) {
            this.checkPuzzle();
            this.state.cheated = true;
        }
        this.setAutocheck();
        this.saveState();
        this.closeMenu();
    }

    closeMenu() {
        const inputEl = document.querySelector(".jxword-menu-toggle input:checked");
        if (inputEl) inputEl.checked = false;
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
/* harmony import */ var _css_jxword_less__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./css/jxword.less */ "./src/css/jxword.less");




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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QWdEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUF1QixtQ0FBbUM7QUFDMUQsMkJBQTJCLHNDQUFzQztBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHdEQUF3RCxVQUFVLHFDQUFxQztBQUN2RztBQUNBLFVBQVU7QUFDVix3REFBd0QsVUFBVTtBQUNsRTtBQUNBOztBQUVBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlFQUFlLE1BQU07Ozs7OztVQzkyQ3JCO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7O0FDTnNDO0FBQ0s7QUFDaEI7O0FBRTNCO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwwREFBUTtBQUMvQix3QkFBd0IsdURBQU07QUFDOUIsdUJBQXVCLGFBQWE7QUFDcEM7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLHNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL3NyYy9jc3Mvanh3b3JkLmxlc3M/YzliZCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vbm9kZV9tb2R1bGVzL3hkLWNyb3Nzd29yZC1wYXJzZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL3NyYy9qcy9qeHdvcmQtZ3JpZC5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGV4dHJhY3RlZCBieSBtaW5pLWNzcy1leHRyYWN0LXBsdWdpblxuZXhwb3J0IHt9OyIsIi8vIEEgbGlicmFyeSBmb3IgY29udmVydGluZyAueGQgQ3Jvc3N3b3JkIGRhdGEgdG8gSlNPTiAoYXMgZGVmaW5lZCBieSBTYXVsIFB3YW5zb24gLSBodHRwOi8veGQuc2F1bC5wdykgd3JpdHRlbiBieSBKYXNvbiBOb3J3b29kLVlvdW5nXG5cbmZ1bmN0aW9uIFhEUGFyc2VyKGRhdGEpIHtcbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YShkYXRhKSB7XG4gICAgICAgIC8vIFNwbGl0IGludG8gcGFydHNcbiAgICAgICAgbGV0IHBhcnRzID0gZGF0YS5zcGxpdCgvXiReJC9nbSkuZmlsdGVyKHMgPT4gcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgICBwYXJ0cyA9IGRhdGEuc3BsaXQoL1xcclxcblxcclxcbi9nKS5maWx0ZXIocyA9PiAocy50cmltKCkpKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhcnRzW2ldID0gcGFydHNbaV0ucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgVG9vIG1hbnkgcGFydHMgLSBleHBlY3RlZCA0LCBmb3VuZCAke3BhcnRzLmxlbmd0aH1gKTtcbiAgICAgICAgY29uc3QgcmF3TWV0YSA9IHBhcnRzWzBdO1xuICAgICAgICBjb25zdCByYXdHcmlkID0gcGFydHNbMV07XG4gICAgICAgIGNvbnN0IHJhd0Fjcm9zcyA9IHBhcnRzWzJdO1xuICAgICAgICBjb25zdCByYXdEb3duID0gcGFydHNbM107XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcm9jZXNzTWV0YShyYXdNZXRhKTtcbiAgICAgICAgY29uc3QgZ3JpZCA9IHByb2Nlc3NHcmlkKHJhd0dyaWQpO1xuICAgICAgICBjb25zdCBhY3Jvc3MgPSBwcm9jZXNzQ2x1ZXMocmF3QWNyb3NzKTtcbiAgICAgICAgY29uc3QgZG93biA9IHByb2Nlc3NDbHVlcyhyYXdEb3duKTtcbiAgICAgICAgcmV0dXJuIHsgbWV0YSwgZ3JpZCwgYWNyb3NzLCBkb3duLCByYXdHcmlkLCByYXdBY3Jvc3MsIHJhd0Rvd24sIHJhd01ldGEsIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc01ldGEocmF3TWV0YSkge1xuICAgICAgICBjb25zdCBtZXRhTGluZXMgPSByYXdNZXRhLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgbGV0IG1ldGEgPSB7fTtcbiAgICAgICAgbWV0YUxpbmVzLmZvckVhY2gobWV0YUxpbmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGluZVBhcnRzID0gbWV0YUxpbmUuc3BsaXQoXCI6IFwiKTtcbiAgICAgICAgICAgIG1ldGFbbGluZVBhcnRzWzBdXSA9IGxpbmVQYXJ0c1sxXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NHcmlkKHJhd0dyaWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0dyaWQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSBsaW5lc1t4XS5zcGxpdChcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDbHVlcyhyYXdDbHVlcykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3Q2x1ZXMuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBjb25zdCByZWdleCA9IC8oXi5cXGQqKVxcLlxccyguKilcXHN+XFxzKC4qKS87XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGlmICghbGluZXNbeF0udHJpbSgpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gbGluZXNbeF0ubWF0Y2gocmVnZXgpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBDb3VsZCBub3QgcGFyc2UgcXVlc3Rpb24gJHtsaW5lc1t4XX1gKTtcbiAgICAgICAgICAgIC8vIFVuZXNjYXBlIHN0cmluZ1xuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb24gPSBwYXJ0c1syXS5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xuICAgICAgICAgICAgcmVzdWx0W3hdID0ge1xuICAgICAgICAgICAgICAgIG51bTogcGFydHNbMV0sXG4gICAgICAgICAgICAgICAgcXVlc3Rpb246IHF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgIGFuc3dlcjogcGFydHNbM11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc0RhdGEoZGF0YSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWERQYXJzZXI7IiwiLypcbiogSlhXb3JkIEdyaWQgLSBBIENyb3Nzd29yZCBTeXN0ZW0gYnkgSmFzb24gTm9yd29vZC1Zb3VuZyA8amFzb25AMTBsYXllci5jb20+XG4qIENvcHlyaWdodCAyMDIwIEphc29uIE5vcndvb2QtWW91bmdcbiovXG5cbi8vIENvbCwgICBSb3dcbi8vIFgsICAgICBZXG4vLyB3aWR0aCwgaGVpZ2h0XG5jbGFzcyBKWFdvcmQge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJKWFdvcmQsIGEgY3Jvc3N3b3JkIHN5c3RlbSBieSBKYXNvbiBOb3J3b29kLVlvdW5nIDxqYXNvbkAxMGxheWVyLmNvbT5cIik7XG4gICAgICAgIGlmICghb3B0cy5jb250YWluZXIpIHRocm93IFwiJ2NvbnRhaW5lcicgcmVxdWlyZWRcIjtcbiAgICAgICAgaWYgKCFvcHRzLmRhdGEpIHRocm93IFwiJ2RhdGEnIHJlcXVpcmVkXCI7XG4gICAgICAgIC8vIFNldCBzb21lIGRlZmF1bHRzXG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oeyBcbiAgICAgICAgICAgIHdpZHRoOiA1MDAsIFxuICAgICAgICAgICAgaGVpZ2h0OiA1MDAsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJXaWR0aDogMS41LCBcbiAgICAgICAgICAgIGlubmVyQm9yZGVyV2lkdGg6IDEsIFxuICAgICAgICAgICAgbWFyZ2luOiAzLCBcbiAgICAgICAgICAgIG91dGVyQm9yZGVyQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBmaWxsQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgY29sczogb3B0cy5kYXRhLmdyaWQubGVuZ3RoLFxuICAgICAgICAgICAgcm93czogb3B0cy5kYXRhLmdyaWRbMF0ubGVuZ3RoLCBcbiAgICAgICAgICAgIGZvbnRSYXRpbzogMC43LFxuICAgICAgICAgICAgbnVtUmF0aW86IDAuMzMsXG4gICAgICAgICAgICBzZWxlY3RDZWxsQ29sb3VyOiBcIiNmN2Y0NTdcIixcbiAgICAgICAgICAgIHNlbGVjdFdvcmRDb2xvdXI6IFwiIzljZTBmYlwiLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG91cjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICAgICAgcmVzdG9yZVN0YXRlOiBmYWxzZVxuICAgICAgICB9LCBvcHRzKTtcbiAgICAgICAgdGhpcy51aWQgPSArbmV3IERhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHRpbWVfdGFrZW46IDAsXG4gICAgICAgICAgICBhdXRvY2hlY2s6IGZhbHNlLFxuICAgICAgICAgICAgY2hlYXRlZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zID0gW107XG4gICAgICAgIHRoaXMuZG93bl9xdWVzdGlvbnMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgdGhpcy5pc19oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIGRvY3VtZW50IHRvIGxvYWRcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgdGhpcy5vbkxvYWQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLy8gdGhyb3dFdmVudChldmVudE5hbWUsIGRldGFpbCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyh0aGlzLmV2ZW50cywgZXZlbnROYW1lKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudHMucHVibGlzaChldmVudE5hbWUsIGRldGFpbCk7XG4gICAgLy8gfVxuXG4gICAgb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMub3B0cy5jb250YWluZXIpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyRWxlbWVudCkgdGhyb3cgKGBDb3VsZCBub3QgZmluZCAke3RoaXMub3B0cy5jb250YWluZXJ9YCk7XG4gICAgICAgIHRoaXMudG90YWxXaWR0aCA9IHRoaXMub3B0cy53aWR0aCArICh0aGlzLm9wdHMubWFyZ2luICogMik7XG4gICAgICAgIHRoaXMudG90YWxIZWlnaHQgPSB0aGlzLm9wdHMuaGVpZ2h0ICsgKHRoaXMub3B0cy5tYXJnaW4gKiAyKTtcbiAgICAgICAgdGhpcy5jZWxsV2lkdGggPSB0aGlzLm9wdHMud2lkdGggLyB0aGlzLm9wdHMuY29scztcbiAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5vcHRzLmhlaWdodCAvIHRoaXMub3B0cy5yb3dzO1xuICAgICAgICB0aGlzLmZvbnRTaXplID0gdGhpcy5jZWxsV2lkdGggKiB0aGlzLm9wdHMuZm9udFJhdGlvOyAvLyBGb250IHNpemUgeCUgc2l6ZSBvZiBjZWxsXG4gICAgICAgIHRoaXMuZ3JpZCA9IFtdO1xuICAgICAgICB0aGlzLmdyaWQgPSB0aGlzLm9wdHMuZGF0YS5ncmlkWzBdLm1hcCgoY29sLCBpKSA9PiB0aGlzLm9wdHMuZGF0YS5ncmlkLm1hcChyb3cgPT4gcm93W2ldKSk7IC8vIFRyYW5zcG9zZSBvdXIgbWF0cml4XG4gICAgICAgIHRoaXMuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5ncmlkKTsgLy8gQ2FsY3VsYXRlIG91ciBoYXNoIHJlc3VsdFxuICAgICAgICB0aGlzLnN0b3JhZ2VOYW1lID0gYGp4d29yZC0ke01hdGguYWJzKHRoaXMuaGFzaCl9YDtcbiAgICAgICAgdGhpcy5kcmF3TGF5b3V0KCk7XG4gICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcbiAgICAgICAgdGhpcy5kcmF3Qm9yZGVyKCk7XG4gICAgICAgIHRoaXMuZHJhd051bWJlcnMoKTtcbiAgICAgICAgdGhpcy5kcmF3UXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQWN0aW9ucygpO1xuICAgICAgICB0aGlzLnNldEZvY3VzKCk7XG4gICAgICAgIHRoaXMubGlzdGVuUXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMuc2V0VGltZXIoKTtcbiAgICAgICAgdGhpcy5kcmF3VGltZXIoKTtcbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzZXRUaW1lcigpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzX2hpZGRlbikgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnRpbWVfdGFrZW4pIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnRpbWVfdGFrZW4rKztcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmRyYXdUaW1lcigpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpLCAxMDAwKTtcbiAgICB9XG5cbiAgICBkcmF3TGF5b3V0KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1jb250YWluZXJcIiBpZD1cImp4d29yZC1jb250YWluZXItJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5IGp4d29yZC1vdmVybGF5LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1wYXVzZWQtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1wYXVzZWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91ciBHYW1lIGlzIEN1cnJlbnRseSBQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktcmVzdW1lLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzdW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtY29tcGxldGVfb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLWNvbXBsZXRlX292ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29uZ3JhdHVsYXRpb25zISBZb3UndmUgV29uIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheS1yZXN0YXJ0LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b24ganh3b3JkLXJlc2V0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uIGp4d29yZC1jbG9zZS1vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsb3NlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtbWV0YV9vdmVybGF5LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtbWV0YV9vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dGhpcy5vcHRzLmRhdGEubWV0YS5UaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkeyBPYmplY3Qua2V5cyh0aGlzLm9wdHMuZGF0YS5tZXRhKS5tYXAoayA9PiBrID09PSBcIlRpdGxlXCIgPyBcIlwiIDogYDxsaT4ke2t9OiAke3RoaXMub3B0cy5kYXRhLm1ldGFba119PC9saT5gICkuam9pbihcIlxcblwiKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvbiBqeHdvcmQtY2xvc2Utb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcGxheS1hcmVhXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtZ3JpZC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPG5hdiBjbGFzcz1cImp4d29yZC1jb250cm9sc1wiIHJvbGU9XCJuYXZpZ2F0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW1lbnUtdG9nZ2xlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwianh3b3JkLW1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQWJvdXQgVGhpcyBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1tZXRhLSR7dGhpcy51aWR9XCI+PGxpPkFib3V0IFRoaXMgUHV6emxlPC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cImp4d29yZC1tZW51LWJyZWFrXCI+PGhyPjwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSBBdXRvY2hlY2tcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH1cIj48bGk+QXV0b2NoZWNrPC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkNoZWNrIFNxdWFyZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWNoZWNrX3NxdWFyZS0ke3RoaXMudWlkfVwiPjxsaT5DaGVjayBTcXVhcmU8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfd29yZC0ke3RoaXMudWlkfVwiPjxsaT5DaGVjayBXb3JkPC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkNoZWNrIFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWNoZWNrX3B1enpsZS0ke3RoaXMudWlkfVwiPjxsaT5DaGVjayBQdXp6bGU8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj48aHI+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiUHJpbnQgKEJsYW5rKVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLXByaW50X2JsYW5rLSR7dGhpcy51aWR9XCI+PGxpPlByaW50IChCbGFuayk8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiUHJpbnQgKEZpbGxlZClcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1wcmludF9maWxsZWQtJHt0aGlzLnVpZH1cIj48bGk+UHJpbnQgKEZpbGxlZCk8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj48aHI+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiUmVzZXQgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uIGp4d29yZC1yZXNldFwiIGlkPVwianh3b3JkLXJlc2V0LSR7dGhpcy51aWR9XCI+PGxpPlJlc2V0PC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L25hdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1wYXVzZS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXBhdXNlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1wYXVzZS10ZXh0IGp4d29yZC1zci1vbmx5XCI+UGF1c2U8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC10aW1lci0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXRpbWVyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXN2Zy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIGlkPSdqeHdvcmQtc3ZnLSR7dGhpcy51aWR9JyBjbGFzcz0nanh3b3JkLXN2Zycgdmlld0JveD1cIjAgMCAkeyB0aGlzLnRvdGFsV2lkdGggfSAkeyB0aGlzLnRvdGFsSGVpZ2h0IH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGcgY2xhc3M9XCJjZWxsLWdyb3VwXCIgaWQ9J2p4d29yZC1nLWNvbnRhaW5lci0ke3RoaXMudWlkIH0nPjwvZz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tY29udGFpbmVyIGp4d29yZC1tb2JpbGUtb25seVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWJhY2tcIiBpZD1cImp4d29yZC1hcnJvdy1iYWNrLSR7IHRoaXMudWlkIH1cIj4mbGFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXNpbmdsZS1xdWVzdGlvblwiIGlkPVwianh3b3JkLXNpbmdsZS1xdWVzdGlvbi0keyB0aGlzLnVpZCB9XCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1hcnJvdyBqeHdvcmQtYXJyb3ctZm9yd2FyZFwiIGlkPVwianh3b3JkLWFycm93LWZvcndhcmQtJHsgdGhpcy51aWQgfVwiPiZyYW5nOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkIGp4d29yZC1tb2JpbGUtb25seVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJRXCI+UTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiV1wiPlc8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkVcIj5FPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJSXCI+UjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiVFwiPlQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIllcIj5ZPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJVXCI+VTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiSVwiPkk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk9cIj5PPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJQXCI+UDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJBXCI+QTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiU1wiPlM8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkRcIj5EPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJGXCI+RjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiR1wiPkc8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkhcIj5IPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJKXCI+SjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiS1wiPks8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkxcIj5MPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlpcIj5aPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJYXCI+WDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiQ1wiPkM8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlZcIj5WPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJCXCI+QjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiTlwiPk48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk1cIj5NPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5IGp4d29yZC1rZXktYmFja3NwYWNlXCIgZGF0YS1rZXk9XCJCQUNLU1BBQ0VcIj4mbEFycjs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbi1jb250YWluZXIganh3b3JkLWRlc2t0b3Atb25seVwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWNvbnRhaW5lci0keyB0aGlzLnVpZCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3NcIiBpZD1cImp4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHsgdGhpcy51aWQgfVwiPjxoND5BY3Jvc3M8L2g0PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtZG93blwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWRvd24tJHsgdGhpcy51aWQgfVwiPjxoND5Eb3duPC9oND48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICAgICAgdGhpcy5zdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0keyB0aGlzLnVpZCB9YCk7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1nLWNvbnRhaW5lci0ke3RoaXMudWlkIH1gKTtcbiAgICB9XG5cbiAgICBkcmF3R3JpZCgpIHtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxHcm91cC5pbm5lckhUTUwgKz0gdGhpcy5kcmF3Q2VsbCh0aGlzLmdyaWRbY29sXVtyb3ddLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3Q2VsbChsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IHggPSAodGhpcy5jZWxsV2lkdGggKiBjb2wpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3QgeSA9ICh0aGlzLmNlbGxIZWlnaHQgKiByb3cpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5jZWxsSGVpZ2h0O1xuICAgICAgICBjb25zdCBsZXR0ZXJYID0geCArICh3aWR0aCAvIDIpO1xuICAgICAgICBjb25zdCBsZXR0ZXJZID0geSArIGhlaWdodCAtIChoZWlnaHQgKiAwLjEpO1xuICAgICAgICBsZXQgZmlsbCA9IHRoaXMub3B0cy5iYWNrZ3JvdW5kQ29sb3VyO1xuICAgICAgICBsZXQgaXNCbGFuayA9IFwiaXMtbGV0dGVyXCI7XG4gICAgICAgIGxldCBjb250YWluZXJDbGFzcz1cImlzLWxldHRlci1jb250YWluZXJcIjtcbiAgICAgICAgaWYgKGxldHRlciA9PSBcIiNcIikge1xuICAgICAgICAgICAgZmlsbCA9IHRoaXMub3B0cy5maWxsQ29sb3VyO1xuICAgICAgICAgICAgaXNCbGFuayA9IFwiaXMtYmxhbmtcIjtcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzPVwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGA8ZyBpZD1cImp4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31cIiBjbGFzcz1cImp4d29yZC1jZWxsICR7Y29udGFpbmVyQ2xhc3N9XCIgc3R5bGU9XCJ6LWluZGV4OiAyMFwiPjxyZWN0IGNsYXNzPVwianh3b3JkLWNlbGwtcmVjdCAke2lzQmxhbmt9XCIgcm9sZT1cImNlbGxcIiB0YWJpbmRleD1cIi0xXCIgYXJpYS1sYWJlbD1cIlwiIHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCIgc3Ryb2tlPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJDb2xvdXJ9XCIgc3Ryb2tlLXdpZHRoPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJXaWR0aH1cIiBmaWxsPVwiJHtmaWxsfVwiIGRhdGEtY29sPVwiJHtjb2x9XCIgZGF0YS1yb3c9XCIke3JvdyB9XCIgY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiPjwvcmVjdD48dGV4dCBpZD1cImp4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fVwiIGNsYXNzPVwianh3b3JkLWxldHRlclwiIHg9XCIkeyBsZXR0ZXJYIH1cIiB5PVwiJHsgbGV0dGVyWSB9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmb250LXNpemU9XCIkeyB0aGlzLmZvbnRTaXplIH1cIiB3aWR0aD1cIiR7IHdpZHRoIH1cIj48L3RleHQ+PC9nPmA7XG4gICAgfVxuXG4gICAgZHJhd0xldHRlcihsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IGxldHRlckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fWApO1xuICAgICAgICBjb25zdCBjb3JyZWN0ID0gdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFtjb2xdW3Jvd107XG4gICAgICAgIGlmIChjb3JyZWN0KSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5jbGFzc0xpc3QuYWRkKFwianh3b3JkLWxldHRlci1pcy1jb3JyZWN0XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0dGVyRWwuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1sZXR0ZXItaXMtY29ycmVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZXR0ZXIpO1xuICAgICAgICB3aGlsZShsZXR0ZXJFbC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5yZW1vdmVDaGlsZChsZXR0ZXJFbC5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGxldHRlckVsLmFwcGVuZENoaWxkKHR4dCk7XG4gICAgfVxuXG4gICAgZHJhd1RpbWVyKCkge1xuICAgICAgICBmdW5jdGlvbiBmb3JtYXRUaW1lKHQpIHtcbiAgICAgICAgICAgIHZhciBzZWNfbnVtID0gcGFyc2VJbnQodCwgMTApOyAvLyBkb24ndCBmb3JnZXQgdGhlIHNlY29uZCBwYXJhbVxuICAgICAgICAgICAgdmFyIGhvdXJzICAgPSBNYXRoLmZsb29yKHNlY19udW0gLyAzNjAwKTtcbiAgICAgICAgICAgIHZhciBtaW51dGVzID0gTWF0aC5mbG9vcigoc2VjX251bSAtIChob3VycyAqIDM2MDApKSAvIDYwKTtcbiAgICAgICAgICAgIHZhciBzZWNvbmRzID0gc2VjX251bSAtIChob3VycyAqIDM2MDApIC0gKG1pbnV0ZXMgKiA2MCk7XG4gICAgICAgIFxuICAgICAgICAgICAgaWYgKGhvdXJzICAgPCAxMCkge2hvdXJzICAgPSBcIjBcIitob3Vyczt9XG4gICAgICAgICAgICBpZiAobWludXRlcyA8IDEwKSB7bWludXRlcyA9IFwiMFwiK21pbnV0ZXM7fVxuICAgICAgICAgICAgaWYgKHNlY29uZHMgPCAxMCkge3NlY29uZHMgPSBcIjBcIitzZWNvbmRzO31cbiAgICAgICAgICAgIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXRpbWVyLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRpbWVyRWwuaW5uZXJIVE1MID0gYDxzcGFuIGlkPVwianh3b3JkLXRpbWVyLXRleHQtJHt0aGlzLnVpZH1cIj4ke2Zvcm1hdFRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKX08L3NwYW4+YDtcbiAgICB9XG5cbiAgICBpc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpIHtcbiAgICAgICAgaWYgKChjb2wgPT09IDApICYmICh0aGlzLmdyaWRbY29sXVtyb3ddICE9PSBcIiNcIikgJiYgKHRoaXMuZ3JpZFtjb2wgKyAxXVtyb3ddICE9PSBcIiNcIikpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF0aGlzLmdyaWRbY29sICsgMV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKChjb2wgPT09IDApIHx8ICh0aGlzLmdyaWRbY29sIC0gMV1bcm93XSA9PSBcIiNcIikpIHtcbiAgICAgICAgICAgIC8vIGlmIChyb3cgPCB0aGlzLmdyaWRbMF0ubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vIGlmICh0aGlzLmdyaWRbY29sXVtyb3cgKyAxXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgaXNTdGFydE9mRG93bihjb2wsIHJvdykge1xuICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF0aGlzLmdyaWRbY29sXVtyb3cgKyAxXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoKHJvdyA9PT0gMCkgfHwgKHRoaXMuZ3JpZFtjb2xdW3JvdyAtIDFdID09IFwiI1wiKSkge1xuICAgICAgICAgICAgLy8gaWYgKGNvbCA8IHRoaXMuZ3JpZC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMuZ3JpZFtjb2wgKyAxXVtyb3ddICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZHJhd051bWJlcnMoKSB7XG4gICAgICAgIC8vIEEgY2VsbCBnZXRzIGEgbnVtYmVyIGlmIGl0IGhhcyBhIGJsb2NrIG9yIGVkZ2UgYWJvdmUgb3IgdG8gdGhlIGxlZnQgb2YgaXQsIGFuZCBhIGJsYW5rIGxldHRlciB0byB0aGUgYm90dG9tIG9yIHJpZ2h0IG9mIGl0IHJlc3BlY3RpdmVseVxuICAgICAgICAvLyBQb3B1bGF0ZSBhIG51bWJlciBncmlkIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgICAgIGxldCBudW0gPSAxO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIGxldCBkcmF3TnVtID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sICE9PSB0aGlzLm9wdHMuY29scyAtIDEgJiYgdGhpcy5ncmlkW2NvbCsxXVtyb3ddICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd051bSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjcm9zc19xdWVzdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpcy5vcHRzLmRhdGEuYWNyb3NzLmZpbmQocSA9PiBxLm51bSA9PT0gYEEke251bX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3cgIT09IHRoaXMub3B0cy5yb3dzIC0gMSAmJiB0aGlzLmdyaWRbY29sXVtyb3crMV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3TnVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG93bl9xdWVzdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpcy5vcHRzLmRhdGEuZG93bi5maW5kKHEgPT4gcS5udW0gPT09IGBEJHtudW19YClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGxldCBkcmF3TnVtID0gdGhpcy5pc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpIHx8IHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHJvdyk7XG4gICAgICAgICAgICAgICAgaWYgKGRyYXdOdW0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TnVtYmVyKGNvbCwgcm93LCBudW0rKyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd051bWJlcihjb2wsIHJvdywgbnVtKSB7XG4gICAgICAgIGNvbnN0IG51bUZvbnRTaXplID0gdGhpcy5jZWxsV2lkdGggKiB0aGlzLm9wdHMubnVtUmF0aW87XG4gICAgICAgIGNvbnN0IHggPSAodGhpcy5jZWxsV2lkdGggKiBjb2wpICsgdGhpcy5vcHRzLm1hcmdpbiArIDI7XG4gICAgICAgIGNvbnN0IHkgPSAodGhpcy5jZWxsSGVpZ2h0ICogcm93KSArIHRoaXMub3B0cy5tYXJnaW4gKyBudW1Gb250U2l6ZTtcbiAgICAgICAgY29uc3QgY2VsbEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7IHRoaXMudWlkIH0tJHsgY29sIH0tJHsgcm93IH1gKTtcbiAgICAgICAgXG4gICAgICAgIGNlbGxFbC5pbm5lckhUTUwgKz0gYDx0ZXh0IHg9XCIkeyB4IH1cIiB5PVwiJHsgeSB9XCIgdGV4dC1hbmNob3I9XCJsZWZ0XCIgZm9udC1zaXplPVwiJHsgbnVtRm9udFNpemUgfVwiPiR7IG51bSB9PC90ZXh0PmBcbiAgICB9XG5cbiAgICBkcmF3Qm9yZGVyKCkge1xuICAgICAgICB0aGlzLmNlbGxHcm91cC5pbm5lckhUTUwgKz0gYDxyZWN0IHg9XCIke3RoaXMub3B0cy5tYXJnaW59XCIgeT1cIiR7dGhpcy5vcHRzLm1hcmdpbn1cIiB3aWR0aD1cIiR7dGhpcy5vcHRzLndpZHRofVwiIGhlaWdodD1cIiR7dGhpcy5vcHRzLmhlaWdodH1cIiBzdHJva2U9XCIke3RoaXMub3B0cy5vdXRlckJvcmRlckNvbG91ciB9XCIgc3Ryb2tlLXdpZHRoPVwiJHt0aGlzLm9wdHMub3V0ZXJCb3JkZXJXaWR0aCB9XCIgZmlsbD1cIm5vbmVcIj5gO1xuICAgIH1cblxuICAgIGRyYXdRdWVzdGlvbnMoKSB7XG4gICAgICAgIGxldCBhY3Jvc3MgPSBgPG9sIGlkPVwianh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3MtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdFwiPmBcbiAgICAgICAgdGhpcy5vcHRzLmRhdGEuYWNyb3NzLmZvckVhY2gocSA9PiB7XG4gICAgICAgICAgICBhY3Jvc3MgKz0gdGhpcy5kcmF3UXVlc3Rpb24ocSk7XG4gICAgICAgIH0pXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7dGhpcy51aWR9YCkuaW5uZXJIVE1MICs9IGFjcm9zcztcbiAgICAgICAgbGV0IGRvd24gPSBgPG9sIGlkPVwianh3b3JkLXF1ZXN0aW9ucy1kb3duLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3RcIj5gXG4gICAgICAgIHRoaXMub3B0cy5kYXRhLmRvd24uZm9yRWFjaChxID0+IHtcbiAgICAgICAgICAgIGRvd24gKz0gdGhpcy5kcmF3UXVlc3Rpb24ocSk7XG4gICAgICAgIH0pXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tZG93bi0ke3RoaXMudWlkfWApLmlubmVySFRNTCArPSBkb3duO1xuICAgIH1cblxuICAgIGRyYXdRdWVzdGlvbihxKSB7XG4gICAgICAgIHJldHVybiBgPGxpIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW1cIiBpZD1cImp4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHtxLm51bX0tJHt0aGlzLnVpZH1cIiBkYXRhLXE9XCIke3EubnVtfVwiPjxzcGFuIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0tbnVtXCI+JHtxLm51bS5yZXBsYWNlKC9eXFxELywgXCJcIil9PC9zcGFuPjxzcGFuIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0tcXVlc3Rpb25cIj4ke3EucXVlc3Rpb259PC9zcGFuPjwvbGk+YDtcbiAgICB9XG5cbiAgICBzaG93T3ZlcmxheShzdGF0ZSA9IFwicGF1c2VkXCIpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtcGF1c2VkXCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1ldGFfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gXCJwYXVzZWRcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtcGF1c2VkXCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBcIm1ldGFcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWV0YV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1vdmVybGF5LXNob3dcIik7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtb3ZlcmxheS1oaWRlXCIpO1xuICAgIH1cblxuICAgIGhpZGVPdmVybGF5KCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLW92ZXJsYXktaGlkZVwiKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1vdmVybGF5LXNob3dcIik7XG4gICAgfVxuXG4gICAgY2hlY2tPdmVybGF5KCkge1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd092ZXJsYXkoXCJwYXVzZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVPdmVybGF5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRTdGF0ZSgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwOyAvLyAwID0gYWNyb3NzLCAxID0gZG93blxuICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gZmFsc2U7IC8vIEFyZSB3ZSBkb25lIHlldD9cbiAgICAgICAgdGhpcy5zdGF0ZS5oaW50cyA9IGZhbHNlOyAvLyBIYWQgYW55IGhlbHA/XG4gICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7IC8vIEhvdyBsb25nIGhhdmUgd2UgYmVlbiBwbGF5aW5nP1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoID0gbmV3IEFycmF5KHRoaXMub3B0cy5jb2xzKS5maWxsKFwiXCIpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoXCJcIikpOyAvLyBBIG1hdHJpeCBmaWxsZWQgd2l0aCBlbXB0eSBjaGFyc1xuICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHsgLy8gRmlsbCBpbiB0aGUgIydzXG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gPSBcIiNcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FsYXJzIChmb3IgYWNyb3NzIGFuZCBkb3duKSB0aGF0IHdlIHVzZSB3aGVuIGRlY2lkaW5nIHdoaWNoIGNlbGwgdG8gZ28gdG8gaW4gdGhlIGV2ZW50IHRoYXQgYSBsZXR0ZXIgaXMgdHlwZWQsIHRhYiBpcyBwcmVzc2VkIGV0Yy4gXG4gICAgICAgIC8vIERvd24gU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93biA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCBxdWVzdGlvbiBvZiB0aGlzLmRvd25fcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3cgKyBpLFxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2codGhpcy5zdGF0ZS5zY2FsYXJEb3duKTtcbiAgICAgICAgLy8gQWNyb3NzIFNjYWxhclxuICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyA9IFtdO1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHF1ZXN0aW9uIG9mIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sICsgaSxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyk7XG4gICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGwgPSBbdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3NbMF0uY29sLCB0aGlzLnN0YXRlLnNjYWxhckFjcm9zc1swXS5yb3ddOyAvLyBTdGFydCBhdCBmaXJzdCBhY3Jvc3NcbiAgICAgICAgLy8gQ29ycmVjdCBncmlkXG4gICAgICAgIHRoaXMuc3RhdGUuY29ycmVjdEdyaWQgPSBuZXcgQXJyYXkodGhpcy5vcHRzLmNvbHMpLmZpbGwoZmFsc2UpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoZmFsc2UpKTtcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzYXZlU3RhdGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlNhdmluZyBTdGF0ZVwiKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUpKTtcbiAgICB9XG5cbiAgICByZXN0b3JlU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5zdG9yYWdlTmFtZSk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbGV0dGVyID0gdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd107XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZXR0ZXIgIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdMZXR0ZXIobGV0dGVyLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdXRvY2hlY2soKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVSZXN0b3JlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTdGF0ZSBSZXN0b3JlZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhbGNIYXNoKG1hdHJpeCkge1xuICAgICAgICBsZXQgcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgcyArPSBtYXRyaXhbY29sXVtyb3ddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBoYXNoID0gMCwgY2hyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNociA9IHMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICAgICAgICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coaGFzaCwgcyk7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cblxuICAgIG1hcmtDZWxscygpIHtcbiAgICAgICAgbGV0IGFsbENlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtY2VsbC1yZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgYWxsQ2VsbHMuZm9yRWFjaChjZWxsID0+IHtcbiAgICAgICAgICAgIGNlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuYmFja2dyb3VuZENvbG91cik7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIC0xKTtcbiAgICAgICAgfSlcbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsUmVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gfS0keyB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIH0gPiByZWN0YCk7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RDZWxsQ29sb3VyKTtcbiAgICAgICAgY3VycmVudENlbGxSZWN0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDEpO1xuICAgICAgICBsZXQgbWFya2VkQ2VsbCA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLmNvbHM7IGNvdW50ICsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvdW50fS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV19ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLnJvd3M7IGNvdW50KyspIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXX0tJHtjb3VudH0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gLSAxOyBjb3VudCA+PSAwOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0UXVlc3Rpb24odGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJBY3Rpb25zKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgdGhpcy52aXNpYmlsaXR5Q2hhbmdlZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgbGV0IGFsbENlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcInJlY3QuaXMtbGV0dGVyXCIpO1xuICAgICAgICBmb3IobGV0IGNlbGwgb2YgYWxsQ2VsbHMpIHtcbiAgICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2F0Y2hDZWxsQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5jYXRjaEtleVByZXNzLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWFycm93LWZvcndhcmQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5tb3ZlVG9OZXh0V29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hcnJvdy1iYWNrLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubW92ZVRvUHJldmlvdXNXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuanh3b3JkLXJlc2V0YCkuZm9yRWFjaChidG4gPT4gYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzZWxmLnJlc2V0LmJpbmQoc2VsZikpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1tZXRhLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2hvd01ldGEuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXV0b2NoZWNrLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMudG9nZ2xlQXV0b2NoZWNrLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3dvcmQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGVja1dvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2hlY2tfc3F1YXJlLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hlY2tTcXVhcmUuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2hlY2tfcHV6emxlLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hlY2tQdXp6bGUuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hhbmdlRGlyZWN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICBjb25zdCBrZXlzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQta2V5XCIpO1xuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKGtleSk7XG4gICAgICAgICAgICBrZXkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMua2V5Q2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnBhdXNlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktcmVzdW1lLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucGxheS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmp4d29yZC1jbG9zZS1vdmVybGF5YCkuZm9yRWFjaChidG4gPT4gYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5oaWRlT3ZlcmxheS5iaW5kKHNlbGYpKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcHJpbnRfYmxhbmstJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wcmludEJsYW5rLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXByaW50X2ZpbGxlZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByaW50RmlsbGVkLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIHZpc2liaWxpdHlDaGFuZ2VkKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUpO1xuICAgICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICB0aGlzLmlzX2hpZGRlbiA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSBcInZpc2libGVcIikge1xuICAgICAgICAgICAgdGhpcy5pc19oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhdXNlKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJQYXVzZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSB7XG4gICAgICAgICAgICB0aGlzLmlzX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfSA+IC5qeHdvcmQtcGF1c2UtdGV4dGApLmlubmVySFRNTCA9IFwiUGF1c2VcIjtcbiAgICAgICAgICAgIC8vIGFkZCBjbGFzcyB0byBwYXVzZSBidXR0b25cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLXBsYXlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmlzX3BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQbGF5XCI7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2tPdmVybGF5KCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiUGxheVwiKTtcbiAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSB7XG4gICAgICAgICAgICB0aGlzLmlzX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfSA+IC5qeHdvcmQtcGF1c2UtdGV4dGApLmlubmVySFRNTCA9IFwiUGF1c2VcIjtcbiAgICAgICAgICAgIC8vIGFkZCBjbGFzcyB0byBwYXVzZSBidXR0b25cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLXBsYXlcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzaG93TWV0YShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcIm1ldGFcIik7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KClcbiAgICB9XG5cbiAgICBwcmludEJsYW5rKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpXG4gICAgICAgIGNvbnN0IHN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc3ZnLSR7dGhpcy51aWR9YCkuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBjb25zdCBsZXR0ZXJzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtbGV0dGVyYCk7XG4gICAgICAgIGZvciAobGV0IGxldHRlciBvZiBsZXR0ZXJzKSB7XG4gICAgICAgICAgICBsZXR0ZXIucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcmludChzdmcpO1xuICAgIH1cblxuICAgIHByaW50RmlsbGVkKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICBjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLnByaW50KHN2Zyk7XG4gICAgfVxuXG4gICAgcHJpbnQoc3ZnKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHN2Zyk7XG4gICAgICAgIGNvbnN0IHN2Z190ZXh0ID0gc3ZnLm91dGVySFRNTC5yZXBsYWNlKC9maWxsPVwiI2Y3ZjQ1N1wiL2csIGBmaWxsPVwiI2ZmZmZmZlwiYCkucmVwbGFjZSgvZmlsbD1cIiM5Y2UwZmJcIi9nLCBgZmlsbD1cIiNmZmZmZmZcImApO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfYWNyb3NzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbnMtYWNyb3NzLSR7dGhpcy51aWR9YCkub3V0ZXJIVE1MO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfZG93biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1gKS5vdXRlckhUTUw7XG4gICAgICAgIGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8aHRtbD48aGVhZD48dGl0bGU+JHt0aGlzLm9wdHMuZGF0YS5tZXRhLlRpdGxlfTwvdGl0bGU+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8c3R5bGU+XG4gICAgICAgICAgICAuc3ZnLWNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAzNWVtO1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6YmxvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAuanh3b3JkLXN2ZyB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdCB7XG4gICAgICAgICAgICAgICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMS41O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLW51bSB7XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA1cHg7XG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDI1cHg7XG4gICAgICAgICAgICAgICAgbWluLXdpZHRoOiAyNXB4O1xuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLnF1ZXN0aW9ucyB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgICAgICAgICAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgPC9zdHlsZT5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJzdmctY29udGFpbmVyXCI+JHtzdmdfdGV4dH08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJxdWVzdGlvbnNcIj5cXG5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXY+PGg0PkFjcm9zczwvaDQ+XFxuJHtxdWVzdGlvbnNfYWNyb3NzfTwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGRpdj48aDQ+RG93bjwvaDQ+XFxuJHtxdWVzdGlvbnNfZG93bn08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuICAgICAgICBwcmludFdpbmRvdy5mb2N1cygpO1xuICAgICAgICBwcmludFdpbmRvdy5wcmludCgpO1xuICAgICAgICBwcmludFdpbmRvdy5jbG9zZSgpO1xuICAgIH1cblxuICAgIGNhdGNoQ2VsbENsaWNrKGUpIHtcbiAgICAgICAgY29uc3QgY29sID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQuY29sKTtcbiAgICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQucm93KTtcbiAgICAgICAgaWYgKChjb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0pICYmIChyb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKSB7IC8vIENsaWNrZWQgb24gYWxyZWFkeSBzZWxlY3RlZCBjZWxsXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSByb3c7XG4gICAgICAgICAgICBjb25zdCB3b3JkID0gdGhpcy5nZXRXb3JkKHRoaXMuc3RhdGUuZGlyZWN0aW9uLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICBpZiAoIXdvcmQpIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0Q2VsbCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50U2NhbGFySW5kZXggPSBzY2FsYXIuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgaXRlbS5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoY3VycmVudFNjYWxhckluZGV4IDwgc2NhbGFyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0uY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltjdXJyZW50U2NhbGFySW5kZXggKyAxXS5yb3c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgdHlwZUxldHRlcihsZXR0ZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNMZXR0ZXIgPSAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPSBsZXR0ZXI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pXG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAvLyB0aGlzLmNoZWNrSGludCgpO1xuICAgICAgICB0aGlzLmNoZWNrV2luKCk7XG4gICAgICAgIGlmICghaGFzTGV0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhdGNoS2V5UHJlc3MoZSkge1xuICAgICAgICBjb25zdCBrZXljb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgaWYgKGUubWV0YUtleSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludGFibGUgPSAoa2V5Y29kZSA+IDY0ICYmIGtleWNvZGUgPCA5MSk7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkgcmV0dXJuOyAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBwYXVzZWRcbiAgICAgICAgaWYgKHByaW50YWJsZSAmJiAhdGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbGV0dGVyID0gZS5rZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMudHlwZUxldHRlcihsZXR0ZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDgpIHsgLy8gQmFja3NwYWNlXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuY29tcGxldGUpIHsgLy8gRG9uJ3QgYWxsb3cgY2hhbmdlcyBpZiB3ZSd2ZSBmaW5pc2hlZCBvdXIgcHV6emxlXG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09IDMyKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIGlmICgoa2V5Y29kZSA9PT0gOSkgfHwgKGtleWNvZGUgPT09IDEzKSkgeyAvLyBUYWIgb3IgRW50ZXJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0V29yZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM3KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzgpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVVwKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNDApIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZURvd24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB4LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVVcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB5LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3ldICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4IDwgdGhpcy5vcHRzLnJvd3MgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHgrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbeF1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggKzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4ICsxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW2luZGV4ICsxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHkgPCB0aGlzLm9wdHMuY29scyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRTY2FsYXJzKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChhY3Jvc3MpIHtcbiAgICAgICAgICAgIGFjcm9zcy5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgaWYgKGRvd24pIHtcbiAgICAgICAgICAgIGRvd24ubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dG9jaGVjaykge1xuICAgICAgICAgICAgaWYgKGxldHRlciA9PT0gdGhpcy5ncmlkW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgIGlmIChkb3duKSBkb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChhY3Jvc3MpIGFjcm9zcy5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0KCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGN1cnNvcik7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh4LCBzY2FsYXJbeF0pO1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNMZXR0ZXIoKSB7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgbGV0IGN1cnNvciA9IGN1cnJlbnRDZWxsLmluZGV4IC0gMTtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvcjsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbeF0uY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbeF0ucm93O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pIHtcbiAgICAgICAgICAgIC8vIE1vdmUgYmFjayBhbmQgdGhlbiBkZWxldGVcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3TGV0dGVyKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gXCJcIjtcbiAgICAgICAgdGhpcy5zZXRTY2FsYXJzKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICBtb3ZlVG9OZXh0V29yZCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICBpZiAoIWN1cnNvcikgcmV0dXJuO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCAmJiBuZXh0Q2VsbC5sZXR0ZXIgIT09IFwiXCIpIHsgLy8gRmlyc3QgbGV0dGVyIGlzIG5vdCBibGFuaywgXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gbmV4dENlbGwuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIGZpbmRTdGFydE9mQ3VycmVudFdvcmQoKSB7XG4gICAgICAgIGxldCBzY2FsYXI7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHsgLy8gRG93blxuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBTdGFydCBvZiBjdXJyZW50IHdvcmRcbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXg7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRPZkN1cnJlbnRXb3JkID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGFydE9mQ3VycmVudFdvcmQ7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNXb3JkKCkge1xuICAgICAgICBmdW5jdGlvbiBmaW5kTGFzdChhcnJheSwgcHJlZGljYXRlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gYXJyYXlbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZSh4KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gTW92ZSB0byBmaXN0IGxldHRlciBvZiBjdXJyZW50IHdvcmQsIHRoZW4gc2VhcmNoIGJhY2t3YXJkIGZvciBhIGZyZWUgc3BhY2UsIHRoZW4gbW92ZSB0byB0aGUgc3RhcnQgb2YgdGhhdCB3b3JkLCB0aGVuIG1vdmUgZm9yd2FyZCB1bnRpbCBhIGZyZWUgc3BhY2VcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBTdGFydCBvZiBjdXJyZW50IHdvcmRcbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IHRoaXMuc3RhcnRPZkN1cnJlbnRXb3JkKCk7XG4gICAgICAgIGxldCBibGFua1NwYWNlID0gbnVsbDtcbiAgICAgICAgLy8gS2VlcCBnb2luZyBiYWNrIHVudGlsIHdlIGhpdCBhIGJsYW5rIHNwYWNlXG4gICAgICAgIGlmIChzdGFydE9mQ3VycmVudFdvcmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBzdGFydE9mQ3VycmVudFdvcmQuaW5kZXggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJsYW5rU3BhY2UgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RhcnRPZkxhc3RXb3JkID0gbnVsbDtcbiAgICAgICAgaWYgKGJsYW5rU3BhY2UpIHtcbiAgICAgICAgICAgIC8vIE5vdyBmaW5kIHN0YXJ0IG9mIHRoaXMgd29yZFxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IGJsYW5rU3BhY2UuaW5kZXg7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydE9mTGFzdFdvcmQgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRPZkxhc3RXb3JkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gc3RhcnRPZkxhc3RXb3JkLmluZGV4OyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBmaW5kTGFzdChvdGhlclNjYWxhciwgY2VsbCA9PiBjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICBpZiAobmV4dEJsYW5rKSB7IC8vIElzIHRoZXJlIHN0aWxsIGEgYmxhbmsgZG93bj9cbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRPZldvcmQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSBuZXh0QmxhbmsuaW5kZXg7IHggPj0gMDsgeC0tKSB7IC8vIE1vdmUgdG8gc3RhcnQgb2Ygd29yZFxuICAgICAgICAgICAgICAgICAgICBpZiAob3RoZXJTY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkID0gb3RoZXJTY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc3RhcnRPZldvcmQuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzdGFydE9mV29yZC5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHNldEZvY3VzKCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1jZWxsLXJlY3RcIikuZm9jdXMoKTtcbiAgICAgICAgLy8gdGhpcy5jb250YWluZXJFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgY2hlY2tXaW4oKSB7XG4gICAgICAgIGxldCB3aW4gPSB0cnVlO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMuZ3JpZC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLmdyaWRbeF0ubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSBcIiNcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgbGV0IHNjYWxhckFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoc2NhbGFyID0+IHNjYWxhci5yb3cgPT0geSAmJiBzY2FsYXIuY29sID09IHgpO1xuICAgICAgICAgICAgICAgIGxldCBzY2FsYXJEb3duID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoc2NhbGFyID0+IHNjYWxhci5yb3cgPT0geSAmJiBzY2FsYXIuY29sID09IHgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IHRoaXMuc3RhdGUuZ3JhcGhbeF1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhckFjcm9zcykgc2NhbGFyQWNyb3NzLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyRG93bikgc2NhbGFyRG93bi5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyQWNyb3NzKSBzY2FsYXJBY3Jvc3MuY29ycmVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyRG93bikgc2NhbGFyRG93bi5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzLnN0YXRlLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuc3RhdGUuZ3JhcGgpO1xuICAgICAgICBpZiAod2luKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1vdmVybGF5LXRpdGxlXCIpLmlubmVySFRNTCA9IFwiWW91IFdpbiFcIjtcbiAgICAgICAgICAgIHRoaXMuc2hvd092ZXJsYXkoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY29tcGxldGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGlnaGxpZ2h0UXVlc3Rpb24oY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGQgPSBudWxsO1xuICAgICAgICBsZXQgY2VsbCA9IG51bGw7XG4gICAgICAgIGxldCBkYXRhID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgICAgICBkID0gXCJBXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuYWNyb3NzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICAgICAgZCA9IFwiRFwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmRvd247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjZWxsKSByZXR1cm47XG4gICAgICAgIGxldCBxID0gY2VsbC5xO1xuICAgICAgICB2YXIgZWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLmFjdGl2ZVwiKTtcbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKGVsZW1zLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBxdWVzdGlvbkVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHtkfSR7cX0tJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgaWYgKCFxdWVzdGlvbkVsKSByZXR1cm47XG4gICAgICAgIHF1ZXN0aW9uRWwuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgcXVlc3Rpb25FbCB9KTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpICBjb25zb2xlLmxvZyhgI2p4d29yZC1xdWVzdGlvbi0ke2R9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRoaXMuZW5zdXJlVmlzaWJpbGl0eShxdWVzdGlvbkVsLCBxdWVzdGlvbkVsLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCk7XG4gICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkfSR7Y2VsbC5xfWApO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIikuaW5uZXJIVE1MID0gYCR7cXVlc3Rpb24ucXVlc3Rpb259YDtcbiAgICB9XG5cbiAgICBlbnN1cmVWaXNpYmlsaXR5KGVsLCBjb250YWluZXIpIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJSZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBpZiAocmVjdC5ib3R0b20gPiBjb250YWluZXJSZWN0LmJvdHRvbSkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnRvcCA8IGNvbnRhaW5lclJlY3QudG9wKSB7XG4gICAgICAgICAgICBlbC5zY3JvbGxJbnRvVmlldyh0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblF1ZXN0aW9ucygpIHtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiKTtcbiAgICAgICAgZm9yKGxldCBxdWVzdGlvbiBvZiBxdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHF1ZXN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNsaWNrUXVlc3Rpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGlja1F1ZXN0aW9uKGUpIHtcbiAgICAgICAgY29uc3QgcSA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnE7XG4gICAgICAgIGNvbnN0IGRpciA9IHFbMF07XG4gICAgICAgIGNvbnN0IG51bSA9IE51bWJlcihxLnN1YnN0cmluZygxKSk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoZGlyID09PSBcIkFcIikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5xID09PSBudW0pIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBmaXJzdCBlbXB0eSBsZXR0ZXIgaW4gYSB3b3JkLiBJZiB0aGVyZSBpc24ndCBhbiBlbXB0eSBsZXR0ZXIsIG1vdmUgdG8gc3RhcnQgb2Ygd29yZC5cbiAgICAgICAgICAgICAgICBsZXQgZW1wdHlsZXR0ZXJzID0gc2NhbGFyLmZpbHRlcih3b3JkY2VsbCA9PiB3b3JkY2VsbC5xID09PSBudW0gJiYgd29yZGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZW1wdHlsZXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gZW1wdHlsZXR0ZXJzWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGVtcHR5bGV0dGVyc1swXS5yb3c7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNlbGwuY29sO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gY2VsbC5yb3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0QXJpYSgpIHtcbiAgICAgICAgbGV0IHRoID0gbnVtID0+IHtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDEpIHJldHVybiBcIjFzdFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMikgcmV0dXJuIFwiMm5kXCI7XG4gICAgICAgICAgICBpZiAobnVtID09PSAzKSByZXR1cm4gXCIzcmRcIjtcbiAgICAgICAgICAgIHJldHVybiBgJHtudW19dGhgO1xuICAgICAgICB9XG4gICAgICAgIGxldCBmdWxsc3RvcCA9IHMgPT4ge1xuICAgICAgICAgICAgaWYgKHMubWF0Y2goL1suP10kLykpIHJldHVybiBzO1xuICAgICAgICAgICAgcmV0dXJuIGAke3N9LmA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBkaXJMZXR0ZXIgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgZGlyTGV0dGVyID1cIkFcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5hY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBkaXJMZXR0ZXIgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIGxldHRlckNvdW50ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkaXJMZXR0ZXJ9JHtjZWxsLnF9YCk7XG4gICAgICAgICAgICBpZiAoIXF1ZXN0aW9uKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCB3b3JkTGVuZ3RoID0gcXVlc3Rpb24ucXVlc3Rpb24ubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHMgPSBgJHtxdWVzdGlvbi5udW19LiAke2Z1bGxzdG9wKHF1ZXN0aW9uLnF1ZXN0aW9uKX0gJHt3b3JkTGVuZ3RofSBsZXR0ZXJzLCAke3RoKGxldHRlckNvdW50KX0gbGV0dGVyLmBcbiAgICAgICAgICAgIGxldHRlckNvdW50Kys7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjZWxsLmNvbH0tJHtjZWxsLnJvd30gPiAuanh3b3JkLWNlbGwtcmVjdGApIC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXQoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGNoZWF0ZWQgPSB0aGlzLnN0YXRlLmNoZWF0ZWQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5jaGVhdGVkID0gY2hlYXRlZDsgLy8gTmljZSB0cnkhXG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuaGlkZU92ZXJsYXkoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjaGFuZ2VEaXJlY3Rpb24oKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjYW4gY2hhbmdlIGRpcmVjdGlvbi5cbiAgICAgICAgY29uc3Qgd29yZCA9IHRoaXMuZ2V0V29yZCghdGhpcy5zdGF0ZS5kaXJlY3Rpb24sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoIXdvcmQpIHJldHVybjtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAhdGhpcy5zdGF0ZS5kaXJlY3Rpb247XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuXG4gICAgfVxuXG4gICAgZ2V0V29yZChkaXJlY3Rpb24sIGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBjZWxsID0gbnVsbDtcbiAgICAgICAgaWYgKCFkaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChjZWxsID0+IChjb2wgPT09IGNlbGwuY29sICYmIHJvdyA9PT0gY2VsbC5yb3cpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjb2wgPT09IGNlbGwuY29sICYmIHJvdyA9PT0gY2VsbC5yb3cpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2VsbDtcbiAgICB9XG5cbiAgICBrZXlDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgZWwgPSBlLnRhcmdldDtcbiAgICAgICAgbGV0IGxldHRlciA9IGVsLmRhdGFzZXQua2V5O1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coeyBsZXR0ZXIgfSk7XG4gICAgICAgIGlmIChsZXR0ZXIgPT09IFwiQkFDS1NQQUNFXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnR5cGVMZXR0ZXIobGV0dGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrVGlsZSh4LCB5KSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IFwiI1wiKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdW3ldKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IHRoaXMuc3RhdGUuZ3JhcGhbeF1beV0pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbeF1beV0gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKHRoaXMuZ3JpZFt4XVt5XSwgeCwgeSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1NxdWFyZShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5jaGVja1RpbGUodGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2hlY2tXb3JkKGUpIHsgLy9UT0RPXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHNjYWxhciA9IFwiXCI7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IHRoaXMuZmluZFN0YXJ0T2ZDdXJyZW50V29yZCgpO1xuICAgICAgICB0aGlzLmNoZWNrVGlsZShzdGFydE9mQ3VycmVudFdvcmQuY29sLCBzdGFydE9mQ3VycmVudFdvcmQucm93KTtcbiAgICAgICAgbGV0IGkgPSBzdGFydE9mQ3VycmVudFdvcmQuaW5kZXggKyAxO1xuICAgICAgICB3aGlsZShzY2FsYXJbaV0gJiYgIXNjYWxhcltpXS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coc2NhbGFyW2ldKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tUaWxlKHNjYWxhcltpXS5jb2wsIHNjYWxhcltpXS5yb3cpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2hlY2tQdXp6bGUoZSkge1xuICAgICAgICBpZiAoZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBmb3IobGV0IHggPSAwOyB4IDwgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgZm9yKGxldCB5ID0gMDsgeSA8IHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbeF0ubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrVGlsZSh4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jaGVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0QXV0b2NoZWNrKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXV0b2NoZWNrLSR7dGhpcy51aWR9ID4gbGlgKS5pbm5lckhUTUwgPSBcIkF1dG9jaGVjayAmY2hlY2s7XCI7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2tcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZUF1dG9jaGVjayhlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc3RhdGUuYXV0b2NoZWNrID0gIXRoaXMuc3RhdGUuYXV0b2NoZWNrO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tQdXp6bGUoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBdXRvY2hlY2soKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjbG9zZU1lbnUoKSB7XG4gICAgICAgIGNvbnN0IGlucHV0RWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1tZW51LXRvZ2dsZSBpbnB1dDpjaGVja2VkXCIpO1xuICAgICAgICBpZiAoaW5wdXRFbCkgaW5wdXRFbC5jaGVja2VkID0gZmFsc2U7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBKWFdvcmQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBKWFdvcmQgZnJvbSBcIi4vanMvanh3b3JkLWdyaWRcIjtcbmltcG9ydCB4ZHBhcnNlciBmcm9tIFwieGQtY3Jvc3N3b3JkLXBhcnNlclwiO1xuaW1wb3J0IFwiLi9jc3Mvanh3b3JkLmxlc3NcIjtcblxuYXN5bmMgZnVuY3Rpb24gX2FkZF9jcm9zc3dvcmQoY3Jvc3N3b3JkX2RhdGEsIGNvbnRhaW5lcl9pZCwgZGVidWcgPSBmYWxzZSkge1xuICAgIGlmICghY3Jvc3N3b3JkX2RhdGEpIHJldHVybjtcbiAgICBjb25zdCB1bmVuY29kZWRfZGF0YSA9IGF0b2IoY3Jvc3N3b3JkX2RhdGEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB4ZHBhcnNlcih1bmVuY29kZWRfZGF0YSk7XG4gICAgd2luZG93Lmp4d29yZCA9IG5ldyBKWFdvcmQoeyBcbiAgICAgICAgY29udGFpbmVyOiBgIyR7Y29udGFpbmVyX2lkfWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGRlYnVnXG4gICAgfSk7XG59XG53aW5kb3cuYWRkX2Nyb3Nzd29yZCA9IF9hZGRfY3Jvc3N3b3JkOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==