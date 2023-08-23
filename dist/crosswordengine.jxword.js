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
/* harmony import */ var fireworks_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fireworks-js */ "./node_modules/fireworks-js/dist/index.es.js");
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
        this.setupIOSKeyboard();
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
                        <div id="jxword-overlay_share-${this.uid}" class="jxword-overlay-share"></div>
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
                                ${ Object.keys(this.opts.data.meta).map(k => k === "Title" ? "" : `<li>${k}:
                                    ${this.opts.data.meta[k]}</li>` ).join("\n") }
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
                                    <a href="#" aria-label="About This Puzzle" class="jxword-button"
                                        id="jxword-meta-${this.uid}">
                                        <li>About This Puzzle</li>
                                    </a>
                                    <li class="jxword-menu-break">
                                        <hr>
                                    </li>
                                    <a href="#" aria-label="Toggle Autocheck" class="jxword-button"
                                        id="jxword-autocheck-${this.uid}">
                                        <li>Autocheck</li>
                                    </a>
                                    <a href="#" aria-label="Check Square" class="jxword-button"
                                        id="jxword-check_square-${this.uid}">
                                        <li>Check Square</li>
                                    </a>
                                    <a href="#" aria-label="Check Puzzle" class="jxword-button"
                                        id="jxword-check_word-${this.uid}">
                                        <li>Check Word</li>
                                    </a>
                                    <a href="#" aria-label="Check Puzzle" class="jxword-button"
                                        id="jxword-check_puzzle-${this.uid}">
                                        <li>Check Puzzle</li>
                                    </a>
                                    <li class="jxword-menu-break">
                                        <hr>
                                    </li>
                                    <a href="#" aria-label="Print (Blank)" class="jxword-button"
                                        id="jxword-print_blank-${this.uid}">
                                        <li>Print (Blank)</li>
                                    </a>
                                    <a href="#" aria-label="Print (Filled)" class="jxword-button"
                                        id="jxword-print_filled-${this.uid}">
                                        <li>Print (Filled)</li>
                                    </a>
                                    <li class="jxword-menu-break">
                                        <hr>
                                    </li>
                                    <a href="#" aria-label="Reset Puzzle" class="jxword-button jxword-reset"
                                        id="jxword-reset-${this.uid}">
                                        <li>Reset</li>
                                    </a>
                                </ul>
                            </div>
                        </nav>
                        <div id="jxword-pause-${this.uid}" class="jxword-pause">
                            <span class="jxword-pause-text jxword-sr-only">Pause</span>
                        </div>
                        <div id="jxword-timer-${this.uid}" class="jxword-timer"></div>
                    </div>
                    <div class="jxword-svg-container">
                        <svg id='jxword-svg-${this.uid}' class='jxword-svg'
                            viewBox="0 0 ${ this.totalWidth } ${ this.totalHeight }">
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
                    <div class="jxword-questions-across" id="jxword-question-across-${ this.uid }">
                        <h4>Across</h4>
                    </div>
                    <div class="jxword-questions-down" id="jxword-question-down-${ this.uid }">
                        <h4>Down</h4>
                    </div>
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
        const urlParams = new URLSearchParams(window.location.search);
        let share_url = urlParams.get('share_url');
        if (!share_url) {
            share_url = window.location.href;
        }
        const time_taken = this.humanTime(this.state.time_taken);
        const encoded_time_taken = encodeURIComponent(time_taken);
        const share_html = `
        <div class="jxword-overlay-share-option jxword-overlay-share-option-clipboard" data-text="I%20just%20completed%20the%20${encoded_product_name}%20in%20${encoded_time_taken}!%20Can%20you%20beat%20my%20time? ${encodeURIComponent(share_url)}">
            <span class="dashicons dashicons-clipboard"></span>&nbsp;&nbsp;Copy your results
        </div>
        <div class="jxword-overlay-share-option">
            <a href="https://twitter.com/intent/tweet?text=I%20just%20completed%20the%20${encoded_product_name}%20in%20${encoded_time_taken}!%20Can%20you%20beat%20my%20time?&url=${encodeURIComponent(share_url)}" target="_blank"><span class="dashicons dashicons-twitter"></span> Share your results on Twitter</a>
        </div>
        <div class="jxword-overlay-share-option">
            <a href="whatsapp://send?text=I%20just%20completed%20the%20${encoded_product_name}%20in%20${encoded_time_taken}!%20Can%20you%20beat%20my%20time?%20${encodeURIComponent(share_url)}" target="_blank"><span class="dashicons dashicons-whatsapp"></span> Share your results on WhatsApp</a>
        </div>`;
        const shareEl = document.querySelector(`#jxword-overlay_share-${this.uid}`);
        shareEl.innerHTML = share_html;
        const timeEl = document.querySelector(`#jxword-overlay_time-${this.uid}`);
        timeEl.innerHTML = `Your time: ${this.humanTime(this.state.time_taken)}`;
        document.querySelector(".jxword-overlay-share-option-clipboard").addEventListener("click", this.copyToClipboard.bind(this));
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
        this.showIOSKeyboard();
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
        const el = document.querySelector(".jxword-cell-rect");
        el.focus();
        this.showIOSKeyboard();
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
        console.log("Fireworks!");
        const fireworks = new fireworks_js__WEBPACK_IMPORTED_MODULE_0__.Fireworks(document.querySelector(".jxword-overlay-content"), {
            acceleration: 1,
            traceSpeed: 3,
        });
        fireworks.start();
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

    isKeyboardShowing() {
        return (window.innerWidth <= 480);
    }

    setupIOSKeyboard() {
        if (this.isKeyboardShowing()) return;
        const inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'text');
        inputElement.setAttribute('id', 'hiddenIOSInput');
        inputElement.setAttribute('autocorrect', 'off');
        inputElement.setAttribute('autocapitalize', 'off');
        inputElement.setAttribute('spellcheck', 'false');
        const top = window.scrollY;
        inputElement.setAttribute('style', `position: absolute; top: ${top}px; left: 0; opacity: 0; width: 0; height: 0; z-index: -100;`);
        let currentTop = top;
        inputElement.addEventListener('keydown', () => {
            currentTop = window.scrollY;
        });
        inputElement.addEventListener('keyup', () => {
            window.scrollTo(0, currentTop);
        });
        this.containerElement.appendChild(inputElement);
    }

    showIOSKeyboard() {
        const top = window.scrollY;
        const inputElement = document.getElementById('hiddenIOSInput');
        if (!inputElement) return;
        inputElement.style.visibility = 'visible'; // unhide the input
        inputElement.style.top = `${top}px`;
        inputElement.style.position = 'absolute';
        inputElement.focus(); // focus on it so keyboard pops
        inputElement.style.visibility = 'hidden'; // hide it again
        window.scrollTo(0, top);
    }

    copyToClipboard(e) {
        const text = e.currentTarget.dataset.text;
        navigator.clipboard.writeText(decodeURIComponent(text));
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (JXWord);

/***/ }),

/***/ "./node_modules/fireworks-js/dist/index.es.js":
/*!****************************************************!*\
  !*** ./node_modules/fireworks-js/dist/index.es.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fireworks: () => (/* binding */ T),
/* harmony export */   "default": () => (/* binding */ T)
/* harmony export */ });
/**
 * name: fireworks-js
 * version: 2.10.7
 * author: Vitalij Ryndin (https://crashmax.ru)
 * homepage: https://fireworks.js.org
 * license MIT
 */
