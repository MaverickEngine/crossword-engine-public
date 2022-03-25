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
        return `<g id="jxword-cell-${this.uid}-${col}-${row}" class="jxword-cell ${containerClass}" style="z-index: 20"><rect class="jxword-cell-rect ${isBlank}" role="cell" tabindex="-1" aria-label="" x="${x}" y="${y}" width="${width}" height="${height}" stroke="${this.opts.innerBorderColour}" stroke-width="${this.opts.innerBorderWidth}" fill="${fill}" data-col="${col}" data-row="${row }" contenteditable="true"></rect><text id="jxword-letter-${this.uid}-${col}-${row}" x="${ letterX }" y="${ letterY }" text-anchor="middle" font-size="${ this.fontSize }" width="${ width }"></text></g>`;
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

    showMeta(e) {
        e.preventDefault();
        this.showOverlay("meta");
        this.closeMenu()
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
        };
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
        let cursor = scalar.find(cell => (cell.col === this.state.currentCell[0] && cell.row === this.state.currentCell[1]));
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
            console.log(scalar[i]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQSwwRkFBMEY7QUFDMUY7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQztBQUNwQztBQUNBO0FBQ0E7QUFDQSxVQUFVLDBCQUEwQjtBQUNwQztBQUNBLHdDQUF3QztBQUN4QztBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVLGdEQUFnRDtBQUMxRDtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtB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aUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7OztBQ05zQztBQUNLO0FBQzNDLG1CQUFPLENBQUMsZ0RBQW1COztBQUUzQjtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsMERBQVE7QUFDL0Isd0JBQXdCLHVEQUFNO0FBQzlCLHVCQUF1QixhQUFhO0FBQ3BDO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxzQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvY3NzL2p4d29yZC5sZXNzP2M5YmQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL25vZGVfbW9kdWxlcy94ZC1jcm9zc3dvcmQtcGFyc2VyL2luZGV4LmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvanMvanh3b3JkLWdyaWQuanMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIvLyBBIGxpYnJhcnkgZm9yIGNvbnZlcnRpbmcgLnhkIENyb3Nzd29yZCBkYXRhIHRvIEpTT04gKGFzIGRlZmluZWQgYnkgU2F1bCBQd2Fuc29uIC0gaHR0cDovL3hkLnNhdWwucHcpIHdyaXR0ZW4gYnkgSmFzb24gTm9yd29vZC1Zb3VuZ1xuXG5mdW5jdGlvbiBYRFBhcnNlcihkYXRhKSB7XG4gICAgZnVuY3Rpb24gcHJvY2Vzc0RhdGEoZGF0YSkge1xuICAgICAgICAvLyBTcGxpdCBpbnRvIHBhcnRzXG4gICAgICAgIGxldCBwYXJ0cyA9IGRhdGEuc3BsaXQoL14kXiQvZ20pLmZpbHRlcihzID0+IHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gNCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgcGFydHMgPSBkYXRhLnNwbGl0KC9cXHJcXG5cXHJcXG4vZykuZmlsdGVyKHMgPT4gKHMudHJpbSgpKSk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYXJ0c1tpXSA9IHBhcnRzW2ldLnJlcGxhY2UoL1xcclxcbi9nLCBcIlxcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYFRvbyBtYW55IHBhcnRzIC0gZXhwZWN0ZWQgNCwgZm91bmQgJHtwYXJ0cy5sZW5ndGh9YCk7XG4gICAgICAgIGNvbnN0IHJhd01ldGEgPSBwYXJ0c1swXTtcbiAgICAgICAgY29uc3QgcmF3R3JpZCA9IHBhcnRzWzFdO1xuICAgICAgICBjb25zdCByYXdBY3Jvc3MgPSBwYXJ0c1syXTtcbiAgICAgICAgY29uc3QgcmF3RG93biA9IHBhcnRzWzNdO1xuICAgICAgICBjb25zdCBtZXRhID0gcHJvY2Vzc01ldGEocmF3TWV0YSk7XG4gICAgICAgIGNvbnN0IGdyaWQgPSBwcm9jZXNzR3JpZChyYXdHcmlkKTtcbiAgICAgICAgY29uc3QgYWNyb3NzID0gcHJvY2Vzc0NsdWVzKHJhd0Fjcm9zcyk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBwcm9jZXNzQ2x1ZXMocmF3RG93bik7XG4gICAgICAgIHJldHVybiB7IG1ldGEsIGdyaWQsIGFjcm9zcywgZG93biwgcmF3R3JpZCwgcmF3QWNyb3NzLCByYXdEb3duLCByYXdNZXRhLCB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NNZXRhKHJhd01ldGEpIHtcbiAgICAgICAgY29uc3QgbWV0YUxpbmVzID0gcmF3TWV0YS5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGxldCBtZXRhID0ge307XG4gICAgICAgIG1ldGFMaW5lcy5mb3JFYWNoKG1ldGFMaW5lID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVQYXJ0cyA9IG1ldGFMaW5lLnNwbGl0KFwiOiBcIik7XG4gICAgICAgICAgICBtZXRhW2xpbmVQYXJ0c1swXV0gPSBsaW5lUGFydHNbMV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWV0YTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzR3JpZChyYXdHcmlkKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdHcmlkLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgcmVzdWx0W3hdID0gbGluZXNbeF0uc3BsaXQoXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQ2x1ZXMocmF3Q2x1ZXMpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0NsdWVzLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgY29uc3QgcmVnZXggPSAvKF4uXFxkKilcXC5cXHMoLiopXFxzflxccyguKikvO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoIWxpbmVzW3hdLnRyaW0oKSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IGxpbmVzW3hdLm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgQ291bGQgbm90IHBhcnNlIHF1ZXN0aW9uICR7bGluZXNbeF19YCk7XG4gICAgICAgICAgICAvLyBVbmVzY2FwZSBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uID0gcGFydHNbMl0ucmVwbGFjZSgvXFxcXC9nLCBcIlwiKTtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IHtcbiAgICAgICAgICAgICAgICBudW06IHBhcnRzWzFdLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxdWVzdGlvbixcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IHBhcnRzWzNdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NEYXRhKGRhdGEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFhEUGFyc2VyOyIsIi8qXG4qIEpYV29yZCBHcmlkIC0gQSBDcm9zc3dvcmQgU3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlxuKiBDb3B5cmlnaHQgMjAyMCBKYXNvbiBOb3J3b29kLVlvdW5nXG4qL1xuXG4vLyBDb2wsICAgUm93XG4vLyBYLCAgICAgWVxuLy8gd2lkdGgsIGhlaWdodFxuY2xhc3MgSlhXb3JkIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiSlhXb3JkLCBhIGNyb3Nzd29yZCBzeXN0ZW0gYnkgSmFzb24gTm9yd29vZC1Zb3VuZyA8amFzb25AMTBsYXllci5jb20+XCIpO1xuICAgICAgICBpZiAoIW9wdHMuY29udGFpbmVyKSB0aHJvdyBcIidjb250YWluZXInIHJlcXVpcmVkXCI7XG4gICAgICAgIGlmICghb3B0cy5kYXRhKSB0aHJvdyBcIidkYXRhJyByZXF1aXJlZFwiO1xuICAgICAgICAvLyBTZXQgc29tZSBkZWZhdWx0c1xuICAgICAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHsgXG4gICAgICAgICAgICB3aWR0aDogNTAwLCBcbiAgICAgICAgICAgIGhlaWdodDogNTAwLCBcbiAgICAgICAgICAgIG91dGVyQm9yZGVyV2lkdGg6IDEuNSwgXG4gICAgICAgICAgICBpbm5lckJvcmRlcldpZHRoOiAxLCBcbiAgICAgICAgICAgIG1hcmdpbjogMywgXG4gICAgICAgICAgICBvdXRlckJvcmRlckNvbG91cjogXCJibGFja1wiLCBcbiAgICAgICAgICAgIGlubmVyQm9yZGVyQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgZmlsbENvbG91cjogXCJibGFja1wiLCBcbiAgICAgICAgICAgIGNvbHM6IG9wdHMuZGF0YS5ncmlkLmxlbmd0aCxcbiAgICAgICAgICAgIHJvd3M6IG9wdHMuZGF0YS5ncmlkWzBdLmxlbmd0aCwgXG4gICAgICAgICAgICBmb250UmF0aW86IDAuNyxcbiAgICAgICAgICAgIG51bVJhdGlvOiAwLjMzLFxuICAgICAgICAgICAgc2VsZWN0Q2VsbENvbG91cjogXCIjZjdmNDU3XCIsXG4gICAgICAgICAgICBzZWxlY3RXb3JkQ29sb3VyOiBcIiM5Y2UwZmJcIixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvdXI6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIHJlc3RvcmVTdGF0ZTogZmFsc2VcbiAgICAgICAgfSwgb3B0cyk7XG4gICAgICAgIHRoaXMudWlkID0gK25ldyBEYXRlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB0aW1lX3Rha2VuOiAwLFxuICAgICAgICAgICAgYXV0b2NoZWNrOiBmYWxzZSxcbiAgICAgICAgICAgIGNoZWF0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmRvd25fcXVlc3Rpb25zID0gW107XG4gICAgICAgIC8vIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBkb2N1bWVudCB0byBsb2FkXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIHRoaXMub25Mb2FkLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8vIHRocm93RXZlbnQoZXZlbnROYW1lLCBkZXRhaWwpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2codGhpcy5ldmVudHMsIGV2ZW50TmFtZSk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnRzLnB1Ymxpc2goZXZlbnROYW1lLCBkZXRhaWwpO1xuICAgIC8vIH1cblxuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLm9wdHMuY29udGFpbmVyKTtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5lckVsZW1lbnQpIHRocm93IChgQ291bGQgbm90IGZpbmQgJHt0aGlzLm9wdHMuY29udGFpbmVyfWApO1xuICAgICAgICB0aGlzLnRvdGFsV2lkdGggPSB0aGlzLm9wdHMud2lkdGggKyAodGhpcy5vcHRzLm1hcmdpbiAqIDIpO1xuICAgICAgICB0aGlzLnRvdGFsSGVpZ2h0ID0gdGhpcy5vcHRzLmhlaWdodCArICh0aGlzLm9wdHMubWFyZ2luICogMik7XG4gICAgICAgIHRoaXMuY2VsbFdpZHRoID0gdGhpcy5vcHRzLndpZHRoIC8gdGhpcy5vcHRzLmNvbHM7XG4gICAgICAgIHRoaXMuY2VsbEhlaWdodCA9IHRoaXMub3B0cy5oZWlnaHQgLyB0aGlzLm9wdHMucm93cztcbiAgICAgICAgdGhpcy5mb250U2l6ZSA9IHRoaXMuY2VsbFdpZHRoICogdGhpcy5vcHRzLmZvbnRSYXRpbzsgLy8gRm9udCBzaXplIHglIHNpemUgb2YgY2VsbFxuICAgICAgICB0aGlzLmdyaWQgPSBbXTtcbiAgICAgICAgdGhpcy5ncmlkID0gdGhpcy5vcHRzLmRhdGEuZ3JpZFswXS5tYXAoKGNvbCwgaSkgPT4gdGhpcy5vcHRzLmRhdGEuZ3JpZC5tYXAocm93ID0+IHJvd1tpXSkpOyAvLyBUcmFuc3Bvc2Ugb3VyIG1hdHJpeFxuICAgICAgICB0aGlzLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuZ3JpZCk7IC8vIENhbGN1bGF0ZSBvdXIgaGFzaCByZXN1bHRcbiAgICAgICAgdGhpcy5zdG9yYWdlTmFtZSA9IGBqeHdvcmQtJHtNYXRoLmFicyh0aGlzLmhhc2gpfWA7XG4gICAgICAgIHRoaXMuZHJhd0xheW91dCgpO1xuICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XG4gICAgICAgIHRoaXMuZHJhd0JvcmRlcigpO1xuICAgICAgICB0aGlzLmRyYXdOdW1iZXJzKCk7XG4gICAgICAgIHRoaXMuZHJhd1F1ZXN0aW9ucygpO1xuICAgICAgICB0aGlzLnJlc3RvcmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckFjdGlvbnMoKTtcbiAgICAgICAgdGhpcy5zZXRGb2N1cygpO1xuICAgICAgICB0aGlzLmxpc3RlblF1ZXN0aW9ucygpO1xuICAgICAgICB0aGlzLnNldFRpbWVyKCk7XG4gICAgICAgIHRoaXMuZHJhd1RpbWVyKCk7XG4gICAgICAgIHRoaXMuY2hlY2tPdmVybGF5KCk7XG4gICAgfVxuXG4gICAgc2V0VGltZXIoKSB7XG4gICAgICAgIHNldEludGVydmFsKCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc19oaWRkZW4pIHJldHVybjtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29tcGxldGUpIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZS50aW1lX3Rha2VuKSB0aGlzLnN0YXRlLnRpbWVfdGFrZW4gPSAwO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS50aW1lX3Rha2VuKys7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5kcmF3VGltZXIoKTtcbiAgICAgICAgfSkuYmluZCh0aGlzKSwgMTAwMCk7XG4gICAgfVxuXG4gICAgZHJhd0xheW91dCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtY29udGFpbmVyXCIgaWQ9XCJqeHdvcmQtY29udGFpbmVyLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheSBqeHdvcmQtb3ZlcmxheS1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2VkLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcGF1c2VkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlvdXIgR2FtZSBpcyBDdXJyZW50bHkgUGF1c2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlc3VtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLWNvbXBsZXRlX292ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1jb21wbGV0ZV9vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbmdyYXR1bGF0aW9ucyEgWW91J3ZlIFdvbiFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktcmVzdGFydC0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uIGp4d29yZC1yZXNldFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvbiBqeHdvcmQtY2xvc2Utb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW1ldGFfb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW1ldGFfb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3RoaXMub3B0cy5kYXRhLm1ldGEuVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHsgT2JqZWN0LmtleXModGhpcy5vcHRzLmRhdGEubWV0YSkubWFwKGsgPT4gayA9PT0gXCJUaXRsZVwiID8gXCJcIiA6IGA8bGk+JHtrfTogJHt0aGlzLm9wdHMuZGF0YS5tZXRhW2tdfTwvbGk+YCApLmpvaW4oXCJcXG5cIikgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b24ganh3b3JkLWNsb3NlLW92ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXBsYXktYXJlYVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWdyaWQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxuYXYgY2xhc3M9XCJqeHdvcmQtY29udHJvbHNcIiByb2xlPVwibmF2aWdhdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1tZW51LXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cImp4d29yZC1tZW51XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkFib3V0IFRoaXMgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtbWV0YS0ke3RoaXMudWlkfVwiPjxsaT5BYm91dCBUaGlzIFB1enpsZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPjxocj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJUb2dnbGUgQXV0b2NoZWNrXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtYXV0b2NoZWNrLSR7dGhpcy51aWR9XCI+PGxpPkF1dG9jaGVjazwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJDaGVjayBTcXVhcmVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1jaGVja19zcXVhcmUtJHt0aGlzLnVpZH1cIj48bGk+Q2hlY2sgU3F1YXJlPC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkNoZWNrIFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWNoZWNrX3dvcmQtJHt0aGlzLnVpZH1cIj48bGk+Q2hlY2sgV29yZDwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJDaGVjayBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1jaGVja19wdXp6bGUtJHt0aGlzLnVpZH1cIj48bGk+Q2hlY2sgUHV6emxlPC9saT48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cImp4d29yZC1tZW51LWJyZWFrXCI+PGhyPjwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIlJlc2V0IFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvbiBqeHdvcmQtcmVzZXRcIiBpZD1cImp4d29yZC1yZXNldC0ke3RoaXMudWlkfVwiPjxsaT5SZXNldDwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1wYXVzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtcGF1c2UtdGV4dCBqeHdvcmQtc3Itb25seVwiPlBhdXNlPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC10aW1lclwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zdmctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2ZyBpZD0nanh3b3JkLXN2Zy0ke3RoaXMudWlkfScgY2xhc3M9J2p4d29yZC1zdmcnIHZpZXdCb3g9XCIwIDAgJHsgdGhpcy50b3RhbFdpZHRoIH0gJHsgdGhpcy50b3RhbEhlaWdodCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxnIGNsYXNzPVwiY2VsbC1ncm91cFwiIGlkPSdqeHdvcmQtZy1jb250YWluZXItJHt0aGlzLnVpZCB9Jz48L2c+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLWNvbnRhaW5lciBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWFycm93IGp4d29yZC1hcnJvdy1iYWNrXCIgaWQ9XCJqeHdvcmQtYXJyb3ctYmFjay0keyB0aGlzLnVpZCB9XCI+Jmxhbmc7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIiBpZD1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHsgdGhpcy51aWQgfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWZvcndhcmRcIiBpZD1cImp4d29yZC1hcnJvdy1mb3J3YXJkLSR7IHRoaXMudWlkIH1cIj4mcmFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZCBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUVwiPlE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIldcIj5XPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJFXCI+RTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUlwiPlI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlRcIj5UPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJZXCI+WTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiVVwiPlU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIklcIj5JPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJPXCI+TzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUFwiPlA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiQVwiPkE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlNcIj5TPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJEXCI+RDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRlwiPkY8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkdcIj5HPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJIXCI+SDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiSlwiPko8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIktcIj5LPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJMXCI+TDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJaXCI+WjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWFwiPlg8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkNcIj5DPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJWXCI+VjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiQlwiPkI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk5cIj5OPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJNXCI+TTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleSBqeHdvcmQta2V5LWJhY2tzcGFjZVwiIGRhdGEta2V5PVwiQkFDS1NQQUNFXCI+JmxBcnI7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb24tY29udGFpbmVyIGp4d29yZC1kZXNrdG9wLW9ubHlcIiBpZD1cImp4d29yZC1xdWVzdGlvbi1jb250YWluZXItJHsgdGhpcy51aWQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtYWNyb3NzXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7IHRoaXMudWlkIH1cIj48aDQ+QWNyb3NzPC9oND48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd25cIiBpZD1cImp4d29yZC1xdWVzdGlvbi1kb3duLSR7IHRoaXMudWlkIH1cIj48aDQ+RG93bjwvaDQ+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1zdmctJHsgdGhpcy51aWQgfWApO1xuICAgICAgICB0aGlzLmNlbGxHcm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtZy1jb250YWluZXItJHt0aGlzLnVpZCB9YCk7XG4gICAgfVxuXG4gICAgZHJhd0dyaWQoKSB7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsR3JvdXAuaW5uZXJIVE1MICs9IHRoaXMuZHJhd0NlbGwodGhpcy5ncmlkW2NvbF1bcm93XSwgY29sLCByb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0NlbGwobGV0dGVyLCBjb2wsIHJvdykge1xuICAgICAgICBjb25zdCB4ID0gKHRoaXMuY2VsbFdpZHRoICogY29sKSArIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGNvbnN0IHkgPSAodGhpcy5jZWxsSGVpZ2h0ICogcm93KSArIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jZWxsV2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuY2VsbEhlaWdodDtcbiAgICAgICAgY29uc3QgbGV0dGVyWCA9IHggKyAod2lkdGggLyAyKTtcbiAgICAgICAgY29uc3QgbGV0dGVyWSA9IHkgKyBoZWlnaHQgLSAoaGVpZ2h0ICogMC4xKTtcbiAgICAgICAgbGV0IGZpbGwgPSB0aGlzLm9wdHMuYmFja2dyb3VuZENvbG91cjtcbiAgICAgICAgbGV0IGlzQmxhbmsgPSBcImlzLWxldHRlclwiO1xuICAgICAgICBsZXQgY29udGFpbmVyQ2xhc3M9XCJpcy1sZXR0ZXItY29udGFpbmVyXCI7XG4gICAgICAgIGlmIChsZXR0ZXIgPT0gXCIjXCIpIHtcbiAgICAgICAgICAgIGZpbGwgPSB0aGlzLm9wdHMuZmlsbENvbG91cjtcbiAgICAgICAgICAgIGlzQmxhbmsgPSBcImlzLWJsYW5rXCI7XG4gICAgICAgICAgICBjb250YWluZXJDbGFzcz1cIlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgPGcgaWQ9XCJqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9XCIgY2xhc3M9XCJqeHdvcmQtY2VsbCAke2NvbnRhaW5lckNsYXNzfVwiIHN0eWxlPVwiei1pbmRleDogMjBcIj48cmVjdCBjbGFzcz1cImp4d29yZC1jZWxsLXJlY3QgJHtpc0JsYW5rfVwiIHJvbGU9XCJjZWxsXCIgdGFiaW5kZXg9XCItMVwiIGFyaWEtbGFiZWw9XCJcIiB4PVwiJHt4fVwiIHk9XCIke3l9XCIgd2lkdGg9XCIke3dpZHRofVwiIGhlaWdodD1cIiR7aGVpZ2h0fVwiIHN0cm9rZT1cIiR7dGhpcy5vcHRzLmlubmVyQm9yZGVyQ29sb3VyfVwiIHN0cm9rZS13aWR0aD1cIiR7dGhpcy5vcHRzLmlubmVyQm9yZGVyV2lkdGh9XCIgZmlsbD1cIiR7ZmlsbH1cIiBkYXRhLWNvbD1cIiR7Y29sfVwiIGRhdGEtcm93PVwiJHtyb3cgfVwiIGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIj48L3JlY3Q+PHRleHQgaWQ9XCJqeHdvcmQtbGV0dGVyLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31cIiB4PVwiJHsgbGV0dGVyWCB9XCIgeT1cIiR7IGxldHRlclkgfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZm9udC1zaXplPVwiJHsgdGhpcy5mb250U2l6ZSB9XCIgd2lkdGg9XCIkeyB3aWR0aCB9XCI+PC90ZXh0PjwvZz5gO1xuICAgIH1cblxuICAgIGRyYXdMZXR0ZXIobGV0dGVyLCBjb2wsIHJvdykge1xuICAgICAgICBjb25zdCBsZXR0ZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtbGV0dGVyLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31gKTtcbiAgICAgICAgY29uc3QgY29ycmVjdCA9IHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbY29sXVtyb3ddO1xuICAgICAgICBpZiAoY29ycmVjdCkge1xuICAgICAgICAgICAgbGV0dGVyRWwuY2xhc3NMaXN0LmFkZChcImp4d29yZC1sZXR0ZXItaXMtY29ycmVjdFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldHRlckVsLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtbGV0dGVyLWlzLWNvcnJlY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobGV0dGVyKTtcbiAgICAgICAgd2hpbGUobGV0dGVyRWwuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgbGV0dGVyRWwucmVtb3ZlQ2hpbGQobGV0dGVyRWwubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBsZXR0ZXJFbC5hcHBlbmRDaGlsZCh0eHQpO1xuICAgIH1cblxuICAgIGRyYXdUaW1lcigpIHtcbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGltZSh0KSB7XG4gICAgICAgICAgICB2YXIgc2VjX251bSA9IHBhcnNlSW50KHQsIDEwKTsgLy8gZG9uJ3QgZm9yZ2V0IHRoZSBzZWNvbmQgcGFyYW1cbiAgICAgICAgICAgIHZhciBob3VycyAgID0gTWF0aC5mbG9vcihzZWNfbnVtIC8gMzYwMCk7XG4gICAgICAgICAgICB2YXIgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY19udW0gLSAoaG91cnMgKiAzNjAwKSkgLyA2MCk7XG4gICAgICAgICAgICB2YXIgc2Vjb25kcyA9IHNlY19udW0gLSAoaG91cnMgKiAzNjAwKSAtIChtaW51dGVzICogNjApO1xuICAgICAgICBcbiAgICAgICAgICAgIGlmIChob3VycyAgIDwgMTApIHtob3VycyAgID0gXCIwXCIraG91cnM7fVxuICAgICAgICAgICAgaWYgKG1pbnV0ZXMgPCAxMCkge21pbnV0ZXMgPSBcIjBcIittaW51dGVzO31cbiAgICAgICAgICAgIGlmIChzZWNvbmRzIDwgMTApIHtzZWNvbmRzID0gXCIwXCIrc2Vjb25kczt9XG4gICAgICAgICAgICByZXR1cm4gaG91cnMgKyAnOicgKyBtaW51dGVzICsgJzonICsgc2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC10aW1lci0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aW1lckVsLmlubmVySFRNTCA9IGA8c3BhbiBpZD1cImp4d29yZC10aW1lci10ZXh0LSR7dGhpcy51aWR9XCI+JHtmb3JtYXRUaW1lKHRoaXMuc3RhdGUudGltZV90YWtlbil9PC9zcGFuPmA7XG4gICAgfVxuXG4gICAgaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB7XG4gICAgICAgIGlmICgoY29sID09PSAwKSAmJiAodGhpcy5ncmlkW2NvbF1bcm93XSAhPT0gXCIjXCIpICYmICh0aGlzLmdyaWRbY29sICsgMV1bcm93XSAhPT0gXCIjXCIpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghdGhpcy5ncmlkW2NvbCArIDFdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgoY29sID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbCAtIDFdW3Jvd10gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAocm93IDwgdGhpcy5ncmlkWzBdLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbF1bcm93ICsgMV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIGlzU3RhcnRPZkRvd24oY29sLCByb3cpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghdGhpcy5ncmlkW2NvbF1bcm93ICsgMV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKChyb3cgPT09IDApIHx8ICh0aGlzLmdyaWRbY29sXVtyb3cgLSAxXSA9PSBcIiNcIikpIHtcbiAgICAgICAgICAgIC8vIGlmIChjb2wgPCB0aGlzLmdyaWQubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vIGlmICh0aGlzLmdyaWRbY29sICsgMV1bcm93XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGRyYXdOdW1iZXJzKCkge1xuICAgICAgICAvLyBBIGNlbGwgZ2V0cyBhIG51bWJlciBpZiBpdCBoYXMgYSBibG9jayBvciBlZGdlIGFib3ZlIG9yIHRvIHRoZSBsZWZ0IG9mIGl0LCBhbmQgYSBibGFuayBsZXR0ZXIgdG8gdGhlIGJvdHRvbSBvciByaWdodCBvZiBpdCByZXNwZWN0aXZlbHlcbiAgICAgICAgLy8gUG9wdWxhdGUgYSBudW1iZXIgZ3JpZCB3aGlsZSB3ZSdyZSBhdCBpdFxuICAgICAgICBsZXQgbnVtID0gMTtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgZHJhd051bSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbCAhPT0gdGhpcy5vcHRzLmNvbHMgLSAxICYmIHRoaXMuZ3JpZFtjb2wrMV1bcm93XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdOdW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMub3B0cy5kYXRhLmFjcm9zcy5maW5kKHEgPT4gcS5udW0gPT09IGBBJHtudW19YClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1N0YXJ0T2ZEb3duKGNvbCwgcm93KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocm93ICE9PSB0aGlzLm9wdHMucm93cyAtIDEgJiYgdGhpcy5ncmlkW2NvbF1bcm93KzFdICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd051bSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvd25fcXVlc3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMub3B0cy5kYXRhLmRvd24uZmluZChxID0+IHEubnVtID09PSBgRCR7bnVtfWApXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBsZXQgZHJhd051bSA9IHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB8fCB0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpO1xuICAgICAgICAgICAgICAgIGlmIChkcmF3TnVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd051bWJlcihjb2wsIHJvdywgbnVtKyspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdOdW1iZXIoY29sLCByb3csIG51bSkge1xuICAgICAgICBjb25zdCBudW1Gb250U2l6ZSA9IHRoaXMuY2VsbFdpZHRoICogdGhpcy5vcHRzLm51bVJhdGlvO1xuICAgICAgICBjb25zdCB4ID0gKHRoaXMuY2VsbFdpZHRoICogY29sKSArIHRoaXMub3B0cy5tYXJnaW4gKyAyO1xuICAgICAgICBjb25zdCB5ID0gKHRoaXMuY2VsbEhlaWdodCAqIHJvdykgKyB0aGlzLm9wdHMubWFyZ2luICsgbnVtRm9udFNpemU7XG4gICAgICAgIGNvbnN0IGNlbGxFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0keyB0aGlzLnVpZCB9LSR7IGNvbCB9LSR7IHJvdyB9YCk7XG4gICAgICAgIFxuICAgICAgICBjZWxsRWwuaW5uZXJIVE1MICs9IGA8dGV4dCB4PVwiJHsgeCB9XCIgeT1cIiR7IHkgfVwiIHRleHQtYW5jaG9yPVwibGVmdFwiIGZvbnQtc2l6ZT1cIiR7IG51bUZvbnRTaXplIH1cIj4keyBudW0gfTwvdGV4dD5gXG4gICAgfVxuXG4gICAgZHJhd0JvcmRlcigpIHtcbiAgICAgICAgdGhpcy5jZWxsR3JvdXAuaW5uZXJIVE1MICs9IGA8cmVjdCB4PVwiJHt0aGlzLm9wdHMubWFyZ2lufVwiIHk9XCIke3RoaXMub3B0cy5tYXJnaW59XCIgd2lkdGg9XCIke3RoaXMub3B0cy53aWR0aH1cIiBoZWlnaHQ9XCIke3RoaXMub3B0cy5oZWlnaHR9XCIgc3Ryb2tlPVwiJHt0aGlzLm9wdHMub3V0ZXJCb3JkZXJDb2xvdXIgfVwiIHN0cm9rZS13aWR0aD1cIiR7dGhpcy5vcHRzLm91dGVyQm9yZGVyV2lkdGggfVwiIGZpbGw9XCJub25lXCI+YDtcbiAgICB9XG5cbiAgICBkcmF3UXVlc3Rpb25zKCkge1xuICAgICAgICBsZXQgYWNyb3NzID0gYDxvbCBpZD1cImp4d29yZC1xdWVzdGlvbnMtYWNyb3NzLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3RcIj5gXG4gICAgICAgIHRoaXMub3B0cy5kYXRhLmFjcm9zcy5mb3JFYWNoKHEgPT4ge1xuICAgICAgICAgICAgYWNyb3NzICs9IHRoaXMuZHJhd1F1ZXN0aW9uKHEpO1xuICAgICAgICB9KVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke3RoaXMudWlkfWApLmlubmVySFRNTCArPSBhY3Jvc3M7XG4gICAgICAgIGxldCBkb3duID0gYDxvbCBpZD1cImp4d29yZC1xdWVzdGlvbnMtZG93bi0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+YFxuICAgICAgICB0aGlzLm9wdHMuZGF0YS5kb3duLmZvckVhY2gocSA9PiB7XG4gICAgICAgICAgICBkb3duICs9IHRoaXMuZHJhd1F1ZXN0aW9uKHEpO1xuICAgICAgICB9KVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9uLWRvd24tJHt0aGlzLnVpZH1gKS5pbm5lckhUTUwgKz0gZG93bjtcbiAgICB9XG5cbiAgICBkcmF3UXVlc3Rpb24ocSkge1xuICAgICAgICByZXR1cm4gYDxsaSBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7cS5udW19LSR7dGhpcy51aWR9XCIgZGF0YS1xPVwiJHtxLm51bX1cIj48c3BhbiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLW51bVwiPiR7cS5udW0ucmVwbGFjZSgvXlxcRC8sIFwiXCIpfTwvc3Bhbj48c3BhbiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLXF1ZXN0aW9uXCI+JHtxLnF1ZXN0aW9ufTwvc3Bhbj48L2xpPmA7XG4gICAgfVxuXG4gICAgc2hvd092ZXJsYXkoc3RhdGUgPSBcInBhdXNlZFwiKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLXBhdXNlZFwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLWNvbXBsZXRlX292ZXJsYXlcIikuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1tZXRhX292ZXJsYXlcIikuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBpZiAoc3RhdGUgPT09IFwicGF1c2VkXCIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLXBhdXNlZFwiKS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLWNvbXBsZXRlX292ZXJsYXlcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gXCJtZXRhXCIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1ldGFfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtb3ZlcmxheS1zaG93XCIpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLW92ZXJsYXktaGlkZVwiKTtcbiAgICB9XG5cbiAgICBoaWRlT3ZlcmxheSgpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1vdmVybGF5LWhpZGVcIik7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtb3ZlcmxheS1zaG93XCIpO1xuICAgIH1cblxuICAgIGNoZWNrT3ZlcmxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dPdmVybGF5KFwicGF1c2VkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlT3ZlcmxheSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0U3RhdGUoKSB7XG4gICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDsgLy8gMCA9IGFjcm9zcywgMSA9IGRvd25cbiAgICAgICAgdGhpcy5zdGF0ZS5jb21wbGV0ZSA9IGZhbHNlOyAvLyBBcmUgd2UgZG9uZSB5ZXQ/XG4gICAgICAgIHRoaXMuc3RhdGUuaGludHMgPSBmYWxzZTsgLy8gSGFkIGFueSBoZWxwP1xuICAgICAgICB0aGlzLnN0YXRlLnRpbWVfdGFrZW4gPSAwOyAvLyBIb3cgbG9uZyBoYXZlIHdlIGJlZW4gcGxheWluZz9cbiAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaCA9IG5ldyBBcnJheSh0aGlzLm9wdHMuY29scykuZmlsbChcIlwiKS5tYXAoKCkgPT4gbmV3IEFycmF5KHRoaXMub3B0cy5yb3dzKS5maWxsKFwiXCIpKTsgLy8gQSBtYXRyaXggZmlsbGVkIHdpdGggZW1wdHkgY2hhcnNcbiAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7IC8vIEZpbGwgaW4gdGhlICMnc1xuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddID0gXCIjXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5zdGF0ZS5ncmFwaCk7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2NhbGFycyAoZm9yIGFjcm9zcyBhbmQgZG93bikgdGhhdCB3ZSB1c2Ugd2hlbiBkZWNpZGluZyB3aGljaCBjZWxsIHRvIGdvIHRvIGluIHRoZSBldmVudCB0aGF0IGEgbGV0dGVyIGlzIHR5cGVkLCB0YWIgaXMgcHJlc3NlZCBldGMuIFxuICAgICAgICAvLyBEb3duIFNjYWxhclxuICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24gPSBbXTtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgcXVlc3Rpb24gb2YgdGhpcy5kb3duX3F1ZXN0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sLFxuICAgICAgICAgICAgICAgIHJvdzogcXVlc3Rpb24ucm93LFxuICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICBzdGFydE9mV29yZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICBxOiBxdWVzdGlvbi5udW0sXG4gICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBxdWVzdGlvbi5kYXRhLmFuc3dlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93bi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgICAgIHJvdzogcXVlc3Rpb24ucm93ICsgaSxcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mV29yZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgICAgICBxOiBxdWVzdGlvbi5udW0sXG4gICAgICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuc2NhbGFyRG93bik7XG4gICAgICAgIC8vIEFjcm9zcyBTY2FsYXJcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MgPSBbXTtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCBxdWVzdGlvbiBvZiB0aGlzLmFjcm9zc19xdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sLFxuICAgICAgICAgICAgICAgIHJvdzogcXVlc3Rpb24ucm93LFxuICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICBzdGFydE9mV29yZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICBxOiBxdWVzdGlvbi5udW0sXG4gICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBxdWVzdGlvbi5kYXRhLmFuc3dlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCArIGksXG4gICAgICAgICAgICAgICAgICAgIHJvdzogcXVlc3Rpb24ucm93LFxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2codGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MpO1xuICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsID0gW3RoaXMuc3RhdGUuc2NhbGFyQWNyb3NzWzBdLmNvbCwgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3NbMF0ucm93XTsgLy8gU3RhcnQgYXQgZmlyc3QgYWNyb3NzXG4gICAgICAgIC8vIENvcnJlY3QgZ3JpZFxuICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkID0gbmV3IEFycmF5KHRoaXMub3B0cy5jb2xzKS5maWxsKGZhbHNlKS5tYXAoKCkgPT4gbmV3IEFycmF5KHRoaXMub3B0cy5yb3dzKS5maWxsKGZhbHNlKSk7XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTYXZpbmcgU3RhdGVcIik7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnN0b3JhZ2VOYW1lLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlKSk7XG4gICAgfVxuXG4gICAgcmVzdG9yZVN0YXRlKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxldHRlciA9IHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXV0b2NoZWNrKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlUmVzdG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiU3RhdGUgUmVzdG9yZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWxjSGFzaChtYXRyaXgpIHtcbiAgICAgICAgbGV0IHMgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHMgKz0gbWF0cml4W2NvbF1bcm93XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaGFzaCA9IDAsIGksIGNocjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjaHIgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgICAgICAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGhhc2gsIHMpO1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICBtYXJrQ2VsbHMoKSB7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWNlbGwtcmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGFsbENlbGxzLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLmJhY2tncm91bmRDb2xvdXIpO1xuICAgICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICAgIH0pXG4gICAgICAgIGxldCBjdXJyZW50Q2VsbFJlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIH0tJHsgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSB9ID4gcmVjdGApO1xuICAgICAgICBjdXJyZW50Q2VsbFJlY3Quc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0Q2VsbENvbG91cik7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAxKTtcbiAgICAgICAgbGV0IG1hcmtlZENlbGwgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5jb2xzOyBjb3VudCArKykge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAtIDE7IGNvdW50ID49IDA7IGNvdW50LS0pIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y291bnR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXX0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5yb3dzOyBjb3VudCsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdfS0ke2NvdW50fSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhpZ2hsaWdodFF1ZXN0aW9uKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQWN0aW9ucygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHRoaXMudmlzaWJpbGl0eUNoYW5nZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJyZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgZm9yKGxldCBjZWxsIG9mIGFsbENlbGxzKSB7XG4gICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNhdGNoQ2VsbENsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuY2F0Y2hLZXlQcmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hcnJvdy1mb3J3YXJkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubW92ZVRvTmV4dFdvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctYmFjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb1ByZXZpb3VzV29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmp4d29yZC1yZXNldGApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2VsZi5yZXNldC5iaW5kKHNlbGYpKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtbWV0YS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNob3dNZXRhLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnRvZ2dsZUF1dG9jaGVjay5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hlY2tXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3NxdWFyZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrU3F1YXJlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3B1enpsZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrUHV6emxlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXNpbmdsZS1xdWVzdGlvbi0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoYW5nZURpcmVjdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgY29uc3Qga2V5cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWtleVwiKTtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAgICAgICAga2V5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmtleUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wYXVzZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnBsYXkuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtY2xvc2Utb3ZlcmxheWApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYuaGlkZU92ZXJsYXkuYmluZChzZWxmKSkpO1xuICAgICAgICBcbiAgICB9XG5cbiAgICB2aXNpYmlsaXR5Q2hhbmdlZChlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSk7XG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLmlzX2hpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBhdXNlXCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBsYXlcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLXBsYXlcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJQbGF5XCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHNob3dNZXRhKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNob3dPdmVybGF5KFwibWV0YVwiKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKVxuICAgIH1cblxuICAgIGNhdGNoQ2VsbENsaWNrKGUpIHtcbiAgICAgICAgY29uc3QgY29sID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQuY29sKTtcbiAgICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQucm93KTtcbiAgICAgICAgaWYgKChjb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0pICYmIChyb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKSB7IC8vIENsaWNrZWQgb24gYWxyZWFkeSBzZWxlY3RlZCBjZWxsXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSByb3c7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0Q2VsbCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50U2NhbGFySW5kZXggPSBzY2FsYXIuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgaXRlbS5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoY3VycmVudFNjYWxhckluZGV4IDwgc2NhbGFyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0uY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltjdXJyZW50U2NhbGFySW5kZXggKyAxXS5yb3c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgdHlwZUxldHRlcihsZXR0ZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNMZXR0ZXIgPSAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPSBsZXR0ZXI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pXG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAvLyB0aGlzLmNoZWNrSGludCgpO1xuICAgICAgICB0aGlzLmNoZWNrV2luKCk7XG4gICAgICAgIGlmICghaGFzTGV0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhdGNoS2V5UHJlc3MoZSkge1xuICAgICAgICBjb25zdCBrZXljb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgaWYgKGUubWV0YUtleSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludGFibGUgPSAoa2V5Y29kZSA+IDY0ICYmIGtleWNvZGUgPCA5MSk7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkgcmV0dXJuOyAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBwYXVzZWRcbiAgICAgICAgaWYgKHByaW50YWJsZSAmJiAhdGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbGV0dGVyID0gZS5rZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMudHlwZUxldHRlcihsZXR0ZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDgpIHsgLy8gQmFja3NwYWNlXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuY29tcGxldGUpIHsgLy8gRG9uJ3QgYWxsb3cgY2hhbmdlcyBpZiB3ZSd2ZSBmaW5pc2hlZCBvdXIgcHV6emxlXG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09IDMyKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIGlmICgoa2V5Y29kZSA9PT0gOSkgfHwgKGtleWNvZGUgPT09IDEzKSkgeyAvLyBUYWIgb3IgRW50ZXJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0V29yZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM3KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzgpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVVwKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNDApIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZURvd24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB4LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVVcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB5LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3ldICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4IDwgdGhpcy5vcHRzLnJvd3MgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHgrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbeF1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggKzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4ICsxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW2luZGV4ICsxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHkgPCB0aGlzLm9wdHMuY29scyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRTY2FsYXJzKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChhY3Jvc3MpIHtcbiAgICAgICAgICAgIGFjcm9zcy5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgaWYgKGRvd24pIHtcbiAgICAgICAgICAgIGRvd24ubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dG9jaGVjaykge1xuICAgICAgICAgICAgaWYgKGxldHRlciA9PT0gdGhpcy5ncmlkW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgIGlmIChkb3duKSBkb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChhY3Jvc3MpIGFjcm9zcy5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0KCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGN1cnNvcik7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh4LCBzY2FsYXJbeF0pO1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNMZXR0ZXIoKSB7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgbGV0IGN1cnNvciA9IGN1cnJlbnRDZWxsLmluZGV4IC0gMTtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvcjsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbeF0uY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbeF0ucm93O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSB7XG4gICAgICAgICAgICAvLyBNb3ZlIGJhY2sgYW5kIHRoZW4gZGVsZXRlXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGV0dGVyKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihcIlwiLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSA9IFwiXCI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhcIlwiLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgXG4gICAgbW92ZVRvTmV4dFdvcmQoKSB7XG4gICAgICAgIGxldCBuZXh0Q2VsbCA9IG51bGw7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgb3RoZXJTY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHsgLy8gRG93blxuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3Vyc29yID0gc2NhbGFyLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKTtcbiAgICAgICAgaWYgKCFjdXJzb3IpIHJldHVybjtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvci5pbmRleCArIDE7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwgJiYgbmV4dENlbGwubGV0dGVyICE9PSBcIlwiKSB7IC8vIEZpcnN0IGxldHRlciBpcyBub3QgYmxhbmssIFxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IG5leHRDZWxsLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgY29uc3QgbmV4dEJsYW5rID0gb3RoZXJTY2FsYXIuZmluZChjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0QmxhbmsuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Qmxhbmsucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBmaW5kU3RhcnRPZkN1cnJlbnRXb3JkKCkge1xuICAgICAgICBsZXQgc2NhbGFyO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3Vyc29yID0gc2NhbGFyLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKTtcbiAgICAgICAgLy8gU3RhcnQgb2YgY3VycmVudCB3b3JkXG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSBudWxsO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4OyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0T2ZDdXJyZW50V29yZCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhcnRPZkN1cnJlbnRXb3JkO1xuICAgIH1cblxuICAgIG1vdmVUb1ByZXZpb3VzV29yZCgpIHtcbiAgICAgICAgZnVuY3Rpb24gZmluZExhc3QoYXJyYXksIHByZWRpY2F0ZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IGFycmF5W2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE1vdmUgdG8gZmlzdCBsZXR0ZXIgb2YgY3VycmVudCB3b3JkLCB0aGVuIHNlYXJjaCBiYWNrd2FyZCBmb3IgYSBmcmVlIHNwYWNlLCB0aGVuIG1vdmUgdG8gdGhlIHN0YXJ0IG9mIHRoYXQgd29yZCwgdGhlbiBtb3ZlIGZvcndhcmQgdW50aWwgYSBmcmVlIHNwYWNlXG4gICAgICAgIGxldCBuZXh0Q2VsbCA9IG51bGw7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgb3RoZXJTY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHsgLy8gRG93blxuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3Vyc29yID0gc2NhbGFyLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKTtcbiAgICAgICAgLy8gU3RhcnQgb2YgY3VycmVudCB3b3JkXG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSB0aGlzLnN0YXJ0T2ZDdXJyZW50V29yZCgpO1xuICAgICAgICBsZXQgYmxhbmtTcGFjZSA9IG51bGw7XG4gICAgICAgIC8vIEtlZXAgZ29pbmcgYmFjayB1bnRpbCB3ZSBoaXQgYSBibGFuayBzcGFjZVxuICAgICAgICBpZiAoc3RhcnRPZkN1cnJlbnRXb3JkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gc3RhcnRPZkN1cnJlbnRXb3JkLmluZGV4IC0gMTsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBibGFua1NwYWNlID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0T2ZMYXN0V29yZCA9IG51bGw7XG4gICAgICAgIGlmIChibGFua1NwYWNlKSB7XG4gICAgICAgICAgICAvLyBOb3cgZmluZCBzdGFydCBvZiB0aGlzIHdvcmRcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBibGFua1NwYWNlLmluZGV4OyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZkxhc3RXb3JkID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0T2ZMYXN0V29yZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHN0YXJ0T2ZMYXN0V29yZC5pbmRleDsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgY29uc3QgbmV4dEJsYW5rID0gZmluZExhc3Qob3RoZXJTY2FsYXIsIGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0T2ZXb3JkID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gbmV4dEJsYW5rLmluZGV4OyB4ID49IDA7IHgtLSkgeyAvLyBNb3ZlIHRvIHN0YXJ0IG9mIHdvcmRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG90aGVyU2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydE9mV29yZCA9IG90aGVyU2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHN0YXJ0T2ZXb3JkLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc3RhcnRPZldvcmQucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRGb2N1cygpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY2VsbC1yZWN0XCIpLmZvY3VzKCk7XG4gICAgICAgIC8vIHRoaXMuY29udGFpbmVyRWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIGNoZWNrV2luKCkge1xuICAgICAgICBsZXQgd2luID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmdyaWQubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5ncmlkW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gXCIjXCIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGxldCBzY2FsYXJBY3Jvc3MgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKHNjYWxhciA9PiBzY2FsYXIucm93ID09IHkgJiYgc2NhbGFyLmNvbCA9PSB4KTtcbiAgICAgICAgICAgICAgICBsZXQgc2NhbGFyRG93biA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKHNjYWxhciA9PiBzY2FsYXIucm93ID09IHkgJiYgc2NhbGFyLmNvbCA9PSB4KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSB0aGlzLnN0YXRlLmdyYXBoW3hdW3ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJBY3Jvc3MpIHNjYWxhckFjcm9zcy5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhckRvd24pIHNjYWxhckRvd24uY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhckFjcm9zcykgc2NhbGFyQWNyb3NzLmNvcnJlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhckRvd24pIHNjYWxhckRvd24uY29ycmVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB3aW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtb3ZlcmxheS10aXRsZVwiKS5pbm5lckhUTUwgPSBcIllvdSBXaW4hXCI7XG4gICAgICAgICAgICB0aGlzLnNob3dPdmVybGF5KFwiY29tcGxldGVcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGhpZ2hsaWdodFF1ZXN0aW9uKGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBkID0gbnVsbDtcbiAgICAgICAgbGV0IGNlbGwgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICAgICAgZCA9IFwiQVwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgICAgIGQgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY2VsbCkgcmV0dXJuO1xuICAgICAgICBsZXQgcSA9IGNlbGwucTtcbiAgICAgICAgdmFyIGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS5hY3RpdmVcIik7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtcywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25FbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7ZH0ke3F9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIGlmICghcXVlc3Rpb25FbCkgcmV0dXJuO1xuICAgICAgICBxdWVzdGlvbkVsLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh7IHF1ZXN0aW9uRWwgfSk7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSAgY29uc29sZS5sb2coYCNqeHdvcmQtcXVlc3Rpb24tJHtkfS0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLmVuc3VyZVZpc2liaWxpdHkocXVlc3Rpb25FbCwgcXVlc3Rpb25FbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQpO1xuICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZH0ke2NlbGwucX1gKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtc2luZ2xlLXF1ZXN0aW9uXCIpLmlubmVySFRNTCA9IGAke3F1ZXN0aW9uLnF1ZXN0aW9ufWA7XG4gICAgfVxuXG4gICAgZW5zdXJlVmlzaWJpbGl0eShlbCwgY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyUmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKHJlY3QuYm90dG9tID4gY29udGFpbmVyUmVjdC5ib3R0b20pIHtcbiAgICAgICAgICAgIGVsLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVjdC50b3AgPCBjb250YWluZXJSZWN0LnRvcCkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsaXN0ZW5RdWVzdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW1cIik7XG4gICAgICAgIGZvcihsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICBxdWVzdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbGlja1F1ZXN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xpY2tRdWVzdGlvbihlKSB7XG4gICAgICAgIGNvbnN0IHEgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5xO1xuICAgICAgICBjb25zdCBkaXIgPSBxWzBdO1xuICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIocS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKGRpciA9PT0gXCJBXCIpIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwucSA9PT0gbnVtKSB7XG4gICAgICAgICAgICAgICAgLy8gTW92ZSB0byB0aGUgZmlyc3QgZW1wdHkgbGV0dGVyIGluIGEgd29yZC4gSWYgdGhlcmUgaXNuJ3QgYW4gZW1wdHkgbGV0dGVyLCBtb3ZlIHRvIHN0YXJ0IG9mIHdvcmQuXG4gICAgICAgICAgICAgICAgbGV0IGVtcHR5bGV0dGVycyA9IHNjYWxhci5maWx0ZXIod29yZGNlbGwgPT4gd29yZGNlbGwucSA9PT0gbnVtICYmIHdvcmRjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5bGV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGVtcHR5bGV0dGVyc1swXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBlbXB0eWxldHRlcnNbMF0ucm93O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBjZWxsLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGNlbGwucm93O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHNldEFyaWEoKSB7XG4gICAgICAgIGxldCB0aCA9IG51bSA9PiB7XG4gICAgICAgICAgICBpZiAobnVtID09PSAxKSByZXR1cm4gXCIxc3RcIjtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDIpIHJldHVybiBcIjJuZFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMykgcmV0dXJuIFwiM3JkXCI7XG4gICAgICAgICAgICByZXR1cm4gYCR7bnVtfXRoYDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZnVsbHN0b3AgPSBzID0+IHtcbiAgICAgICAgICAgIGlmIChzLm1hdGNoKC9bXFwuXFw/XSQvKSkgcmV0dXJuIHM7XG4gICAgICAgICAgICByZXR1cm4gYCR7c30uYDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IGRpckxldHRlciA9IG51bGw7XG4gICAgICAgIGxldCBkYXRhID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBkaXJMZXR0ZXIgPVwiQVwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGRpckxldHRlciA9IFwiRFwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxldHRlckNvdW50ID0gMTtcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBzY2FsYXIpIHtcbiAgICAgICAgICAgIGlmIChjZWxsLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgbGV0dGVyQ291bnQgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHF1ZXN0aW9uID0gZGF0YS5maW5kKHEgPT4gcS5udW0gPT09IGAke2RpckxldHRlcn0ke2NlbGwucX1gKTtcbiAgICAgICAgICAgIGlmICghcXVlc3Rpb24pIGNvbnRpbnVlO1xuICAgICAgICAgICAgbGV0IHdvcmRMZW5ndGggPSBxdWVzdGlvbi5xdWVzdGlvbi5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgcyA9IGAke3F1ZXN0aW9uLm51bX0uICR7ZnVsbHN0b3AocXVlc3Rpb24ucXVlc3Rpb24pfSAke3dvcmRMZW5ndGh9IGxldHRlcnMsICR7dGgobGV0dGVyQ291bnQpfSBsZXR0ZXIuYFxuICAgICAgICAgICAgbGV0dGVyQ291bnQrKztcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NlbGwuY29sfS0ke2NlbGwucm93fSA+IC5qeHdvcmQtY2VsbC1yZWN0YCkgLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgY2hlYXRlZCA9IHRoaXMuc3RhdGUuY2hlYXRlZDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSgpO1xuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSBjaGVhdGVkOyAvLyBOaWNlIHRyeSFcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5oaWRlT3ZlcmxheSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoYW5nZURpcmVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAhdGhpcy5zdGF0ZS5kaXJlY3Rpb247XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuXG4gICAgfVxuXG4gICAga2V5Q2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGVsID0gZS50YXJnZXQ7XG4gICAgICAgIGxldCBsZXR0ZXIgPSBlbC5kYXRhc2V0LmtleTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgbGV0dGVyIH0pO1xuICAgICAgICBpZiAobGV0dGVyID09PSBcIkJBQ0tTUEFDRVwiKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50eXBlTGV0dGVyKGxldHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1RpbGUoeCwgeSkge1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSBcIiNcIikgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt4XVt5XSkgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSB0aGlzLnN0YXRlLmdyYXBoW3hdW3ldKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdW3ldID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0xldHRlcih0aGlzLmdyaWRbeF1beV0sIHgsIHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tTcXVhcmUoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuY2hlY2tUaWxlKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrV29yZChlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBcIlwiO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSB0aGlzLmZpbmRTdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgdGhpcy5jaGVja1RpbGUoc3RhcnRPZkN1cnJlbnRXb3JkLmNvbCwgc3RhcnRPZkN1cnJlbnRXb3JkLnJvdyk7XG4gICAgICAgIGxldCBpID0gc3RhcnRPZkN1cnJlbnRXb3JkLmluZGV4ICsgMTtcbiAgICAgICAgd2hpbGUoc2NhbGFyW2ldICYmICFzY2FsYXJbaV0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjYWxhcltpXSk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVGlsZShzY2FsYXJbaV0uY29sLCBzY2FsYXJbaV0ucm93KTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrUHV6emxlKGUpIHtcbiAgICAgICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZm9yKGxldCB4ID0gMDsgeCA8IHRoaXMuc3RhdGUuY29ycmVjdEdyaWQubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvcihsZXQgeSA9IDA7IHkgPCB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja1RpbGUoeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEF1dG9jaGVjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2sgJmNoZWNrO1wiO1xuICAgICAgICAgICAgdGhpcy5jaGVja1B1enpsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH0gPiBsaWApLmlubmVySFRNTCA9IFwiQXV0b2NoZWNrXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGVBdXRvY2hlY2soZSkgeyAvL1RPRE9cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN0YXRlLmF1dG9jaGVjayA9ICF0aGlzLnN0YXRlLmF1dG9jaGVjaztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0QXV0b2NoZWNrKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2xvc2VNZW51KCkge1xuICAgICAgICBjb25zdCBpbnB1dEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWVudS10b2dnbGUgaW5wdXQ6Y2hlY2tlZFwiKTtcbiAgICAgICAgaWYgKGlucHV0RWwpIGlucHV0RWwuY2hlY2tlZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSlhXb3JkOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgSlhXb3JkIGZyb20gXCIuL2pzL2p4d29yZC1ncmlkXCI7XG5pbXBvcnQgeGRwYXJzZXIgZnJvbSBcInhkLWNyb3Nzd29yZC1wYXJzZXJcIjtcbnJlcXVpcmUoXCIuL2Nzcy9qeHdvcmQubGVzc1wiKTtcblxuYXN5bmMgZnVuY3Rpb24gX2FkZF9jcm9zc3dvcmQoY3Jvc3N3b3JkX2RhdGEsIGNvbnRhaW5lcl9pZCwgZGVidWcgPSBmYWxzZSkge1xuICAgIGlmICghY3Jvc3N3b3JkX2RhdGEpIHJldHVybjtcbiAgICBjb25zdCB1bmVuY29kZWRfZGF0YSA9IGF0b2IoY3Jvc3N3b3JkX2RhdGEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB4ZHBhcnNlcih1bmVuY29kZWRfZGF0YSk7XG4gICAgd2luZG93Lmp4d29yZCA9IG5ldyBKWFdvcmQoeyBcbiAgICAgICAgY29udGFpbmVyOiBgIyR7Y29udGFpbmVyX2lkfWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGRlYnVnXG4gICAgfSk7XG59XG53aW5kb3cuYWRkX2Nyb3Nzd29yZCA9IF9hZGRfY3Jvc3N3b3JkOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==