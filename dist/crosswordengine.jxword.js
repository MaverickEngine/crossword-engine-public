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
            autocheck: false
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
                        <div class="jxword-overlay-title">
                            Your Game is Currently Paused
                        </div>
                        <div id="jxword-overlay-resume-${this.uid}" class="jxword-overlay-button">
                            Resume
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
                                <a href="#" aria-label="Puzzle Info" class="jxword-button" id="jxword-info-${this.uid}"><li>Puzzle Info</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" aria-label="Toggle Autocheck" class="jxword-button" id="jxword-autocheck-${this.uid}"><li>Autocheck</li></a>
                                <a href="#" aria-label="Check Square" class="jxword-button" id="jxword-check_square-${this.uid}"><li>Check Square</li></a>
                                <a href="#" aria-label="Check Puzzle" class="jxword-button" id="jxword-check_word-${this.uid}"><li>Check Word</li></a>
                                <a href="#" aria-label="Check Puzzle" class="jxword-button" id="jxword-check_puzzle-${this.uid}"><li>Check Puzzle</li></a>
                                <li class="jxword-menu-break"><hr></li>
                                <a href="#" aria-label="Reset Puzzle" class="jxword-button" id="jxword-reset-${this.uid}"><li>Reset</li></a>
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
        this.state.time_taken = 9100; // How long have we been playing?
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

    moveToNextCell() {
        let scalar;
        if (this.state.direction) {
            scalar = this.state.scalarDown;
        } else {
            scalar = this.state.scalarAcross;
        }
        const currentScalarIndex = scalar.findIndex(item => item.col === this.state.currentCell[0] && item.row === this.state.currentCell[1]);
        if (currentScalarIndex < scalar.length) {
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
            this.showOverlay();
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
        }
        this.setAutocheck();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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b0M7QUFDcEM7QUFDQTtBQUNBO0FBQ0EsVUFBVSwwQkFBMEI7QUFDcEM7QUFDQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVSxnREFBZ0Q7QUFDMUQ7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUF1QixtQ0FBbUM7QUFDMUQsMkJBQTJCLHNDQUFzQztBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx3REFBd0QsVUFBVSxxQ0FBcUM7QUFDdkc7QUFDQSxVQUFVO0FBQ1Ysd0RBQXdELFVBQVU7QUFDbEU7QUFDQTs7QUFFQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlFQUFlLE1BQU07Ozs7OztVQ3Z1Q3JCO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7QUNOc0M7QUFDSztBQUMzQyxtQkFBTyxDQUFDLGdEQUFtQjs7QUFFM0I7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDBEQUFRO0FBQy9CLHdCQUF3Qix1REFBTTtBQUM5Qix1QkFBdUIsYUFBYTtBQUNwQztBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0Esc0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2Nzcy9qeHdvcmQubGVzcz9jOWJkIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMveGQtY3Jvc3N3b3JkLXBhcnNlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2pzL2p4d29yZC1ncmlkLmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZXh0cmFjdGVkIGJ5IG1pbmktY3NzLWV4dHJhY3QtcGx1Z2luXG5leHBvcnQge307IiwiLy8gQSBsaWJyYXJ5IGZvciBjb252ZXJ0aW5nIC54ZCBDcm9zc3dvcmQgZGF0YSB0byBKU09OIChhcyBkZWZpbmVkIGJ5IFNhdWwgUHdhbnNvbiAtIGh0dHA6Ly94ZC5zYXVsLnB3KSB3cml0dGVuIGJ5IEphc29uIE5vcndvb2QtWW91bmdcblxuZnVuY3Rpb24gWERQYXJzZXIoZGF0YSkge1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhKGRhdGEpIHtcbiAgICAgICAgLy8gU3BsaXQgaW50byBwYXJ0c1xuICAgICAgICBsZXQgcGFydHMgPSBkYXRhLnNwbGl0KC9eJF4kL2dtKS5maWx0ZXIocyA9PiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgIHBhcnRzID0gZGF0YS5zcGxpdCgvXFxyXFxuXFxyXFxuL2cpLmZpbHRlcihzID0+IChzLnRyaW0oKSkpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBUb28gbWFueSBwYXJ0cyAtIGV4cGVjdGVkIDQsIGZvdW5kICR7cGFydHMubGVuZ3RofWApO1xuICAgICAgICBjb25zdCByYXdNZXRhID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IHJhd0dyaWQgPSBwYXJ0c1sxXTtcbiAgICAgICAgY29uc3QgcmF3QWNyb3NzID0gcGFydHNbMl07XG4gICAgICAgIGNvbnN0IHJhd0Rvd24gPSBwYXJ0c1szXTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHByb2Nlc3NNZXRhKHJhd01ldGEpO1xuICAgICAgICBjb25zdCBncmlkID0gcHJvY2Vzc0dyaWQocmF3R3JpZCk7XG4gICAgICAgIGNvbnN0IGFjcm9zcyA9IHByb2Nlc3NDbHVlcyhyYXdBY3Jvc3MpO1xuICAgICAgICBjb25zdCBkb3duID0gcHJvY2Vzc0NsdWVzKHJhd0Rvd24pO1xuICAgICAgICByZXR1cm4geyBtZXRhLCBncmlkLCBhY3Jvc3MsIGRvd24sIHJhd0dyaWQsIHJhd0Fjcm9zcywgcmF3RG93biwgcmF3TWV0YSwgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzTWV0YShyYXdNZXRhKSB7XG4gICAgICAgIGNvbnN0IG1ldGFMaW5lcyA9IHJhd01ldGEuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBsZXQgbWV0YSA9IHt9O1xuICAgICAgICBtZXRhTGluZXMuZm9yRWFjaChtZXRhTGluZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lUGFydHMgPSBtZXRhTGluZS5zcGxpdChcIjogXCIpO1xuICAgICAgICAgICAgbWV0YVtsaW5lUGFydHNbMF1dID0gbGluZVBhcnRzWzFdO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1ldGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0dyaWQocmF3R3JpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3R3JpZC5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IGxpbmVzW3hdLnNwbGl0KFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0NsdWVzKHJhd0NsdWVzKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdDbHVlcy5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLyheLlxcZCopXFwuXFxzKC4qKVxcc35cXHMoLiopLztcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKCFsaW5lc1t4XS50cmltKCkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBsaW5lc1t4XS5tYXRjaChyZWdleCk7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYENvdWxkIG5vdCBwYXJzZSBxdWVzdGlvbiAke2xpbmVzW3hdfWApO1xuICAgICAgICAgICAgLy8gVW5lc2NhcGUgc3RyaW5nXG4gICAgICAgICAgICBjb25zdCBxdWVzdGlvbiA9IHBhcnRzWzJdLnJlcGxhY2UoL1xcXFwvZywgXCJcIik7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSB7XG4gICAgICAgICAgICAgICAgbnVtOiBwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb24sXG4gICAgICAgICAgICAgICAgYW5zd2VyOiBwYXJ0c1szXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzRGF0YShkYXRhKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBYRFBhcnNlcjsiLCIvKlxuKiBKWFdvcmQgR3JpZCAtIEEgQ3Jvc3N3b3JkIFN5c3RlbSBieSBKYXNvbiBOb3J3b29kLVlvdW5nIDxqYXNvbkAxMGxheWVyLmNvbT5cbiogQ29weXJpZ2h0IDIwMjAgSmFzb24gTm9yd29vZC1Zb3VuZ1xuKi9cblxuLy8gQ29sLCAgIFJvd1xuLy8gWCwgICAgIFlcbi8vIHdpZHRoLCBoZWlnaHRcbmNsYXNzIEpYV29yZCB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkpYV29yZCwgYSBjcm9zc3dvcmQgc3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlwiKTtcbiAgICAgICAgaWYgKCFvcHRzLmNvbnRhaW5lcikgdGhyb3cgXCInY29udGFpbmVyJyByZXF1aXJlZFwiO1xuICAgICAgICBpZiAoIW9wdHMuZGF0YSkgdGhyb3cgXCInZGF0YScgcmVxdWlyZWRcIjtcbiAgICAgICAgLy8gU2V0IHNvbWUgZGVmYXVsdHNcbiAgICAgICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7IFxuICAgICAgICAgICAgd2lkdGg6IDUwMCwgXG4gICAgICAgICAgICBoZWlnaHQ6IDUwMCwgXG4gICAgICAgICAgICBvdXRlckJvcmRlcldpZHRoOiAxLjUsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJXaWR0aDogMSwgXG4gICAgICAgICAgICBtYXJnaW46IDMsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBpbm5lckJvcmRlckNvbG91cjogXCJibGFja1wiLCBcbiAgICAgICAgICAgIGZpbGxDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBjb2xzOiBvcHRzLmRhdGEuZ3JpZC5sZW5ndGgsXG4gICAgICAgICAgICByb3dzOiBvcHRzLmRhdGEuZ3JpZFswXS5sZW5ndGgsIFxuICAgICAgICAgICAgZm9udFJhdGlvOiAwLjcsXG4gICAgICAgICAgICBudW1SYXRpbzogMC4zMyxcbiAgICAgICAgICAgIHNlbGVjdENlbGxDb2xvdXI6IFwiI2Y3ZjQ1N1wiLFxuICAgICAgICAgICAgc2VsZWN0V29yZENvbG91cjogXCIjOWNlMGZiXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3VyOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgICAgICByZXN0b3JlU3RhdGU6IGZhbHNlXG4gICAgICAgIH0sIG9wdHMpO1xuICAgICAgICB0aGlzLnVpZCA9ICtuZXcgRGF0ZSgpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdGltZV90YWtlbjogMCxcbiAgICAgICAgICAgIGF1dG9jaGVjazogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zID0gW107XG4gICAgICAgIHRoaXMuZG93bl9xdWVzdGlvbnMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgdGhpcy5pc19oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIGRvY3VtZW50IHRvIGxvYWRcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgdGhpcy5vbkxvYWQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLy8gdGhyb3dFdmVudChldmVudE5hbWUsIGRldGFpbCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyh0aGlzLmV2ZW50cywgZXZlbnROYW1lKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudHMucHVibGlzaChldmVudE5hbWUsIGRldGFpbCk7XG4gICAgLy8gfVxuXG4gICAgb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMub3B0cy5jb250YWluZXIpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyRWxlbWVudCkgdGhyb3cgKGBDb3VsZCBub3QgZmluZCAke3RoaXMub3B0cy5jb250YWluZXJ9YCk7XG4gICAgICAgIHRoaXMudG90YWxXaWR0aCA9IHRoaXMub3B0cy53aWR0aCArICh0aGlzLm9wdHMubWFyZ2luICogMik7XG4gICAgICAgIHRoaXMudG90YWxIZWlnaHQgPSB0aGlzLm9wdHMuaGVpZ2h0ICsgKHRoaXMub3B0cy5tYXJnaW4gKiAyKTtcbiAgICAgICAgdGhpcy5jZWxsV2lkdGggPSB0aGlzLm9wdHMud2lkdGggLyB0aGlzLm9wdHMuY29scztcbiAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5vcHRzLmhlaWdodCAvIHRoaXMub3B0cy5yb3dzO1xuICAgICAgICB0aGlzLmZvbnRTaXplID0gdGhpcy5jZWxsV2lkdGggKiB0aGlzLm9wdHMuZm9udFJhdGlvOyAvLyBGb250IHNpemUgeCUgc2l6ZSBvZiBjZWxsXG4gICAgICAgIHRoaXMuZ3JpZCA9IFtdO1xuICAgICAgICB0aGlzLmdyaWQgPSB0aGlzLm9wdHMuZGF0YS5ncmlkWzBdLm1hcCgoY29sLCBpKSA9PiB0aGlzLm9wdHMuZGF0YS5ncmlkLm1hcChyb3cgPT4gcm93W2ldKSk7IC8vIFRyYW5zcG9zZSBvdXIgbWF0cml4XG4gICAgICAgIHRoaXMuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5ncmlkKTsgLy8gQ2FsY3VsYXRlIG91ciBoYXNoIHJlc3VsdFxuICAgICAgICB0aGlzLnN0b3JhZ2VOYW1lID0gYGp4d29yZC0ke01hdGguYWJzKHRoaXMuaGFzaCl9YDtcbiAgICAgICAgdGhpcy5kcmF3TGF5b3V0KCk7XG4gICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcbiAgICAgICAgdGhpcy5kcmF3Qm9yZGVyKCk7XG4gICAgICAgIHRoaXMuZHJhd051bWJlcnMoKTtcbiAgICAgICAgdGhpcy5kcmF3UXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQWN0aW9ucygpO1xuICAgICAgICB0aGlzLnNldEZvY3VzKCk7XG4gICAgICAgIHRoaXMubGlzdGVuUXVlc3Rpb25zKCk7XG4gICAgICAgIHRoaXMuc2V0VGltZXIoKTtcbiAgICAgICAgdGhpcy5kcmF3VGltZXIoKTtcbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzZXRUaW1lcigpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzX2hpZGRlbikgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnRpbWVfdGFrZW4pIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnRpbWVfdGFrZW4rKztcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmRyYXdUaW1lcigpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpLCAxMDAwKTtcbiAgICB9XG5cbiAgICBkcmF3TGF5b3V0KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1jb250YWluZXJcIiBpZD1cImp4d29yZC1jb250YWluZXItJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5IGp4d29yZC1vdmVybGF5LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91ciBHYW1lIGlzIEN1cnJlbnRseSBQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzdW1lXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1wbGF5LWFyZWFcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1ncmlkLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8bmF2IGNsYXNzPVwianh3b3JkLWNvbnRyb2xzXCIgcm9sZT1cIm5hdmlnYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtbWVudS10b2dnbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJqeHdvcmQtbWVudVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJQdXp6bGUgSW5mb1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWluZm8tJHt0aGlzLnVpZH1cIj48bGk+UHV6emxlIEluZm88L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj48aHI+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIEF1dG9jaGVja1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfVwiPjxsaT5BdXRvY2hlY2s8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgU3F1YXJlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfc3F1YXJlLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFNxdWFyZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJDaGVjayBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFdvcmQ8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfcHV6emxlLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFB1enpsZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPjxocj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJSZXNldCBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1yZXNldC0ke3RoaXMudWlkfVwiPjxsaT5SZXNldDwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1wYXVzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtcGF1c2UtdGV4dCBqeHdvcmQtc3Itb25seVwiPlBhdXNlPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC10aW1lclwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zdmctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2ZyBpZD0nanh3b3JkLXN2Zy0ke3RoaXMudWlkfScgY2xhc3M9J2p4d29yZC1zdmcnIHZpZXdCb3g9XCIwIDAgJHsgdGhpcy50b3RhbFdpZHRoIH0gJHsgdGhpcy50b3RhbEhlaWdodCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxnIGNsYXNzPVwiY2VsbC1ncm91cFwiIGlkPSdqeHdvcmQtZy1jb250YWluZXItJHt0aGlzLnVpZCB9Jz48L2c+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLWNvbnRhaW5lciBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWFycm93IGp4d29yZC1hcnJvdy1iYWNrXCIgaWQ9XCJqeHdvcmQtYXJyb3ctYmFjay0keyB0aGlzLnVpZCB9XCI+Jmxhbmc7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIiBpZD1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHsgdGhpcy51aWQgfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWZvcndhcmRcIiBpZD1cImp4d29yZC1hcnJvdy1mb3J3YXJkLSR7IHRoaXMudWlkIH1cIj4mcmFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZCBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUVwiPlE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIldcIj5XPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJFXCI+RTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUlwiPlI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlRcIj5UPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJZXCI+WTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiVVwiPlU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIklcIj5JPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJPXCI+TzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiUFwiPlA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiQVwiPkE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlNcIj5TPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJEXCI+RDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRlwiPkY8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkdcIj5HPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJIXCI+SDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiSlwiPko8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIktcIj5LPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJMXCI+TDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJaXCI+WjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWFwiPlg8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkNcIj5DPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJWXCI+VjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiQlwiPkI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk5cIj5OPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJNXCI+TTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleSBqeHdvcmQta2V5LWJhY2tzcGFjZVwiIGRhdGEta2V5PVwiQkFDS1NQQUNFXCI+JmxBcnI7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb24tY29udGFpbmVyIGp4d29yZC1kZXNrdG9wLW9ubHlcIiBpZD1cImp4d29yZC1xdWVzdGlvbi1jb250YWluZXItJHsgdGhpcy51aWQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtYWNyb3NzXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7IHRoaXMudWlkIH1cIj48aDQ+QWNyb3NzPC9oND48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd25cIiBpZD1cImp4d29yZC1xdWVzdGlvbi1kb3duLSR7IHRoaXMudWlkIH1cIj48aDQ+RG93bjwvaDQ+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1zdmctJHsgdGhpcy51aWQgfWApO1xuICAgICAgICB0aGlzLmNlbGxHcm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtZy1jb250YWluZXItJHt0aGlzLnVpZCB9YCk7XG4gICAgfVxuXG4gICAgZHJhd0dyaWQoKSB7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsR3JvdXAuaW5uZXJIVE1MICs9IHRoaXMuZHJhd0NlbGwodGhpcy5ncmlkW2NvbF1bcm93XSwgY29sLCByb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0NlbGwobGV0dGVyLCBjb2wsIHJvdykge1xuICAgICAgICBjb25zdCB4ID0gKHRoaXMuY2VsbFdpZHRoICogY29sKSArIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGNvbnN0IHkgPSAodGhpcy5jZWxsSGVpZ2h0ICogcm93KSArIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jZWxsV2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuY2VsbEhlaWdodDtcbiAgICAgICAgY29uc3QgbGV0dGVyWCA9IHggKyAod2lkdGggLyAyKTtcbiAgICAgICAgY29uc3QgbGV0dGVyWSA9IHkgKyBoZWlnaHQgLSAoaGVpZ2h0ICogMC4xKTtcbiAgICAgICAgbGV0IGZpbGwgPSB0aGlzLm9wdHMuYmFja2dyb3VuZENvbG91cjtcbiAgICAgICAgbGV0IGlzQmxhbmsgPSBcImlzLWxldHRlclwiO1xuICAgICAgICBsZXQgY29udGFpbmVyQ2xhc3M9XCJpcy1sZXR0ZXItY29udGFpbmVyXCI7XG4gICAgICAgIGlmIChsZXR0ZXIgPT0gXCIjXCIpIHtcbiAgICAgICAgICAgIGZpbGwgPSB0aGlzLm9wdHMuZmlsbENvbG91cjtcbiAgICAgICAgICAgIGlzQmxhbmsgPSBcImlzLWJsYW5rXCI7XG4gICAgICAgICAgICBjb250YWluZXJDbGFzcz1cIlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgPGcgaWQ9XCJqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9XCIgY2xhc3M9XCJqeHdvcmQtY2VsbCAke2NvbnRhaW5lckNsYXNzfVwiIHN0eWxlPVwiei1pbmRleDogMjBcIj48cmVjdCBjbGFzcz1cImp4d29yZC1jZWxsLXJlY3QgJHtpc0JsYW5rfVwiIHJvbGU9XCJjZWxsXCIgdGFiaW5kZXg9XCItMVwiIGFyaWEtbGFiZWw9XCJcIiB4PVwiJHt4fVwiIHk9XCIke3l9XCIgd2lkdGg9XCIke3dpZHRofVwiIGhlaWdodD1cIiR7aGVpZ2h0fVwiIHN0cm9rZT1cIiR7dGhpcy5vcHRzLmlubmVyQm9yZGVyQ29sb3VyfVwiIHN0cm9rZS13aWR0aD1cIiR7dGhpcy5vcHRzLmlubmVyQm9yZGVyV2lkdGh9XCIgZmlsbD1cIiR7ZmlsbH1cIiBkYXRhLWNvbD1cIiR7Y29sfVwiIGRhdGEtcm93PVwiJHtyb3cgfVwiIGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIj48L3JlY3Q+PHRleHQgaWQ9XCJqeHdvcmQtbGV0dGVyLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31cIiB4PVwiJHsgbGV0dGVyWCB9XCIgeT1cIiR7IGxldHRlclkgfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZm9udC1zaXplPVwiJHsgdGhpcy5mb250U2l6ZSB9XCIgd2lkdGg9XCIkeyB3aWR0aCB9XCI+PC90ZXh0PjwvZz5gO1xuICAgIH1cblxuICAgIGRyYXdMZXR0ZXIobGV0dGVyLCBjb2wsIHJvdykge1xuICAgICAgICBjb25zdCBsZXR0ZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtbGV0dGVyLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31gKTtcbiAgICAgICAgY29uc3QgY29ycmVjdCA9IHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbY29sXVtyb3ddO1xuICAgICAgICBpZiAoY29ycmVjdCkge1xuICAgICAgICAgICAgbGV0dGVyRWwuY2xhc3NMaXN0LmFkZChcImp4d29yZC1sZXR0ZXItaXMtY29ycmVjdFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldHRlckVsLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtbGV0dGVyLWlzLWNvcnJlY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobGV0dGVyKTtcbiAgICAgICAgd2hpbGUobGV0dGVyRWwuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgbGV0dGVyRWwucmVtb3ZlQ2hpbGQobGV0dGVyRWwubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBsZXR0ZXJFbC5hcHBlbmRDaGlsZCh0eHQpO1xuICAgIH1cblxuICAgIGRyYXdUaW1lcigpIHtcbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGltZSh0KSB7XG4gICAgICAgICAgICB2YXIgc2VjX251bSA9IHBhcnNlSW50KHQsIDEwKTsgLy8gZG9uJ3QgZm9yZ2V0IHRoZSBzZWNvbmQgcGFyYW1cbiAgICAgICAgICAgIHZhciBob3VycyAgID0gTWF0aC5mbG9vcihzZWNfbnVtIC8gMzYwMCk7XG4gICAgICAgICAgICB2YXIgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY19udW0gLSAoaG91cnMgKiAzNjAwKSkgLyA2MCk7XG4gICAgICAgICAgICB2YXIgc2Vjb25kcyA9IHNlY19udW0gLSAoaG91cnMgKiAzNjAwKSAtIChtaW51dGVzICogNjApO1xuICAgICAgICBcbiAgICAgICAgICAgIGlmIChob3VycyAgIDwgMTApIHtob3VycyAgID0gXCIwXCIraG91cnM7fVxuICAgICAgICAgICAgaWYgKG1pbnV0ZXMgPCAxMCkge21pbnV0ZXMgPSBcIjBcIittaW51dGVzO31cbiAgICAgICAgICAgIGlmIChzZWNvbmRzIDwgMTApIHtzZWNvbmRzID0gXCIwXCIrc2Vjb25kczt9XG4gICAgICAgICAgICByZXR1cm4gaG91cnMgKyAnOicgKyBtaW51dGVzICsgJzonICsgc2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC10aW1lci0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aW1lckVsLmlubmVySFRNTCA9IGA8c3BhbiBpZD1cImp4d29yZC10aW1lci10ZXh0LSR7dGhpcy51aWR9XCI+JHtmb3JtYXRUaW1lKHRoaXMuc3RhdGUudGltZV90YWtlbil9PC9zcGFuPmA7XG4gICAgfVxuXG4gICAgaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB7XG4gICAgICAgIGlmICgoY29sID09PSAwKSAmJiAodGhpcy5ncmlkW2NvbF1bcm93XSAhPT0gXCIjXCIpICYmICh0aGlzLmdyaWRbY29sICsgMV1bcm93XSAhPT0gXCIjXCIpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghdGhpcy5ncmlkW2NvbCArIDFdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgoY29sID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbCAtIDFdW3Jvd10gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAocm93IDwgdGhpcy5ncmlkWzBdLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbF1bcm93ICsgMV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIGlzU3RhcnRPZkRvd24oY29sLCByb3cpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghdGhpcy5ncmlkW2NvbF1bcm93ICsgMV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKChyb3cgPT09IDApIHx8ICh0aGlzLmdyaWRbY29sXVtyb3cgLSAxXSA9PSBcIiNcIikpIHtcbiAgICAgICAgICAgIC8vIGlmIChjb2wgPCB0aGlzLmdyaWQubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vIGlmICh0aGlzLmdyaWRbY29sICsgMV1bcm93XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGRyYXdOdW1iZXJzKCkge1xuICAgICAgICAvLyBBIGNlbGwgZ2V0cyBhIG51bWJlciBpZiBpdCBoYXMgYSBibG9jayBvciBlZGdlIGFib3ZlIG9yIHRvIHRoZSBsZWZ0IG9mIGl0LCBhbmQgYSBibGFuayBsZXR0ZXIgdG8gdGhlIGJvdHRvbSBvciByaWdodCBvZiBpdCByZXNwZWN0aXZlbHlcbiAgICAgICAgLy8gUG9wdWxhdGUgYSBudW1iZXIgZ3JpZCB3aGlsZSB3ZSdyZSBhdCBpdFxuICAgICAgICBsZXQgbnVtID0gMTtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgZHJhd051bSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbCAhPT0gdGhpcy5vcHRzLmNvbHMgLSAxICYmIHRoaXMuZ3JpZFtjb2wrMV1bcm93XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdOdW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMub3B0cy5kYXRhLmFjcm9zcy5maW5kKHEgPT4gcS5udW0gPT09IGBBJHtudW19YClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1N0YXJ0T2ZEb3duKGNvbCwgcm93KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocm93ICE9PSB0aGlzLm9wdHMucm93cyAtIDEgJiYgdGhpcy5ncmlkW2NvbF1bcm93KzFdICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd051bSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvd25fcXVlc3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMub3B0cy5kYXRhLmRvd24uZmluZChxID0+IHEubnVtID09PSBgRCR7bnVtfWApXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBsZXQgZHJhd051bSA9IHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSB8fCB0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpO1xuICAgICAgICAgICAgICAgIGlmIChkcmF3TnVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd051bWJlcihjb2wsIHJvdywgbnVtKyspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdOdW1iZXIoY29sLCByb3csIG51bSkge1xuICAgICAgICBjb25zdCBudW1Gb250U2l6ZSA9IHRoaXMuY2VsbFdpZHRoICogdGhpcy5vcHRzLm51bVJhdGlvO1xuICAgICAgICBjb25zdCB4ID0gKHRoaXMuY2VsbFdpZHRoICogY29sKSArIHRoaXMub3B0cy5tYXJnaW4gKyAyO1xuICAgICAgICBjb25zdCB5ID0gKHRoaXMuY2VsbEhlaWdodCAqIHJvdykgKyB0aGlzLm9wdHMubWFyZ2luICsgbnVtRm9udFNpemU7XG4gICAgICAgIGNvbnN0IGNlbGxFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0keyB0aGlzLnVpZCB9LSR7IGNvbCB9LSR7IHJvdyB9YCk7XG4gICAgICAgIFxuICAgICAgICBjZWxsRWwuaW5uZXJIVE1MICs9IGA8dGV4dCB4PVwiJHsgeCB9XCIgeT1cIiR7IHkgfVwiIHRleHQtYW5jaG9yPVwibGVmdFwiIGZvbnQtc2l6ZT1cIiR7IG51bUZvbnRTaXplIH1cIj4keyBudW0gfTwvdGV4dD5gXG4gICAgfVxuXG4gICAgZHJhd0JvcmRlcigpIHtcbiAgICAgICAgdGhpcy5jZWxsR3JvdXAuaW5uZXJIVE1MICs9IGA8cmVjdCB4PVwiJHt0aGlzLm9wdHMubWFyZ2lufVwiIHk9XCIke3RoaXMub3B0cy5tYXJnaW59XCIgd2lkdGg9XCIke3RoaXMub3B0cy53aWR0aH1cIiBoZWlnaHQ9XCIke3RoaXMub3B0cy5oZWlnaHR9XCIgc3Ryb2tlPVwiJHt0aGlzLm9wdHMub3V0ZXJCb3JkZXJDb2xvdXIgfVwiIHN0cm9rZS13aWR0aD1cIiR7dGhpcy5vcHRzLm91dGVyQm9yZGVyV2lkdGggfVwiIGZpbGw9XCJub25lXCI+YDtcbiAgICB9XG5cbiAgICBkcmF3UXVlc3Rpb25zKCkge1xuICAgICAgICBsZXQgYWNyb3NzID0gYDxvbCBpZD1cImp4d29yZC1xdWVzdGlvbnMtYWNyb3NzLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3RcIj5gXG4gICAgICAgIHRoaXMub3B0cy5kYXRhLmFjcm9zcy5mb3JFYWNoKHEgPT4ge1xuICAgICAgICAgICAgYWNyb3NzICs9IHRoaXMuZHJhd1F1ZXN0aW9uKHEpO1xuICAgICAgICB9KVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke3RoaXMudWlkfWApLmlubmVySFRNTCArPSBhY3Jvc3M7XG4gICAgICAgIGxldCBkb3duID0gYDxvbCBpZD1cImp4d29yZC1xdWVzdGlvbnMtZG93bi0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+YFxuICAgICAgICB0aGlzLm9wdHMuZGF0YS5kb3duLmZvckVhY2gocSA9PiB7XG4gICAgICAgICAgICBkb3duICs9IHRoaXMuZHJhd1F1ZXN0aW9uKHEpO1xuICAgICAgICB9KVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9uLWRvd24tJHt0aGlzLnVpZH1gKS5pbm5lckhUTUwgKz0gZG93bjtcbiAgICB9XG5cbiAgICBkcmF3UXVlc3Rpb24ocSkge1xuICAgICAgICByZXR1cm4gYDxsaSBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7cS5udW19LSR7dGhpcy51aWR9XCIgZGF0YS1xPVwiJHtxLm51bX1cIj48c3BhbiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLW51bVwiPiR7cS5udW0ucmVwbGFjZSgvXlxcRC8sIFwiXCIpfTwvc3Bhbj48c3BhbiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLXF1ZXN0aW9uXCI+JHtxLnF1ZXN0aW9ufTwvc3Bhbj48L2xpPmA7XG4gICAgfVxuXG4gICAgc2hvd092ZXJsYXkoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtb3ZlcmxheS1zaG93XCIpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLW92ZXJsYXktaGlkZVwiKTtcbiAgICB9XG5cbiAgICBoaWRlT3ZlcmxheSgpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1vdmVybGF5LWhpZGVcIik7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtb3ZlcmxheS1zaG93XCIpO1xuICAgIH1cblxuICAgIGNoZWNrT3ZlcmxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dPdmVybGF5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVPdmVybGF5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRTdGF0ZSgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwOyAvLyAwID0gYWNyb3NzLCAxID0gZG93blxuICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gZmFsc2U7IC8vIEFyZSB3ZSBkb25lIHlldD9cbiAgICAgICAgdGhpcy5zdGF0ZS5oaW50cyA9IGZhbHNlOyAvLyBIYWQgYW55IGhlbHA/XG4gICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDkxMDA7IC8vIEhvdyBsb25nIGhhdmUgd2UgYmVlbiBwbGF5aW5nP1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoID0gbmV3IEFycmF5KHRoaXMub3B0cy5jb2xzKS5maWxsKFwiXCIpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoXCJcIikpOyAvLyBBIG1hdHJpeCBmaWxsZWQgd2l0aCBlbXB0eSBjaGFyc1xuICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHsgLy8gRmlsbCBpbiB0aGUgIydzXG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gPSBcIiNcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FsYXJzIChmb3IgYWNyb3NzIGFuZCBkb3duKSB0aGF0IHdlIHVzZSB3aGVuIGRlY2lkaW5nIHdoaWNoIGNlbGwgdG8gZ28gdG8gaW4gdGhlIGV2ZW50IHRoYXQgYSBsZXR0ZXIgaXMgdHlwZWQsIHRhYiBpcyBwcmVzc2VkIGV0Yy4gXG4gICAgICAgIC8vIERvd24gU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93biA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCBxdWVzdGlvbiBvZiB0aGlzLmRvd25fcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3cgKyBpLFxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2codGhpcy5zdGF0ZS5zY2FsYXJEb3duKTtcbiAgICAgICAgLy8gQWNyb3NzIFNjYWxhclxuICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyA9IFtdO1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHF1ZXN0aW9uIG9mIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sICsgaSxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyk7XG4gICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGwgPSBbdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3NbMF0uY29sLCB0aGlzLnN0YXRlLnNjYWxhckFjcm9zc1swXS5yb3ddOyAvLyBTdGFydCBhdCBmaXJzdCBhY3Jvc3NcbiAgICAgICAgLy8gQ29ycmVjdCBncmlkXG4gICAgICAgIHRoaXMuc3RhdGUuY29ycmVjdEdyaWQgPSBuZXcgQXJyYXkodGhpcy5vcHRzLmNvbHMpLmZpbGwoZmFsc2UpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoZmFsc2UpKTtcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzYXZlU3RhdGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlNhdmluZyBTdGF0ZVwiKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUpKTtcbiAgICB9XG5cbiAgICByZXN0b3JlU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5zdG9yYWdlTmFtZSk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbGV0dGVyID0gdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd107XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZXR0ZXIgIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdMZXR0ZXIobGV0dGVyLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdXRvY2hlY2soKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVSZXN0b3JlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTdGF0ZSBSZXN0b3JlZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhbGNIYXNoKG1hdHJpeCkge1xuICAgICAgICBsZXQgcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgcyArPSBtYXRyaXhbY29sXVtyb3ddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBoYXNoID0gMCwgaSwgY2hyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNociA9IHMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICAgICAgICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coaGFzaCwgcyk7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cblxuICAgIG1hcmtDZWxscygpIHtcbiAgICAgICAgbGV0IGFsbENlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtY2VsbC1yZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgYWxsQ2VsbHMuZm9yRWFjaChjZWxsID0+IHtcbiAgICAgICAgICAgIGNlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuYmFja2dyb3VuZENvbG91cik7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIC0xKTtcbiAgICAgICAgfSlcbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsUmVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gfS0keyB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIH0gPiByZWN0YCk7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RDZWxsQ29sb3VyKTtcbiAgICAgICAgY3VycmVudENlbGxSZWN0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDEpO1xuICAgICAgICBsZXQgbWFya2VkQ2VsbCA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLmNvbHM7IGNvdW50ICsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvdW50fS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV19ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSArIDE7IGNvdW50IDwgdGhpcy5vcHRzLnJvd3M7IGNvdW50KyspIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXX0tJHtjb3VudH0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gLSAxOyBjb3VudCA+PSAwOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0UXVlc3Rpb24odGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJBY3Rpb25zKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCB0aGlzLnZpc2liaWxpdHlDaGFuZ2VkLmJpbmQodGhpcykpO1xuICAgICAgICBsZXQgYWxsQ2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwicmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGZvcihsZXQgY2VsbCBvZiBhbGxDZWxscykge1xuICAgICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jYXRjaENlbGxDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmNhdGNoS2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctZm9yd2FyZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb05leHRXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWFycm93LWJhY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcmVzZXQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5yZXNldC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy50b2dnbGVBdXRvY2hlY2suYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2hlY2tfd29yZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrV29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja19zcXVhcmUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGVja1NxdWFyZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja19wdXp6bGUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGVja1B1enpsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGFuZ2VEaXJlY3Rpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IGtleXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1rZXlcIik7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coa2V5KTtcbiAgICAgICAgICAgIGtleS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5rZXlDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucGF1c2UuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS1yZXN1bWUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wbGF5LmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIHZpc2liaWxpdHlDaGFuZ2VkKGUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlKTtcbiAgICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgdGhpcy5pc19oaWRkZW4gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJ2aXNpYmxlXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiUGF1c2VcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfSA+IC5qeHdvcmQtcGF1c2UtdGV4dGApLmlubmVySFRNTCA9IFwiUGxheVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBsYXlcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2tPdmVybGF5KCk7XG4gICAgfVxuXG4gICAgY2F0Y2hDZWxsQ2xpY2soZSkge1xuICAgICAgICBjb25zdCBjb2wgPSBOdW1iZXIoZS50YXJnZXQuZGF0YXNldC5jb2wpO1xuICAgICAgICBjb25zdCByb3cgPSBOdW1iZXIoZS50YXJnZXQuZGF0YXNldC5yb3cpO1xuICAgICAgICBpZiAoKGNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSkgJiYgKHJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpIHsgLy8gQ2xpY2tlZCBvbiBhbHJlYWR5IHNlbGVjdGVkIGNlbGxcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHJvdztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVUb05leHRDZWxsKCkge1xuICAgICAgICBsZXQgc2NhbGFyO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTY2FsYXJJbmRleCA9IHNjYWxhci5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBpdGVtLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIGlmIChjdXJyZW50U2NhbGFySW5kZXggPCBzY2FsYXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2N1cnJlbnRTY2FsYXJJbmRleCArIDFdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0ucm93O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHR5cGVMZXR0ZXIobGV0dGVyKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHRDZWxsKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGFzTGV0dGVyID0gKHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gbGV0dGVyO1xuICAgICAgICB0aGlzLnNldFNjYWxhcnMobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKVxuICAgICAgICB0aGlzLmRyYXdMZXR0ZXIobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgLy8gdGhpcy5jaGVja0hpbnQoKTtcbiAgICAgICAgdGhpcy5jaGVja1dpbigpO1xuICAgICAgICBpZiAoIWhhc0xldHRlcikge1xuICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHRDZWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYXRjaEtleVByZXNzKGUpIHtcbiAgICAgICAgY29uc3Qga2V5Y29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZSk7XG4gICAgICAgIGlmIChlLm1ldGFLZXkpIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJpbnRhYmxlID0gXG4gICAgICAgICAgICAoKGtleWNvZGUgPiA0NyAmJiBrZXljb2RlIDwgNTgpICAgfHwgLy8gbnVtYmVyIGtleXNcbiAgICAgICAgICAgIChrZXljb2RlID4gNjQgJiYga2V5Y29kZSA8IDkxKSAgIHx8IC8vIGxldHRlciBrZXlzXG4gICAgICAgICAgICAoa2V5Y29kZSA+IDk1ICYmIGtleWNvZGUgPCAxMTIpICB8fCAvLyBudW1wYWQga2V5c1xuICAgICAgICAgICAgKGtleWNvZGUgPiAxODUgJiYga2V5Y29kZSA8IDE5MykgfHwgLy8gOz0sLS4vYCAoaW4gb3JkZXIpXG4gICAgICAgICAgICAoa2V5Y29kZSA+IDIxOCAmJiBrZXljb2RlIDwgMjIzKSk7ICAgLy8gW1xcXScgKGluIG9yZGVyKVxuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHJldHVybjsgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgcGF1c2VkXG4gICAgICAgIGlmIChwcmludGFibGUgJiYgIXRoaXMuc3RhdGUuY29tcGxldGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGUua2V5LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLnR5cGVMZXR0ZXIobGV0dGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSA4KSB7IC8vIEJhY2tzcGFjZVxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmNvbXBsZXRlKSB7IC8vIERvbid0IGFsbG93IGNoYW5nZXMgaWYgd2UndmUgZmluaXNoZWQgb3VyIHB1enpsZVxuICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PSAzMikge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGtleWNvZGUgPT09IDkpIHx8IChrZXljb2RlID09PSAxMykpIHsgLy8gVGFiIG9yIEVudGVyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNXb3JkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dFdvcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSAzNykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM4KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVVcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM5KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVSaWdodCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDQwKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVEb3duKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlTGVmdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB4ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgeC0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt4XVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlVXAoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB5ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgeS0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVJpZ2h0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCArMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbaW5kZXggKzFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggKzFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbMF0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhclswXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB4ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeCA8IHRoaXMub3B0cy5yb3dzIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB4Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVEb3duKCkge1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5IDwgdGhpcy5vcHRzLmNvbHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHkrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1beV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0U2NhbGFycyhsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBhY3Jvc3MgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICBpZiAoYWNyb3NzKSB7XG4gICAgICAgICAgICBhY3Jvc3MubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkb3duID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChkb3duKSB7XG4gICAgICAgICAgICBkb3duLmxldHRlciA9IGxldHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIGlmIChsZXR0ZXIgPT09IHRoaXMuZ3JpZFtjb2xdW3Jvd10pIHtcbiAgICAgICAgICAgICAgICBpZiAoZG93bikgZG93bi5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoYWNyb3NzKSBhY3Jvc3MuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFtjb2xdW3Jvd10gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZVRvTmV4dCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhjdXJzb3IpO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coeCwgc2NhbGFyW3hdKTtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgY29uc3QgbmV4dEJsYW5rID0gb3RoZXJTY2FsYXIuZmluZChjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0QmxhbmsuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Qmxhbmsucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVUb1ByZXZpb3VzTGV0dGVyKCkge1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIGxldCBjdXJzb3IgPSBjdXJyZW50Q2VsbC5pbmRleCAtIDE7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3I7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3hdLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3hdLnJvdztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIGRlbGV0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pICB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGV0dGVyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkge1xuICAgICAgICAgICAgLy8gTW92ZSBiYWNrIGFuZCB0aGVuIGRlbGV0ZVxuICAgICAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c0xldHRlcigpO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRyYXdMZXR0ZXIoXCJcIiwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPSBcIlwiO1xuICAgICAgICB0aGlzLnNldFNjYWxhcnMoXCJcIiwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIFxuICAgIG1vdmVUb05leHRXb3JkKCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIGlmICghY3Vyc29yKSByZXR1cm47XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsICYmIG5leHRDZWxsLmxldHRlciAhPT0gXCJcIikgeyAvLyBGaXJzdCBsZXR0ZXIgaXMgbm90IGJsYW5rLCBcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBuZXh0Q2VsbC5pbmRleCArIDE7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IG90aGVyU2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICBpZiAobmV4dEJsYW5rKSB7IC8vIElzIHRoZXJlIHN0aWxsIGEgYmxhbmsgZG93bj9cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dEJsYW5rLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dEJsYW5rLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZmluZFN0YXJ0T2ZDdXJyZW50V29yZCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvci5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBzdGFydE9mQ3VycmVudFdvcmQgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXJ0T2ZDdXJyZW50V29yZDtcbiAgICB9XG5cbiAgICBtb3ZlVG9QcmV2aW91c1dvcmQoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGZpbmRMYXN0KGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBhcnJheVtpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKHgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBNb3ZlIHRvIGZpc3QgbGV0dGVyIG9mIGN1cnJlbnQgd29yZCwgdGhlbiBzZWFyY2ggYmFja3dhcmQgZm9yIGEgZnJlZSBzcGFjZSwgdGhlbiBtb3ZlIHRvIHRoZSBzdGFydCBvZiB0aGF0IHdvcmQsIHRoZW4gbW92ZSBmb3J3YXJkIHVudGlsIGEgZnJlZSBzcGFjZVxuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gdGhpcy5zdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgbGV0IGJsYW5rU3BhY2UgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGdvaW5nIGJhY2sgdW50aWwgd2UgaGl0IGEgYmxhbmsgc3BhY2VcbiAgICAgICAgaWYgKHN0YXJ0T2ZDdXJyZW50V29yZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHN0YXJ0T2ZDdXJyZW50V29yZC5pbmRleCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmxhbmtTcGFjZSA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mTGFzdFdvcmQgPSBudWxsO1xuICAgICAgICBpZiAoYmxhbmtTcGFjZSkge1xuICAgICAgICAgICAgLy8gTm93IGZpbmQgc3RhcnQgb2YgdGhpcyB3b3JkXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gYmxhbmtTcGFjZS5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZMYXN0V29yZCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydE9mTGFzdFdvcmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBzdGFydE9mTGFzdFdvcmQuaW5kZXg7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IGZpbmRMYXN0KG90aGVyU2NhbGFyLCBjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIGxldCBzdGFydE9mV29yZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IG5leHRCbGFuay5pbmRleDsgeCA+PSAwOyB4LS0pIHsgLy8gTW92ZSB0byBzdGFydCBvZiB3b3JkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdGhlclNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQgPSBvdGhlclNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzdGFydE9mV29yZC5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHN0YXJ0T2ZXb3JkLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0Rm9jdXMoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLWNlbGwtcmVjdFwiKS5mb2N1cygpO1xuICAgICAgICAvLyB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBjaGVja1dpbigpIHtcbiAgICAgICAgbGV0IHdpbiA9IHRydWU7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5ncmlkLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuZ3JpZFt4XS5sZW5ndGg7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IFwiI1wiKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsZXQgc2NhbGFyQWNyb3NzID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgbGV0IHNjYWxhckRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gdGhpcy5zdGF0ZS5ncmFwaFt4XVt5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyQWNyb3NzKSBzY2FsYXJBY3Jvc3MuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJBY3Jvc3MpIHNjYWxhckFjcm9zcy5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgd2luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHRoaXMuc3RhdGUuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5zdGF0ZS5ncmFwaCk7XG4gICAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW92ZXJsYXktdGl0bGVcIikuaW5uZXJIVE1MID0gXCJZb3UgV2luIVwiO1xuICAgICAgICAgICAgdGhpcy5zaG93T3ZlcmxheSgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoaWdobGlnaHRRdWVzdGlvbihjb2wsIHJvdykge1xuICAgICAgICBsZXQgZCA9IG51bGw7XG4gICAgICAgIGxldCBjZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgICAgIGQgPSBcIkFcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5hY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgICAgICBkID0gXCJEXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuZG93bjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNlbGwpIHJldHVybjtcbiAgICAgICAgbGV0IHEgPSBjZWxsLnE7XG4gICAgICAgIHZhciBlbGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0uYWN0aXZlXCIpO1xuICAgICAgICBbXS5mb3JFYWNoLmNhbGwoZWxlbXMsIGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHF1ZXN0aW9uRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke2R9JHtxfS0ke3RoaXMudWlkfWApO1xuICAgICAgICBpZiAoIXF1ZXN0aW9uRWwpIHJldHVybjtcbiAgICAgICAgcXVlc3Rpb25FbC5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coeyBxdWVzdGlvbkVsIH0pO1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgIGNvbnNvbGUubG9nKGAjanh3b3JkLXF1ZXN0aW9uLSR7ZH0tJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGhpcy5lbnN1cmVWaXNpYmlsaXR5KHF1ZXN0aW9uRWwsIHF1ZXN0aW9uRWwucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50KTtcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gZGF0YS5maW5kKHEgPT4gcS5udW0gPT09IGAke2R9JHtjZWxsLnF9YCk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLXNpbmdsZS1xdWVzdGlvblwiKS5pbm5lckhUTUwgPSBgJHtxdWVzdGlvbi5xdWVzdGlvbn1gO1xuICAgIH1cblxuICAgIGVuc3VyZVZpc2liaWxpdHkoZWwsIGNvbnRhaW5lcikge1xuICAgICAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lclJlY3QgPSBjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmIChyZWN0LmJvdHRvbSA+IGNvbnRhaW5lclJlY3QuYm90dG9tKSB7XG4gICAgICAgICAgICBlbC5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlY3QudG9wIDwgY29udGFpbmVyUmVjdC50b3ApIHtcbiAgICAgICAgICAgIGVsLnNjcm9sbEludG9WaWV3KHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbGlzdGVuUXVlc3Rpb25zKCkge1xuICAgICAgICBjb25zdCBxdWVzdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtXCIpO1xuICAgICAgICBmb3IobGV0IHF1ZXN0aW9uIG9mIHF1ZXN0aW9ucykge1xuICAgICAgICAgICAgcXVlc3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2xpY2tRdWVzdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsaWNrUXVlc3Rpb24oZSkge1xuICAgICAgICBjb25zdCBxID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucTtcbiAgICAgICAgY29uc3QgZGlyID0gcVswXTtcbiAgICAgICAgY29uc3QgbnVtID0gTnVtYmVyKHEuc3Vic3RyaW5nKDEpKTtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmIChkaXIgPT09IFwiQVwiKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBzY2FsYXIpIHtcbiAgICAgICAgICAgIGlmIChjZWxsLnEgPT09IG51bSkge1xuICAgICAgICAgICAgICAgIC8vIE1vdmUgdG8gdGhlIGZpcnN0IGVtcHR5IGxldHRlciBpbiBhIHdvcmQuIElmIHRoZXJlIGlzbid0IGFuIGVtcHR5IGxldHRlciwgbW92ZSB0byBzdGFydCBvZiB3b3JkLlxuICAgICAgICAgICAgICAgIGxldCBlbXB0eWxldHRlcnMgPSBzY2FsYXIuZmlsdGVyKHdvcmRjZWxsID0+IHdvcmRjZWxsLnEgPT09IG51bSAmJiB3b3JkY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgICAgIGlmIChlbXB0eWxldHRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBlbXB0eWxldHRlcnNbMF0uY29sO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gZW1wdHlsZXR0ZXJzWzBdLnJvdztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gY2VsbC5jb2w7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBjZWxsLnJvdztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRBcmlhKCkge1xuICAgICAgICBsZXQgdGggPSBudW0gPT4ge1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMSkgcmV0dXJuIFwiMXN0XCI7XG4gICAgICAgICAgICBpZiAobnVtID09PSAyKSByZXR1cm4gXCIybmRcIjtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDMpIHJldHVybiBcIjNyZFwiO1xuICAgICAgICAgICAgcmV0dXJuIGAke251bX10aGA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZ1bGxzdG9wID0gcyA9PiB7XG4gICAgICAgICAgICBpZiAocy5tYXRjaCgvW1xcLlxcP10kLykpIHJldHVybiBzO1xuICAgICAgICAgICAgcmV0dXJuIGAke3N9LmA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBkaXJMZXR0ZXIgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgZGlyTGV0dGVyID1cIkFcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5hY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBkaXJMZXR0ZXIgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIGxldHRlckNvdW50ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkaXJMZXR0ZXJ9JHtjZWxsLnF9YCk7XG4gICAgICAgICAgICBpZiAoIXF1ZXN0aW9uKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCB3b3JkTGVuZ3RoID0gcXVlc3Rpb24ucXVlc3Rpb24ubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHMgPSBgJHtxdWVzdGlvbi5udW19LiAke2Z1bGxzdG9wKHF1ZXN0aW9uLnF1ZXN0aW9uKX0gJHt3b3JkTGVuZ3RofSBsZXR0ZXJzLCAke3RoKGxldHRlckNvdW50KX0gbGV0dGVyLmBcbiAgICAgICAgICAgIGxldHRlckNvdW50Kys7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjZWxsLmNvbH0tJHtjZWxsLnJvd30gPiAuanh3b3JkLWNlbGwtcmVjdGApIC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXQoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjaGFuZ2VEaXJlY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gIXRoaXMuc3RhdGUuZGlyZWN0aW9uO1xuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICB0aGlzLnNldEFyaWEoKTtcblxuICAgIH1cblxuICAgIGtleUNsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBlbCA9IGUudGFyZ2V0O1xuICAgICAgICBsZXQgbGV0dGVyID0gZWwuZGF0YXNldC5rZXk7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh7IGxldHRlciB9KTtcbiAgICAgICAgaWYgKGxldHRlciA9PT0gXCJCQUNLU1BBQ0VcIikge1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHlwZUxldHRlcihsZXR0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tUaWxlKHgsIHkpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gXCIjXCIpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbeF1beV0pIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gdGhpcy5zdGF0ZS5ncmFwaFt4XVt5XSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt4XVt5XSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmRyYXdMZXR0ZXIodGhpcy5ncmlkW3hdW3ldLCB4LCB5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrU3F1YXJlKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNoZWNrVGlsZSh0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjaGVja1dvcmQoZSkgeyAvL1RPRE9cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsZXQgc2NhbGFyID0gXCJcIjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gdGhpcy5maW5kU3RhcnRPZkN1cnJlbnRXb3JkKCk7XG4gICAgICAgIHRoaXMuY2hlY2tUaWxlKHN0YXJ0T2ZDdXJyZW50V29yZC5jb2wsIHN0YXJ0T2ZDdXJyZW50V29yZC5yb3cpO1xuICAgICAgICBsZXQgaSA9IHN0YXJ0T2ZDdXJyZW50V29yZC5pbmRleCArIDE7XG4gICAgICAgIHdoaWxlKHNjYWxhcltpXSAmJiAhc2NhbGFyW2ldLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzY2FsYXJbaV0pO1xuICAgICAgICAgICAgdGhpcy5jaGVja1RpbGUoc2NhbGFyW2ldLmNvbCwgc2NhbGFyW2ldLnJvdyk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjaGVja1B1enpsZShlKSB7XG4gICAgICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGZvcihsZXQgeCA9IDA7IHggPCB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IobGV0IHkgPSAwOyB5IDwgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt4XS5sZW5ndGg7IHkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tUaWxlKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEF1dG9jaGVjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2sgJmNoZWNrO1wiO1xuICAgICAgICAgICAgdGhpcy5jaGVja1B1enpsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH0gPiBsaWApLmlubmVySFRNTCA9IFwiQXV0b2NoZWNrXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGVBdXRvY2hlY2soZSkgeyAvL1RPRE9cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN0YXRlLmF1dG9jaGVjayA9ICF0aGlzLnN0YXRlLmF1dG9jaGVjaztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBdXRvY2hlY2soKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICB9XG5cbiAgICBjbG9zZU1lbnUoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1lbnUtdG9nZ2xlIGlucHV0OmNoZWNrZWRcIikuY2hlY2tlZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSlhXb3JkOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgSlhXb3JkIGZyb20gXCIuL2pzL2p4d29yZC1ncmlkXCI7XG5pbXBvcnQgeGRwYXJzZXIgZnJvbSBcInhkLWNyb3Nzd29yZC1wYXJzZXJcIjtcbnJlcXVpcmUoXCIuL2Nzcy9qeHdvcmQubGVzc1wiKTtcblxuYXN5bmMgZnVuY3Rpb24gX2FkZF9jcm9zc3dvcmQoY3Jvc3N3b3JkX2RhdGEsIGNvbnRhaW5lcl9pZCwgZGVidWcgPSBmYWxzZSkge1xuICAgIGlmICghY3Jvc3N3b3JkX2RhdGEpIHJldHVybjtcbiAgICBjb25zdCB1bmVuY29kZWRfZGF0YSA9IGF0b2IoY3Jvc3N3b3JkX2RhdGEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB4ZHBhcnNlcih1bmVuY29kZWRfZGF0YSk7XG4gICAgd2luZG93Lmp4d29yZCA9IG5ldyBKWFdvcmQoeyBcbiAgICAgICAgY29udGFpbmVyOiBgIyR7Y29udGFpbmVyX2lkfWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGRlYnVnXG4gICAgfSk7XG59XG53aW5kb3cuYWRkX2Nyb3Nzd29yZCA9IF9hZGRfY3Jvc3N3b3JkOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==