function f(e) {
  return Math.abs(Math.floor(e));
}
function c(e, t) {
  return Math.random() * (t - e) + e;
}
function o(e, t) {
  return Math.floor(c(e, t + 1));
}
function m(e, t, i, s) {
  const n = Math.pow;
  return Math.sqrt(n(e - i, 2) + n(t - s, 2));
}
function x(e, t, i = 1) {
  if (e > 360 || e < 0)
    throw new Error(`Expected hue 0-360 range, got \`${e}\``);
  if (t > 100 || t < 0)
    throw new Error(`Expected lightness 0-100 range, got \`${t}\``);
  if (i > 1 || i < 0)
    throw new Error(`Expected alpha 0-1 range, got \`${i}\``);
  return `hsla(${e}, 100%, ${t}%, ${i})`;
}
const g = (e) => {
  if (typeof e == "object" && e !== null) {
    if (typeof Object.getPrototypeOf == "function") {
      const t = Object.getPrototypeOf(e);
      return t === Object.prototype || t === null;
    }
    return Object.prototype.toString.call(e) === "[object Object]";
  }
  return !1;
}, y = [
  "__proto__",
  "constructor",
  "prototype"
], v = (...e) => e.reduce((t, i) => (Object.keys(i).forEach((s) => {
  y.includes(s) || (Array.isArray(t[s]) && Array.isArray(i[s]) ? t[s] = i[s] : g(t[s]) && g(i[s]) ? t[s] = v(t[s], i[s]) : t[s] = i[s]);
}), t), {});
function b(e, t) {
  let i;
  return (...s) => {
    i && clearTimeout(i), i = setTimeout(() => e(...s), t);
  };
}
class S {
  x;
  y;
  ctx;
  hue;
  friction;
  gravity;
  flickering;
  lineWidth;
  explosionLength;
  angle;
  speed;
  brightness;
  coordinates = [];
  decay;
  alpha = 1;
  constructor({
    x: t,
    y: i,
    ctx: s,
    hue: n,
    decay: h,
    gravity: a,
    friction: r,
    brightness: u,
    flickering: p,
    lineWidth: l,
    explosionLength: d
  }) {
    for (this.x = t, this.y = i, this.ctx = s, this.hue = n, this.gravity = a, this.friction = r, this.flickering = p, this.lineWidth = l, this.explosionLength = d, this.angle = c(0, Math.PI * 2), this.speed = o(1, 10), this.brightness = o(u.min, u.max), this.decay = c(h.min, h.max); this.explosionLength--; )
      this.coordinates.push([t, i]);
  }
  update(t) {
    this.coordinates.pop(), this.coordinates.unshift([this.x, this.y]), this.speed *= this.friction, this.x += Math.cos(this.angle) * this.speed, this.y += Math.sin(this.angle) * this.speed + this.gravity, this.alpha -= this.decay, this.alpha <= this.decay && t();
  }
  draw() {
    const t = this.coordinates.length - 1;
    this.ctx.beginPath(), this.ctx.lineWidth = this.lineWidth, this.ctx.fillStyle = x(this.hue, this.brightness, this.alpha), this.ctx.moveTo(
      this.coordinates[t][0],
      this.coordinates[t][1]
    ), this.ctx.lineTo(this.x, this.y), this.ctx.strokeStyle = x(
      this.hue,
      this.flickering ? c(0, this.brightness) : this.brightness,
      this.alpha
    ), this.ctx.stroke();
  }
}
class E {
  constructor(t, i) {
    this.options = t, this.canvas = i, this.pointerDown = this.pointerDown.bind(this), this.pointerUp = this.pointerUp.bind(this), this.pointerMove = this.pointerMove.bind(this);
  }
  active = !1;
  x;
  y;
  get mouseOptions() {
    return this.options.mouse;
  }
  mount() {
    this.canvas.addEventListener("pointerdown", this.pointerDown), this.canvas.addEventListener("pointerup", this.pointerUp), this.canvas.addEventListener("pointermove", this.pointerMove);
  }
  unmount() {
    this.canvas.removeEventListener("pointerdown", this.pointerDown), this.canvas.removeEventListener("pointerup", this.pointerUp), this.canvas.removeEventListener("pointermove", this.pointerMove);
  }
  usePointer(t, i) {
    const { click: s, move: n } = this.mouseOptions;
    (s || n) && (this.x = t.pageX - this.canvas.offsetLeft, this.y = t.pageY - this.canvas.offsetTop, this.active = i);
  }
  pointerDown(t) {
    this.usePointer(t, this.mouseOptions.click);
  }
  pointerUp(t) {
    this.usePointer(t, !1);
  }
  pointerMove(t) {
    this.usePointer(t, this.active);
  }
}
class O {
  hue;
  rocketsPoint;
  opacity;
  acceleration;
  friction;
  gravity;
  particles;
  explosion;
  mouse;
  boundaries;
  sound;
  delay;
  brightness;
  decay;
  flickering;
  intensity;
  traceLength;
  traceSpeed;
  lineWidth;
  lineStyle;
  autoresize;
  constructor() {
    this.autoresize = !0, this.lineStyle = "round", this.flickering = 50, this.traceLength = 3, this.traceSpeed = 10, this.intensity = 30, this.explosion = 5, this.gravity = 1.5, this.opacity = 0.5, this.particles = 50, this.friction = 0.95, this.acceleration = 1.05, this.hue = {
      min: 0,
      max: 360
    }, this.rocketsPoint = {
      min: 50,
      max: 50
    }, this.lineWidth = {
      explosion: {
        min: 1,
        max: 3
      },
      trace: {
        min: 1,
        max: 2
      }
    }, this.mouse = {
      click: !1,
      move: !1,
      max: 1
    }, this.delay = {
      min: 30,
      max: 60
    }, this.brightness = {
      min: 50,
      max: 80
    }, this.decay = {
      min: 0.015,
      max: 0.03
    }, this.sound = {
      enabled: !1,
      files: [
        "explosion0.mp3",
        "explosion1.mp3",
        "explosion2.mp3"
      ],
      volume: {
        min: 4,
        max: 8
      }
    }, this.boundaries = {
      debug: !1,
      height: 0,
      width: 0,
      x: 50,
      y: 50
    };
  }
  update(t) {
    Object.assign(this, v(this, t));
  }
}
class z {
  constructor(t, i) {
    this.options = t, this.render = i;
  }
  tick = 0;
  rafId = 0;
  fps = 60;
  tolerance = 0.1;
  now;
  mount() {
    this.now = performance.now();
    const t = 1e3 / this.fps, i = (s) => {
      this.rafId = requestAnimationFrame(i);
      const n = s - this.now;
      n >= t - this.tolerance && (this.render(), this.now = s - n % t, this.tick += n * (this.options.intensity * Math.PI) / 1e3);
    };
    this.rafId = requestAnimationFrame(i);
  }
  unmount() {
    cancelAnimationFrame(this.rafId);
  }
}
class L {
  constructor(t, i, s) {
    this.options = t, this.updateSize = i, this.container = s;
  }
  resizer;
  mount() {
    if (!this.resizer) {
      const t = b(() => this.updateSize(), 100);
      this.resizer = new ResizeObserver(t);
    }
    this.options.autoresize && this.resizer.observe(this.container);
  }
  unmount() {
    this.resizer && this.resizer.unobserve(this.container);
  }
}
class M {
  constructor(t) {
    this.options = t, this.init();
  }
  buffers = [];
  audioContext;
  onInit = !1;
  get isEnabled() {
    return this.options.sound.enabled;
  }
  get soundOptions() {
    return this.options.sound;
  }
  init() {
    !this.onInit && this.isEnabled && (this.onInit = !0, this.audioContext = new (window.AudioContext || window.webkitAudioContext)(), this.loadSounds());
  }
  async loadSounds() {
    for (const t of this.soundOptions.files) {
      const i = await (await fetch(t)).arrayBuffer();
      this.audioContext.decodeAudioData(i).then((s) => {
        this.buffers.push(s);
      }).catch((s) => {
        throw s;
      });
    }
  }
  play() {
    if (this.isEnabled && this.buffers.length) {
      const t = this.audioContext.createBufferSource(), i = this.buffers[o(0, this.buffers.length - 1)], s = this.audioContext.createGain();
      t.buffer = i, s.gain.value = c(
        this.soundOptions.volume.min / 100,
        this.soundOptions.volume.max / 100
      ), s.connect(this.audioContext.destination), t.connect(s), t.start(0);
    } else
      this.init();
  }
}
class C {
  x;
  y;
  sx;
  sy;
  dx;
  dy;
  ctx;
  hue;
  speed;
  acceleration;
  traceLength;
  totalDistance;
  angle;
  brightness;
  coordinates = [];
  currentDistance = 0;
  constructor({
    x: t,
    y: i,
    dx: s,
    dy: n,
    ctx: h,
    hue: a,
    speed: r,
    traceLength: u,
    acceleration: p
  }) {
    for (this.x = t, this.y = i, this.sx = t, this.sy = i, this.dx = s, this.dy = n, this.ctx = h, this.hue = a, this.speed = r, this.traceLength = u, this.acceleration = p, this.totalDistance = m(t, i, s, n), this.angle = Math.atan2(n - i, s - t), this.brightness = o(50, 70); this.traceLength--; )
      this.coordinates.push([t, i]);
  }
  update(t) {
    this.coordinates.pop(), this.coordinates.unshift([this.x, this.y]), this.speed *= this.acceleration;
    const i = Math.cos(this.angle) * this.speed, s = Math.sin(this.angle) * this.speed;
    this.currentDistance = m(
      this.sx,
      this.sy,
      this.x + i,
      this.y + s
    ), this.currentDistance >= this.totalDistance ? t(this.dx, this.dy, this.hue) : (this.x += i, this.y += s);
  }
  draw() {
    const t = this.coordinates.length - 1;
    this.ctx.beginPath(), this.ctx.moveTo(
      this.coordinates[t][0],
      this.coordinates[t][1]
    ), this.ctx.lineTo(this.x, this.y), this.ctx.strokeStyle = x(this.hue, this.brightness), this.ctx.stroke();
  }
}
class T {
  target;
  container;
  canvas;
  ctx;
  width;
  height;
  traces = [];
  explosions = [];
  waitStopRaf;
  running = !1;
  opts;
  sound;
  resize;
  mouse;
  raf;
  constructor(t, i = {}) {
    this.target = t, this.container = t, this.opts = new O(), this.createCanvas(this.target), this.updateOptions(i), this.sound = new M(this.opts), this.resize = new L(
      this.opts,
      this.updateSize.bind(this),
      this.container
    ), this.mouse = new E(this.opts, this.canvas), this.raf = new z(this.opts, this.render.bind(this));
  }
  get isRunning() {
    return this.running;
  }
  get version() {
    return "2.10.7";
  }
  get currentOptions() {
    return this.opts;
  }
  start() {
    this.running || (this.canvas.isConnected || this.createCanvas(this.target), this.running = !0, this.resize.mount(), this.mouse.mount(), this.raf.mount());
  }
  stop(t = !1) {
    !this.running || (this.running = !1, this.resize.unmount(), this.mouse.unmount(), this.raf.unmount(), this.clear(), t && this.canvas.remove());
  }
  async waitStop(t) {
    if (!!this.running)
      return new Promise((i) => {
        this.waitStopRaf = () => {
          !this.waitStopRaf || (requestAnimationFrame(this.waitStopRaf), !this.traces.length && !this.explosions.length && (this.waitStopRaf = null, this.stop(t), i()));
        }, this.waitStopRaf();
      });
  }
  pause() {
    this.running = !this.running, this.running ? this.raf.mount() : this.raf.unmount();
  }
  clear() {
    !this.ctx || (this.traces = [], this.explosions = [], this.ctx.clearRect(0, 0, this.width, this.height));
  }
  launch(t = 1) {
    for (let i = 0; i < t; i++)
      this.createTrace();
    this.waitStopRaf || (this.start(), this.waitStop());
  }
  updateOptions(t) {
    this.opts.update(t);
  }
  updateSize({
    width: t = this.container.clientWidth,
    height: i = this.container.clientHeight
  } = {}) {
    this.width = t, this.height = i, this.canvas.width = t, this.canvas.height = i, this.updateBoundaries({
      ...this.opts.boundaries,
      width: t,
      height: i
    });
  }
  updateBoundaries(t) {
    this.updateOptions({ boundaries: t });
  }
  createCanvas(t) {
    t instanceof HTMLCanvasElement ? (t.isConnected || document.body.append(t), this.canvas = t) : (this.canvas = document.createElement("canvas"), this.container.append(this.canvas)), this.ctx = this.canvas.getContext("2d"), this.updateSize();
  }
  render() {
    if (!this.ctx || !this.running)
      return;
    const { opacity: t, lineStyle: i, lineWidth: s } = this.opts;
    this.ctx.globalCompositeOperation = "destination-out", this.ctx.fillStyle = `rgba(0, 0, 0, ${t})`, this.ctx.fillRect(0, 0, this.width, this.height), this.ctx.globalCompositeOperation = "lighter", this.ctx.lineCap = i, this.ctx.lineJoin = "round", this.ctx.lineWidth = c(s.trace.min, s.trace.max), this.initTrace(), this.drawTrace(), this.drawExplosion();
  }
  createTrace() {
    const {
      hue: t,
      rocketsPoint: i,
      boundaries: s,
      traceLength: n,
      traceSpeed: h,
      acceleration: a,
      mouse: r
    } = this.opts;
    this.traces.push(
      new C({
        x: this.width * o(i.min, i.max) / 100,
        y: this.height,
        dx: this.mouse.x && r.move || this.mouse.active ? this.mouse.x : o(s.x, s.width - s.x * 2),
        dy: this.mouse.y && r.move || this.mouse.active ? this.mouse.y : o(s.y, s.height * 0.5),
        ctx: this.ctx,
        hue: o(t.min, t.max),
        speed: h,
        acceleration: a,
        traceLength: f(n)
      })
    );
  }
  initTrace() {
    if (this.waitStopRaf)
      return;
    const { delay: t, mouse: i } = this.opts;
    (this.raf.tick > o(t.min, t.max) || this.mouse.active && i.max > this.traces.length) && (this.createTrace(), this.raf.tick = 0);
  }
  drawTrace() {
    let t = this.traces.length;
    for (; t--; )
      this.traces[t].draw(), this.traces[t].update((i, s, n) => {
        this.initExplosion(i, s, n), this.sound.play(), this.traces.splice(t, 1);
      });
  }
  initExplosion(t, i, s) {
    const {
      particles: n,
      flickering: h,
      lineWidth: a,
      explosion: r,
      brightness: u,
      friction: p,
      gravity: l,
      decay: d
    } = this.opts;
    let w = f(n);
    for (; w--; )
      this.explosions.push(
        new S({
          x: t,
          y: i,
          ctx: this.ctx,
          hue: s,
          friction: p,
          gravity: l,
          flickering: o(0, 100) <= h,
          lineWidth: c(
            a.explosion.min,
            a.explosion.max
          ),
          explosionLength: f(r),
          brightness: u,
          decay: d
        })
      );
  }
  drawExplosion() {
    let t = this.explosions.length;
    for (; t--; )
      this.explosions[t].draw(), this.explosions[t].update(() => {
        this.explosions.splice(t, 1);
      });
  }
}



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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmp4d29yZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7OztBQ0FBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQSw2RUFBNkUsYUFBYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixrQkFBa0I7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isa0JBQWtCO0FBQzFDO0FBQ0E7QUFDQSx1RUFBdUUsU0FBUztBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7QUNsRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBLE1BQU07QUFDTix1Q0FBdUMsS0FBSztBQUM1QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOzs7Ozs7Ozs7Ozs7Ozs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ3dDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDZEQUE2RCxvQkFBb0I7QUFDakY7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4REFBOEQ7QUFDOUQ7QUFDQSxvR0FBb0c7QUFDcEcsOENBQThDO0FBQzlDLHFDQUFxQyxvQkFBb0I7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZFQUE2RSxvQkFBb0I7QUFDakc7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQSw2REFBNkQsU0FBUztBQUN0RSxzQ0FBc0MsU0FBUztBQUMvQztBQUNBLDZDQUE2QyxTQUFTO0FBQ3REO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RCxTQUFTO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RCxTQUFTO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBLG1GQUFtRixTQUFTO0FBQzVGLHdEQUF3RCxTQUFTO0FBQ2pFLDBEQUEwRCxTQUFTO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxTQUFTO0FBQzVEO0FBQ0EsOEJBQThCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxzRUFBc0UsRUFBRTtBQUMzRyxzQ0FBc0MsdUJBQXVCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBELFNBQVM7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0RBQStELFNBQVM7QUFDeEU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0EsZ0VBQWdFLFNBQVM7QUFDekU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJELFNBQVM7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxTQUFTO0FBQ3pEO0FBQ0E7QUFDQSxnREFBZ0QsU0FBUztBQUN6RDtBQUNBO0FBQ0EsOENBQThDLFNBQVM7QUFDdkQsNENBQTRDLGtCQUFrQixHQUFHLGtCQUFrQjtBQUNuRiwyRUFBMkUsVUFBVTtBQUNyRjtBQUNBO0FBQ0E7QUFDQSw2RkFBNkYsVUFBVSxRQUFRO0FBQy9HLDBGQUEwRixVQUFVO0FBQ3BHLG1HQUFtRyxVQUFVLFFBQVE7QUFDckg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0dBQW9HO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBLDRHQUE0RyxVQUFVO0FBQ3RILHVGQUF1RixVQUFVO0FBQ2pHO0FBQ0E7QUFDQSxtRkFBbUYsVUFBVTtBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsVUFBVTtBQUNwRSx1RUFBdUUsVUFBVTtBQUNqRjs7QUFFQTtBQUNBLDBCQUEwQixzQkFBc0I7QUFDaEQsOEJBQThCLHNCQUFzQjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsU0FBUyxHQUFHLElBQUksR0FBRyxJQUFJLHVCQUF1QixlQUFlLHNEQUFzRCxRQUFRLCtDQUErQyxFQUFFLE9BQU8sRUFBRSxXQUFXLE1BQU0sWUFBWSxPQUFPLFlBQVksNEJBQTRCLGtCQUFrQiwyQkFBMkIsVUFBVSxLQUFLLGNBQWMsSUFBSSxjQUFjLEtBQUssMERBQTBELFNBQVMsR0FBRyxJQUFJLEdBQUcsSUFBSSw4QkFBOEIsU0FBUyxRQUFRLFNBQVMscUNBQXFDLGVBQWUsWUFBWSxPQUFPO0FBQ3ZsQjs7QUFFQTtBQUNBLGtFQUFrRSxTQUFTLEdBQUcsSUFBSSxHQUFHLElBQUk7QUFDekY7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQjtBQUMvQiwrQkFBK0I7QUFDL0IsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQSxnRUFBZ0UsU0FBUztBQUN6RSwyREFBMkQsU0FBUyxJQUFJLGtDQUFrQztBQUMxRzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixTQUFTLFFBQVEsZUFBZTtBQUN0RDtBQUNBO0FBQ0Esc0JBQXNCLFNBQVMsUUFBUSxnQkFBZ0IsTUFBTSxhQUFhLFFBQVEsZUFBZTtBQUNqRztBQUNBLGtCQUFrQixPQUFPLE1BQU0sYUFBYSxJQUFJLGFBQWEsUUFBUSxnQkFBZ0IsTUFBTSxhQUFhLFFBQVEsZUFBZTtBQUMvSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlJQUFpSSxxQkFBcUIsVUFBVSxtQkFBbUIsb0NBQW9DLDhCQUE4QjtBQUNyUCxxRUFBcUUsTUFBTTtBQUMzRTtBQUNBO0FBQ0EsMEZBQTBGLHFCQUFxQixVQUFVLG1CQUFtQix3Q0FBd0MsOEJBQThCO0FBQ2xOO0FBQ0E7QUFDQSx5RUFBeUUscUJBQXFCLFVBQVUsbUJBQW1CLHNDQUFzQyw4QkFBOEI7QUFDL0w7QUFDQSx3RUFBd0UsU0FBUztBQUNqRjtBQUNBLHNFQUFzRSxTQUFTO0FBQy9FLHlDQUF5QyxzQ0FBc0M7QUFDL0U7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCLHNCQUFzQjtBQUNoRCw4QkFBOEIsc0JBQXNCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBZ0YsSUFBSTtBQUNwRix5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLElBQUk7QUFDbEYseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtEQUErRCxVQUFVLElBQUksS0FBSyxJQUFJLEtBQUs7QUFDM0Y7QUFDQSx5Q0FBeUMsR0FBRyxRQUFRLEdBQUcsbUNBQW1DLGFBQWEsS0FBSyxLQUFLO0FBQ2pIOztBQUVBO0FBQ0EsZ0RBQWdELGlCQUFpQixPQUFPLGlCQUFpQixXQUFXLGdCQUFnQixZQUFZLGlCQUFpQixZQUFZLDZCQUE2QixrQkFBa0IsNEJBQTRCO0FBQ3hPOztBQUVBO0FBQ0Esd0RBQXdELFNBQVM7QUFDakU7QUFDQTtBQUNBLFNBQVM7QUFDVCwwREFBMEQsU0FBUztBQUNuRSxvREFBb0QsU0FBUztBQUM3RDtBQUNBO0FBQ0EsU0FBUztBQUNULHdEQUF3RCxTQUFTO0FBQ2pFOztBQUVBO0FBQ0Esb0ZBQW9GLE1BQU0sR0FBRyxTQUFTLFlBQVksTUFBTSxpREFBaUQseUJBQXlCLDJEQUEyRCxXQUFXO0FBQ3hROztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0Esa0RBQWtELFNBQVM7QUFDM0Qsa0RBQWtELFNBQVM7QUFDM0Q7O0FBRUE7QUFDQSxrREFBa0QsU0FBUztBQUMzRCxrREFBa0QsU0FBUztBQUMzRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0Esa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDZHQUE2RztBQUM3RywwQkFBMEIsc0JBQXNCLFNBQVM7QUFDekQsOEJBQThCLHNCQUFzQjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw0QkFBNEIsaUNBQWlDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDRCQUE0QixpQ0FBaUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxtR0FBbUc7QUFDbkc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHNCQUFzQjtBQUNwRCxrQ0FBa0Msc0JBQXNCO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCLHNCQUFzQjtBQUNoRCw4QkFBOEIsc0JBQXNCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULHFFQUFxRSxTQUFTLEdBQUcsMkJBQTJCLElBQUksNEJBQTRCO0FBQzVJO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELHdCQUF3QjtBQUNwRixvRUFBb0UsU0FBUyxHQUFHLE1BQU0sR0FBRywyQkFBMkI7QUFDcEg7QUFDQTtBQUNBO0FBQ0EsNERBQTRELFlBQVk7QUFDeEUsb0VBQW9FLFNBQVMsR0FBRyxNQUFNLEdBQUcsMkJBQTJCO0FBQ3BIO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDViw0REFBNEQsd0JBQXdCO0FBQ3BGLG9FQUFvRSxTQUFTLEdBQUcsMEJBQTBCLEdBQUcsT0FBTztBQUNwSDtBQUNBO0FBQ0E7QUFDQSw0REFBNEQsWUFBWTtBQUN4RSxvRUFBb0UsU0FBUyxHQUFHLDBCQUEwQixHQUFHLE9BQU87QUFDcEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCxTQUFTO0FBQ2pFLHFEQUFxRCxTQUFTO0FBQzlEO0FBQ0EsK0NBQStDLFNBQVM7QUFDeEQsb0RBQW9ELFNBQVM7QUFDN0QscURBQXFELFNBQVM7QUFDOUQsdURBQXVELFNBQVM7QUFDaEUsdURBQXVELFNBQVM7QUFDaEUsMERBQTBELFNBQVM7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxTQUFTO0FBQ3pELHlEQUF5RCxTQUFTO0FBQ2xFO0FBQ0Esc0RBQXNELFNBQVM7QUFDL0QsdURBQXVELFNBQVM7QUFDaEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELFVBQVU7QUFDOUQ7QUFDQSxvREFBb0QsU0FBUztBQUM3RCxtRkFBbUYsb0JBQW9CO0FBQ3ZHLFVBQVU7QUFDVjtBQUNBLG9EQUFvRCxVQUFVO0FBQzlELG9EQUFvRCxTQUFTO0FBQzdELGtGQUFrRixvQkFBb0I7QUFDdEc7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELFVBQVU7QUFDOUQ7QUFDQSxvREFBb0QsU0FBUztBQUM3RCxtRkFBbUYsb0JBQW9CO0FBQ3ZHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxTQUFTO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG9GQUFvRixTQUFTO0FBQzdGLGdGQUFnRixTQUFTO0FBQ3pGO0FBQ0EseURBQXlELDBCQUEwQjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRSxTQUFTO0FBQzFFO0FBQ0EsNERBQTRELGlCQUFpQjtBQUM3RSwwREFBMEQsZUFBZTtBQUN6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMEZBQTBGO0FBQzFGO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0M7QUFDcEM7QUFDQTtBQUNBO0FBQ0EsVUFBVSwwQkFBMEI7QUFDcEM7QUFDQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVSxnREFBZ0Q7QUFDMUQ7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxtQkFBbUI7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsUUFBUTtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsVUFBVSxPQUFPO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsbUJBQW1CO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Q7QUFDbEQsNkNBQTZDLG1CQUFtQjtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0EsVUFBVSxPQUFPO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsUUFBUTtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMkNBQTJDLFFBQVE7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQsUUFBUTtBQUMvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsUUFBUTtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxtQkFBbUI7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSw4Q0FBOEMsUUFBUSxPQUFPO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHdCQUF3QixzQkFBc0I7QUFDOUMsNEJBQTRCLHlCQUF5QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlGQUFpRixvQkFBb0I7QUFDckc7QUFDQSw4QkFBOEIsbURBQVM7QUFDdkM7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULDZFQUE2RSxFQUFFLEVBQUUsRUFBRSxHQUFHLFNBQVM7QUFDL0Y7QUFDQTtBQUNBLHNDQUFzQyxZQUFZO0FBQ2xELHlEQUF5RCxFQUFFLEdBQUcsU0FBUztBQUN2RTtBQUNBLG1EQUFtRCxFQUFFLEVBQUUsT0FBTztBQUM5RCx5RUFBeUUsa0JBQWtCO0FBQzNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsSUFBSTtBQUMxQjtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsRUFBRTtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RCxVQUFVLEVBQUUsT0FBTztBQUMxRTtBQUNBO0FBQ0EsdUJBQXVCLGFBQWEsSUFBSSw2QkFBNkIsRUFBRSxZQUFZLFdBQVcsaUJBQWlCO0FBQy9HO0FBQ0EsbURBQW1ELFNBQVMsR0FBRyxTQUFTLEdBQUcsVUFBVTtBQUNyRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLG9CQUFvQjtBQUNsRzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQXVCLG1DQUFtQztBQUMxRCwyQkFBMkIsc0NBQXNDO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0RBQXdELFVBQVUscUNBQXFDO0FBQ3ZHO0FBQ0EsVUFBVTtBQUNWLHdEQUF3RCxVQUFVO0FBQ2xFO0FBQ0E7O0FBRUEseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRkFBa0Ysb0JBQW9CO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsc0JBQXNCO0FBQ2hELDhCQUE4QixzQkFBc0I7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUZBQXFGLG9CQUFvQjtBQUN6RztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRSxPQUFPLElBQUksSUFBSSxTQUFTLFlBQVksVUFBVSxXQUFXLGNBQWM7QUFDdkk7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRDtBQUNuRCxvQ0FBb0MsSUFBSTtBQUN4QztBQUNBLDhCQUE4QjtBQUM5QixrREFBa0Q7QUFDbEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlFQUFlLE1BQU07Ozs7Ozs7Ozs7Ozs7Ozs7QUM3aURyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RCxFQUFFO0FBQ3pEO0FBQ0EsNkRBQTZELEVBQUU7QUFDL0Q7QUFDQSx1REFBdUQsRUFBRTtBQUN6RCxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLFNBQVM7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCw2UkFBNlIsd0JBQXdCO0FBQ3JUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxvQkFBb0I7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxzUkFBc1Isb0JBQW9CO0FBQzFTO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLE9BQU87QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLHlCQUF5QixlQUFlO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSx5Q0FBeUM7QUFDckQsaUdBQWlHLEVBQUU7QUFDbkc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxxQkFBcUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEtBQUs7QUFDaEI7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsV0FBVyxLQUFLO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxLQUFLO0FBQ2hCO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUlFOzs7Ozs7O1VDeGVGO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7OztBQ05zQztBQUNLO0FBQ2hCO0FBQ1E7O0FBRW5DO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwwREFBUTtBQUMvQix3QkFBd0IsdURBQU07QUFDOUIsdUJBQXVCLGFBQWE7QUFDcEM7QUFDQTtBQUNBLEtBQUs7QUFDTCwrQkFBK0IsOENBQU0sS0FBSyxhQUFhO0FBQ3ZEO0FBQ0Esc0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2Nzcy9qeHdvcmQubGVzcz9jOWJkIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMveGQtY3Jvc3N3b3JkLXBhcnNlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2pzL2V2ZW50cy5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2pzL2p4d29yZC1ncmlkLmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMvZmlyZXdvcmtzLWpzL2Rpc3QvaW5kZXguZXMuanMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIvLyBBIGxpYnJhcnkgZm9yIGNvbnZlcnRpbmcgLnhkIENyb3Nzd29yZCBkYXRhIHRvIEpTT04gKGFzIGRlZmluZWQgYnkgU2F1bCBQd2Fuc29uIC0gaHR0cDovL3hkLnNhdWwucHcpIHdyaXR0ZW4gYnkgSmFzb24gTm9yd29vZC1Zb3VuZ1xuXG5mdW5jdGlvbiBYRFBhcnNlcihkYXRhKSB7XG4gICAgZnVuY3Rpb24gcHJvY2Vzc0RhdGEoZGF0YSkge1xuICAgICAgICAvLyBTcGxpdCBpbnRvIHBhcnRzXG4gICAgICAgIGxldCBwYXJ0cyA9IGRhdGEuc3BsaXQoL14kXiQvZ20pLmZpbHRlcihzID0+IHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gNCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgcGFydHMgPSBkYXRhLnNwbGl0KC9cXHJcXG5cXHJcXG4vZykuZmlsdGVyKHMgPT4gKHMudHJpbSgpKSk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYXJ0c1tpXSA9IHBhcnRzW2ldLnJlcGxhY2UoL1xcclxcbi9nLCBcIlxcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYFRvbyBtYW55IHBhcnRzIC0gZXhwZWN0ZWQgNCwgZm91bmQgJHtwYXJ0cy5sZW5ndGh9YCk7XG4gICAgICAgIGNvbnN0IHJhd01ldGEgPSBwYXJ0c1swXTtcbiAgICAgICAgY29uc3QgcmF3R3JpZCA9IHBhcnRzWzFdO1xuICAgICAgICBjb25zdCByYXdBY3Jvc3MgPSBwYXJ0c1syXTtcbiAgICAgICAgY29uc3QgcmF3RG93biA9IHBhcnRzWzNdO1xuICAgICAgICBjb25zdCBtZXRhID0gcHJvY2Vzc01ldGEocmF3TWV0YSk7XG4gICAgICAgIGNvbnN0IGdyaWQgPSBwcm9jZXNzR3JpZChyYXdHcmlkKTtcbiAgICAgICAgY29uc3QgYWNyb3NzID0gcHJvY2Vzc0NsdWVzKHJhd0Fjcm9zcyk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBwcm9jZXNzQ2x1ZXMocmF3RG93bik7XG4gICAgICAgIHJldHVybiB7IG1ldGEsIGdyaWQsIGFjcm9zcywgZG93biwgcmF3R3JpZCwgcmF3QWNyb3NzLCByYXdEb3duLCByYXdNZXRhLCB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NNZXRhKHJhd01ldGEpIHtcbiAgICAgICAgY29uc3QgbWV0YUxpbmVzID0gcmF3TWV0YS5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGxldCBtZXRhID0ge307XG4gICAgICAgIG1ldGFMaW5lcy5mb3JFYWNoKG1ldGFMaW5lID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVQYXJ0cyA9IG1ldGFMaW5lLnNwbGl0KFwiOiBcIik7XG4gICAgICAgICAgICBtZXRhW2xpbmVQYXJ0c1swXV0gPSBsaW5lUGFydHNbMV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWV0YTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzR3JpZChyYXdHcmlkKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdHcmlkLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgcmVzdWx0W3hdID0gbGluZXNbeF0uc3BsaXQoXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQ2x1ZXMocmF3Q2x1ZXMpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0NsdWVzLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgY29uc3QgcmVnZXggPSAvKF4uXFxkKilcXC5cXHMoLiopXFxzflxccyguKikvO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoIWxpbmVzW3hdLnRyaW0oKSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IGxpbmVzW3hdLm1hdGNoKHJlZ2V4KTtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgQ291bGQgbm90IHBhcnNlIHF1ZXN0aW9uICR7bGluZXNbeF19YCk7XG4gICAgICAgICAgICAvLyBVbmVzY2FwZSBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uID0gcGFydHNbMl0ucmVwbGFjZSgvXFxcXC9nLCBcIlwiKTtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IHtcbiAgICAgICAgICAgICAgICBudW06IHBhcnRzWzFdLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxdWVzdGlvbixcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IHBhcnRzWzNdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NEYXRhKGRhdGEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFhEUGFyc2VyOyIsIi8vIEV2ZW50IGxpc3RlbmVycyBmb3Igb3VyIHB1enpsZSBnYW1lXG5jb25zdCBndGFnID0gd2luZG93Lmd0YWc7XG5cbmV4cG9ydCBmdW5jdGlvbiBFdmVudHMoY29udGFpbmVyX2VsZW1lbnQpIHtcbiAgICAvLyBHZXQgdGhlIGNvbnRhaW5lclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyX2VsZW1lbnQpO1xuICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvbnRhaW5lciBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgY29udGFpbmVyXG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpsb2FkJywgbG9hZEhhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6Y2hlYXQnLCBjaGVhdEhhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6Y29tcGxldGUnLCBjb21wbGV0ZUhhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6cmVzZXQnLCByZXNldEhhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6cHJvZ3Jlc3MnLCBwcm9ncmVzc0hhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6cGF1c2UnLCBwYXVzZUhhbmRsZXIpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdqeHdvcmQ6cmVzdW1lJywgcmVzdW1lSGFuZGxlcik7XG59XG5cbmZ1bmN0aW9uIGZpcmVfZ3RhZ19ldmVudChuYW1lLCBkYXRhID0ge30pIHtcbiAgICBpZiAodHlwZW9mIGd0YWcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZ3RhZygnZXZlbnQnLCBuYW1lLCBkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhgZ3RhZyBub3QgZm91bmQ6ICR7bmFtZX1gLCBkYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIGxvYWQgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9sb2FkJywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNoZWF0SGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSBjaGVhdCBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX2NoZWF0Jywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXBsZXRlSGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSBjb21wbGV0ZSBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX2NvbXBsZXRlJywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0SGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSByZXNldCBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX3Jlc2V0Jywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHByb2dyZXNzSGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSBwcm9ncmVzcyBldmVudFxuICAgIGNvbnNvbGUubG9nKGUuZGV0YWlsKTtcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9wcm9ncmVzcycsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgICAgICBwcm9ncmVzczogZS5kZXRhaWwucHJvZ3Jlc3MsXG4gICAgICAgIHF1YXJ0aWxlOiBlLmRldGFpbC5xdWFydGlsZSxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcGF1c2VIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIHBhdXNlIGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfcGF1c2UnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVzdW1lSGFuZGxlcihlKSB7XG4gICAgLy8gSGFuZGxlIHRoZSByZXN1bWUgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9yZXN1bWUnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn0iLCIvKlxuKiBKWFdvcmQgR3JpZCAtIEEgQ3Jvc3N3b3JkIFN5c3RlbSBieSBKYXNvbiBOb3J3b29kLVlvdW5nIDxqYXNvbkAxMGxheWVyLmNvbT5cbiogQ29weXJpZ2h0IDIwMjAgSmFzb24gTm9yd29vZC1Zb3VuZ1xuKi9cbmltcG9ydCB7IEZpcmV3b3JrcyB9IGZyb20gJ2ZpcmV3b3Jrcy1qcydcbi8vIENvbCwgICBSb3dcbi8vIFgsICAgICBZXG4vLyB3aWR0aCwgaGVpZ2h0XG5jbGFzcyBKWFdvcmQge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJKWFdvcmQsIGEgY3Jvc3N3b3JkIHN5c3RlbSBieSBKYXNvbiBOb3J3b29kLVlvdW5nIDxqYXNvbkAxMGxheWVyLmNvbT5cIik7XG4gICAgICAgIHRoaXMucHJvZHVjdF9uYW1lID0gXCJKWFdvcmRcIjtcbiAgICAgICAgaWYgKHdpbmRvdy5qeHdvcmRfcHJvZHVjdF9uYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RfbmFtZSA9IHdpbmRvdy5qeHdvcmRfcHJvZHVjdF9uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0cy5jb250YWluZXIpIHRocm93IFwiJ2NvbnRhaW5lcicgcmVxdWlyZWRcIjtcbiAgICAgICAgaWYgKCFvcHRzLmRhdGEpIHRocm93IFwiJ2RhdGEnIHJlcXVpcmVkXCI7XG4gICAgICAgIC8vIFNldCBzb21lIGRlZmF1bHRzXG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oeyBcbiAgICAgICAgICAgIHdpZHRoOiA1MDAsIFxuICAgICAgICAgICAgaGVpZ2h0OiA1MDAsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJXaWR0aDogMS41LCBcbiAgICAgICAgICAgIGlubmVyQm9yZGVyV2lkdGg6IDEsIFxuICAgICAgICAgICAgbWFyZ2luOiAzLCBcbiAgICAgICAgICAgIG91dGVyQm9yZGVyQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBmaWxsQ29sb3VyOiBcImJsYWNrXCIsIFxuICAgICAgICAgICAgY29sczogb3B0cy5kYXRhLmdyaWQubGVuZ3RoLFxuICAgICAgICAgICAgcm93czogb3B0cy5kYXRhLmdyaWRbMF0ubGVuZ3RoLCBcbiAgICAgICAgICAgIGZvbnRSYXRpbzogMC44MCxcbiAgICAgICAgICAgIG51bVJhdGlvOiAwLjI1LFxuICAgICAgICAgICAgc2VsZWN0Q2VsbENvbG91cjogXCIjZjdmNDU3XCIsXG4gICAgICAgICAgICBzZWxlY3RXb3JkQ29sb3VyOiBcIiM5Y2UwZmJcIixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvdXI6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIHJlc3RvcmVTdGF0ZTogZmFsc2UsXG4gICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgIHF1YXJ0aWxlOiAwLFxuICAgICAgICB9LCBvcHRzKTtcbiAgICAgICAgaWYgKHdpbmRvdy5qeHdvcmRfY29tcGxldGVkX2F1ZGlvKSB7XG4gICAgICAgICAgICB0aGlzLm9wdHMuY29tcGxldGVBdWRpbyA9IHdpbmRvdy5qeHdvcmRfY29tcGxldGVkX2F1ZGlvO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudWlkID0gK25ldyBEYXRlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICB0aW1lX3Rha2VuOiAwLFxuICAgICAgICAgICAgYXV0b2NoZWNrOiBmYWxzZSxcbiAgICAgICAgICAgIGNoZWF0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmRvd25fcXVlc3Rpb25zID0gW107XG4gICAgICAgIC8vIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGFzdF9xdWFydGlsZSA9IDA7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuY29tcGxldGVBdWRpbykge1xuICAgICAgICAgICAgdGhpcy5hdWRpbyA9IG5ldyBBdWRpbyh0aGlzLm9wdHMuY29tcGxldGVBdWRpbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBXYWl0IGZvciB0aGUgZG9jdW1lbnQgdG8gbG9hZFxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCB0aGlzLm9uTG9hZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICAvLyB0aHJvd0V2ZW50KGV2ZW50TmFtZSwgZGV0YWlsKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKHRoaXMuZXZlbnRzLCBldmVudE5hbWUpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50cy5wdWJsaXNoKGV2ZW50TmFtZSwgZGV0YWlsKTtcbiAgICAvLyB9XG5cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5vcHRzLmNvbnRhaW5lcik7XG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXJFbGVtZW50KSB0aHJvdyAoYENvdWxkIG5vdCBmaW5kICR7dGhpcy5vcHRzLmNvbnRhaW5lcn1gKTtcbiAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gdGhpcy5vcHRzLndpZHRoICsgKHRoaXMub3B0cy5tYXJnaW4gKiAyKTtcbiAgICAgICAgdGhpcy50b3RhbEhlaWdodCA9IHRoaXMub3B0cy5oZWlnaHQgKyAodGhpcy5vcHRzLm1hcmdpbiAqIDIpO1xuICAgICAgICB0aGlzLmNlbGxXaWR0aCA9IHRoaXMub3B0cy53aWR0aCAvIHRoaXMub3B0cy5jb2xzO1xuICAgICAgICB0aGlzLmNlbGxIZWlnaHQgPSB0aGlzLm9wdHMuaGVpZ2h0IC8gdGhpcy5vcHRzLnJvd3M7XG4gICAgICAgIHRoaXMuZm9udFNpemUgPSB0aGlzLmNlbGxXaWR0aCAqIHRoaXMub3B0cy5mb250UmF0aW87IC8vIEZvbnQgc2l6ZSB4JSBzaXplIG9mIGNlbGxcbiAgICAgICAgdGhpcy5ncmlkID0gW107XG4gICAgICAgIHRoaXMuZ3JpZCA9IHRoaXMub3B0cy5kYXRhLmdyaWRbMF0ubWFwKChjb2wsIGkpID0+IHRoaXMub3B0cy5kYXRhLmdyaWQubWFwKHJvdyA9PiByb3dbaV0pKTsgLy8gVHJhbnNwb3NlIG91ciBtYXRyaXhcbiAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLmdyaWQpOyAvLyBDYWxjdWxhdGUgb3VyIGhhc2ggcmVzdWx0XG4gICAgICAgIHRoaXMuc3RvcmFnZU5hbWUgPSBganh3b3JkLSR7TWF0aC5hYnModGhpcy5oYXNoKX1gO1xuICAgICAgICB0aGlzLmRyYXdMYXlvdXQoKTtcbiAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xuICAgICAgICB0aGlzLmRyYXdCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5kcmF3TnVtYmVycygpO1xuICAgICAgICB0aGlzLmRyYXdRdWVzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMuc2V0Rm9jdXMoKTtcbiAgICAgICAgdGhpcy5saXN0ZW5RdWVzdGlvbnMoKTtcbiAgICAgICAgdGhpcy5zZXRUaW1lcigpO1xuICAgICAgICB0aGlzLmRyYXdUaW1lcigpO1xuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5V2luKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXR1cElPU0tleWJvYXJkKCk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpsb2FkXCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICB9XG5cbiAgICBzZXRUaW1lcigpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzX2hpZGRlbikgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfcGF1c2VkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0ZSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnRpbWVfdGFrZW4pIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnRpbWVfdGFrZW4rKztcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmRyYXdUaW1lcigpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpLCAxMDAwKTtcbiAgICB9XG5cbiAgICBkcmF3TGF5b3V0KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5uZXJIVE1MID0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWNvbnRhaW5lclwiIGlkPVwianh3b3JkLWNvbnRhaW5lci0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheSBqeHdvcmQtb3ZlcmxheS1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLXBhdXNlZC0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXBhdXNlZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91ciBHYW1lIGlzIEN1cnJlbnRseSBQYXVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzdW1lXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtY29tcGxldGVfb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLWNvbXBsZXRlX292ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbmdyYXR1bGF0aW9ucyEgWW91J3ZlIFdvbiFcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpbWVcIiBpZD1cImp4d29yZC1vdmVybGF5X3RpbWUtJHt0aGlzLnVpZH1cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheV9zaGFyZS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW92ZXJsYXktc2hhcmVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtb3ZlcmxheS1yZXN0YXJ0LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b24ganh3b3JkLXJlc2V0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uIGp4d29yZC1jbG9zZS1vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1tZXRhX292ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1tZXRhX292ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dGhpcy5vcHRzLmRhdGEubWV0YS5UaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7IE9iamVjdC5rZXlzKHRoaXMub3B0cy5kYXRhLm1ldGEpLm1hcChrID0+IGsgPT09IFwiVGl0bGVcIiA/IFwiXCIgOiBgPGxpPiR7a306XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3RoaXMub3B0cy5kYXRhLm1ldGFba119PC9saT5gICkuam9pbihcIlxcblwiKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvbiBqeHdvcmQtY2xvc2Utb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsb3NlXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcGxheS1hcmVhXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1ncmlkLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG5hdiBjbGFzcz1cImp4d29yZC1jb250cm9sc1wiIHJvbGU9XCJuYXZpZ2F0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1tZW51LXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwianh3b3JkLW1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkFib3V0IFRoaXMgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1tZXRhLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPkFib3V0IFRoaXMgUHV6emxlPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cImp4d29yZC1tZW51LWJyZWFrXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSBBdXRvY2hlY2tcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwianh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5BdXRvY2hlY2s8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgU3F1YXJlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1jaGVja19zcXVhcmUtJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+Q2hlY2sgU3F1YXJlPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkNoZWNrIFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJqeHdvcmQtY2hlY2tfd29yZC0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5DaGVjayBXb3JkPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIkNoZWNrIFB1enpsZVwiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJqeHdvcmQtY2hlY2tfcHV6emxlLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPkNoZWNrIFB1enpsZTwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxocj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJQcmludCAoQmxhbmspXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1wcmludF9ibGFuay0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5QcmludCAoQmxhbmspPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIlByaW50IChGaWxsZWQpXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1wcmludF9maWxsZWQtJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+UHJpbnQgKEZpbGxlZCk8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiUmVzZXQgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uIGp4d29yZC1yZXNldFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJqeHdvcmQtcmVzZXQtJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+UmVzZXQ8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLXBhdXNlLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcGF1c2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1wYXVzZS10ZXh0IGp4d29yZC1zci1vbmx5XCI+UGF1c2U8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC10aW1lclwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zdmctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIGlkPSdqeHdvcmQtc3ZnLSR7dGhpcy51aWR9JyBjbGFzcz0nanh3b3JkLXN2ZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwICR7IHRoaXMudG90YWxXaWR0aCB9ICR7IHRoaXMudG90YWxIZWlnaHQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxnIGNsYXNzPVwiY2VsbC1ncm91cFwiIGlkPSdqeHdvcmQtZy1jb250YWluZXItJHt0aGlzLnVpZCB9Jz48L2c+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLWNvbnRhaW5lciBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWJhY2tcIiBpZD1cImp4d29yZC1hcnJvdy1iYWNrLSR7IHRoaXMudWlkIH1cIj4mbGFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uXCIgaWQ9XCJqeHdvcmQtc2luZ2xlLXF1ZXN0aW9uLSR7IHRoaXMudWlkIH1cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtYXJyb3cganh3b3JkLWFycm93LWZvcndhcmRcIiBpZD1cImp4d29yZC1hcnJvdy1mb3J3YXJkLSR7IHRoaXMudWlkIH1cIj4mcmFuZzs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQganh3b3JkLW1vYmlsZS1vbmx5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJRXCI+UTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJXXCI+VzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJFXCI+RTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJSXCI+UjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJUXCI+VDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJZXCI+WTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJVXCI+VTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJJXCI+STwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJPXCI+TzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJQXCI+UDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJBXCI+QTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJTXCI+UzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJEXCI+RDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJGXCI+RjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJHXCI+RzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJIXCI+SDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJKXCI+SjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJLXCI+SzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJMXCI+TDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWtleWJvYXJkLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJaXCI+WjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJYXCI+WDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJDXCI+QzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJWXCI+VjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJCXCI+QjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJOXCI+TjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5XCIgZGF0YS1rZXk9XCJNXCI+TTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5IGp4d29yZC1rZXktYmFja3NwYWNlXCIgZGF0YS1rZXk9XCJCQUNLU1BBQ0VcIj4mbEFycjs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9uLWNvbnRhaW5lciBqeHdvcmQtZGVza3RvcC1vbmx5XCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tY29udGFpbmVyLSR7IHRoaXMudWlkIH1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtYWNyb3NzXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7IHRoaXMudWlkIH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoND5BY3Jvc3M8L2g0PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtZG93blwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWRvd24tJHsgdGhpcy51aWQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0PkRvd248L2g0PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICAgICAgdGhpcy5zdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0keyB0aGlzLnVpZCB9YCk7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1nLWNvbnRhaW5lci0ke3RoaXMudWlkIH1gKTtcbiAgICB9XG5cbiAgICBkcmF3R3JpZCgpIHtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxHcm91cC5pbm5lckhUTUwgKz0gdGhpcy5kcmF3Q2VsbCh0aGlzLmdyaWRbY29sXVtyb3ddLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3Q2VsbChsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IHggPSAodGhpcy5jZWxsV2lkdGggKiBjb2wpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3QgeSA9ICh0aGlzLmNlbGxIZWlnaHQgKiByb3cpICsgdGhpcy5vcHRzLm1hcmdpbjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5jZWxsSGVpZ2h0O1xuICAgICAgICBjb25zdCBsZXR0ZXJYID0geCArICh3aWR0aCAvIDIpO1xuICAgICAgICBjb25zdCBsZXR0ZXJZID0geSArIHRoaXMuZm9udFNpemUgLSB0aGlzLm9wdHMubWFyZ2luO1xuICAgICAgICBsZXQgZmlsbCA9IHRoaXMub3B0cy5iYWNrZ3JvdW5kQ29sb3VyO1xuICAgICAgICBsZXQgaXNCbGFuayA9IFwiaXMtbGV0dGVyXCI7XG4gICAgICAgIGxldCBjb250YWluZXJDbGFzcz1cImlzLWxldHRlci1jb250YWluZXJcIjtcbiAgICAgICAgaWYgKGxldHRlciA9PSBcIiNcIikge1xuICAgICAgICAgICAgZmlsbCA9IHRoaXMub3B0cy5maWxsQ29sb3VyO1xuICAgICAgICAgICAgaXNCbGFuayA9IFwiaXMtYmxhbmtcIjtcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzPVwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGA8ZyBpZD1cImp4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y29sfS0ke3Jvd31cIiBjbGFzcz1cImp4d29yZC1jZWxsICR7Y29udGFpbmVyQ2xhc3N9XCIgc3R5bGU9XCJ6LWluZGV4OiAyMFwiPjxyZWN0IGNsYXNzPVwianh3b3JkLWNlbGwtcmVjdCAke2lzQmxhbmt9XCIgcm9sZT1cImNlbGxcIiB0YWJpbmRleD1cIi0xXCIgYXJpYS1sYWJlbD1cIlwiIHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCIgc3Ryb2tlPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJDb2xvdXJ9XCIgc3Ryb2tlLXdpZHRoPVwiJHt0aGlzLm9wdHMuaW5uZXJCb3JkZXJXaWR0aH1cIiBmaWxsPVwiJHtmaWxsfVwiIGRhdGEtY29sPVwiJHtjb2x9XCIgZGF0YS1yb3c9XCIke3JvdyB9XCIgY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiPjwvcmVjdD48dGV4dCBpZD1cImp4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fVwiIGNsYXNzPVwianh3b3JkLWxldHRlclwiIHg9XCIkeyBsZXR0ZXJYIH1cIiB5PVwiJHsgbGV0dGVyWSB9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmb250LXNpemU9XCIkeyB0aGlzLmZvbnRTaXplIH1cIiB3aWR0aD1cIiR7IHdpZHRoIH1cIj48L3RleHQ+PC9nPmA7XG4gICAgfVxuXG4gICAgZHJhd0xldHRlcihsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnN0IGxldHRlckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1sZXR0ZXItJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fWApO1xuICAgICAgICBjb25zdCBjb3JyZWN0ID0gdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFtjb2xdW3Jvd107XG4gICAgICAgIGlmIChjb3JyZWN0KSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5jbGFzc0xpc3QuYWRkKFwianh3b3JkLWxldHRlci1pcy1jb3JyZWN0XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0dGVyRWwuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1sZXR0ZXItaXMtY29ycmVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZXR0ZXIpO1xuICAgICAgICB3aGlsZShsZXR0ZXJFbC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5yZW1vdmVDaGlsZChsZXR0ZXJFbC5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGxldHRlckVsLmFwcGVuZENoaWxkKHR4dCk7XG4gICAgfVxuXG4gICAgZHJhd1RpbWVyKCkge1xuICAgICAgICBmdW5jdGlvbiBmb3JtYXRUaW1lKHQpIHtcbiAgICAgICAgICAgIHZhciBzZWNfbnVtID0gcGFyc2VJbnQodCwgMTApOyAvLyBkb24ndCBmb3JnZXQgdGhlIHNlY29uZCBwYXJhbVxuICAgICAgICAgICAgdmFyIGhvdXJzICAgPSBNYXRoLmZsb29yKHNlY19udW0gLyAzNjAwKTtcbiAgICAgICAgICAgIHZhciBtaW51dGVzID0gTWF0aC5mbG9vcigoc2VjX251bSAtIChob3VycyAqIDM2MDApKSAvIDYwKTtcbiAgICAgICAgICAgIHZhciBzZWNvbmRzID0gc2VjX251bSAtIChob3VycyAqIDM2MDApIC0gKG1pbnV0ZXMgKiA2MCk7XG4gICAgICAgIFxuICAgICAgICAgICAgaWYgKGhvdXJzICAgPCAxMCkge2hvdXJzICAgPSBcIjBcIitob3Vyczt9XG4gICAgICAgICAgICBpZiAobWludXRlcyA8IDEwKSB7bWludXRlcyA9IFwiMFwiK21pbnV0ZXM7fVxuICAgICAgICAgICAgaWYgKHNlY29uZHMgPCAxMCkge3NlY29uZHMgPSBcIjBcIitzZWNvbmRzO31cbiAgICAgICAgICAgIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXRpbWVyLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRpbWVyRWwuaW5uZXJIVE1MID0gYDxzcGFuIGlkPVwianh3b3JkLXRpbWVyLXRleHQtJHt0aGlzLnVpZH1cIj4ke2Zvcm1hdFRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKX08L3NwYW4+YDtcbiAgICB9XG5cbiAgICBodW1hblRpbWUoKSB7XG4gICAgICAgIGNvbnN0IHNlY29uZHMgPSB0aGlzLnN0YXRlLnRpbWVfdGFrZW47XG4gICAgICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW51dGVzIC8gNjApO1xuICAgICAgICBjb25zdCBzZWNvbmRzTGVmdCA9IHNlY29uZHMgLSAobWludXRlcyAqIDYwKTtcbiAgICAgICAgY29uc3QgbWludXRlc0xlZnQgPSBtaW51dGVzIC0gKGhvdXJzICogNjApO1xuICAgICAgICBjb25zdCBzZWNvbmRzX3BsdXJhbCA9IHNlY29uZHNMZWZ0ID09IDEgPyBcIlwiIDogXCJzXCI7XG4gICAgICAgIGNvbnN0IG1pbnV0ZXNfcGx1cmFsID0gbWludXRlc0xlZnQgPT0gMSA/IFwiXCIgOiBcInNcIjtcbiAgICAgICAgY29uc3QgaG91cnNfcGx1cmFsID0gaG91cnMgPT0gMSA/IFwiXCIgOiBcInNcIjtcbiAgICAgICAgaWYgKGhvdXJzID09IDAgJiYgbWludXRlcyA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7c2Vjb25kc30gc2Vjb25kJHtzZWNvbmRzX3BsdXJhbH1gO1xuICAgICAgICB9XG4gICAgICAgIGlmIChob3VycyA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7bWludXRlc30gbWludXRlJHttaW51dGVzX3BsdXJhbH0gYW5kICR7c2Vjb25kc0xlZnR9IHNlY29uZCR7c2Vjb25kc19wbHVyYWx9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7aG91cnN9IGhvdXIke2hvdXJzX3BsdXJhbH0sICR7bWludXRlc0xlZnR9IG1pbnV0ZSR7bWludXRlc19wbHVyYWx9IGFuZCAke3NlY29uZHNMZWZ0fSBzZWNvbmQke3NlY29uZHNfcGx1cmFsfWA7XG4gICAgfVxuXG4gICAgZHJhd1NoYXJlKCkge1xuICAgICAgICBjb25zdCBlbmNvZGVkX3Byb2R1Y3RfbmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnByb2R1Y3RfbmFtZSk7XG4gICAgICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICAgIGxldCBzaGFyZV91cmwgPSB1cmxQYXJhbXMuZ2V0KCdzaGFyZV91cmwnKTtcbiAgICAgICAgaWYgKCFzaGFyZV91cmwpIHtcbiAgICAgICAgICAgIHNoYXJlX3VybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVfdGFrZW4gPSB0aGlzLmh1bWFuVGltZSh0aGlzLnN0YXRlLnRpbWVfdGFrZW4pO1xuICAgICAgICBjb25zdCBlbmNvZGVkX3RpbWVfdGFrZW4gPSBlbmNvZGVVUklDb21wb25lbnQodGltZV90YWtlbik7XG4gICAgICAgIGNvbnN0IHNoYXJlX2h0bWwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1zaGFyZS1vcHRpb24ganh3b3JkLW92ZXJsYXktc2hhcmUtb3B0aW9uLWNsaXBib2FyZFwiIGRhdGEtdGV4dD1cIkklMjBqdXN0JTIwY29tcGxldGVkJTIwdGhlJTIwJHtlbmNvZGVkX3Byb2R1Y3RfbmFtZX0lMjBpbiUyMCR7ZW5jb2RlZF90aW1lX3Rha2VufSElMjBDYW4lMjB5b3UlMjBiZWF0JTIwbXklMjB0aW1lPyAke2VuY29kZVVSSUNvbXBvbmVudChzaGFyZV91cmwpfVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJkYXNoaWNvbnMgZGFzaGljb25zLWNsaXBib2FyZFwiPjwvc3Bhbj4mbmJzcDsmbmJzcDtDb3B5IHlvdXIgcmVzdWx0c1xuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXNoYXJlLW9wdGlvblwiPlxuICAgICAgICAgICAgPGEgaHJlZj1cImh0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P3RleHQ9SSUyMGp1c3QlMjBjb21wbGV0ZWQlMjB0aGUlMjAke2VuY29kZWRfcHJvZHVjdF9uYW1lfSUyMGluJTIwJHtlbmNvZGVkX3RpbWVfdGFrZW59ISUyMENhbiUyMHlvdSUyMGJlYXQlMjBteSUyMHRpbWU/JnVybD0ke2VuY29kZVVSSUNvbXBvbmVudChzaGFyZV91cmwpfVwiIHRhcmdldD1cIl9ibGFua1wiPjxzcGFuIGNsYXNzPVwiZGFzaGljb25zIGRhc2hpY29ucy10d2l0dGVyXCI+PC9zcGFuPiBTaGFyZSB5b3VyIHJlc3VsdHMgb24gVHdpdHRlcjwvYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1zaGFyZS1vcHRpb25cIj5cbiAgICAgICAgICAgIDxhIGhyZWY9XCJ3aGF0c2FwcDovL3NlbmQ/dGV4dD1JJTIwanVzdCUyMGNvbXBsZXRlZCUyMHRoZSUyMCR7ZW5jb2RlZF9wcm9kdWN0X25hbWV9JTIwaW4lMjAke2VuY29kZWRfdGltZV90YWtlbn0hJTIwQ2FuJTIweW91JTIwYmVhdCUyMG15JTIwdGltZT8lMjAke2VuY29kZVVSSUNvbXBvbmVudChzaGFyZV91cmwpfVwiIHRhcmdldD1cIl9ibGFua1wiPjxzcGFuIGNsYXNzPVwiZGFzaGljb25zIGRhc2hpY29ucy13aGF0c2FwcFwiPjwvc3Bhbj4gU2hhcmUgeW91ciByZXN1bHRzIG9uIFdoYXRzQXBwPC9hPlxuICAgICAgICA8L2Rpdj5gO1xuICAgICAgICBjb25zdCBzaGFyZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5X3NoYXJlLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHNoYXJlRWwuaW5uZXJIVE1MID0gc2hhcmVfaHRtbDtcbiAgICAgICAgY29uc3QgdGltZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5X3RpbWUtJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGltZUVsLmlubmVySFRNTCA9IGBZb3VyIHRpbWU6ICR7dGhpcy5odW1hblRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKX1gO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1vdmVybGF5LXNoYXJlLW9wdGlvbi1jbGlwYm9hcmRcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY29weVRvQ2xpcGJvYXJkLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIGlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykge1xuICAgICAgICBpZiAoKGNvbCA9PT0gMCkgJiYgKHRoaXMuZ3JpZFtjb2xdW3Jvd10gIT09IFwiI1wiKSAmJiAodGhpcy5ncmlkW2NvbCArIDFdW3Jvd10gIT09IFwiI1wiKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuZ3JpZFtjb2wgKyAxXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoKGNvbCA9PT0gMCkgfHwgKHRoaXMuZ3JpZFtjb2wgLSAxXVtyb3ddID09IFwiI1wiKSkge1xuICAgICAgICAgICAgLy8gaWYgKHJvdyA8IHRoaXMuZ3JpZFswXS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMuZ3JpZFtjb2xdW3JvdyArIDFdICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICBpc1N0YXJ0T2ZEb3duKGNvbCwgcm93KSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuZ3JpZFtjb2xdW3JvdyArIDFdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgocm93ID09PSAwKSB8fCAodGhpcy5ncmlkW2NvbF1bcm93IC0gMV0gPT0gXCIjXCIpKSB7XG4gICAgICAgICAgICAvLyBpZiAoY29sIDwgdGhpcy5ncmlkLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5ncmlkW2NvbCArIDFdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBkcmF3TnVtYmVycygpIHtcbiAgICAgICAgLy8gQSBjZWxsIGdldHMgYSBudW1iZXIgaWYgaXQgaGFzIGEgYmxvY2sgb3IgZWRnZSBhYm92ZSBvciB0byB0aGUgbGVmdCBvZiBpdCwgYW5kIGEgYmxhbmsgbGV0dGVyIHRvIHRoZSBib3R0b20gb3IgcmlnaHQgb2YgaXQgcmVzcGVjdGl2ZWx5XG4gICAgICAgIC8vIFBvcHVsYXRlIGEgbnVtYmVyIGdyaWQgd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgbGV0IG51bSA9IDE7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRyYXdOdW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2wgIT09IHRoaXMub3B0cy5jb2xzIC0gMSAmJiB0aGlzLmdyaWRbY29sKzFdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3TnVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLm9wdHMuZGF0YS5hY3Jvc3MuZmluZChxID0+IHEubnVtID09PSBgQSR7bnVtfWApXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvdyAhPT0gdGhpcy5vcHRzLnJvd3MgLSAxICYmIHRoaXMuZ3JpZFtjb2xdW3JvdysxXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdOdW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb3duX3F1ZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLm9wdHMuZGF0YS5kb3duLmZpbmQocSA9PiBxLm51bSA9PT0gYEQke251bX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gbGV0IGRyYXdOdW0gPSB0aGlzLmlzU3RhcnRPZkFjcm9zcyhjb2wsIHJvdykgfHwgdGhpcy5pc1N0YXJ0T2ZEb3duKGNvbCwgcm93KTtcbiAgICAgICAgICAgICAgICBpZiAoZHJhd051bSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdOdW1iZXIoY29sLCByb3csIG51bSsrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3TnVtYmVyKGNvbCwgcm93LCBudW0pIHtcbiAgICAgICAgY29uc3QgbnVtRm9udFNpemUgPSB0aGlzLmNlbGxXaWR0aCAqIHRoaXMub3B0cy5udW1SYXRpbztcbiAgICAgICAgY29uc3QgeCA9ICh0aGlzLmNlbGxXaWR0aCAqIGNvbCkgKyB0aGlzLm9wdHMubWFyZ2luICsgKHRoaXMuY2VsbFdpZHRoICogMC4wNCk7XG4gICAgICAgIGNvbnN0IHkgPSAodGhpcy5jZWxsSGVpZ2h0ICogcm93KSArIHRoaXMub3B0cy5tYXJnaW4gLSAodGhpcy5jZWxsV2lkdGggKiAwLjAyKSArIG51bUZvbnRTaXplO1xuICAgICAgICBjb25zdCBjZWxsRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHsgdGhpcy51aWQgfS0keyBjb2wgfS0keyByb3cgfWApO1xuICAgICAgICBcbiAgICAgICAgY2VsbEVsLmlubmVySFRNTCArPSBgPHRleHQgeD1cIiR7IHggfVwiIHk9XCIkeyB5IH1cIiB0ZXh0LWFuY2hvcj1cImxlZnRcIiBmb250LXNpemU9XCIkeyBudW1Gb250U2l6ZSB9XCI+JHsgbnVtIH08L3RleHQ+YFxuICAgIH1cblxuICAgIGRyYXdCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuY2VsbEdyb3VwLmlubmVySFRNTCArPSBgPHJlY3QgeD1cIiR7dGhpcy5vcHRzLm1hcmdpbn1cIiB5PVwiJHt0aGlzLm9wdHMubWFyZ2lufVwiIHdpZHRoPVwiJHt0aGlzLm9wdHMud2lkdGh9XCIgaGVpZ2h0PVwiJHt0aGlzLm9wdHMuaGVpZ2h0fVwiIHN0cm9rZT1cIiR7dGhpcy5vcHRzLm91dGVyQm9yZGVyQ29sb3VyIH1cIiBzdHJva2Utd2lkdGg9XCIke3RoaXMub3B0cy5vdXRlckJvcmRlcldpZHRoIH1cIiBmaWxsPVwibm9uZVwiPmA7XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9ucygpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcy0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+YFxuICAgICAgICB0aGlzLm9wdHMuZGF0YS5hY3Jvc3MuZm9yRWFjaChxID0+IHtcbiAgICAgICAgICAgIGFjcm9zcyArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHt0aGlzLnVpZH1gKS5pbm5lckhUTUwgKz0gYWNyb3NzO1xuICAgICAgICBsZXQgZG93biA9IGA8b2wgaWQ9XCJqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdFwiPmBcbiAgICAgICAgdGhpcy5vcHRzLmRhdGEuZG93bi5mb3JFYWNoKHEgPT4ge1xuICAgICAgICAgICAgZG93biArPSB0aGlzLmRyYXdRdWVzdGlvbihxKTtcbiAgICAgICAgfSlcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1kb3duLSR7dGhpcy51aWR9YCkuaW5uZXJIVE1MICs9IGRvd247XG4gICAgfVxuXG4gICAgZHJhd1F1ZXN0aW9uKHEpIHtcbiAgICAgICAgcmV0dXJuIGA8bGkgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiIGlkPVwianh3b3JkLXF1ZXN0aW9uLWFjcm9zcy0ke3EubnVtfS0ke3RoaXMudWlkfVwiIGRhdGEtcT1cIiR7cS5udW19XCI+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1udW1cIj4ke3EubnVtLnJlcGxhY2UoL15cXEQvLCBcIlwiKX08L3NwYW4+PHNwYW4gY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1xdWVzdGlvblwiPiR7cS5xdWVzdGlvbn08L3NwYW4+PC9saT5gO1xuICAgIH1cblxuICAgIHNob3dPdmVybGF5KHN0YXRlID0gXCJwYXVzZWRcIikge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1wYXVzZWRcIikuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1jb21wbGV0ZV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWV0YV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgaWYgKHN0YXRlID09PSBcInBhdXNlZFwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1wYXVzZWRcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1jb21wbGV0ZV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFwibWV0YVwiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1tZXRhX292ZXJsYXlcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1vdmVybGF5LWhpZGVcIik7XG4gICAgfVxuXG4gICAgaGlkZU92ZXJsYXkoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtb3ZlcmxheS1oaWRlXCIpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLW92ZXJsYXktc2hvd1wiKTtcbiAgICB9XG5cbiAgICBjaGVja092ZXJsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcInBhdXNlZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZU92ZXJsYXkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFN0YXRlKCkge1xuICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7IC8vIDAgPSBhY3Jvc3MsIDEgPSBkb3duXG4gICAgICAgIHRoaXMuc3RhdGUuY29tcGxldGUgPSBmYWxzZTsgLy8gQXJlIHdlIGRvbmUgeWV0P1xuICAgICAgICB0aGlzLnN0YXRlLmhpbnRzID0gZmFsc2U7IC8vIEhhZCBhbnkgaGVscD9cbiAgICAgICAgdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDsgLy8gSG93IGxvbmcgaGF2ZSB3ZSBiZWVuIHBsYXlpbmc/XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGggPSBuZXcgQXJyYXkodGhpcy5vcHRzLmNvbHMpLmZpbGwoXCJcIikubWFwKCgpID0+IG5ldyBBcnJheSh0aGlzLm9wdHMucm93cykuZmlsbChcIlwiKSk7IC8vIEEgbWF0cml4IGZpbGxlZCB3aXRoIGVtcHR5IGNoYXJzXG4gICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykgeyAvLyBGaWxsIGluIHRoZSAjJ3NcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbY29sXVtyb3ddID09PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XSA9IFwiI1wiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuc3RhdGUuZ3JhcGgpO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHNjYWxhcnMgKGZvciBhY3Jvc3MgYW5kIGRvd24pIHRoYXQgd2UgdXNlIHdoZW4gZGVjaWRpbmcgd2hpY2ggY2VsbCB0byBnbyB0byBpbiB0aGUgZXZlbnQgdGhhdCBhIGxldHRlciBpcyB0eXBlZCwgdGFiIGlzIHByZXNzZWQgZXRjLiBcbiAgICAgICAgLy8gRG93biBTY2FsYXJcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duID0gW107XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHF1ZXN0aW9uIG9mIHRoaXMuZG93bl9xdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93bi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcXVlc3Rpb24uZGF0YS5hbnN3ZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sLFxuICAgICAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyArIGksXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckRvd24pO1xuICAgICAgICAvLyBBY3Jvc3MgU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzID0gW107XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgcXVlc3Rpb24gb2YgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcXVlc3Rpb24uZGF0YS5hbnN3ZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wgKyBpLFxuICAgICAgICAgICAgICAgICAgICByb3c6IHF1ZXN0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mV29yZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgICAgICBxOiBxdWVzdGlvbi5udW0sXG4gICAgICAgICAgICAgICAgICAgIGNvcnJlY3Q6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbCA9IFt0aGlzLnN0YXRlLnNjYWxhckFjcm9zc1swXS5jb2wsIHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzWzBdLnJvd107IC8vIFN0YXJ0IGF0IGZpcnN0IGFjcm9zc1xuICAgICAgICAvLyBDb3JyZWN0IGdyaWRcbiAgICAgICAgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZCA9IG5ldyBBcnJheSh0aGlzLm9wdHMuY29scykuZmlsbChmYWxzZSkubWFwKCgpID0+IG5ldyBBcnJheSh0aGlzLm9wdHMucm93cykuZmlsbChmYWxzZSkpO1xuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICB0aGlzLnN0YXRlLnByb2dyZXNzID0gMDtcbiAgICAgICAgdGhpcy5zdGF0ZS5xdWFydGlsZSA9IDA7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJTYXZpbmcgU3RhdGVcIik7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnN0b3JhZ2VOYW1lLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlKSk7XG4gICAgfVxuXG4gICAgcmVzdG9yZVN0YXRlKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuc3RvcmFnZU5hbWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxldHRlciA9IHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXV0b2NoZWNrKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlUmVzdG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiU3RhdGUgUmVzdG9yZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWxjSGFzaChtYXRyaXgpIHtcbiAgICAgICAgbGV0IHMgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHMgKz0gbWF0cml4W2NvbF1bcm93XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaGFzaCA9IDAsIGNocjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjaHIgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgICAgICAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGhhc2gsIHMpO1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICBtYXJrQ2VsbHMoKSB7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWNlbGwtcmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGFsbENlbGxzLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLmJhY2tncm91bmRDb2xvdXIpO1xuICAgICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICAgIH0pXG4gICAgICAgIGxldCBjdXJyZW50Q2VsbFJlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdIH0tJHsgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSB9ID4gcmVjdGApO1xuICAgICAgICBjdXJyZW50Q2VsbFJlY3Quc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0Q2VsbENvbG91cik7XG4gICAgICAgIGN1cnJlbnRDZWxsUmVjdC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAxKTtcbiAgICAgICAgbGV0IG1hcmtlZENlbGwgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5jb2xzOyBjb3VudCArKykge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb3VudH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdfSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAtIDE7IGNvdW50ID49IDA7IGNvdW50LS0pIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y291bnR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXX0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gKyAxOyBjb3VudCA8IHRoaXMub3B0cy5yb3dzOyBjb3VudCsrKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF19LSR7Y291bnR9ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdIC0gMTsgY291bnQgPj0gMDsgY291bnQtLSkge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdfS0ke2NvdW50fSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhpZ2hsaWdodFF1ZXN0aW9uKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQWN0aW9ucygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHRoaXMudmlzaWJpbGl0eUNoYW5nZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIGxldCBhbGxDZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJyZWN0LmlzLWxldHRlclwiKTtcbiAgICAgICAgZm9yKGxldCBjZWxsIG9mIGFsbENlbGxzKSB7XG4gICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNhdGNoQ2VsbENsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuY2F0Y2hLZXlQcmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hcnJvdy1mb3J3YXJkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubW92ZVRvTmV4dFdvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctYmFjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb1ByZXZpb3VzV29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmp4d29yZC1yZXNldGApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2VsZi5yZXNldC5iaW5kKHNlbGYpKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtbWV0YS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNob3dNZXRhLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnRvZ2dsZUF1dG9jaGVjay5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuY2hlY2tXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3NxdWFyZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrU3F1YXJlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNoZWNrX3B1enpsZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrUHV6emxlLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXNpbmdsZS1xdWVzdGlvbi0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoYW5nZURpcmVjdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgY29uc3Qga2V5cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLWtleVwiKTtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAgICAgICAga2V5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmtleUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wYXVzZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LXJlc3VtZS0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnBsYXkuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtY2xvc2Utb3ZlcmxheWApLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYuaGlkZU92ZXJsYXkuYmluZChzZWxmKSkpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXByaW50X2JsYW5rLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJpbnRCbGFuay5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wcmludF9maWxsZWQtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wcmludEZpbGxlZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICB2aXNpYmlsaXR5Q2hhbmdlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlKTtcbiAgICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgdGhpcy5pc19oaWRkZW4gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gXCJ2aXNpYmxlXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiUGF1c2VcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnJlc3VtZVwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmlzX3BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQbGF5XCI7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnBhdXNlXCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBsYXlcIik7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH0gPiAuanh3b3JkLXBhdXNlLXRleHRgKS5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3MgdG8gcGF1c2UgYnV0dG9uXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1wbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnJlc3VtZVwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBzaG93TWV0YShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcIm1ldGFcIik7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KClcbiAgICB9XG5cbiAgICBwcmludEJsYW5rKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpXG4gICAgICAgIGNvbnN0IHN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc3ZnLSR7dGhpcy51aWR9YCkuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBjb25zdCBsZXR0ZXJzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtbGV0dGVyYCk7XG4gICAgICAgIGZvciAobGV0IGxldHRlciBvZiBsZXR0ZXJzKSB7XG4gICAgICAgICAgICBsZXR0ZXIucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcmludChzdmcpO1xuICAgIH1cblxuICAgIHByaW50RmlsbGVkKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICBjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLnByaW50KHN2Zyk7XG4gICAgfVxuXG4gICAgcHJpbnQoc3ZnKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHN2Zyk7XG4gICAgICAgIGNvbnN0IHN2Z190ZXh0ID0gc3ZnLm91dGVySFRNTC5yZXBsYWNlKC9maWxsPVwiI2Y3ZjQ1N1wiL2csIGBmaWxsPVwiI2ZmZmZmZlwiYCkucmVwbGFjZSgvZmlsbD1cIiM5Y2UwZmJcIi9nLCBgZmlsbD1cIiNmZmZmZmZcImApO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfYWNyb3NzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbnMtYWNyb3NzLSR7dGhpcy51aWR9YCkub3V0ZXJIVE1MO1xuICAgICAgICBjb25zdCBxdWVzdGlvbnNfZG93biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb25zLWRvd24tJHt0aGlzLnVpZH1gKS5vdXRlckhUTUw7XG4gICAgICAgIGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8aHRtbD48aGVhZD48dGl0bGU+JHt0aGlzLm9wdHMuZGF0YS5tZXRhLlRpdGxlfTwvdGl0bGU+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8c3R5bGU+XG4gICAgICAgICAgICAuc3ZnLWNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAzNWVtO1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6YmxvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAuanh3b3JkLXN2ZyB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdCB7XG4gICAgICAgICAgICAgICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMS41O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLW51bSB7XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA1cHg7XG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDI1cHg7XG4gICAgICAgICAgICAgICAgbWluLXdpZHRoOiAyNXB4O1xuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLnF1ZXN0aW9ucyB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgICAgICAgICAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgPC9zdHlsZT5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJzdmctY29udGFpbmVyXCI+JHtzdmdfdGV4dH08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJxdWVzdGlvbnNcIj5cXG5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXY+PGg0PkFjcm9zczwvaDQ+XFxuJHtxdWVzdGlvbnNfYWNyb3NzfTwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGRpdj48aDQ+RG93bjwvaDQ+XFxuJHtxdWVzdGlvbnNfZG93bn08L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDwvZGl2PmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuICAgICAgICBwcmludFdpbmRvdy5mb2N1cygpO1xuICAgICAgICBwcmludFdpbmRvdy5wcmludCgpO1xuICAgICAgICBwcmludFdpbmRvdy5jbG9zZSgpO1xuICAgIH1cblxuICAgIGNhdGNoQ2VsbENsaWNrKGUpIHtcbiAgICAgICAgY29uc3QgY29sID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQuY29sKTtcbiAgICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGUudGFyZ2V0LmRhdGFzZXQucm93KTtcbiAgICAgICAgaWYgKChjb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0pICYmIChyb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pKSB7IC8vIENsaWNrZWQgb24gYWxyZWFkeSBzZWxlY3RlZCBjZWxsXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSByb3c7XG4gICAgICAgICAgICBjb25zdCB3b3JkID0gdGhpcy5nZXRXb3JkKHRoaXMuc3RhdGUuZGlyZWN0aW9uLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICBpZiAoIXdvcmQpIHRoaXMuY2hhbmdlRGlyZWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgdGhpcy5zaG93SU9TS2V5Ym9hcmQoKTtcbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0Q2VsbCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50U2NhbGFySW5kZXggPSBzY2FsYXIuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgaXRlbS5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoY3VycmVudFNjYWxhckluZGV4IDwgc2NhbGFyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0uY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltjdXJyZW50U2NhbGFySW5kZXggKyAxXS5yb3c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgdHlwZUxldHRlcihsZXR0ZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNMZXR0ZXIgPSAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gPSBsZXR0ZXI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pXG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihsZXR0ZXIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAvLyB0aGlzLmNoZWNrSGludCgpO1xuICAgICAgICB0aGlzLmNoZWNrV2luKCk7XG4gICAgICAgIGlmICghaGFzTGV0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dENlbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhdGNoS2V5UHJlc3MoZSkge1xuICAgICAgICBjb25zdCBrZXljb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgaWYgKGUubWV0YUtleSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludGFibGUgPSAoa2V5Y29kZSA+IDY0ICYmIGtleWNvZGUgPCA5MSk7XG4gICAgICAgIGlmICh0aGlzLmlzX3BhdXNlZCkgcmV0dXJuOyAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBwYXVzZWRcbiAgICAgICAgaWYgKHByaW50YWJsZSAmJiAhdGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbGV0dGVyID0gZS5rZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMudHlwZUxldHRlcihsZXR0ZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDgpIHsgLy8gQmFja3NwYWNlXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuY29tcGxldGUpIHsgLy8gRG9uJ3QgYWxsb3cgY2hhbmdlcyBpZiB3ZSd2ZSBmaW5pc2hlZCBvdXIgcHV6emxlXG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09IDMyKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHQoKTtcbiAgICAgICAgfSBlbHNlIGlmICgoa2V5Y29kZSA9PT0gOSkgfHwgKGtleWNvZGUgPT09IDEzKSkgeyAvLyBUYWIgb3IgRW50ZXJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0V29yZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM3KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzgpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVVwKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNDApIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMubW92ZURvd24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB4LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVVcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4IC0gMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbc2NhbGFyLmxlbmd0aCAtIDFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB5LS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3ldICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHggPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh4IDwgdGhpcy5vcHRzLnJvd3MgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHgrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbeF1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZURvd24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggKzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2luZGV4ICsxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW2luZGV4ICsxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbMF0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHkgPCB0aGlzLm9wdHMuY29scyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBzZXRTY2FsYXJzKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChhY3Jvc3MpIHtcbiAgICAgICAgICAgIGFjcm9zcy5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgaWYgKGRvd24pIHtcbiAgICAgICAgICAgIGRvd24ubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dG9jaGVjaykge1xuICAgICAgICAgICAgaWYgKGxldHRlciA9PT0gdGhpcy5ncmlkW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgIGlmIChkb3duKSBkb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChhY3Jvc3MpIGFjcm9zcy5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG9OZXh0KCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGN1cnNvcik7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh4LCBzY2FsYXJbeF0pO1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNMZXR0ZXIoKSB7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgbGV0IGN1cnNvciA9IGN1cnJlbnRDZWxsLmluZGV4IC0gMTtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvcjsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbeF0uY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbeF0ucm93O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pIHtcbiAgICAgICAgICAgIC8vIE1vdmUgYmFjayBhbmQgdGhlbiBkZWxldGVcbiAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNMZXR0ZXIoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3TGV0dGVyKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gXCJcIjtcbiAgICAgICAgdGhpcy5zZXRTY2FsYXJzKFwiXCIsIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNvbXBsZXRlKCk7XG4gICAgfVxuICAgIFxuICAgIG1vdmVUb05leHRXb3JkKCkge1xuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIGlmICghY3Vyc29yKSByZXR1cm47XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsICYmIG5leHRDZWxsLmxldHRlciAhPT0gXCJcIikgeyAvLyBGaXJzdCBsZXR0ZXIgaXMgbm90IGJsYW5rLCBcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBuZXh0Q2VsbC5pbmRleCArIDE7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IG90aGVyU2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICBpZiAobmV4dEJsYW5rKSB7IC8vIElzIHRoZXJlIHN0aWxsIGEgYmxhbmsgZG93bj9cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dEJsYW5rLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dEJsYW5rLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgZmluZFN0YXJ0T2ZDdXJyZW50V29yZCgpIHtcbiAgICAgICAgbGV0IHNjYWxhcjtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgeCA9IGN1cnNvci5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBzdGFydE9mQ3VycmVudFdvcmQgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXJ0T2ZDdXJyZW50V29yZDtcbiAgICB9XG5cbiAgICBtb3ZlVG9QcmV2aW91c1dvcmQoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGZpbmRMYXN0KGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBhcnJheVtpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKHgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBNb3ZlIHRvIGZpc3QgbGV0dGVyIG9mIGN1cnJlbnQgd29yZCwgdGhlbiBzZWFyY2ggYmFja3dhcmQgZm9yIGEgZnJlZSBzcGFjZSwgdGhlbiBtb3ZlIHRvIHRoZSBzdGFydCBvZiB0aGF0IHdvcmQsIHRoZW4gbW92ZSBmb3J3YXJkIHVudGlsIGEgZnJlZSBzcGFjZVxuICAgICAgICBsZXQgbmV4dENlbGwgPSBudWxsO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgbGV0IG90aGVyU2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikgeyAvLyBBY3Jvc3NcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgb3RoZXJTY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH0gZWxzZSB7IC8vIERvd25cbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGV0IGN1cnNvciA9IHNjYWxhci5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSk7XG4gICAgICAgIC8vIFN0YXJ0IG9mIGN1cnJlbnQgd29yZFxuICAgICAgICBsZXQgc3RhcnRPZkN1cnJlbnRXb3JkID0gdGhpcy5zdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgbGV0IGJsYW5rU3BhY2UgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGdvaW5nIGJhY2sgdW50aWwgd2UgaGl0IGEgYmxhbmsgc3BhY2VcbiAgICAgICAgaWYgKHN0YXJ0T2ZDdXJyZW50V29yZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHN0YXJ0T2ZDdXJyZW50V29yZC5pbmRleCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmxhbmtTcGFjZSA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mTGFzdFdvcmQgPSBudWxsO1xuICAgICAgICBpZiAoYmxhbmtTcGFjZSkge1xuICAgICAgICAgICAgLy8gTm93IGZpbmQgc3RhcnQgb2YgdGhpcyB3b3JkXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gYmxhbmtTcGFjZS5pbmRleDsgeCA+PSAwOyB4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZMYXN0V29yZCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydE9mTGFzdFdvcmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBzdGFydE9mTGFzdFdvcmQuaW5kZXg7IHggPCBzY2FsYXIubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q2VsbCA9IHNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCkgeyAvLyBGb3VuZCBhIGNlbGwgdG8gbW92ZSB0b1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRDZWxsLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Q2VsbC5yb3c7XG4gICAgICAgIH0gZWxzZSB7IC8vIENoYW5nZSBkaXJlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG5leHRCbGFuayA9IGZpbmRMYXN0KG90aGVyU2NhbGFyLCBjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIGxldCBzdGFydE9mV29yZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IG5leHRCbGFuay5pbmRleDsgeCA+PSAwOyB4LS0pIHsgLy8gTW92ZSB0byBzdGFydCBvZiB3b3JkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdGhlclNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQgPSBvdGhlclNjYWxhclt4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzdGFydE9mV29yZC5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHN0YXJ0T2ZXb3JkLnJvdztcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0Rm9jdXMoKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY2VsbC1yZWN0XCIpO1xuICAgICAgICBlbC5mb2N1cygpO1xuICAgICAgICB0aGlzLnNob3dJT1NLZXlib2FyZCgpO1xuICAgICAgICAvLyB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBjaGVja1dpbigpIHtcbiAgICAgICAgbGV0IHdpbiA9IHRydWU7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5ncmlkLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuZ3JpZFt4XS5sZW5ndGg7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IFwiI1wiKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsZXQgc2NhbGFyQWNyb3NzID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgbGV0IHNjYWxhckRvd24gPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChzY2FsYXIgPT4gc2NhbGFyLnJvdyA9PSB5ICYmIHNjYWxhci5jb2wgPT0geCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gdGhpcy5zdGF0ZS5ncmFwaFt4XVt5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyQWNyb3NzKSBzY2FsYXJBY3Jvc3MuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJBY3Jvc3MpIHNjYWxhckFjcm9zcy5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJEb3duKSBzY2FsYXJEb3duLmNvcnJlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgd2luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ29tcGxldGUoKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5V2luKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNwbGF5V2luKCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1vdmVybGF5LXRpdGxlXCIpLmlubmVySFRNTCA9IFwiWW91IFdpbiFcIjtcbiAgICAgICAgdGhpcy5kcmF3U2hhcmUoKTtcbiAgICAgICAgdGhpcy5zaG93T3ZlcmxheShcImNvbXBsZXRlXCIpO1xuICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuYXVkaW8pIHRoaXMuYXVkaW8ucGxheSgpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJqeHdvcmQ6Y29tcGxldGVcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZpcmV3b3JrcyFcIik7XG4gICAgICAgIGNvbnN0IGZpcmV3b3JrcyA9IG5ldyBGaXJld29ya3MoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtb3ZlcmxheS1jb250ZW50XCIpLCB7XG4gICAgICAgICAgICBhY2NlbGVyYXRpb246IDEsXG4gICAgICAgICAgICB0cmFjZVNwZWVkOiAzLFxuICAgICAgICB9KTtcbiAgICAgICAgZmlyZXdvcmtzLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgaGlnaGxpZ2h0UXVlc3Rpb24oY29sLCByb3cpIHtcbiAgICAgICAgbGV0IGQgPSBudWxsO1xuICAgICAgICBsZXQgY2VsbCA9IG51bGw7XG4gICAgICAgIGxldCBkYXRhID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgICAgICBkID0gXCJBXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuYWNyb3NzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bi5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICAgICAgZCA9IFwiRFwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmRvd247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjZWxsKSByZXR1cm47XG4gICAgICAgIGxldCBxID0gY2VsbC5xO1xuICAgICAgICB2YXIgZWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1xdWVzdGlvbnMtbGlzdC1pdGVtLmFjdGl2ZVwiKTtcbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKGVsZW1zLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBxdWVzdGlvbkVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHtkfSR7cX0tJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgaWYgKCFxdWVzdGlvbkVsKSByZXR1cm47XG4gICAgICAgIHF1ZXN0aW9uRWwuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgcXVlc3Rpb25FbCB9KTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpICBjb25zb2xlLmxvZyhgI2p4d29yZC1xdWVzdGlvbi0ke2R9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRoaXMuZW5zdXJlVmlzaWJpbGl0eShxdWVzdGlvbkVsLCBxdWVzdGlvbkVsLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCk7XG4gICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkfSR7Y2VsbC5xfWApO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIikuaW5uZXJIVE1MID0gYCR7cXVlc3Rpb24ucXVlc3Rpb259YDtcbiAgICB9XG5cbiAgICBlbnN1cmVWaXNpYmlsaXR5KGVsLCBjb250YWluZXIpIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJSZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBpZiAocmVjdC5ib3R0b20gPiBjb250YWluZXJSZWN0LmJvdHRvbSkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnRvcCA8IGNvbnRhaW5lclJlY3QudG9wKSB7XG4gICAgICAgICAgICBlbC5zY3JvbGxJbnRvVmlldyh0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblF1ZXN0aW9ucygpIHtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbVwiKTtcbiAgICAgICAgZm9yKGxldCBxdWVzdGlvbiBvZiBxdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIHF1ZXN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNsaWNrUXVlc3Rpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGlja1F1ZXN0aW9uKGUpIHtcbiAgICAgICAgY29uc3QgcSA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnE7XG4gICAgICAgIGNvbnN0IGRpciA9IHFbMF07XG4gICAgICAgIGNvbnN0IG51bSA9IE51bWJlcihxLnN1YnN0cmluZygxKSk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBpZiAoZGlyID09PSBcIkFcIikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5xID09PSBudW0pIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBmaXJzdCBlbXB0eSBsZXR0ZXIgaW4gYSB3b3JkLiBJZiB0aGVyZSBpc24ndCBhbiBlbXB0eSBsZXR0ZXIsIG1vdmUgdG8gc3RhcnQgb2Ygd29yZC5cbiAgICAgICAgICAgICAgICBsZXQgZW1wdHlsZXR0ZXJzID0gc2NhbGFyLmZpbHRlcih3b3JkY2VsbCA9PiB3b3JkY2VsbC5xID09PSBudW0gJiYgd29yZGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZW1wdHlsZXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gZW1wdHlsZXR0ZXJzWzBdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGVtcHR5bGV0dGVyc1swXS5yb3c7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGNlbGwuY29sO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gY2VsbC5yb3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0QXJpYSgpIHtcbiAgICAgICAgbGV0IHRoID0gbnVtID0+IHtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDEpIHJldHVybiBcIjFzdFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMikgcmV0dXJuIFwiMm5kXCI7XG4gICAgICAgICAgICBpZiAobnVtID09PSAzKSByZXR1cm4gXCIzcmRcIjtcbiAgICAgICAgICAgIHJldHVybiBgJHtudW19dGhgO1xuICAgICAgICB9XG4gICAgICAgIGxldCBmdWxsc3RvcCA9IHMgPT4ge1xuICAgICAgICAgICAgaWYgKHMubWF0Y2goL1suP10kLykpIHJldHVybiBzO1xuICAgICAgICAgICAgcmV0dXJuIGAke3N9LmA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBkaXJMZXR0ZXIgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgZGlyTGV0dGVyID1cIkFcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5hY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBkaXJMZXR0ZXIgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgIGZvciAobGV0IGNlbGwgb2Ygc2NhbGFyKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIGxldHRlckNvdW50ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBxdWVzdGlvbiA9IGRhdGEuZmluZChxID0+IHEubnVtID09PSBgJHtkaXJMZXR0ZXJ9JHtjZWxsLnF9YCk7XG4gICAgICAgICAgICBpZiAoIXF1ZXN0aW9uKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCB3b3JkTGVuZ3RoID0gcXVlc3Rpb24ucXVlc3Rpb24ubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHMgPSBgJHtxdWVzdGlvbi5udW19LiAke2Z1bGxzdG9wKHF1ZXN0aW9uLnF1ZXN0aW9uKX0gJHt3b3JkTGVuZ3RofSBsZXR0ZXJzLCAke3RoKGxldHRlckNvdW50KX0gbGV0dGVyLmBcbiAgICAgICAgICAgIGxldHRlckNvdW50Kys7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjZWxsLmNvbH0tJHtjZWxsLnJvd30gPiAuanh3b3JkLWNlbGwtcmVjdGApIC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXQoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGNoZWF0ZWQgPSB0aGlzLnN0YXRlLmNoZWF0ZWQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5jaGVhdGVkID0gY2hlYXRlZDsgLy8gTmljZSB0cnkhXG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuaGlkZU92ZXJsYXkoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnJlc2V0XCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICB9XG5cbiAgICBjaGFuZ2VEaXJlY3Rpb24oKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjYW4gY2hhbmdlIGRpcmVjdGlvbi5cbiAgICAgICAgY29uc3Qgd29yZCA9IHRoaXMuZ2V0V29yZCghdGhpcy5zdGF0ZS5kaXJlY3Rpb24sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICBpZiAoIXdvcmQpIHJldHVybjtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAhdGhpcy5zdGF0ZS5kaXJlY3Rpb247XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuXG4gICAgfVxuXG4gICAgZ2V0V29yZChkaXJlY3Rpb24sIGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBjZWxsID0gbnVsbDtcbiAgICAgICAgaWYgKCFkaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MuZmluZChjZWxsID0+IChjb2wgPT09IGNlbGwuY29sICYmIHJvdyA9PT0gY2VsbC5yb3cpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjb2wgPT09IGNlbGwuY29sICYmIHJvdyA9PT0gY2VsbC5yb3cpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2VsbDtcbiAgICB9XG5cbiAgICBrZXlDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgZWwgPSBlLnRhcmdldDtcbiAgICAgICAgbGV0IGxldHRlciA9IGVsLmRhdGFzZXQua2V5O1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coeyBsZXR0ZXIgfSk7XG4gICAgICAgIGlmIChsZXR0ZXIgPT09IFwiQkFDS1NQQUNFXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnR5cGVMZXR0ZXIobGV0dGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrVGlsZSh4LCB5KSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IFwiI1wiKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdW3ldKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IHRoaXMuc3RhdGUuZ3JhcGhbeF1beV0pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbeF1beV0gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5kcmF3TGV0dGVyKHRoaXMuZ3JpZFt4XVt5XSwgeCwgeSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1NxdWFyZShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5jaGVja1RpbGUodGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSwgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2hlY2tXb3JkKGUpIHsgLy9UT0RPXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHNjYWxhciA9IFwiXCI7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IHRoaXMuZmluZFN0YXJ0T2ZDdXJyZW50V29yZCgpO1xuICAgICAgICB0aGlzLmNoZWNrVGlsZShzdGFydE9mQ3VycmVudFdvcmQuY29sLCBzdGFydE9mQ3VycmVudFdvcmQucm93KTtcbiAgICAgICAgbGV0IGkgPSBzdGFydE9mQ3VycmVudFdvcmQuaW5kZXggKyAxO1xuICAgICAgICB3aGlsZShzY2FsYXJbaV0gJiYgIXNjYWxhcltpXS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coc2NhbGFyW2ldKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tUaWxlKHNjYWxhcltpXS5jb2wsIHNjYWxhcltpXS5yb3cpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2hlY2tQdXp6bGUoZSkge1xuICAgICAgICBpZiAoZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBmb3IobGV0IHggPSAwOyB4IDwgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgZm9yKGxldCB5ID0gMDsgeSA8IHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbeF0ubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrVGlsZSh4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jaGVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0QXV0b2NoZWNrKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXV0b2NoZWNrLSR7dGhpcy51aWR9ID4gbGlgKS5pbm5lckhUTUwgPSBcIkF1dG9jaGVjayAmY2hlY2s7XCI7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2tcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZUF1dG9jaGVjayhlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc3RhdGUuYXV0b2NoZWNrID0gIXRoaXMuc3RhdGUuYXV0b2NoZWNrO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tQdXp6bGUoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJqeHdvcmQ6Y2hlYXRcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0QXV0b2NoZWNrKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgfVxuXG4gICAgY2xvc2VNZW51KCkge1xuICAgICAgICBjb25zdCBpbnB1dEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWVudS10b2dnbGUgaW5wdXQ6Y2hlY2tlZFwiKTtcbiAgICAgICAgaWYgKGlucHV0RWwpIGlucHV0RWwuY2hlY2tlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZUNvbXBsZXRlKCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggb2YgdGhlIGdyaWQgaXMgZmlsbGVkIGluXG4gICAgICAgIGxldCBmaWxsZWQgPSAwO1xuICAgICAgICBsZXQgdG90YWxfY2VsbHMgPSAwO1xuICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMub3B0cy5yb3dzOyByb3crKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxfY2VsbHMrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbY29sXVtyb3ddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsZWQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxsZWRfcGVyY2VudCA9IE1hdGguZmxvb3IoZmlsbGVkIC8gdG90YWxfY2VsbHMgKiAxMDApO1xuICAgICAgICB0aGlzLnN0YXRlLnByb2dyZXNzID0gZmlsbGVkX3BlcmNlbnQ7XG4gICAgICAgIHRoaXMuc3RhdGUucXVhcnRpbGUgPSBNYXRoLmZsb29yKGZpbGxlZF9wZXJjZW50IC8gMjUpO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5xdWFydGlsZSA+IHRoaXMubGFzdF9xdWFydGlsZSkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOnByb2dyZXNzXCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgICAgIHRoaXMubGFzdF9xdWFydGlsZSA9IHRoaXMuc3RhdGUucXVhcnRpbGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0tleWJvYXJkU2hvd2luZygpIHtcbiAgICAgICAgcmV0dXJuICh3aW5kb3cuaW5uZXJXaWR0aCA8PSA0ODApO1xuICAgIH1cblxuICAgIHNldHVwSU9TS2V5Ym9hcmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzS2V5Ym9hcmRTaG93aW5nKCkpIHJldHVybjtcbiAgICAgICAgY29uc3QgaW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgaW5wdXRFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG4gICAgICAgIGlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2hpZGRlbklPU0lucHV0Jyk7XG4gICAgICAgIGlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb3JyZWN0JywgJ29mZicpO1xuICAgICAgICBpbnB1dEVsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvY2FwaXRhbGl6ZScsICdvZmYnKTtcbiAgICAgICAgaW5wdXRFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsICdmYWxzZScpO1xuICAgICAgICBjb25zdCB0b3AgPSB3aW5kb3cuc2Nyb2xsWTtcbiAgICAgICAgaW5wdXRFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgcG9zaXRpb246IGFic29sdXRlOyB0b3A6ICR7dG9wfXB4OyBsZWZ0OiAwOyBvcGFjaXR5OiAwOyB3aWR0aDogMDsgaGVpZ2h0OiAwOyB6LWluZGV4OiAtMTAwO2ApO1xuICAgICAgICBsZXQgY3VycmVudFRvcCA9IHRvcDtcbiAgICAgICAgaW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjdXJyZW50VG9wID0gd2luZG93LnNjcm9sbFk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoKSA9PiB7XG4gICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgY3VycmVudFRvcCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzaG93SU9TS2V5Ym9hcmQoKSB7XG4gICAgICAgIGNvbnN0IHRvcCA9IHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICBjb25zdCBpbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlkZGVuSU9TSW5wdXQnKTtcbiAgICAgICAgaWYgKCFpbnB1dEVsZW1lbnQpIHJldHVybjtcbiAgICAgICAgaW5wdXRFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7IC8vIHVuaGlkZSB0aGUgaW5wdXRcbiAgICAgICAgaW5wdXRFbGVtZW50LnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICAgIGlucHV0RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGlucHV0RWxlbWVudC5mb2N1cygpOyAvLyBmb2N1cyBvbiBpdCBzbyBrZXlib2FyZCBwb3BzXG4gICAgICAgIGlucHV0RWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7IC8vIGhpZGUgaXQgYWdhaW5cbiAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIHRvcCk7XG4gICAgfVxuXG4gICAgY29weVRvQ2xpcGJvYXJkKGUpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnRleHQ7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGRlY29kZVVSSUNvbXBvbmVudCh0ZXh0KSk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBKWFdvcmQ7IiwiLyoqXG4gKiBuYW1lOiBmaXJld29ya3MtanNcbiAqIHZlcnNpb246IDIuMTAuN1xuICogYXV0aG9yOiBWaXRhbGlqIFJ5bmRpbiAoaHR0cHM6Ly9jcmFzaG1heC5ydSlcbiAqIGhvbWVwYWdlOiBodHRwczovL2ZpcmV3b3Jrcy5qcy5vcmdcbiAqIGxpY2Vuc2UgTUlUXG4gKi9cbmZ1bmN0aW9uIGYoZSkge1xuICByZXR1cm4gTWF0aC5hYnMoTWF0aC5mbG9vcihlKSk7XG59XG5mdW5jdGlvbiBjKGUsIHQpIHtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAodCAtIGUpICsgZTtcbn1cbmZ1bmN0aW9uIG8oZSwgdCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihjKGUsIHQgKyAxKSk7XG59XG5mdW5jdGlvbiBtKGUsIHQsIGksIHMpIHtcbiAgY29uc3QgbiA9IE1hdGgucG93O1xuICByZXR1cm4gTWF0aC5zcXJ0KG4oZSAtIGksIDIpICsgbih0IC0gcywgMikpO1xufVxuZnVuY3Rpb24geChlLCB0LCBpID0gMSkge1xuICBpZiAoZSA+IDM2MCB8fCBlIDwgMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGh1ZSAwLTM2MCByYW5nZSwgZ290IFxcYCR7ZX1cXGBgKTtcbiAgaWYgKHQgPiAxMDAgfHwgdCA8IDApXG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBsaWdodG5lc3MgMC0xMDAgcmFuZ2UsIGdvdCBcXGAke3R9XFxgYCk7XG4gIGlmIChpID4gMSB8fCBpIDwgMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGFscGhhIDAtMSByYW5nZSwgZ290IFxcYCR7aX1cXGBgKTtcbiAgcmV0dXJuIGBoc2xhKCR7ZX0sIDEwMCUsICR7dH0lLCAke2l9KWA7XG59XG5jb25zdCBnID0gKGUpID0+IHtcbiAgaWYgKHR5cGVvZiBlID09IFwib2JqZWN0XCIgJiYgZSAhPT0gbnVsbCkge1xuICAgIGlmICh0eXBlb2YgT2JqZWN0LmdldFByb3RvdHlwZU9mID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgdCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihlKTtcbiAgICAgIHJldHVybiB0ID09PSBPYmplY3QucHJvdG90eXBlIHx8IHQgPT09IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSkgPT09IFwiW29iamVjdCBPYmplY3RdXCI7XG4gIH1cbiAgcmV0dXJuICExO1xufSwgeSA9IFtcbiAgXCJfX3Byb3RvX19cIixcbiAgXCJjb25zdHJ1Y3RvclwiLFxuICBcInByb3RvdHlwZVwiXG5dLCB2ID0gKC4uLmUpID0+IGUucmVkdWNlKCh0LCBpKSA9PiAoT2JqZWN0LmtleXMoaSkuZm9yRWFjaCgocykgPT4ge1xuICB5LmluY2x1ZGVzKHMpIHx8IChBcnJheS5pc0FycmF5KHRbc10pICYmIEFycmF5LmlzQXJyYXkoaVtzXSkgPyB0W3NdID0gaVtzXSA6IGcodFtzXSkgJiYgZyhpW3NdKSA/IHRbc10gPSB2KHRbc10sIGlbc10pIDogdFtzXSA9IGlbc10pO1xufSksIHQpLCB7fSk7XG5mdW5jdGlvbiBiKGUsIHQpIHtcbiAgbGV0IGk7XG4gIHJldHVybiAoLi4ucykgPT4ge1xuICAgIGkgJiYgY2xlYXJUaW1lb3V0KGkpLCBpID0gc2V0VGltZW91dCgoKSA9PiBlKC4uLnMpLCB0KTtcbiAgfTtcbn1cbmNsYXNzIFMge1xuICB4O1xuICB5O1xuICBjdHg7XG4gIGh1ZTtcbiAgZnJpY3Rpb247XG4gIGdyYXZpdHk7XG4gIGZsaWNrZXJpbmc7XG4gIGxpbmVXaWR0aDtcbiAgZXhwbG9zaW9uTGVuZ3RoO1xuICBhbmdsZTtcbiAgc3BlZWQ7XG4gIGJyaWdodG5lc3M7XG4gIGNvb3JkaW5hdGVzID0gW107XG4gIGRlY2F5O1xuICBhbHBoYSA9IDE7XG4gIGNvbnN0cnVjdG9yKHtcbiAgICB4OiB0LFxuICAgIHk6IGksXG4gICAgY3R4OiBzLFxuICAgIGh1ZTogbixcbiAgICBkZWNheTogaCxcbiAgICBncmF2aXR5OiBhLFxuICAgIGZyaWN0aW9uOiByLFxuICAgIGJyaWdodG5lc3M6IHUsXG4gICAgZmxpY2tlcmluZzogcCxcbiAgICBsaW5lV2lkdGg6IGwsXG4gICAgZXhwbG9zaW9uTGVuZ3RoOiBkXG4gIH0pIHtcbiAgICBmb3IgKHRoaXMueCA9IHQsIHRoaXMueSA9IGksIHRoaXMuY3R4ID0gcywgdGhpcy5odWUgPSBuLCB0aGlzLmdyYXZpdHkgPSBhLCB0aGlzLmZyaWN0aW9uID0gciwgdGhpcy5mbGlja2VyaW5nID0gcCwgdGhpcy5saW5lV2lkdGggPSBsLCB0aGlzLmV4cGxvc2lvbkxlbmd0aCA9IGQsIHRoaXMuYW5nbGUgPSBjKDAsIE1hdGguUEkgKiAyKSwgdGhpcy5zcGVlZCA9IG8oMSwgMTApLCB0aGlzLmJyaWdodG5lc3MgPSBvKHUubWluLCB1Lm1heCksIHRoaXMuZGVjYXkgPSBjKGgubWluLCBoLm1heCk7IHRoaXMuZXhwbG9zaW9uTGVuZ3RoLS07IClcbiAgICAgIHRoaXMuY29vcmRpbmF0ZXMucHVzaChbdCwgaV0pO1xuICB9XG4gIHVwZGF0ZSh0KSB7XG4gICAgdGhpcy5jb29yZGluYXRlcy5wb3AoKSwgdGhpcy5jb29yZGluYXRlcy51bnNoaWZ0KFt0aGlzLngsIHRoaXMueV0pLCB0aGlzLnNwZWVkICo9IHRoaXMuZnJpY3Rpb24sIHRoaXMueCArPSBNYXRoLmNvcyh0aGlzLmFuZ2xlKSAqIHRoaXMuc3BlZWQsIHRoaXMueSArPSBNYXRoLnNpbih0aGlzLmFuZ2xlKSAqIHRoaXMuc3BlZWQgKyB0aGlzLmdyYXZpdHksIHRoaXMuYWxwaGEgLT0gdGhpcy5kZWNheSwgdGhpcy5hbHBoYSA8PSB0aGlzLmRlY2F5ICYmIHQoKTtcbiAgfVxuICBkcmF3KCkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmNvb3JkaW5hdGVzLmxlbmd0aCAtIDE7XG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCksIHRoaXMuY3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoLCB0aGlzLmN0eC5maWxsU3R5bGUgPSB4KHRoaXMuaHVlLCB0aGlzLmJyaWdodG5lc3MsIHRoaXMuYWxwaGEpLCB0aGlzLmN0eC5tb3ZlVG8oXG4gICAgICB0aGlzLmNvb3JkaW5hdGVzW3RdWzBdLFxuICAgICAgdGhpcy5jb29yZGluYXRlc1t0XVsxXVxuICAgICksIHRoaXMuY3R4LmxpbmVUbyh0aGlzLngsIHRoaXMueSksIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0geChcbiAgICAgIHRoaXMuaHVlLFxuICAgICAgdGhpcy5mbGlja2VyaW5nID8gYygwLCB0aGlzLmJyaWdodG5lc3MpIDogdGhpcy5icmlnaHRuZXNzLFxuICAgICAgdGhpcy5hbHBoYVxuICAgICksIHRoaXMuY3R4LnN0cm9rZSgpO1xuICB9XG59XG5jbGFzcyBFIHtcbiAgY29uc3RydWN0b3IodCwgaSkge1xuICAgIHRoaXMub3B0aW9ucyA9IHQsIHRoaXMuY2FudmFzID0gaSwgdGhpcy5wb2ludGVyRG93biA9IHRoaXMucG9pbnRlckRvd24uYmluZCh0aGlzKSwgdGhpcy5wb2ludGVyVXAgPSB0aGlzLnBvaW50ZXJVcC5iaW5kKHRoaXMpLCB0aGlzLnBvaW50ZXJNb3ZlID0gdGhpcy5wb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICB9XG4gIGFjdGl2ZSA9ICExO1xuICB4O1xuICB5O1xuICBnZXQgbW91c2VPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubW91c2U7XG4gIH1cbiAgbW91bnQoKSB7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMucG9pbnRlckRvd24pLCB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHRoaXMucG9pbnRlclVwKSwgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMucG9pbnRlck1vdmUpO1xuICB9XG4gIHVubW91bnQoKSB7XG4gICAgdGhpcy5jYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMucG9pbnRlckRvd24pLCB0aGlzLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHRoaXMucG9pbnRlclVwKSwgdGhpcy5jYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMucG9pbnRlck1vdmUpO1xuICB9XG4gIHVzZVBvaW50ZXIodCwgaSkge1xuICAgIGNvbnN0IHsgY2xpY2s6IHMsIG1vdmU6IG4gfSA9IHRoaXMubW91c2VPcHRpb25zO1xuICAgIChzIHx8IG4pICYmICh0aGlzLnggPSB0LnBhZ2VYIC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCwgdGhpcy55ID0gdC5wYWdlWSAtIHRoaXMuY2FudmFzLm9mZnNldFRvcCwgdGhpcy5hY3RpdmUgPSBpKTtcbiAgfVxuICBwb2ludGVyRG93bih0KSB7XG4gICAgdGhpcy51c2VQb2ludGVyKHQsIHRoaXMubW91c2VPcHRpb25zLmNsaWNrKTtcbiAgfVxuICBwb2ludGVyVXAodCkge1xuICAgIHRoaXMudXNlUG9pbnRlcih0LCAhMSk7XG4gIH1cbiAgcG9pbnRlck1vdmUodCkge1xuICAgIHRoaXMudXNlUG9pbnRlcih0LCB0aGlzLmFjdGl2ZSk7XG4gIH1cbn1cbmNsYXNzIE8ge1xuICBodWU7XG4gIHJvY2tldHNQb2ludDtcbiAgb3BhY2l0eTtcbiAgYWNjZWxlcmF0aW9uO1xuICBmcmljdGlvbjtcbiAgZ3Jhdml0eTtcbiAgcGFydGljbGVzO1xuICBleHBsb3Npb247XG4gIG1vdXNlO1xuICBib3VuZGFyaWVzO1xuICBzb3VuZDtcbiAgZGVsYXk7XG4gIGJyaWdodG5lc3M7XG4gIGRlY2F5O1xuICBmbGlja2VyaW5nO1xuICBpbnRlbnNpdHk7XG4gIHRyYWNlTGVuZ3RoO1xuICB0cmFjZVNwZWVkO1xuICBsaW5lV2lkdGg7XG4gIGxpbmVTdHlsZTtcbiAgYXV0b3Jlc2l6ZTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5hdXRvcmVzaXplID0gITAsIHRoaXMubGluZVN0eWxlID0gXCJyb3VuZFwiLCB0aGlzLmZsaWNrZXJpbmcgPSA1MCwgdGhpcy50cmFjZUxlbmd0aCA9IDMsIHRoaXMudHJhY2VTcGVlZCA9IDEwLCB0aGlzLmludGVuc2l0eSA9IDMwLCB0aGlzLmV4cGxvc2lvbiA9IDUsIHRoaXMuZ3Jhdml0eSA9IDEuNSwgdGhpcy5vcGFjaXR5ID0gMC41LCB0aGlzLnBhcnRpY2xlcyA9IDUwLCB0aGlzLmZyaWN0aW9uID0gMC45NSwgdGhpcy5hY2NlbGVyYXRpb24gPSAxLjA1LCB0aGlzLmh1ZSA9IHtcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogMzYwXG4gICAgfSwgdGhpcy5yb2NrZXRzUG9pbnQgPSB7XG4gICAgICBtaW46IDUwLFxuICAgICAgbWF4OiA1MFxuICAgIH0sIHRoaXMubGluZVdpZHRoID0ge1xuICAgICAgZXhwbG9zaW9uOiB7XG4gICAgICAgIG1pbjogMSxcbiAgICAgICAgbWF4OiAzXG4gICAgICB9LFxuICAgICAgdHJhY2U6IHtcbiAgICAgICAgbWluOiAxLFxuICAgICAgICBtYXg6IDJcbiAgICAgIH1cbiAgICB9LCB0aGlzLm1vdXNlID0ge1xuICAgICAgY2xpY2s6ICExLFxuICAgICAgbW92ZTogITEsXG4gICAgICBtYXg6IDFcbiAgICB9LCB0aGlzLmRlbGF5ID0ge1xuICAgICAgbWluOiAzMCxcbiAgICAgIG1heDogNjBcbiAgICB9LCB0aGlzLmJyaWdodG5lc3MgPSB7XG4gICAgICBtaW46IDUwLFxuICAgICAgbWF4OiA4MFxuICAgIH0sIHRoaXMuZGVjYXkgPSB7XG4gICAgICBtaW46IDAuMDE1LFxuICAgICAgbWF4OiAwLjAzXG4gICAgfSwgdGhpcy5zb3VuZCA9IHtcbiAgICAgIGVuYWJsZWQ6ICExLFxuICAgICAgZmlsZXM6IFtcbiAgICAgICAgXCJleHBsb3Npb24wLm1wM1wiLFxuICAgICAgICBcImV4cGxvc2lvbjEubXAzXCIsXG4gICAgICAgIFwiZXhwbG9zaW9uMi5tcDNcIlxuICAgICAgXSxcbiAgICAgIHZvbHVtZToge1xuICAgICAgICBtaW46IDQsXG4gICAgICAgIG1heDogOFxuICAgICAgfVxuICAgIH0sIHRoaXMuYm91bmRhcmllcyA9IHtcbiAgICAgIGRlYnVnOiAhMSxcbiAgICAgIGhlaWdodDogMCxcbiAgICAgIHdpZHRoOiAwLFxuICAgICAgeDogNTAsXG4gICAgICB5OiA1MFxuICAgIH07XG4gIH1cbiAgdXBkYXRlKHQpIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHYodGhpcywgdCkpO1xuICB9XG59XG5jbGFzcyB6IHtcbiAgY29uc3RydWN0b3IodCwgaSkge1xuICAgIHRoaXMub3B0aW9ucyA9IHQsIHRoaXMucmVuZGVyID0gaTtcbiAgfVxuICB0aWNrID0gMDtcbiAgcmFmSWQgPSAwO1xuICBmcHMgPSA2MDtcbiAgdG9sZXJhbmNlID0gMC4xO1xuICBub3c7XG4gIG1vdW50KCkge1xuICAgIHRoaXMubm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc3QgdCA9IDFlMyAvIHRoaXMuZnBzLCBpID0gKHMpID0+IHtcbiAgICAgIHRoaXMucmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoaSk7XG4gICAgICBjb25zdCBuID0gcyAtIHRoaXMubm93O1xuICAgICAgbiA+PSB0IC0gdGhpcy50b2xlcmFuY2UgJiYgKHRoaXMucmVuZGVyKCksIHRoaXMubm93ID0gcyAtIG4gJSB0LCB0aGlzLnRpY2sgKz0gbiAqICh0aGlzLm9wdGlvbnMuaW50ZW5zaXR5ICogTWF0aC5QSSkgLyAxZTMpO1xuICAgIH07XG4gICAgdGhpcy5yYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShpKTtcbiAgfVxuICB1bm1vdW50KCkge1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuICB9XG59XG5jbGFzcyBMIHtcbiAgY29uc3RydWN0b3IodCwgaSwgcykge1xuICAgIHRoaXMub3B0aW9ucyA9IHQsIHRoaXMudXBkYXRlU2l6ZSA9IGksIHRoaXMuY29udGFpbmVyID0gcztcbiAgfVxuICByZXNpemVyO1xuICBtb3VudCgpIHtcbiAgICBpZiAoIXRoaXMucmVzaXplcikge1xuICAgICAgY29uc3QgdCA9IGIoKCkgPT4gdGhpcy51cGRhdGVTaXplKCksIDEwMCk7XG4gICAgICB0aGlzLnJlc2l6ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIodCk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5hdXRvcmVzaXplICYmIHRoaXMucmVzaXplci5vYnNlcnZlKHRoaXMuY29udGFpbmVyKTtcbiAgfVxuICB1bm1vdW50KCkge1xuICAgIHRoaXMucmVzaXplciAmJiB0aGlzLnJlc2l6ZXIudW5vYnNlcnZlKHRoaXMuY29udGFpbmVyKTtcbiAgfVxufVxuY2xhc3MgTSB7XG4gIGNvbnN0cnVjdG9yKHQpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSB0LCB0aGlzLmluaXQoKTtcbiAgfVxuICBidWZmZXJzID0gW107XG4gIGF1ZGlvQ29udGV4dDtcbiAgb25Jbml0ID0gITE7XG4gIGdldCBpc0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zb3VuZC5lbmFibGVkO1xuICB9XG4gIGdldCBzb3VuZE9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zb3VuZDtcbiAgfVxuICBpbml0KCkge1xuICAgICF0aGlzLm9uSW5pdCAmJiB0aGlzLmlzRW5hYmxlZCAmJiAodGhpcy5vbkluaXQgPSAhMCwgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgKHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCkoKSwgdGhpcy5sb2FkU291bmRzKCkpO1xuICB9XG4gIGFzeW5jIGxvYWRTb3VuZHMoKSB7XG4gICAgZm9yIChjb25zdCB0IG9mIHRoaXMuc291bmRPcHRpb25zLmZpbGVzKSB7XG4gICAgICBjb25zdCBpID0gYXdhaXQgKGF3YWl0IGZldGNoKHQpKS5hcnJheUJ1ZmZlcigpO1xuICAgICAgdGhpcy5hdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGkpLnRoZW4oKHMpID0+IHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnB1c2gocyk7XG4gICAgICB9KS5jYXRjaCgocykgPT4ge1xuICAgICAgICB0aHJvdyBzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHBsYXkoKSB7XG4gICAgaWYgKHRoaXMuaXNFbmFibGVkICYmIHRoaXMuYnVmZmVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSwgaSA9IHRoaXMuYnVmZmVyc1tvKDAsIHRoaXMuYnVmZmVycy5sZW5ndGggLSAxKV0sIHMgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICB0LmJ1ZmZlciA9IGksIHMuZ2Fpbi52YWx1ZSA9IGMoXG4gICAgICAgIHRoaXMuc291bmRPcHRpb25zLnZvbHVtZS5taW4gLyAxMDAsXG4gICAgICAgIHRoaXMuc291bmRPcHRpb25zLnZvbHVtZS5tYXggLyAxMDBcbiAgICAgICksIHMuY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbiksIHQuY29ubmVjdChzKSwgdC5zdGFydCgwKTtcbiAgICB9IGVsc2VcbiAgICAgIHRoaXMuaW5pdCgpO1xuICB9XG59XG5jbGFzcyBDIHtcbiAgeDtcbiAgeTtcbiAgc3g7XG4gIHN5O1xuICBkeDtcbiAgZHk7XG4gIGN0eDtcbiAgaHVlO1xuICBzcGVlZDtcbiAgYWNjZWxlcmF0aW9uO1xuICB0cmFjZUxlbmd0aDtcbiAgdG90YWxEaXN0YW5jZTtcbiAgYW5nbGU7XG4gIGJyaWdodG5lc3M7XG4gIGNvb3JkaW5hdGVzID0gW107XG4gIGN1cnJlbnREaXN0YW5jZSA9IDA7XG4gIGNvbnN0cnVjdG9yKHtcbiAgICB4OiB0LFxuICAgIHk6IGksXG4gICAgZHg6IHMsXG4gICAgZHk6IG4sXG4gICAgY3R4OiBoLFxuICAgIGh1ZTogYSxcbiAgICBzcGVlZDogcixcbiAgICB0cmFjZUxlbmd0aDogdSxcbiAgICBhY2NlbGVyYXRpb246IHBcbiAgfSkge1xuICAgIGZvciAodGhpcy54ID0gdCwgdGhpcy55ID0gaSwgdGhpcy5zeCA9IHQsIHRoaXMuc3kgPSBpLCB0aGlzLmR4ID0gcywgdGhpcy5keSA9IG4sIHRoaXMuY3R4ID0gaCwgdGhpcy5odWUgPSBhLCB0aGlzLnNwZWVkID0gciwgdGhpcy50cmFjZUxlbmd0aCA9IHUsIHRoaXMuYWNjZWxlcmF0aW9uID0gcCwgdGhpcy50b3RhbERpc3RhbmNlID0gbSh0LCBpLCBzLCBuKSwgdGhpcy5hbmdsZSA9IE1hdGguYXRhbjIobiAtIGksIHMgLSB0KSwgdGhpcy5icmlnaHRuZXNzID0gbyg1MCwgNzApOyB0aGlzLnRyYWNlTGVuZ3RoLS07IClcbiAgICAgIHRoaXMuY29vcmRpbmF0ZXMucHVzaChbdCwgaV0pO1xuICB9XG4gIHVwZGF0ZSh0KSB7XG4gICAgdGhpcy5jb29yZGluYXRlcy5wb3AoKSwgdGhpcy5jb29yZGluYXRlcy51bnNoaWZ0KFt0aGlzLngsIHRoaXMueV0pLCB0aGlzLnNwZWVkICo9IHRoaXMuYWNjZWxlcmF0aW9uO1xuICAgIGNvbnN0IGkgPSBNYXRoLmNvcyh0aGlzLmFuZ2xlKSAqIHRoaXMuc3BlZWQsIHMgPSBNYXRoLnNpbih0aGlzLmFuZ2xlKSAqIHRoaXMuc3BlZWQ7XG4gICAgdGhpcy5jdXJyZW50RGlzdGFuY2UgPSBtKFxuICAgICAgdGhpcy5zeCxcbiAgICAgIHRoaXMuc3ksXG4gICAgICB0aGlzLnggKyBpLFxuICAgICAgdGhpcy55ICsgc1xuICAgICksIHRoaXMuY3VycmVudERpc3RhbmNlID49IHRoaXMudG90YWxEaXN0YW5jZSA/IHQodGhpcy5keCwgdGhpcy5keSwgdGhpcy5odWUpIDogKHRoaXMueCArPSBpLCB0aGlzLnkgKz0gcyk7XG4gIH1cbiAgZHJhdygpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5jb29yZGluYXRlcy5sZW5ndGggLSAxO1xuICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpLCB0aGlzLmN0eC5tb3ZlVG8oXG4gICAgICB0aGlzLmNvb3JkaW5hdGVzW3RdWzBdLFxuICAgICAgdGhpcy5jb29yZGluYXRlc1t0XVsxXVxuICAgICksIHRoaXMuY3R4LmxpbmVUbyh0aGlzLngsIHRoaXMueSksIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0geCh0aGlzLmh1ZSwgdGhpcy5icmlnaHRuZXNzKSwgdGhpcy5jdHguc3Ryb2tlKCk7XG4gIH1cbn1cbmNsYXNzIFQge1xuICB0YXJnZXQ7XG4gIGNvbnRhaW5lcjtcbiAgY2FudmFzO1xuICBjdHg7XG4gIHdpZHRoO1xuICBoZWlnaHQ7XG4gIHRyYWNlcyA9IFtdO1xuICBleHBsb3Npb25zID0gW107XG4gIHdhaXRTdG9wUmFmO1xuICBydW5uaW5nID0gITE7XG4gIG9wdHM7XG4gIHNvdW5kO1xuICByZXNpemU7XG4gIG1vdXNlO1xuICByYWY7XG4gIGNvbnN0cnVjdG9yKHQsIGkgPSB7fSkge1xuICAgIHRoaXMudGFyZ2V0ID0gdCwgdGhpcy5jb250YWluZXIgPSB0LCB0aGlzLm9wdHMgPSBuZXcgTygpLCB0aGlzLmNyZWF0ZUNhbnZhcyh0aGlzLnRhcmdldCksIHRoaXMudXBkYXRlT3B0aW9ucyhpKSwgdGhpcy5zb3VuZCA9IG5ldyBNKHRoaXMub3B0cyksIHRoaXMucmVzaXplID0gbmV3IEwoXG4gICAgICB0aGlzLm9wdHMsXG4gICAgICB0aGlzLnVwZGF0ZVNpemUuYmluZCh0aGlzKSxcbiAgICAgIHRoaXMuY29udGFpbmVyXG4gICAgKSwgdGhpcy5tb3VzZSA9IG5ldyBFKHRoaXMub3B0cywgdGhpcy5jYW52YXMpLCB0aGlzLnJhZiA9IG5ldyB6KHRoaXMub3B0cywgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XG4gIH1cbiAgZ2V0IGlzUnVubmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5ydW5uaW5nO1xuICB9XG4gIGdldCB2ZXJzaW9uKCkge1xuICAgIHJldHVybiBcIjIuMTAuN1wiO1xuICB9XG4gIGdldCBjdXJyZW50T3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRzO1xuICB9XG4gIHN0YXJ0KCkge1xuICAgIHRoaXMucnVubmluZyB8fCAodGhpcy5jYW52YXMuaXNDb25uZWN0ZWQgfHwgdGhpcy5jcmVhdGVDYW52YXModGhpcy50YXJnZXQpLCB0aGlzLnJ1bm5pbmcgPSAhMCwgdGhpcy5yZXNpemUubW91bnQoKSwgdGhpcy5tb3VzZS5tb3VudCgpLCB0aGlzLnJhZi5tb3VudCgpKTtcbiAgfVxuICBzdG9wKHQgPSAhMSkge1xuICAgICF0aGlzLnJ1bm5pbmcgfHwgKHRoaXMucnVubmluZyA9ICExLCB0aGlzLnJlc2l6ZS51bm1vdW50KCksIHRoaXMubW91c2UudW5tb3VudCgpLCB0aGlzLnJhZi51bm1vdW50KCksIHRoaXMuY2xlYXIoKSwgdCAmJiB0aGlzLmNhbnZhcy5yZW1vdmUoKSk7XG4gIH1cbiAgYXN5bmMgd2FpdFN0b3AodCkge1xuICAgIGlmICghIXRoaXMucnVubmluZylcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoaSkgPT4ge1xuICAgICAgICB0aGlzLndhaXRTdG9wUmFmID0gKCkgPT4ge1xuICAgICAgICAgICF0aGlzLndhaXRTdG9wUmFmIHx8IChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy53YWl0U3RvcFJhZiksICF0aGlzLnRyYWNlcy5sZW5ndGggJiYgIXRoaXMuZXhwbG9zaW9ucy5sZW5ndGggJiYgKHRoaXMud2FpdFN0b3BSYWYgPSBudWxsLCB0aGlzLnN0b3AodCksIGkoKSkpO1xuICAgICAgICB9LCB0aGlzLndhaXRTdG9wUmFmKCk7XG4gICAgICB9KTtcbiAgfVxuICBwYXVzZSgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSAhdGhpcy5ydW5uaW5nLCB0aGlzLnJ1bm5pbmcgPyB0aGlzLnJhZi5tb3VudCgpIDogdGhpcy5yYWYudW5tb3VudCgpO1xuICB9XG4gIGNsZWFyKCkge1xuICAgICF0aGlzLmN0eCB8fCAodGhpcy50cmFjZXMgPSBbXSwgdGhpcy5leHBsb3Npb25zID0gW10sIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCkpO1xuICB9XG4gIGxhdW5jaCh0ID0gMSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdDsgaSsrKVxuICAgICAgdGhpcy5jcmVhdGVUcmFjZSgpO1xuICAgIHRoaXMud2FpdFN0b3BSYWYgfHwgKHRoaXMuc3RhcnQoKSwgdGhpcy53YWl0U3RvcCgpKTtcbiAgfVxuICB1cGRhdGVPcHRpb25zKHQpIHtcbiAgICB0aGlzLm9wdHMudXBkYXRlKHQpO1xuICB9XG4gIHVwZGF0ZVNpemUoe1xuICAgIHdpZHRoOiB0ID0gdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGgsXG4gICAgaGVpZ2h0OiBpID0gdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0XG4gIH0gPSB7fSkge1xuICAgIHRoaXMud2lkdGggPSB0LCB0aGlzLmhlaWdodCA9IGksIHRoaXMuY2FudmFzLndpZHRoID0gdCwgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaSwgdGhpcy51cGRhdGVCb3VuZGFyaWVzKHtcbiAgICAgIC4uLnRoaXMub3B0cy5ib3VuZGFyaWVzLFxuICAgICAgd2lkdGg6IHQsXG4gICAgICBoZWlnaHQ6IGlcbiAgICB9KTtcbiAgfVxuICB1cGRhdGVCb3VuZGFyaWVzKHQpIHtcbiAgICB0aGlzLnVwZGF0ZU9wdGlvbnMoeyBib3VuZGFyaWVzOiB0IH0pO1xuICB9XG4gIGNyZWF0ZUNhbnZhcyh0KSB7XG4gICAgdCBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50ID8gKHQuaXNDb25uZWN0ZWQgfHwgZG9jdW1lbnQuYm9keS5hcHBlbmQodCksIHRoaXMuY2FudmFzID0gdCkgOiAodGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLCB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5jYW52YXMpKSwgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIiksIHRoaXMudXBkYXRlU2l6ZSgpO1xuICB9XG4gIHJlbmRlcigpIHtcbiAgICBpZiAoIXRoaXMuY3R4IHx8ICF0aGlzLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgeyBvcGFjaXR5OiB0LCBsaW5lU3R5bGU6IGksIGxpbmVXaWR0aDogcyB9ID0gdGhpcy5vcHRzO1xuICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiZGVzdGluYXRpb24tb3V0XCIsIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGByZ2JhKDAsIDAsIDAsICR7dH0pYCwgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpLCB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImxpZ2h0ZXJcIiwgdGhpcy5jdHgubGluZUNhcCA9IGksIHRoaXMuY3R4LmxpbmVKb2luID0gXCJyb3VuZFwiLCB0aGlzLmN0eC5saW5lV2lkdGggPSBjKHMudHJhY2UubWluLCBzLnRyYWNlLm1heCksIHRoaXMuaW5pdFRyYWNlKCksIHRoaXMuZHJhd1RyYWNlKCksIHRoaXMuZHJhd0V4cGxvc2lvbigpO1xuICB9XG4gIGNyZWF0ZVRyYWNlKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGh1ZTogdCxcbiAgICAgIHJvY2tldHNQb2ludDogaSxcbiAgICAgIGJvdW5kYXJpZXM6IHMsXG4gICAgICB0cmFjZUxlbmd0aDogbixcbiAgICAgIHRyYWNlU3BlZWQ6IGgsXG4gICAgICBhY2NlbGVyYXRpb246IGEsXG4gICAgICBtb3VzZTogclxuICAgIH0gPSB0aGlzLm9wdHM7XG4gICAgdGhpcy50cmFjZXMucHVzaChcbiAgICAgIG5ldyBDKHtcbiAgICAgICAgeDogdGhpcy53aWR0aCAqIG8oaS5taW4sIGkubWF4KSAvIDEwMCxcbiAgICAgICAgeTogdGhpcy5oZWlnaHQsXG4gICAgICAgIGR4OiB0aGlzLm1vdXNlLnggJiYgci5tb3ZlIHx8IHRoaXMubW91c2UuYWN0aXZlID8gdGhpcy5tb3VzZS54IDogbyhzLngsIHMud2lkdGggLSBzLnggKiAyKSxcbiAgICAgICAgZHk6IHRoaXMubW91c2UueSAmJiByLm1vdmUgfHwgdGhpcy5tb3VzZS5hY3RpdmUgPyB0aGlzLm1vdXNlLnkgOiBvKHMueSwgcy5oZWlnaHQgKiAwLjUpLFxuICAgICAgICBjdHg6IHRoaXMuY3R4LFxuICAgICAgICBodWU6IG8odC5taW4sIHQubWF4KSxcbiAgICAgICAgc3BlZWQ6IGgsXG4gICAgICAgIGFjY2VsZXJhdGlvbjogYSxcbiAgICAgICAgdHJhY2VMZW5ndGg6IGYobilcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICBpbml0VHJhY2UoKSB7XG4gICAgaWYgKHRoaXMud2FpdFN0b3BSYWYpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgeyBkZWxheTogdCwgbW91c2U6IGkgfSA9IHRoaXMub3B0cztcbiAgICAodGhpcy5yYWYudGljayA+IG8odC5taW4sIHQubWF4KSB8fCB0aGlzLm1vdXNlLmFjdGl2ZSAmJiBpLm1heCA+IHRoaXMudHJhY2VzLmxlbmd0aCkgJiYgKHRoaXMuY3JlYXRlVHJhY2UoKSwgdGhpcy5yYWYudGljayA9IDApO1xuICB9XG4gIGRyYXdUcmFjZSgpIHtcbiAgICBsZXQgdCA9IHRoaXMudHJhY2VzLmxlbmd0aDtcbiAgICBmb3IgKDsgdC0tOyApXG4gICAgICB0aGlzLnRyYWNlc1t0XS5kcmF3KCksIHRoaXMudHJhY2VzW3RdLnVwZGF0ZSgoaSwgcywgbikgPT4ge1xuICAgICAgICB0aGlzLmluaXRFeHBsb3Npb24oaSwgcywgbiksIHRoaXMuc291bmQucGxheSgpLCB0aGlzLnRyYWNlcy5zcGxpY2UodCwgMSk7XG4gICAgICB9KTtcbiAgfVxuICBpbml0RXhwbG9zaW9uKHQsIGksIHMpIHtcbiAgICBjb25zdCB7XG4gICAgICBwYXJ0aWNsZXM6IG4sXG4gICAgICBmbGlja2VyaW5nOiBoLFxuICAgICAgbGluZVdpZHRoOiBhLFxuICAgICAgZXhwbG9zaW9uOiByLFxuICAgICAgYnJpZ2h0bmVzczogdSxcbiAgICAgIGZyaWN0aW9uOiBwLFxuICAgICAgZ3Jhdml0eTogbCxcbiAgICAgIGRlY2F5OiBkXG4gICAgfSA9IHRoaXMub3B0cztcbiAgICBsZXQgdyA9IGYobik7XG4gICAgZm9yICg7IHctLTsgKVxuICAgICAgdGhpcy5leHBsb3Npb25zLnB1c2goXG4gICAgICAgIG5ldyBTKHtcbiAgICAgICAgICB4OiB0LFxuICAgICAgICAgIHk6IGksXG4gICAgICAgICAgY3R4OiB0aGlzLmN0eCxcbiAgICAgICAgICBodWU6IHMsXG4gICAgICAgICAgZnJpY3Rpb246IHAsXG4gICAgICAgICAgZ3Jhdml0eTogbCxcbiAgICAgICAgICBmbGlja2VyaW5nOiBvKDAsIDEwMCkgPD0gaCxcbiAgICAgICAgICBsaW5lV2lkdGg6IGMoXG4gICAgICAgICAgICBhLmV4cGxvc2lvbi5taW4sXG4gICAgICAgICAgICBhLmV4cGxvc2lvbi5tYXhcbiAgICAgICAgICApLFxuICAgICAgICAgIGV4cGxvc2lvbkxlbmd0aDogZihyKSxcbiAgICAgICAgICBicmlnaHRuZXNzOiB1LFxuICAgICAgICAgIGRlY2F5OiBkXG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG4gIGRyYXdFeHBsb3Npb24oKSB7XG4gICAgbGV0IHQgPSB0aGlzLmV4cGxvc2lvbnMubGVuZ3RoO1xuICAgIGZvciAoOyB0LS07IClcbiAgICAgIHRoaXMuZXhwbG9zaW9uc1t0XS5kcmF3KCksIHRoaXMuZXhwbG9zaW9uc1t0XS51cGRhdGUoKCkgPT4ge1xuICAgICAgICB0aGlzLmV4cGxvc2lvbnMuc3BsaWNlKHQsIDEpO1xuICAgICAgfSk7XG4gIH1cbn1cbmV4cG9ydCB7XG4gIFQgYXMgRmlyZXdvcmtzLFxuICBUIGFzIGRlZmF1bHRcbn07XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IEpYV29yZCBmcm9tIFwiLi9qcy9qeHdvcmQtZ3JpZFwiO1xuaW1wb3J0IHhkcGFyc2VyIGZyb20gXCJ4ZC1jcm9zc3dvcmQtcGFyc2VyXCI7XG5pbXBvcnQgXCIuL2Nzcy9qeHdvcmQubGVzc1wiO1xuaW1wb3J0IHtFdmVudHN9IGZyb20gXCIuL2pzL2V2ZW50c1wiO1xuXG5hc3luYyBmdW5jdGlvbiBfYWRkX2Nyb3Nzd29yZChjcm9zc3dvcmRfZGF0YSwgY29udGFpbmVyX2lkLCBkZWJ1ZyA9IGZhbHNlKSB7XG4gICAgaWYgKCFjcm9zc3dvcmRfZGF0YSkgcmV0dXJuO1xuICAgIGNvbnN0IHVuZW5jb2RlZF9kYXRhID0gYXRvYihjcm9zc3dvcmRfZGF0YSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHhkcGFyc2VyKHVuZW5jb2RlZF9kYXRhKTtcbiAgICB3aW5kb3cuanh3b3JkID0gbmV3IEpYV29yZCh7IFxuICAgICAgICBjb250YWluZXI6IGAjJHtjb250YWluZXJfaWR9YCxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgZGVidWdcbiAgICB9KTtcbiAgICB3aW5kb3cuanh3b3JkLmV2ZW50cyA9IG5ldyBFdmVudHMoYCMke2NvbnRhaW5lcl9pZH1gKTtcbn1cbndpbmRvdy5hZGRfY3Jvc3N3b3JkID0gX2FkZF9jcm9zc3dvcmQ7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9