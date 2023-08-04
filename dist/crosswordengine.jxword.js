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

/***/ "./src/js/events.js":
/*!**************************!*\
  !*** ./src/js/events.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Events: () => (/* binding */ Events)
/* harmony export */ });
// Event listeners for our puzzle game
const gtag = window.gtag;

function Events(container_element) {
    // Get the container
    const container = document.querySelector(container_element);
    if (!container) {
        console.error('Container not found!');
        return;
    }
    // Add event listeners to the container
    container.addEventListener('jxword:load', loadHandler);
    container.addEventListener('jxword:cheat', cheatHandler);
    container.addEventListener('jxword:complete', completeHandler);
    container.addEventListener('jxword:reset', resetHandler);
    container.addEventListener('jxword:progress', progressHandler);
    container.addEventListener('jxword:pause', pauseHandler);
    container.addEventListener('jxword:resume', resumeHandler);
}

function fire_gtag_event(name, data = {}) {
    if (typeof gtag === 'function') {
        gtag('event', name, data);
    } else {
        console.log(`gtag not found: ${name}`, data);
    }
}

function loadHandler(e) {
    // Handle the load event
    fire_gtag_event('crossword_load', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

function cheatHandler(e) {
    // Handle the cheat event
    fire_gtag_event('crossword_cheat', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

function completeHandler(e) {
    // Handle the complete event
    fire_gtag_event('crossword_complete', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

function resetHandler(e) {
    // Handle the reset event
    fire_gtag_event('crossword_reset', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

function progressHandler(e) {
    // Handle the progress event
    console.log(e.detail);
    fire_gtag_event('crossword_progress', {
        engagement_time_msec: e.detail.time_taken * 1000,
        progress: e.detail.progress,
        quartile: e.detail.quartile,
    });
}

function pauseHandler(e) {
    // Handle the pause event
    fire_gtag_event('crossword_pause', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

function resumeHandler(e) {
    // Handle the resume event
    fire_gtag_event('crossword_resume', {
        engagement_time_msec: e.detail.time_taken * 1000,
    });
}

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
        this.product_name = "JXWord";
        if (window.jxword_product_name) {
            this.product_name = window.jxword_product_name;
        }
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
            fontRatio: 0.80,
            numRatio: 0.25,
            selectCellColour: "#f7f457",
            selectWordColour: "#9ce0fb",
            backgroundColour: "white",
            debug: false,
            restoreState: false,
            progress: 0,
            quartile: 0,
        }, opts);
        if (window.jxword_completed_audio) {
            this.opts.completeAudio = window.jxword_completed_audio;
        }
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
        this.last_quartile = 0;
        if (this.opts.completeAudio) {
            this.audio = new Audio(this.opts.completeAudio);
        } else {
            this.audio = null;
        }
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
        if (this.state.complete) {
            this.displayWin();
        }
        this.containerElement.dispatchEvent(new CustomEvent("jxword:load", { detail: this.state }));
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
                            <div class="jxword-overlay-time" id="jxword-overlay_time-${this.uid}"></div>
                            <div id="jxword-overlay_share-${this.uid}" class="jxword-overlay-share">
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
        const letterY = y + this.fontSize - this.opts.margin;
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

    humanTime() {
        const seconds = this.state.time_taken;
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const secondsLeft = seconds - (minutes * 60);
        const minutesLeft = minutes - (hours * 60);
        const seconds_plural = secondsLeft == 1 ? "" : "s";
        const minutes_plural = minutesLeft == 1 ? "" : "s";
        const hours_plural = hours == 1 ? "" : "s";
        if (hours == 0 && minutes == 0) {
            return `${seconds} second${seconds_plural}`;
        }
        if (hours == 0) {
            return `${minutes} minute${minutes_plural} and ${secondsLeft} second${seconds_plural}`;
        }
        return `${hours} hour${hours_plural}, ${minutesLeft} minute${minutes_plural} and ${secondsLeft} second${seconds_plural}`;
    }

    drawShare() {
        const encoded_product_name = encodeURIComponent(this.product_name);
        const share_html = `
        <div class="jxword-overlay-share-option">
            <a href="https://twitter.com/intent/tweet?text=I%20just%20completed%20the%20${encoded_product_name}%20in%20${this.state.time_taken}%20seconds!%20Can%20you%20beat%20my%20time?&url=${encodeURIComponent(window.location.href)}" target="_blank"><span class="dashicons dashicons-twitter"></span> Share your results on Twitter</a>
        </div>
        <div class="jxword-overlay-share-option">
            <a href="whatsapp://send?text=I%20just%20completed%20the%20${encoded_product_name}%20in%20${this.state.time_taken}%20seconds!%20Can%20you%20beat%20my%20time?%20${encodeURIComponent(window.location.href)}" target="_blank"><span class="dashicons dashicons-whatsapp"></span> Share your results on WhatsApp</a>
        </div>`;
        const shareEl = document.querySelector(`#jxword-overlay_share-${this.uid}`);
        shareEl.innerHTML = share_html;
        const timeEl = document.querySelector(`#jxword-overlay_time-${this.uid}`);
        timeEl.innerHTML = `Your time: ${this.humanTime(this.state.time_taken)}`;
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
        const x = (this.cellWidth * col) + this.opts.margin + (this.cellWidth * 0.04);
        const y = (this.cellHeight * row) + this.opts.margin - (this.cellWidth * 0.02) + numFontSize;
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
        this.state.progress = 0;
        this.state.quartile = 0;
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
            this.containerElement.dispatchEvent(new CustomEvent("jxword:resume", { detail: this.state }));
        } else {
            this.is_paused = true;
            document.querySelector(`#jxword-pause-${this.uid} > .jxword-pause-text`).innerHTML = "Play";
            document.querySelector(`#jxword-pause-${this.uid}`).classList.add("jxword-play");
            this.containerElement.dispatchEvent(new CustomEvent("jxword:pause", { detail: this.state }));
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
            this.containerElement.dispatchEvent(new CustomEvent("jxword:resume", { detail: this.state }));
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
        this.calculateComplete();
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
        this.calculateComplete();
        // this.state.hash = this.calcHash(this.state.graph);
        if (win) {
            this.displayWin();
        }
    }

    displayWin() {
        document.querySelector(".jxword-overlay-title").innerHTML = "You Win!";
        this.drawShare();
        this.showOverlay("complete");
        this.state.complete = true;
        if (this.audio) this.audio.play();
        this.containerElement.dispatchEvent(new CustomEvent("jxword:complete", { detail: this.state }));
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
        this.containerElement.dispatchEvent(new CustomEvent("jxword:reset", { detail: this.state }));
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
            this.containerElement.dispatchEvent(new CustomEvent("jxword:cheat", { detail: this.state }));
        }
        this.setAutocheck();
        this.saveState();
        this.closeMenu();
    }

    closeMenu() {
        const inputEl = document.querySelector(".jxword-menu-toggle input:checked");
        if (inputEl) inputEl.checked = false;
    }

    calculateComplete() {
        // Calculate how much of the grid is filled in
        let filled = 0;
        let total_cells = 0;
        for (let col = 0; col < this.opts.cols; col++) {
            for (let row = 0; row < this.opts.rows; row++) {
                if (this.state.graph[col][row] !== "#") {
                    total_cells++;
                    if (this.state.graph[col][row]) {
                        filled++;
                    }
                }
            }
        }
        const filled_percent = Math.floor(filled / total_cells * 100);
        this.state.progress = filled_percent;
        this.state.quartile = Math.floor(filled_percent / 25);
        if (this.state.quartile > this.last_quartile) {
            this.containerElement.dispatchEvent(new CustomEvent("jxword:progress", { detail: this.state }));
            this.last_quartile = this.state.quartile;
        }
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
/* harmony import */ var _js_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./js/events */ "./src/js/events.js");





async function _add_crossword(crossword_data, container_id, debug = false) {
    if (!crossword_data) return;
    const unencoded_data = atob(crossword_data);
    const data = await xd_crossword_parser__WEBPACK_IMPORTED_MODULE_1___default()(unencoded_data);
    window.jxword = new _js_jxword_grid__WEBPACK_IMPORTED_MODULE_0__["default"]({ 
        container: `#${container_id}`,
        data,
        debug
    });
    window.jxword.events = new _js_events__WEBPACK_IMPORTED_MODULE_3__.Events(`#${container_id}`);
}
window.add_crossword = _add_crossword;
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBLFVBQVUsMEJBQTBCO0FBQ3BDO0FBQ0Esd0NBQXdDO0FBQ3hDO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVUsZ0RBQWdEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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V0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7OztBQ05zQztBQUNLO0FBQ2hCO0FBQ1E7O0FBRW5DO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwwREFBUTtBQUMvQix3QkFBd0IsdURBQU07QUFDOUIsdUJBQXVCLGFBQWE7QUFDcEM7QUFDQTtBQUNBLEtBQUs7QUFDTCwrQkFBK0IsOENBQU0sS0FBSyxhQUFhO0FBQ3ZEO0FBQ0Esc0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2Nzcy9qeHdvcmQubGVzcz9jOWJkIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMveGQtY3Jvc3N3b3JkLXBhcnNlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2pzL2V2ZW50cy5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2pzL2p4d29yZC1ncmlkLmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZXh0cmFjdGVkIGJ5IG1pbmktY3NzLWV4dHJhY3QtcGx1Z2luXG5leHBvcnQge307IiwiLy8gQSBsaWJyYXJ5IGZvciBjb252ZXJ0aW5nIC54ZCBDcm9zc3dvcmQgZGF0YSB0byBKU09OIChhcyBkZWZpbmVkIGJ5IFNhdWwgUHdhbnNvbiAtIGh0dHA6Ly94ZC5zYXVsLnB3KSB3cml0dGVuIGJ5IEphc29uIE5vcndvb2QtWW91bmdcblxuZnVuY3Rpb24gWERQYXJzZXIoZGF0YSkge1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhKGRhdGEpIHtcbiAgICAgICAgLy8gU3BsaXQgaW50byBwYXJ0c1xuICAgICAgICBsZXQgcGFydHMgPSBkYXRhLnNwbGl0KC9eJF4kL2dtKS5maWx0ZXIocyA9PiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgIHBhcnRzID0gZGF0YS5zcGxpdCgvXFxyXFxuXFxyXFxuL2cpLmZpbHRlcihzID0+IChzLnRyaW0oKSkpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBUb28gbWFueSBwYXJ0cyAtIGV4cGVjdGVkIDQsIGZvdW5kICR7cGFydHMubGVuZ3RofWApO1xuICAgICAgICBjb25zdCByYXdNZXRhID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IHJhd0dyaWQgPSBwYXJ0c1sxXTtcbiAgICAgICAgY29uc3QgcmF3QWNyb3NzID0gcGFydHNbMl07XG4gICAgICAgIGNvbnN0IHJhd0Rvd24gPSBwYXJ0c1szXTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHByb2Nlc3NNZXRhKHJhd01ldGEpO1xuICAgICAgICBjb25zdCBncmlkID0gcHJvY2Vzc0dyaWQocmF3R3JpZCk7XG4gICAgICAgIGNvbnN0IGFjcm9zcyA9IHByb2Nlc3NDbHVlcyhyYXdBY3Jvc3MpO1xuICAgICAgICBjb25zdCBkb3duID0gcHJvY2Vzc0NsdWVzKHJhd0Rvd24pO1xuICAgICAgICByZXR1cm4geyBtZXRhLCBncmlkLCBhY3Jvc3MsIGRvd24sIHJhd0dyaWQsIHJhd0Fjcm9zcywgcmF3RG93biwgcmF3TWV0YSwgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzTWV0YShyYXdNZXRhKSB7XG4gICAgICAgIGNvbnN0IG1ldGFMaW5lcyA9IHJhd01ldGEuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBsZXQgbWV0YSA9IHt9O1xuICAgICAgICBtZXRhTGluZXMuZm9yRWFjaChtZXRhTGluZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lUGFydHMgPSBtZXRhTGluZS5zcGxpdChcIjogXCIpO1xuICAgICAgICAgICAgbWV0YVtsaW5lUGFydHNbMF1dID0gbGluZVBhcnRzWzFdO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1ldGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0dyaWQocmF3R3JpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3R3JpZC5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IGxpbmVzW3hdLnNwbGl0KFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0NsdWVzKHJhd0NsdWVzKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdDbHVlcy5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLyheLlxcZCopXFwuXFxzKC4qKVxcc35cXHMoLiopLztcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKCFsaW5lc1t4XS50cmltKCkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBsaW5lc1t4XS5tYXRjaChyZWdleCk7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYENvdWxkIG5vdCBwYXJzZSBxdWVzdGlvbiAke2xpbmVzW3hdfWApO1xuICAgICAgICAgICAgLy8gVW5lc2NhcGUgc3RyaW5nXG4gICAgICAgICAgICBjb25zdCBxdWVzdGlvbiA9IHBhcnRzWzJdLnJlcGxhY2UoL1xcXFwvZywgXCJcIik7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSB7XG4gICAgICAgICAgICAgICAgbnVtOiBwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb24sXG4gICAgICAgICAgICAgICAgYW5zd2VyOiBwYXJ0c1szXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzRGF0YShkYXRhKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBYRFBhcnNlcjsiLCIvLyBFdmVudCBsaXN0ZW5lcnMgZm9yIG91ciBwdXp6bGUgZ2FtZVxuY29uc3QgZ3RhZyA9IHdpbmRvdy5ndGFnO1xuXG5leHBvcnQgZnVuY3Rpb24gRXZlbnRzKGNvbnRhaW5lcl9lbGVtZW50KSB7XG4gICAgLy8gR2V0IHRoZSBjb250YWluZXJcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbnRhaW5lcl9lbGVtZW50KTtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb250YWluZXIgbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGNvbnRhaW5lclxuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6bG9hZCcsIGxvYWRIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOmNoZWF0JywgY2hlYXRIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOmNvbXBsZXRlJywgY29tcGxldGVIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOnJlc2V0JywgcmVzZXRIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOnByb2dyZXNzJywgcHJvZ3Jlc3NIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOnBhdXNlJywgcGF1c2VIYW5kbGVyKTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOnJlc3VtZScsIHJlc3VtZUhhbmRsZXIpO1xufVxuXG5mdW5jdGlvbiBmaXJlX2d0YWdfZXZlbnQobmFtZSwgZGF0YSA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBndGFnID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGd0YWcoJ2V2ZW50JywgbmFtZSwgZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYGd0YWcgbm90IGZvdW5kOiAke25hbWV9YCwgZGF0YSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkSGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSBsb2FkIGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfbG9hZCcsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjaGVhdEhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgY2hlYXQgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9jaGVhdCcsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb21wbGV0ZUhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgY29tcGxldGUgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9jb21wbGV0ZScsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZXNldEhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgcmVzZXQgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9yZXNldCcsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwcm9ncmVzc0hhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgcHJvZ3Jlc3MgZXZlbnRcbiAgICBjb25zb2xlLmxvZyhlLmRldGFpbCk7XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfcHJvZ3Jlc3MnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICAgICAgcHJvZ3Jlc3M6IGUuZGV0YWlsLnByb2dyZXNzLFxuICAgICAgICBxdWFydGlsZTogZS5kZXRhaWwucXVhcnRpbGUsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhdXNlSGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSBwYXVzZSBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX3BhdXNlJywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlc3VtZUhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgcmVzdW1lIGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfcmVzdW1lJywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59IiwiLypcbiogSlhXb3JkIEdyaWQgLSBBIENyb3Nzd29yZCBTeXN0ZW0gYnkgSmFzb24gTm9yd29vZC1Zb3VuZyA8amFzb25AMTBsYXllci5jb20+XG4qIENvcHlyaWdodCAyMDIwIEphc29uIE5vcndvb2QtWW91bmdcbiovXG5cbi8vIENvbCwgICBSb3dcbi8vIFgsICAgICBZXG4vLyB3aWR0aCwgaGVpZ2h0XG5jbGFzcyBKWFdvcmQge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJKWFdvcmQsIGEgY3Jvc3N3b3JkIHN5c3RlbSBieSBKYXNvbiBOb3J3b29kLVlvdW5nIDxqYXNvbkAxMGxheWVyLmNvbT5cIik7XG4gICAgICAgIHRoaXMucHJvZHVjdF9uYW1lID0gXCJKWFdvcmRcIjtcbiAgICAgICAgaWYgKHdpbmRvdy5qeHdvcmRfcHJvZHVjdF9uYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RfbmFtZSA9IHdpbmRvdy5qeHdvcmRfcHJvZHVjdF9uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0cy5jb250YWluZXIpIHRocm93IFwiJ2NvbnRhaW5lcicgcmVxdWlyZWRcIjtcbiAgICAgICAgaWYgKCFvcHRzLmRhdGEpIHRocm93IFwiJ2RhdGEnIHJlcXVpcmVkXCI7XG4gICAgICAgIC8vIFNldCBzb21lIGRlZmF1bHRzXG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oeyBcbiAgICAgICAgICAgIHdpZHRoOiA1MDAsIFxuICAgICAgICAgICAgaGVpZ2h0OiA1MDAsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJXaWR0aDogMS41LCBcbiAgICAgICAgICAgIGlubmVyQm9yZGVyV2lkdGg6IDEsIFxuICAgICAgICAgICAgbWFyZ2luOiAzLCBcbiAgICAgICAgICAgIG91dGVyQm9yZGVyQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBmaWxsQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgY29sczogb3B0cy5kYXRhLmdyaWQubGVuZ3RoLFxuICAgICAgICAgICAgcm93czogb3B0cy5kYXRhLmdyaWRbMF0ubGVuZ3RoLCBcbiAgICAgICAgICAgIGZvbnRSYXRpbzogMC44MCxcbiAgICAgICAgICAgIG51bVJhdGlvOiAwLjI1LFxuICAgICAgICAgICAgc2VsZWN0Q2VsbENvbG91cjogXCIjZjdmNDU3XCIsXG4gICAgICAgICAgICBzZWxlY3RXb3JkQ29sb3VyOiBcIiM5Y2UwZmJcIixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvdXI6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIHJlc3RvcmVTdGF0ZTogZmFsc2UsXG4gICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgIHF1YXJ0aWxlOiAwLFxuICAgICAgICB9LCBvcHRzKTtcbiAgICAgICAgaWYgKHdpbmRvdy5qeHdvcmRfY29tcGxldGVkX2F1ZGlvKSB7XG4gICAgICAgICAgICB0aGlzLm9wdHMuY29tcGxldGVBdWRpbyA9IHdpbmRvdy5qeHdvcmRfY29tcGxldGVkX2F1ZGlvO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudWlkID0gK25ldyBEYXRlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB0aW1lX3Rha2VuOiAwLFxuICAgICAgICAgICAgYXV0b2NoZWNrOiBmYWxzZSxcbiAgICAgICAgICAgIGNoZWF0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmRvd25fcXVlc3Rpb25zID0gW107XG4gICAgICAgIC8vIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGFzdF9xdWFydGlsZSA9IDA7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuY29tcGxldGVBdWRpbykge1xuICAgICAgICAgICAgdGhpcy5hdWRpbyA9IG5ldyBBdWRpbyh0aGlzLm9wdHMuY29tcGxldGVBdWRpbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBXYWl0IGZvciB0aGUgZG9jdW1lbnQgdG8gbG9hZFxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCB0aGlzLm9uTG9hZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICAvLyB0aHJvd0V2ZW50KGV2ZW50TmFtZSwgZGV0YWlsKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKHRoaXMuZXZlbnRzLCBldmVudE5hbWUpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50cy5wdWJsaXNoKGV2ZW50TmFtZSwgZGV0YWlsKTtcbiAgICAvLyB9XG5cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5vcHRzLmNvbnRhaW5lcik7XG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXJFbGVtZW50KSB0aHJvdyAoYENvdWxkIG5vdCBmaW5kICR7dGhpcy5vcHRzLmNvbnRhaW5lcn1gKTtcbiAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gdGhpcy5vcHRzLndpZHRoICsgKHRoaXMub3B0cy5tYXJnaW4gKiAyKTtcbiAgICAgICAgdGhpcy50b3RhbEhlaWdodCA9IHRoaXMub3B0cy5oZWlnaHQgKyAodGhpcy5vcHRzLm1hcmdpbiAqIDIpO1xuICAgICAgICB0aGlzLmNlbGxXaWR0aCA9IHRoaXMub3B0cy53aWR0aCAvIHRoaXMub3B0cy5jb2xzO1xuICAgICAgICB0aGlzLmNlbGxIZWlnaHQgPSB0aGlzLm9wdHMuaGVpZ2h0IC8gdGhpcy5vcHRzLnJvd3M7XG4gICAgICAgIHRoaXMuZm9udFNpemUgPSB0aGlzLmNlbGxXaWR0aCAqIHRoaXMub3B0cy5mb250UmF0aW87IC8vIEZvbnQgc2l6ZSB4JSBzaXplIG9mIGNlbGxcbiAgICAgICAgdGhpcy5ncmlkID0gW107XG4gICAgICAgIHRoaXMuZ3JpZCA9IHRoaXMub3B0cy5kYXRhLmdyaWRbMF0ubWFwKChjb2wsIGkpID0+IHRoaXMub3B0cy5kYXRhLmdyaWQubWFwKHJvdyA9PiByb3dbaV0pKTsgLy8gVHJhbnNwb3NlIG91ciBtYXRyaXhcbiAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLmdyaWQpOyAvLyBDYWxjdWxhdGUgb3VyIGhhc2ggcmVzdWx0XG4gICAgICAgIHRoaXMuc3RvcmFnZU5hbWUgPSBganh3b3JkLSR7TWF0aC5hYnModGhpcy5oYXNoKX1gO1xuICAgICAgICB0aGlzLmRyYXdMYXlvdXQoKTtcbiAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xuICAgICAgICB0aGlzLmRyYXdCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5kcmF3TnVtYmVycygpO1xuICAgICAgICB0aGlzLmRyYXdRdWVzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMuc2V0Rm9jdXMoKTtcbiAgICAgICAgdGhpcy5saXN0ZW5RdWVzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5zZXRUaW1lcigpO1xuICAgICAgICB0aGlzLmRyYXdUaW1lcigpO1xuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5V2luKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOmxvYWRcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgIH1cblxuICAgIHNldFRpbWVyKCkge1xuICAgICAgICBzZXRJbnRlcnZhbCgoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfaGlkZGVuKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHJldHVybjtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNvbXBsZXRlKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUudGltZV90YWtlbikgdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbisrO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd1RpbWVyKCk7XG4gICAgICAgIH0pLmJpbmQodGhpcyksIDEwMDApO1xuICAgIH1cblxuICAgIGRyYXdMYXlvdXQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWNvbnRhaW5lclwiIGlkPVwianh3b3JkLWNvbnRhaW5lci0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXkganh3b3JkLW92ZXJsYXktaGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLXBhdXNlZC0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXBhdXNlZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VyIEdhbWUgaXMgQ3VycmVudGx5IFBhdXNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheS1yZXN1bWUtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXN1bWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1jb21wbGV0ZV9vdmVybGF5LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb25ncmF0dWxhdGlvbnMhIFlvdSd2ZSBXb24hXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpbWVcIiBpZD1cImp4d29yZC1vdmVybGF5X3RpbWUtJHt0aGlzLnVpZH1cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXlfc2hhcmUtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXNoYXJlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LXJlc3RhcnQtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvbiBqeHdvcmQtcmVzZXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b24ganh3b3JkLWNsb3NlLW92ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1tZXRhX292ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1tZXRhX292ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt0aGlzLm9wdHMuZGF0YS5tZXRhLlRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7IE9iamVjdC5rZXlzKHRoaXMub3B0cy5kYXRhLm1ldGEpLm1hcChrID0+IGsgPT09IFwiVGl0bGVcIiA/IFwiXCIgOiBgPGxpPiR7a306ICR7dGhpcy5vcHRzLmRhdGEubWV0YVtrXX08L2xpPmAgKS5qb2luKFwiXFxuXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uIGp4d29yZC1jbG9zZS1vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsb3NlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1wbGF5LWFyZWFcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1ncmlkLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8bmF2IGNsYXNzPVwianh3b3JkLWNvbnRyb2xzXCIgcm9sZT1cIm5hdmlnYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtbWVudS10b2dnbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJqeHdvcmQtbWVudVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJBYm91dCBUaGlzIFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLW1ldGEtJHt0aGlzLnVpZH1cIj48bGk+QWJvdXQgVGhpcyBQdXp6bGU8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj48aHI+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIEF1dG9jaGVja1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfVwiPjxsaT5BdXRvY2hlY2s8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgU3F1YXJlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfc3F1YXJlLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFNxdWFyZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJDaGVjayBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIiBpZD1cImp4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFdvcmQ8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtY2hlY2tfcHV6emxlLSR7dGhpcy51aWR9XCI+PGxpPkNoZWNrIFB1enpsZTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPjxocj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJQcmludCAoQmxhbmspXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCIgaWQ9XCJqeHdvcmQtcHJpbnRfYmxhbmstJHt0aGlzLnVpZH1cIj48bGk+UHJpbnQgKEJsYW5rKTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJQcmludCAoRmlsbGVkKVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiIGlkPVwianh3b3JkLXByaW50X2ZpbGxlZC0ke3RoaXMudWlkfVwiPjxsaT5QcmludCAoRmlsbGVkKTwvbGk+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPjxocj48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJSZXNldCBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b24ganh3b3JkLXJlc2V0XCIgaWQ9XCJqeHdvcmQtcmVzZXQtJHt0aGlzLnVpZH1cIj48bGk+UmVzZXQ8L2xpPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvbmF2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLXBhdXNlLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcGF1c2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLXBhdXNlLXRleHQganh3b3JkLXNyLW9ubHlcIj5QYXVzZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+IFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLXRpbWVyLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtdGltZXJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc3ZnLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdmcgaWQ9J2p4d29yZC1zdmctJHt0aGlzLnVpZH0nIGNsYXNzPSdqeHdvcmQtc3ZnJyB2aWV3Qm94PVwiMCAwICR7IHRoaXMudG90YWxXaWR0aCB9ICR7IHRoaXMudG90YWxIZWlnaHQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZyBjbGFzcz1cImNlbGwtZ3JvdXBcIiBpZD0nanh3b3JkLWctY29udGFpbmVyLSR7dGhpcy51aWQgfSc+PC9nPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXNpbmdsZS1xdWVzdGlvbi1jb250YWluZXIganh3b3JkLW1vYmlsZS1vbmx5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1hcnJvdyBqeHdvcmQtYXJyb3ctYmFja1wiIGlkPVwianh3b3JkLWFycm93LWJhY2stJHsgdGhpcy51aWQgfVwiPiZsYW5nOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uXCIgaWQ9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLSR7IHRoaXMudWlkIH1cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWFycm93IGp4d29yZC1hcnJvdy1mb3J3YXJkXCIgaWQ9XCJqeHdvcmQtYXJyb3ctZm9yd2FyZC0keyB0aGlzLnVpZCB9XCI+JnJhbmc7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQganh3b3JkLW1vYmlsZS1vbmx5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlFcIj5RPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJXXCI+VzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRVwiPkU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlJcIj5SPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJUXCI+VDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWVwiPlk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlVcIj5VPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJJXCI+STwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiT1wiPk88L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlBcIj5QPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkFcIj5BPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJTXCI+UzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiRFwiPkQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkZcIj5GPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJHXCI+RzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiSFwiPkg8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkpcIj5KPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJLXCI+SzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiTFwiPkw8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiWlwiPlo8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlhcIj5YPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJDXCI+QzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiVlwiPlY8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkJcIj5CPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJOXCI+TjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleVwiIGRhdGEta2V5PVwiTVwiPk08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXkganh3b3JkLWtleS1iYWNrc3BhY2VcIiBkYXRhLWtleT1cIkJBQ0tTUEFDRVwiPiZsQXJyOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9uLWNvbnRhaW5lciBqeHdvcmQtZGVza3RvcC1vbmx5XCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tY29udGFpbmVyLSR7IHRoaXMudWlkIH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWFjcm9zc1wiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0keyB0aGlzLnVpZCB9XCI+PGg0PkFjcm9zczwvaDQ+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1kb3duXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tZG93bi0keyB0aGlzLnVpZCB9XCI+PGg0PkRvd248L2g0PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgICAgICB0aGlzLnN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc3ZnLSR7IHRoaXMudWlkIH1gKTtcbiAgICAgICAgdGhpcy5jZWxsR3JvdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWctY29udGFpbmVyLSR7dGhpcy51aWQgfWApO1xuICAgIH1cblxuICAgIGRyYXdHcmlkKCkge1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbEdyb3VwLmlubmVySFRNTCArPSB0aGlzLmRyYXdDZWxsKHRoaXMuZ3JpZFtjb2xdW3Jvd10sIGNvbCwgcm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdDZWxsKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgY29uc3QgeCA9ICh0aGlzLmNlbGxXaWR0aCAqIGNvbCkgKyB0aGlzLm9wdHMubWFyZ2luO1xuICAgICAgICBjb25zdCB5ID0gKHRoaXMuY2VsbEhlaWdodCAqIHJvdykgKyB0aGlzLm9wdHMubWFyZ2luO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuY2VsbFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmNlbGxIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxldHRlclggPSB4ICsgKHdpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IGxldHRlclkgPSB5ICsgdGhpcy5mb250U2l6ZSAtIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGxldCBmaWxsID0gdGhpcy5vcHRzLmJhY2tncm91bmRDb2xvdXI7XG4gICAgICAgIGxldCBpc0JsYW5rID0gXCJpcy1sZXR0ZXJcIjtcbiAgICAgICAgbGV0IGNvbnRhaW5lckNsYXNzPVwiaXMtbGV0dGVyLWNvbnRhaW5lclwiO1xuICAgICAgICBpZiAobGV0dGVyID09IFwiI1wiKSB7XG4gICAgICAgICAgICBmaWxsID0gdGhpcy5vcHRzLmZpbGxDb2xvdXI7XG4gICAgICAgICAgICBpc0JsYW5rID0gXCJpcy1ibGFua1wiO1xuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M9XCJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYDxnIGlkPVwianh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fVwiIGNsYXNzPVwianh3b3JkLWNlbGwgJHtjb250YWluZXJDbGFzc31cIiBzdHlsZT1cInotaW5kZXg6IDIwXCI+PHJlY3QgY2xhc3M9XCJqeHdvcmQtY2VsbC1yZWN0ICR7aXNCbGFua31cIiByb2xlPVwiY2VsbFwiIHRhYmluZGV4PVwiLTFcIiBhcmlhLWxhYmVsPVwiXCIgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiBzdHJva2U9XCIke3RoaXMub3B0cy5pbm5lckJvcmRlckNvbG91cn1cIiBzdHJva2Utd2lkdGg9XCIke3RoaXMub3B0cy5pbm5lckJvcmRlcldpZHRofVwiIGZpbGw9XCIke2ZpbGx9XCIgZGF0YS1jb2w9XCIke2NvbH1cIiBkYXRhLXJvdz1cIiR7cm93IH1cIiBjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCI+PC9yZWN0Pjx0ZXh0IGlkPVwianh3b3JkLWxldHRlci0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9XCIgY2xhc3M9XCJqeHdvcmQtbGV0dGVyXCIgeD1cIiR7IGxldHRlclggfVwiIHk9XCIkeyBsZXR0ZXJZIH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZvbnQtc2l6ZT1cIiR7IHRoaXMuZm9udFNpemUgfVwiIHdpZHRoPVwiJHsgd2lkdGggfVwiPjwvdGV4dD48L2c+YDtcbiAgICB9XG5cbiAgICBkcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgY29uc3QgbGV0dGVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWxldHRlci0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9YCk7XG4gICAgICAgIGNvbnN0IGNvcnJlY3QgPSB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XTtcbiAgICAgICAgaWYgKGNvcnJlY3QpIHtcbiAgICAgICAgICAgIGxldHRlckVsLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtbGV0dGVyLWlzLWNvcnJlY3RcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLWxldHRlci1pcy1jb3JyZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGxldHRlcik7XG4gICAgICAgIHdoaWxlKGxldHRlckVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIGxldHRlckVsLnJlbW92ZUNoaWxkKGxldHRlckVsLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0dGVyRWwuYXBwZW5kQ2hpbGQodHh0KTtcbiAgICB9XG5cbiAgICBkcmF3VGltZXIoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUodCkge1xuICAgICAgICAgICAgdmFyIHNlY19udW0gPSBwYXJzZUludCh0LCAxMCk7IC8vIGRvbid0IGZvcmdldCB0aGUgc2Vjb25kIHBhcmFtXG4gICAgICAgICAgICB2YXIgaG91cnMgICA9IE1hdGguZmxvb3Ioc2VjX251bSAvIDM2MDApO1xuICAgICAgICAgICAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNfbnVtIC0gKGhvdXJzICogMzYwMCkpIC8gNjApO1xuICAgICAgICAgICAgdmFyIHNlY29uZHMgPSBzZWNfbnVtIC0gKGhvdXJzICogMzYwMCkgLSAobWludXRlcyAqIDYwKTtcbiAgICAgICAgXG4gICAgICAgICAgICBpZiAoaG91cnMgICA8IDEwKSB7aG91cnMgICA9IFwiMFwiK2hvdXJzO31cbiAgICAgICAgICAgIGlmIChtaW51dGVzIDwgMTApIHttaW51dGVzID0gXCIwXCIrbWludXRlczt9XG4gICAgICAgICAgICBpZiAoc2Vjb25kcyA8IDEwKSB7c2Vjb25kcyA9IFwiMFwiK3NlY29uZHM7fVxuICAgICAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgbWludXRlcyArICc6JyArIHNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGltZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGltZXJFbC5pbm5lckhUTUwgPSBgPHNwYW4gaWQ9XCJqeHdvcmQtdGltZXItdGV4dC0ke3RoaXMudWlkfVwiPiR7Zm9ybWF0VGltZSh0aGlzLnN0YXRlLnRpbWVfdGFrZW4pfTwvc3Bhbj5gO1xuICAgIH1cblxuICAgIGh1bWFuVGltZSgpIHtcbiAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHRoaXMuc3RhdGUudGltZV90YWtlbjtcbiAgICAgICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICAgICAgY29uc3QgaG91cnMgPSBNYXRoLmZsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHNMZWZ0ID0gc2Vjb25kcyAtIChtaW51dGVzICogNjApO1xuICAgICAgICBjb25zdCBtaW51dGVzTGVmdCA9IG1pbnV0ZXMgLSAoaG91cnMgKiA2MCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHNfcGx1cmFsID0gc2Vjb25kc0xlZnQgPT0gMSA/IFwiXCIgOiBcInNcIjtcbiAgICAgICAgY29uc3QgbWludXRlc19wbHVyYWwgPSBtaW51dGVzTGVmdCA9PSAxID8gXCJcIiA6IFwic1wiO1xuICAgICAgICBjb25zdCBob3Vyc19wbHVyYWwgPSBob3VycyA9PSAxID8gXCJcIiA6IFwic1wiO1xuICAgICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtzZWNvbmRzfSBzZWNvbmQke3NlY29uZHNfcGx1cmFsfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhvdXJzID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHttaW51dGVzfSBtaW51dGUke21pbnV0ZXNfcGx1cmFsfSBhbmQgJHtzZWNvbmRzTGVmdH0gc2Vjb25kJHtzZWNvbmRzX3BsdXJhbH1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtob3Vyc30gaG91ciR7aG91cnNfcGx1cmFsfSwgJHttaW51dGVzTGVmdH0gbWludXRlJHttaW51dGVzX3BsdXJhbH0gYW5kICR7c2Vjb25kc0xlZnR9IHNlY29uZCR7c2Vjb25kc19wbHVyYWx9YDtcbiAgICB9XG5cbiAgICBkcmF3U2hhcmUoKSB7XG4gICAgICAgIGNvbnN0IGVuY29kZWRfcHJvZHVjdF9uYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucHJvZHVjdF9uYW1lKTtcbiAgICAgICAgY29uc3Qgc2hhcmVfaHRtbCA9IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXNoYXJlLW9wdGlvblwiPlxuICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P3RleHQ9SSUyMGp1c3QlMjBjb21wbGV0ZWQlMjB0aGUlMjAke2VuY29kZWRfcHJvZHVjdF9uYW1lfSUyMGluJTIwJHt0aGlzLnN0YXRlLnRpbWVfdGFrZW59JTIwc2Vjb25kcyElMjBDYW4lMjB5b3UlMjBiZWF0JTIwbXklMjB0aW1lPyZ1cmw9JHtlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLmhyZWYpfVwiIHRhcmdldD1cIl9ibGFua1wiPjxzcGFuIGNsYXNzPVwiZGFzaGljb25zIGRhc2hpY29ucy10d2l0dGVyXCI+PC9zcGFuPiBTaGFyZSB5b3VyIHJlc3VsdHMgb24gVHdpdHRlcjwvYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1zaGFyZS1vcHRpb25cIj5cbiAgICAgICAgICAgIDxhIGhyZWY9XCJ3aGF0c2FwcDovL3NlbmQ/dGV4dD1JJTIwanVzdCUyMGNvbXBsZXRlZCUyMHRoZSUyMCR7ZW5jb2RlZF9wcm9kdWN0X25hbWV9JTIwaW4lMjAke3RoaXMuc3RhdGUudGltZV90YWtlbn0lMjBzZWNvbmRzISUyMENhbiUyMHlvdSUyMGJlYXQlMjBteSUyMHRpbWU/JTIwJHtlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLmhyZWYpfVwiIHRhcmdldD1cIl9ibGFua1wiPjxzcGFuIGNsYXNzPVwiZGFzaGljb25zIGRhc2hpY29ucy13aGF0c2FwcFwiPjwvc3Bhbj4gU2hhcmUgeW91ciByZXN1bHRzIG9uIFdoYXRzQXBwPC9hPlxuICAgICAgICA8L2Rpdj5gO1xuICAgICAgICBjb25zdCBzaGFyZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5X3NoYXJlLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHNoYXJlRWwuaW5uZXJIVE1MID0gc2hhcmVfaHRtbDtcbiAgICAgICAgY29uc3QgdGltZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5X3RpbWUtJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGltZUVsLmlubmVySFRNTCA9IGBZb3VyIHRpbWU6ICR7dGhpcy5odW1hblRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKX1gO1xuICAgIH1cblxuICAgIGlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykge1xuICAgICAgICBpZiAoKGNvbCA9PT0gMCkgJiYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gIT09IFwiI1wiKSAmJiAodGhpcy5ncmlkW2NvbCArIDFdW3Jvd10gIT09IFwiI1wiKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuZ3JpZFtjb2wgKyAxXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoKGNvbCA9PT0gMCkgfHwgKHRoaXMuZ3JpZFtjb2wgLSAxXVtyb3ddID09IFwiI1wiKSkge1xuICAgICAgICAgICAgLy8gaWYgKHJvdyA8IHRoaXMuZ3JpZFswXS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMuZ3JpZFtjb2xdW3JvdyArIDFdICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICBpc1N0YXJ0T2ZEb3duKGNvbCwgcm93KSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuZ3JpZFtjb2xdW3JvdyArIDFdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgocm93ID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbF1bcm93IC0gMV0gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAoY29sIDwgdGhpcy5ncmlkLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbCArIDFdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBkcmF3TnVtYmVycygpIHtcbiAgICAgICAgLy8gQSBjZWxsIGdldHMgYSBudW1iZXIgaWYgaXQgaGFzIGEgYmxvY2sgb3IgZWRnZSBhYm92ZSBvciB0byB0aGUgbGVmdCBvZiBpdCwgYW5kIGEgYmxhbmsgbGV0dGVyIHRvIHRoZSBib3R0b20gb3IgcmlnaHQgb2YgaXQgcmVzcGVjdGl2ZWx5XG4gICAgICAgIC8vIFBvcHVsYXRlIGEgbnVtYmVyIGdyaWQgd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgbGV0IG51bSA9IDE7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRyYXdOdW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2wgIT09IHRoaXMub3B0cy5jb2xzIC0gMSAmJiB0aGlzLmdyaWRbY29sKzFdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3TnVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLm9wdHMuZGF0YS5hY3Jvc3MuZmluZChxID0+IHEubnVtID09PSBgQSR7bnVtfWApXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvdyAhPT0gdGhpcy5vcHRzLnJvd3MgLSAxICYmIHRoaXMuZ3JpZFtjb2xdW3JvdysxXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdOdW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb3duX3F1ZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLm9wdHMuZGF0YS5kb3duLmZpbmQocSA9PiBxLm51bSA9PT0gYEQke251bX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gbGV0IGRyYXdOdW0gPSB0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykgfHwgdGhpcy5pc1N0YXJ0T2ZEb3duKGNvbCwgcm93KTtcbiAgICAgICAgICAgICAgICBpZiAoZHJhd051bSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdOdW1iZXIoY29sLCByb3csIG51bSsrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3TnVtYmVyKGNvbCwgcm93LCBudW0pIHtcbiAgICAgICAgY29uc3QgbnVtRm9udFNpemUgPSB0aGlzLmNlbGxXaWR0aCAqIHRoaXMub3B0cy5udW1SYXRpbztcbiAgICAgICAgY29uc3QgeCA9ICh0aGlzLmNlbGxXaWR0aCAqIGNvbCkgKyB0aGlzLm9wdHMubWFyZ2luICsgKHRoaXMuY2VsbFdpZHRoICogMC4wNCk7XG4gICAgICAgIGNvbnN0IHkgPSAodGhpcy5jZWxsSGVpZ2h0ICogcm93KSArIHRoaXMub3B0cy5tYXJnaW4gLSAodGhpcy5jZWxsV2lkdGggKiAwLjAyKSArIG51bUZvbnRTaXplO1xuICAgICAgICBjb25zdCBjZWxsRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHsgdGhpcy51aWQgfS0keyBjb2wgfS0keyByb3cgfWApO1xuICAgICAgICBcbiAgICAgICAgY2VsbEVsLmlubmVySFRNTCArPSBgPHRleHQgeD1cIiR7IHggfVwiIHk9XCIkeyB5IH1cIiB0ZXh0LWFuY2hvcj1cImxlZnRcIiBmb250LXNpemU9XCIkeyBudW1Gb250U2l6ZSB9XCI+JHsgbnVtIH08L3RleHQ+YFxuICAgIH1cblxuICAgIGRyYXdCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwLmlubmVySFRNTCArPSBgPHJlY3QgeD1cIiR7dGhpcy5vcHRzLm1hcmdpbn1cIiB5PVwiJHt0aGlzLm9wdHMubWFyZ2lufVwiIHdpZHRoPVwiJHt0aGlzLm9wdHMud2lkdGh9XCIgaGVpZ2h0PVwiJHt0aGlzLm9wdHMuaGVpZ2h0fVwiIHN0cm9rZT1cIiR7dGhpcy5vcHRzLm91dGVyQm9yZGVyQ29sb3VyIH1cIiBzdHJva2Utd2lkdGg9XCIke3RoaXMub3B0cy5vdXRlckJvcmRlcldpZHRoIH1cIiBmaWxsPVwibm9uZVwiPmA7XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9ucygpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcy0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+YFxuICAgICAgICB0aGlzLm9wdHMuZGF0YS5hY3Jvc3MuZm9yRWFjaChxID0+IHtcbiAgICAgICAgICAgIGFjcm9zcyArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHt0aGlzLnVpZH1gKS5pbm5lckhUTUwgKz0gYWNyb3NzO1xuICAgICAgICBsZXQgZG93biA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdFwiPmBcbiAgICAgICAgdGhpcy5vcHRzLmRhdGEuZG93bi5mb3JFYWNoKHEgPT4ge1xuICAgICAgICAgICAgZG93biArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1kb3duLSR7dGhpcy51aWR9YCkuaW5uZXJIVE1MICs9IGRvd247XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9uKHEpIHtcbiAgICAgICAgcmV0dXJuIGA8bGkgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke3EubnVtfS0ke3RoaXMudWlkfVwiIGRhdGEtcT1cIiR7cS5udW19XCI+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1udW1cIj4ke3EubnVtLnJlcGxhY2UoL15cXEQvLCBcIlwiKX08L3NwYW4+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1xdWVzdGlvblwiPiR7cS5xdWVzdGlvbn08L3NwYW4+PC9saT5gO1xuICAgIH1cblxuICAgIHNob3dPdmVybGF5KHN0YXRlID0gXCJwYXVzZWRcIikge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1wYXVzZWRcIikuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1jb21wbGV0ZV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWV0YV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgaWYgKHN0YXRlID09PSBcInBhdXNlZFwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1wYXVzZWRcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1jb21wbGV0ZV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFwibWV0YVwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1tZXRhX292ZXJsYXlcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1vdmVybGF5LWhpZGVcIik7XG4gICAgfVxuXG4gICAgaGlkZU92ZXJsYXkoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtb3ZlcmxheS1oaWRlXCIpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICB9XG5cbiAgICBjaGVja092ZXJsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcInBhdXNlZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZU92ZXJsYXkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFN0YXRlKCkge1xuICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7IC8vIDAgPSBhY3Jvc3MsIDEgPSBkb3duXG4gICAgICAgIHRoaXMuc3RhdGUuY29tcGxldGUgPSBmYWxzZTsgLy8gQXJlIHdlIGRvbmUgeWV0P1xuICAgICAgICB0aGlzLnN0YXRlLmhpbnRzID0gZmFsc2U7IC8vIEhhZCBhbnkgaGVscD9cbiAgICAgICAgdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDsgLy8gSG93IGxvbmcgaGF2ZSB3ZSBiZWVuIHBsYXlpbmc/XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGggPSBuZXcgQXJyYXkodGhpcy5vcHRzLmNvbHMpLmZpbGwoXCJcIikubWFwKCgpID0+IG5ldyBBcnJheSh0aGlzLm9wdHMucm93cykuZmlsbChcIlwiKSk7IC8vIEEgbWF0cml4IGZpbGxlZCB3aXRoIGVtcHR5IGNoYXJzXG4gICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykgeyAvLyBGaWxsIGluIHRoZSAjJ3NcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XSA9IFwiI1wiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuc3RhdGUuZ3JhcGgpO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHNjYWxhcnMgKGZvciBhY3Jvc3MgYW5kIGRvd24pIHRoYXQgd2UgdXNlIHdoZW4gZGVjaWRpbmcgd2hpY2ggY2VsbCB0byBnbyB0byBpbiB0aGUgZXZlbnQgdGhhdCBhIGxldHRlciBpcyB0eXBlZCwgdGFiIGlzIHByZXNzZWQgZXRjLiBcbiAgICAgICAgLy8gRG93biBTY2FsYXJcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duID0gW107XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHF1ZXN0aW9uIG9mIHRoaXMuZG93bl9xdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93bi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcXVlc3Rpb24uZGF0YS5hbnN3ZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sLFxuICAgICAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyArIGksXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckRvd24pO1xuICAgICAgICAvLyBBY3Jvc3MgU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzID0gW107XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgcXVlc3Rpb24gb2YgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcXVlc3Rpb24uZGF0YS5hbnN3ZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wgKyBpLFxuICAgICAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mV29yZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgICAgICBxOiBxdWVzdGlvbi5udW0sXG4gICAgICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbCA9IFt0aGlzLnN0YXRlLnNjYWxhckFjcm9zc1swXS5jb2wsIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzWzBdLnJvd107IC8vIFN0YXJ0IGF0IGZpcnN0IGFjcm9zc1xuICAgICAgICAvLyBDb3JyZWN0IGdyaWRcbiAgICAgICAgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZCA9IG5ldyBBcnJheSh0aGlzLm9wdHMuY29scykuZmlsbChmYWxzZSkubWFwKCgpID0+IG5ldyBBcnJheSh0aGlzLm9wdHMucm93cykuZmlsbChmYWxzZSkpO1xuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICB0aGlzLnN0YXRlLnByb2dyZXNzID0gMDtcbiAgICAgICAgdGhpcy5zdGF0ZS5xdWFydGlsZSA9IDA7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTYXZpbmcgU3RhdGVcIik7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnN0b3JhZ2VOYW1lLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlKSk7XG4gICAgfVxuXG4gICAgcmVzdG9yZVN0YXRlKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxldHRlciA9IHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXV0b2NoZWNrKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlUmVzdG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiU3RhdGUgUmVzdG9yZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWxjSGFzaChtYXRyaXgpIHtcbiAgICAgICAgbGV0IHMgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHMgKz0gbWF0cml4W2NvbF1bcm93XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaGFzaCA9IDAsIGNocjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjaHIgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgICAgICAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGhhc2gsIHMpO1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICBtYXJrQ2VsbHMoKSB7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWNlbGwtcmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGFsbENlbGxzLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLmJhY2tncm91bmRDb2xvdXIpO1xuICAgICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICAgIH0pXG4gICAgICAgIGxldCBjdXJyZW50Q2VsbFJlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIH0tJHsgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSB9ID4gcmVjdGApO1xuICAgICAgICBjdXJyZW50Q2VsbFJlY3Quc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0Q2VsbENvbG91cik7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAxKTtcbiAgICAgICAgbGV0IG1hcmtlZENlbGwgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5jb2xzOyBjb3VudCArKykge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAtIDE7IGNvdW50ID49IDA7IGNvdW50LS0pIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y291bnR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXX0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5yb3dzOyBjb3VudCsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdfS0ke2NvdW50fSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhpZ2hsaWdodFF1ZXN0aW9uKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQWN0aW9ucygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHRoaXMudmlzaWJpbGl0eUNoYW5nZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJyZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgZm9yKGxldCBjZWxsIG9mIGFsbENlbGxzKSB7XG4gICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNhdGNoQ2VsbENsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuY2F0Y2hLZXlQcmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hcnJvdy1mb3J3YXJkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubW92ZVRvTmV4dFdvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctYmFjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb1ByZXZpb3VzV29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmp4d29yZC1yZXNldGApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2VsZi5yZXNldC5iaW5kKHNlbGYpKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtbWV0YS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNob3dNZXRhLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnRvZ2dsZUF1dG9jaGVjay5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hlY2tXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3NxdWFyZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrU3F1YXJlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3B1enpsZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrUHV6emxlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXNpbmdsZS1xdWVzdGlvbi0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoYW5nZURpcmVjdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgY29uc3Qga2V5cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWtleVwiKTtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAgICAgICAga2V5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmtleUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wYXVzZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnBsYXkuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtY2xvc2Utb3ZlcmxheWApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYuaGlkZU92ZXJsYXkuYmluZChzZWxmKSkpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXByaW50X2JsYW5rLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJpbnRCbGFuay5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wcmludF9maWxsZWQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wcmludEZpbGxlZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICB2aXNpYmlsaXR5Q2hhbmdlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlKTtcbiAgICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgdGhpcy5pc19oaWRkZW4gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJ2aXNpYmxlXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiUGF1c2VcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnJlc3VtZVwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmlzX3BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQbGF5XCI7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnBhdXNlXCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBsYXlcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnJlc3VtZVwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzaG93TWV0YShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcIm1ldGFcIik7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KClcbiAgICB9XG5cbiAgICBwcmludEJsYW5rKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpXG4gICAgICAgIGNvbnN0IHN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc3ZnLSR7dGhpcy51aWR9YCkuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBjb25zdCBsZXR0ZXJzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtbGV0dGVyYCk7XG4gICAgICAgIGZvciAobGV0IGxldHRlciBvZiBsZXR0ZXJzKSB7XG4gICAgICAgICAgICBsZXR0ZXIucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcmludChzdmcpO1xuICAgIH1cblxuICAgIHByaW50RmlsbGVkKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICBjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLnByaW50KHN2Zyk7XG4gICAgfVxuXG4gICAgcHJpbnQoc3ZnKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHN2Zyk7XG4gICAgICAgIGNvbnN0IHN2Z190ZXh0ID0gc3ZnLm91dGVySFRNTC5yZXBsYWNlKC9maWxsPVwiI2Y3ZjQ1N1wiL2csIGBmaWxsPVwiI2ZmZmZmZlwiYCkucmVwbGFjZSgvZmlsbD1cIiM5Y2UwZmJcIi9nLCBgZmlsbD1cIiNmZmZmZmZcImApO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfYWNyb3NzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbnMtYWNyb3NzLSR7dGhpcy51aWR9YCkub3V0ZXJIVE1MO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfZG93biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1gKS5vdXRlckhUTUw7XG4gICAgICAgIGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8aHRtbD48aGVhZD48dGl0bGU+JHt0aGlzLm9wdHMuZGF0YS5tZXRhLlRpdGxlfTwvdGl0bGU+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8c3R5bGU+XG4gICAgICAgICAgICAuc3ZnLWNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAzNWVtO1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6YmxvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAuanh3b3JkLXN2ZyB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdCB7XG4gICAgICAgICAgICAgICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMS41O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLW51bSB7XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA1cHg7XG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDI1cHg7XG4gICAgICAgICAgICAgICAgbWluLXdpZHRoOiAyNXB4O1xuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLnF1ZXN0aW9ucyB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgICAgICAgICAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgPC9zdHlsZT5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJzdmctY29udGFpbmVyXCI+JHtzdmdfdGV4dH08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJxdWVzdGlvbnNcIj5cXG5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXY+PGg0PkFjcm9zczwvaDQ+XFxuJHtxdWVzdGlvbnNfYWNyb3NzfTwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGRpdj48aDQ+RG93bjwvaDQ+XFxuJHtxdWVzdGlvbnNfZG93bn08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuICAgICAgICBwcmludFdpbmRvdy5mb2N1cygpO1xuICAgICAgICBwcmludFdpbmRvdy5wcmludCgpO1xuICAgICAgICBwcmludFdpbmRvdy5jbG9zZSgpO1xuICAgIH1cblxuICAgIGNhdGNoQ2VsbENsaWNrKGUpIHtcbiAgICAgICAgY29uc3QgY29sID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQuY29sKTtcbiAgICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQucm93KTtcbiAgICAgICAgaWYgKChjb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0pICYmIChyb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKSB7IC8vIENsaWNrZWQgb24gYWxyZWFkeSBzZWxlY3RlZCBjZWxsXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSByb3c7XG4gICAgICAgICAgICBjb25zdCB3b3JkID0gdGhpcy5nZXRXb3JkKHRoaXMuc3RhdGUuZGlyZWN0aW9uLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICBpZiAoIXdvcmQpIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0Q2VsbCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50U2NhbGFySW5kZXggPSBzY2FsYXIuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgaXRlbS5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoY3VycmVudFNjYWxhckluZGV4IDwgc2NhbGFyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0uY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltjdXJyZW50U2NhbGFySW5kZXggKyAxXS5yb3c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgdHlwZUxldHRlcihsZXR0ZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNMZXR0ZXIgPSAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPSBsZXR0ZXI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pXG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAvLyB0aGlzLmNoZWNrSGludCgpO1xuICAgICAgICB0aGlzLmNoZWNrV2luKCk7XG4gICAgICAgIGlmICghaGFzTGV0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhdGNoS2V5UHJlc3MoZSkge1xuICAgICAgICBjb25zdCBrZXljb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgaWYgKGUubWV0YUtleSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludGFibGUgPSAoa2V5Y29kZSA+IDY0ICYmIGtleWNvZGUgPCA5MSk7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkgcmV0dXJuOyAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBwYXVzZWRcbiAgICAgICAgaWYgKHByaW50YWJsZSAmJiAhdGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbGV0dGVyID0gZS5rZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMudHlwZUxldHRlcihsZXR0ZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDgpIHsgLy8gQmFja3NwYWNlXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuY29tcGxldGUpIHsgLy8gRG9uJ3QgYWxsb3cgY2hhbmdlcyBpZiB3ZSd2ZSBmaW5pc2hlZCBvdXIgcHV6emxlXG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09IDMyKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIGlmICgoa2V5Y29kZSA9PT0gOSkgfHwgKGtleWNvZGUgPT09IDEzKSkgeyAvLyBUYWIgb3IgRW50ZXJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0V29yZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM3KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzgpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVVwKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNDApIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZURvd24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB4LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVVcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB5LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3ldICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4IDwgdGhpcy5vcHRzLnJvd3MgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHgrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbeF1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggKzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4ICsxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW2luZGV4ICsxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHkgPCB0aGlzLm9wdHMuY29scyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRTY2FsYXJzKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChhY3Jvc3MpIHtcbiAgICAgICAgICAgIGFjcm9zcy5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgaWYgKGRvd24pIHtcbiAgICAgICAgICAgIGRvd24ubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dG9jaGVjaykge1xuICAgICAgICAgICAgaWYgKGxldHRlciA9PT0gdGhpcy5ncmlkW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgIGlmIChkb3duKSBkb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChhY3Jvc3MpIGFjcm9zcy5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0KCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGN1cnNvcik7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh4LCBzY2FsYXJbeF0pO1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNMZXR0ZXIoKSB7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgbGV0IGN1cnNvciA9IGN1cnJlbnRDZWxsLmluZGV4IC0gMTtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvcjsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbeF0uY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbeF0ucm93O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pIHtcbiAgICAgICAgICAgIC8vIE1vdmUgYmFjayBhbmQgdGhlbiBkZWxldGVcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3TGV0dGVyKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gXCJcIjtcbiAgICAgICAgdGhpcy5zZXRTY2FsYXJzKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNvbXBsZXRlKCk7XG4gICAgfVxuICAgIFxuICAgIG1vdmVUb05leHRXb3JkKCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIGlmICghY3Vyc29yKSByZXR1cm47XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsICYmIG5leHRDZWxsLmxldHRlciAhPT0gXCJcIikgeyAvLyBGaXJzdCBsZXR0ZXIgaXMgbm90IGJsYW5rLCBcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBuZXh0Q2VsbC5pbmRleCArIDE7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IG90aGVyU2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICBpZiAobmV4dEJsYW5rKSB7IC8vIElzIHRoZXJlIHN0aWxsIGEgYmxhbmsgZG93bj9cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dEJsYW5rLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dEJsYW5rLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZmluZFN0YXJ0T2ZDdXJyZW50V29yZCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvci5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBzdGFydE9mQ3VycmVudFdvcmQgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXJ0T2ZDdXJyZW50V29yZDtcbiAgICB9XG5cbiAgICBtb3ZlVG9QcmV2aW91c1dvcmQoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGZpbmRMYXN0KGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBhcnJheVtpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKHgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBNb3ZlIHRvIGZpc3QgbGV0dGVyIG9mIGN1cnJlbnQgd29yZCwgdGhlbiBzZWFyY2ggYmFja3dhcmQgZm9yIGEgZnJlZSBzcGFjZSwgdGhlbiBtb3ZlIHRvIHRoZSBzdGFydCBvZiB0aGF0IHdvcmQsIHRoZW4gbW92ZSBmb3J3YXJkIHVudGlsIGEgZnJlZSBzcGFjZVxuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gdGhpcy5zdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgbGV0IGJsYW5rU3BhY2UgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGdvaW5nIGJhY2sgdW50aWwgd2UgaGl0IGEgYmxhbmsgc3BhY2VcbiAgICAgICAgaWYgKHN0YXJ0T2ZDdXJyZW50V29yZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHN0YXJ0T2ZDdXJyZW50V29yZC5pbmRleCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmxhbmtTcGFjZSA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mTGFzdFdvcmQgPSBudWxsO1xuICAgICAgICBpZiAoYmxhbmtTcGFjZSkge1xuICAgICAgICAgICAgLy8gTm93IGZpbmQgc3RhcnQgb2YgdGhpcyB3b3JkXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gYmxhbmtTcGFjZS5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZMYXN0V29yZCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydE9mTGFzdFdvcmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBzdGFydE9mTGFzdFdvcmQuaW5kZXg7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IGZpbmRMYXN0KG90aGVyU2NhbGFyLCBjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIGxldCBzdGFydE9mV29yZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IG5leHRCbGFuay5pbmRleDsgeCA+PSAwOyB4LS0pIHsgLy8gTW92ZSB0byBzdGFydCBvZiB3b3JkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdGhlclNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQgPSBvdGhlclNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzdGFydE9mV29yZC5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHN0YXJ0T2ZXb3JkLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0Rm9jdXMoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLWNlbGwtcmVjdFwiKS5mb2N1cygpO1xuICAgICAgICAvLyB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBjaGVja1dpbigpIHtcbiAgICAgICAgbGV0IHdpbiA9IHRydWU7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5ncmlkLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuZ3JpZFt4XS5sZW5ndGg7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IFwiI1wiKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsZXQgc2NhbGFyQWNyb3NzID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgbGV0IHNjYWxhckRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gdGhpcy5zdGF0ZS5ncmFwaFt4XVt5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyQWNyb3NzKSBzY2FsYXJBY3Jvc3MuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJBY3Jvc3MpIHNjYWxhckFjcm9zcy5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgd2luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ29tcGxldGUoKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5V2luKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNwbGF5V2luKCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1vdmVybGF5LXRpdGxlXCIpLmlubmVySFRNTCA9IFwiWW91IFdpbiFcIjtcbiAgICAgICAgdGhpcy5kcmF3U2hhcmUoKTtcbiAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcImNvbXBsZXRlXCIpO1xuICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuYXVkaW8pIHRoaXMuYXVkaW8ucGxheSgpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJqeHdvcmQ6Y29tcGxldGVcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgIH1cblxuICAgIGhpZ2hsaWdodFF1ZXN0aW9uKGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBkID0gbnVsbDtcbiAgICAgICAgbGV0IGNlbGwgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICAgICAgZCA9IFwiQVwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgICAgIGQgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY2VsbCkgcmV0dXJuO1xuICAgICAgICBsZXQgcSA9IGNlbGwucTtcbiAgICAgICAgdmFyIGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS5hY3RpdmVcIik7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtcywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25FbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7ZH0ke3F9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIGlmICghcXVlc3Rpb25FbCkgcmV0dXJuO1xuICAgICAgICBxdWVzdGlvbkVsLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh7IHF1ZXN0aW9uRWwgfSk7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSAgY29uc29sZS5sb2coYCNqeHdvcmQtcXVlc3Rpb24tJHtkfS0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLmVuc3VyZVZpc2liaWxpdHkocXVlc3Rpb25FbCwgcXVlc3Rpb25FbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQpO1xuICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZH0ke2NlbGwucX1gKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtc2luZ2xlLXF1ZXN0aW9uXCIpLmlubmVySFRNTCA9IGAke3F1ZXN0aW9uLnF1ZXN0aW9ufWA7XG4gICAgfVxuXG4gICAgZW5zdXJlVmlzaWJpbGl0eShlbCwgY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyUmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKHJlY3QuYm90dG9tID4gY29udGFpbmVyUmVjdC5ib3R0b20pIHtcbiAgICAgICAgICAgIGVsLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVjdC50b3AgPCBjb250YWluZXJSZWN0LnRvcCkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsaXN0ZW5RdWVzdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW1cIik7XG4gICAgICAgIGZvcihsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICBxdWVzdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbGlja1F1ZXN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xpY2tRdWVzdGlvbihlKSB7XG4gICAgICAgIGNvbnN0IHEgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5xO1xuICAgICAgICBjb25zdCBkaXIgPSBxWzBdO1xuICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIocS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKGRpciA9PT0gXCJBXCIpIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwucSA9PT0gbnVtKSB7XG4gICAgICAgICAgICAgICAgLy8gTW92ZSB0byB0aGUgZmlyc3QgZW1wdHkgbGV0dGVyIGluIGEgd29yZC4gSWYgdGhlcmUgaXNuJ3QgYW4gZW1wdHkgbGV0dGVyLCBtb3ZlIHRvIHN0YXJ0IG9mIHdvcmQuXG4gICAgICAgICAgICAgICAgbGV0IGVtcHR5bGV0dGVycyA9IHNjYWxhci5maWx0ZXIod29yZGNlbGwgPT4gd29yZGNlbGwucSA9PT0gbnVtICYmIHdvcmRjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5bGV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGVtcHR5bGV0dGVyc1swXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBlbXB0eWxldHRlcnNbMF0ucm93O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBjZWxsLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGNlbGwucm93O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHNldEFyaWEoKSB7XG4gICAgICAgIGxldCB0aCA9IG51bSA9PiB7XG4gICAgICAgICAgICBpZiAobnVtID09PSAxKSByZXR1cm4gXCIxc3RcIjtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDIpIHJldHVybiBcIjJuZFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMykgcmV0dXJuIFwiM3JkXCI7XG4gICAgICAgICAgICByZXR1cm4gYCR7bnVtfXRoYDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZnVsbHN0b3AgPSBzID0+IHtcbiAgICAgICAgICAgIGlmIChzLm1hdGNoKC9bLj9dJC8pKSByZXR1cm4gcztcbiAgICAgICAgICAgIHJldHVybiBgJHtzfS5gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgZGlyTGV0dGVyID0gbnVsbDtcbiAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIGRpckxldHRlciA9XCJBXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuYWNyb3NzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgZGlyTGV0dGVyID0gXCJEXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuZG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbGV0dGVyQ291bnQgPSAxO1xuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwuc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZGlyTGV0dGVyfSR7Y2VsbC5xfWApO1xuICAgICAgICAgICAgaWYgKCFxdWVzdGlvbikgY29udGludWU7XG4gICAgICAgICAgICBsZXQgd29yZExlbmd0aCA9IHF1ZXN0aW9uLnF1ZXN0aW9uLmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBzID0gYCR7cXVlc3Rpb24ubnVtfS4gJHtmdWxsc3RvcChxdWVzdGlvbi5xdWVzdGlvbil9ICR7d29yZExlbmd0aH0gbGV0dGVycywgJHt0aChsZXR0ZXJDb3VudCl9IGxldHRlci5gXG4gICAgICAgICAgICBsZXR0ZXJDb3VudCsrO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y2VsbC5jb2x9LSR7Y2VsbC5yb3d9ID4gLmp4d29yZC1jZWxsLXJlY3RgKSAuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjaGVhdGVkID0gdGhpcy5zdGF0ZS5jaGVhdGVkO1xuICAgICAgICB0aGlzLnNldFN0YXRlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IGNoZWF0ZWQ7IC8vIE5pY2UgdHJ5IVxuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLnJlc3RvcmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmhpZGVPdmVybGF5KCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpyZXNldFwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgfVxuXG4gICAgY2hhbmdlRGlyZWN0aW9uKCkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY2FuIGNoYW5nZSBkaXJlY3Rpb24uXG4gICAgICAgIGNvbnN0IHdvcmQgPSB0aGlzLmdldFdvcmQoIXRoaXMuc3RhdGUuZGlyZWN0aW9uLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgaWYgKCF3b3JkKSByZXR1cm47XG4gICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gIXRoaXMuc3RhdGUuZGlyZWN0aW9uO1xuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICB0aGlzLnNldEFyaWEoKTtcblxuICAgIH1cblxuICAgIGdldFdvcmQoZGlyZWN0aW9uLCBjb2wsIHJvdykge1xuICAgICAgICBsZXQgY2VsbCA9IG51bGw7XG4gICAgICAgIGlmICghZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY29sID09PSBjZWxsLmNvbCAmJiByb3cgPT09IGNlbGwucm93KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY29sID09PSBjZWxsLmNvbCAmJiByb3cgPT09IGNlbGwucm93KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNlbGw7XG4gICAgfVxuXG4gICAga2V5Q2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGVsID0gZS50YXJnZXQ7XG4gICAgICAgIGxldCBsZXR0ZXIgPSBlbC5kYXRhc2V0LmtleTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgbGV0dGVyIH0pO1xuICAgICAgICBpZiAobGV0dGVyID09PSBcIkJBQ0tTUEFDRVwiKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50eXBlTGV0dGVyKGxldHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1RpbGUoeCwgeSkge1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSBcIiNcIikgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt4XVt5XSkgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSB0aGlzLnN0YXRlLmdyYXBoW3hdW3ldKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdW3ldID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0xldHRlcih0aGlzLmdyaWRbeF1beV0sIHgsIHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tTcXVhcmUoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuY2hlY2tUaWxlKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrV29yZChlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBcIlwiO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSB0aGlzLmZpbmRTdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgdGhpcy5jaGVja1RpbGUoc3RhcnRPZkN1cnJlbnRXb3JkLmNvbCwgc3RhcnRPZkN1cnJlbnRXb3JkLnJvdyk7XG4gICAgICAgIGxldCBpID0gc3RhcnRPZkN1cnJlbnRXb3JkLmluZGV4ICsgMTtcbiAgICAgICAgd2hpbGUoc2NhbGFyW2ldICYmICFzY2FsYXJbaV0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjYWxhcltpXSk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVGlsZShzY2FsYXJbaV0uY29sLCBzY2FsYXJbaV0ucm93KTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrUHV6emxlKGUpIHtcbiAgICAgICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZm9yKGxldCB4ID0gMDsgeCA8IHRoaXMuc3RhdGUuY29ycmVjdEdyaWQubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvcihsZXQgeSA9IDA7IHkgPCB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja1RpbGUoeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEF1dG9jaGVjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2sgJmNoZWNrO1wiO1xuICAgICAgICAgICAgdGhpcy5jaGVja1B1enpsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH0gPiBsaWApLmlubmVySFRNTCA9IFwiQXV0b2NoZWNrXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGVBdXRvY2hlY2soZSkgeyAvL1RPRE9cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN0YXRlLmF1dG9jaGVjayA9ICF0aGlzLnN0YXRlLmF1dG9jaGVjaztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOmNoZWF0XCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEF1dG9jaGVjaygpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNsb3NlTWVudSgpIHtcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1lbnUtdG9nZ2xlIGlucHV0OmNoZWNrZWRcIik7XG4gICAgICAgIGlmIChpbnB1dEVsKSBpbnB1dEVsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVDb21wbGV0ZSgpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGhvdyBtdWNoIG9mIHRoZSBncmlkIGlzIGZpbGxlZCBpblxuICAgICAgICBsZXQgZmlsbGVkID0gMDtcbiAgICAgICAgbGV0IHRvdGFsX2NlbGxzID0gMDtcbiAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsX2NlbGxzKys7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbGVkKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsbGVkX3BlcmNlbnQgPSBNYXRoLmZsb29yKGZpbGxlZCAvIHRvdGFsX2NlbGxzICogMTAwKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5wcm9ncmVzcyA9IGZpbGxlZF9wZXJjZW50O1xuICAgICAgICB0aGlzLnN0YXRlLnF1YXJ0aWxlID0gTWF0aC5mbG9vcihmaWxsZWRfcGVyY2VudCAvIDI1KTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucXVhcnRpbGUgPiB0aGlzLmxhc3RfcXVhcnRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpwcm9ncmVzc1wiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLmxhc3RfcXVhcnRpbGUgPSB0aGlzLnN0YXRlLnF1YXJ0aWxlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBKWFdvcmQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBKWFdvcmQgZnJvbSBcIi4vanMvanh3b3JkLWdyaWRcIjtcbmltcG9ydCB4ZHBhcnNlciBmcm9tIFwieGQtY3Jvc3N3b3JkLXBhcnNlclwiO1xuaW1wb3J0IFwiLi9jc3Mvanh3b3JkLmxlc3NcIjtcbmltcG9ydCB7RXZlbnRzfSBmcm9tIFwiLi9qcy9ldmVudHNcIjtcblxuYXN5bmMgZnVuY3Rpb24gX2FkZF9jcm9zc3dvcmQoY3Jvc3N3b3JkX2RhdGEsIGNvbnRhaW5lcl9pZCwgZGVidWcgPSBmYWxzZSkge1xuICAgIGlmICghY3Jvc3N3b3JkX2RhdGEpIHJldHVybjtcbiAgICBjb25zdCB1bmVuY29kZWRfZGF0YSA9IGF0b2IoY3Jvc3N3b3JkX2RhdGEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB4ZHBhcnNlcih1bmVuY29kZWRfZGF0YSk7XG4gICAgd2luZG93Lmp4d29yZCA9IG5ldyBKWFdvcmQoeyBcbiAgICAgICAgY29udGFpbmVyOiBgIyR7Y29udGFpbmVyX2lkfWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGRlYnVnXG4gICAgfSk7XG4gICAgd2luZG93Lmp4d29yZC5ldmVudHMgPSBuZXcgRXZlbnRzKGAjJHtjb250YWluZXJfaWR9YCk7XG59XG53aW5kb3cuYWRkX2Nyb3Nzd29yZCA9IF9hZGRfY3Jvc3N3b3JkOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==