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
        let share_url = urlParams.get('share_url') || window.jxword_permalink || window.location.href;
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
        setTimeout(() => {
            alert("Copied to clipboard");
        }, 100);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmp4d29yZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7OztBQ0FBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQSw2RUFBNkUsYUFBYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixrQkFBa0I7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isa0JBQWtCO0FBQzFDO0FBQ0E7QUFDQSx1RUFBdUUsU0FBUztBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7QUNsRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBLE1BQU07QUFDTix1Q0FBdUMsS0FBSztBQUM1QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOzs7Ozs7Ozs7Ozs7Ozs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFd0M7O0FBRXhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDZEQUE2RCxvQkFBb0I7QUFDakY7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4REFBOEQ7QUFDOUQ7QUFDQSxvR0FBb0c7QUFDcEcsOENBQThDO0FBQzlDLHFDQUFxQyxvQkFBb0I7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZFQUE2RSxvQkFBb0I7QUFDakc7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQSw2REFBNkQsU0FBUztBQUN0RSxzQ0FBc0MsU0FBUztBQUMvQztBQUNBLDZDQUE2QyxTQUFTO0FBQ3REO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RCxTQUFTO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RCxTQUFTO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBLG1GQUFtRixTQUFTO0FBQzVGLHdEQUF3RCxTQUFTO0FBQ2pFLDBEQUEwRCxTQUFTO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxTQUFTO0FBQzVEO0FBQ0EsOEJBQThCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxzRUFBc0UsRUFBRTtBQUMzRyxzQ0FBc0MsdUJBQXVCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBELFNBQVM7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0RBQStELFNBQVM7QUFDeEU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0EsZ0VBQWdFLFNBQVM7QUFDekU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJELFNBQVM7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxTQUFTO0FBQ3pEO0FBQ0E7QUFDQSxnREFBZ0QsU0FBUztBQUN6RDtBQUNBO0FBQ0EsOENBQThDLFNBQVM7QUFDdkQsNENBQTRDLGtCQUFrQixHQUFHLGtCQUFrQjtBQUNuRiwyRUFBMkUsVUFBVTtBQUNyRjtBQUNBO0FBQ0E7QUFDQSw2RkFBNkYsVUFBVSxRQUFRO0FBQy9HLDBGQUEwRixVQUFVO0FBQ3BHLG1HQUFtRyxVQUFVLFFBQVE7QUFDckg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0dBQW9HO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBLDRHQUE0RyxVQUFVO0FBQ3RILHVGQUF1RixVQUFVO0FBQ2pHO0FBQ0E7QUFDQSxtRkFBbUYsVUFBVTtBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsVUFBVTtBQUNwRSx1RUFBdUUsVUFBVTtBQUNqRjs7QUFFQTtBQUNBLDBCQUEwQixzQkFBc0I7QUFDaEQsOEJBQThCLHNCQUFzQjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsU0FBUyxHQUFHLElBQUksR0FBRyxJQUFJLHVCQUF1QixlQUFlLHNEQUFzRCxRQUFRLCtDQUErQyxFQUFFLE9BQU8sRUFBRSxXQUFXLE1BQU0sWUFBWSxPQUFPLFlBQVksNEJBQTRCLGtCQUFrQiwyQkFBMkIsVUFBVSxLQUFLLGNBQWMsSUFBSSxjQUFjLEtBQUssMERBQTBELFNBQVMsR0FBRyxJQUFJLEdBQUcsSUFBSSw4QkFBOEIsU0FBUyxRQUFRLFNBQVMscUNBQXFDLGVBQWUsWUFBWSxPQUFPO0FBQ3ZsQjs7QUFFQTtBQUNBLGtFQUFrRSxTQUFTLEdBQUcsSUFBSSxHQUFHLElBQUk7QUFDekY7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQjtBQUMvQiwrQkFBK0I7QUFDL0IsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQSxnRUFBZ0UsU0FBUztBQUN6RSwyREFBMkQsU0FBUyxJQUFJLGtDQUFrQztBQUMxRzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixTQUFTLFFBQVEsZUFBZTtBQUN0RDtBQUNBO0FBQ0Esc0JBQXNCLFNBQVMsUUFBUSxnQkFBZ0IsTUFBTSxhQUFhLFFBQVEsZUFBZTtBQUNqRztBQUNBLGtCQUFrQixPQUFPLE1BQU0sYUFBYSxJQUFJLGFBQWEsUUFBUSxnQkFBZ0IsTUFBTSxhQUFhLFFBQVEsZUFBZTtBQUMvSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlJQUFpSSxxQkFBcUIsVUFBVSxtQkFBbUIsb0NBQW9DLDhCQUE4QjtBQUNyUCxxRUFBcUUsTUFBTTtBQUMzRTtBQUNBO0FBQ0EsMEZBQTBGLHFCQUFxQixVQUFVLG1CQUFtQix3Q0FBd0MsOEJBQThCO0FBQ2xOO0FBQ0E7QUFDQSx5RUFBeUUscUJBQXFCLFVBQVUsbUJBQW1CLHNDQUFzQyw4QkFBOEI7QUFDL0w7QUFDQSx3RUFBd0UsU0FBUztBQUNqRjtBQUNBLHNFQUFzRSxTQUFTO0FBQy9FLHlDQUF5QyxzQ0FBc0M7QUFDL0U7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCLHNCQUFzQjtBQUNoRCw4QkFBOEIsc0JBQXNCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBZ0YsSUFBSTtBQUNwRix5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLElBQUk7QUFDbEYseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtEQUErRCxVQUFVLElBQUksS0FBSyxJQUFJLEtBQUs7QUFDM0Y7QUFDQSx5Q0FBeUMsR0FBRyxRQUFRLEdBQUcsbUNBQW1DLGFBQWEsS0FBSyxLQUFLO0FBQ2pIOztBQUVBO0FBQ0EsZ0RBQWdELGlCQUFpQixPQUFPLGlCQUFpQixXQUFXLGdCQUFnQixZQUFZLGlCQUFpQixZQUFZLDZCQUE2QixrQkFBa0IsNEJBQTRCO0FBQ3hPOztBQUVBO0FBQ0Esd0RBQXdELFNBQVM7QUFDakU7QUFDQTtBQUNBLFNBQVM7QUFDVCwwREFBMEQsU0FBUztBQUNuRSxvREFBb0QsU0FBUztBQUM3RDtBQUNBO0FBQ0EsU0FBUztBQUNULHdEQUF3RCxTQUFTO0FBQ2pFOztBQUVBO0FBQ0Esb0ZBQW9GLE1BQU0sR0FBRyxTQUFTLFlBQVksTUFBTSxpREFBaUQseUJBQXlCLDJEQUEyRCxXQUFXO0FBQ3hROztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0Esa0RBQWtELFNBQVM7QUFDM0Qsa0RBQWtELFNBQVM7QUFDM0Q7O0FBRUE7QUFDQSxrREFBa0QsU0FBUztBQUMzRCxrREFBa0QsU0FBUztBQUMzRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0Esa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDZHQUE2RztBQUM3RywwQkFBMEIsc0JBQXNCLFNBQVM7QUFDekQsOEJBQThCLHNCQUFzQjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw0QkFBNEIsaUNBQWlDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDRCQUE0QixpQ0FBaUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxtR0FBbUc7QUFDbkc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHNCQUFzQjtBQUNwRCxrQ0FBa0Msc0JBQXNCO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCLHNCQUFzQjtBQUNoRCw4QkFBOEIsc0JBQXNCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULHFFQUFxRSxTQUFTLEdBQUcsMkJBQTJCLElBQUksNEJBQTRCO0FBQzVJO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELHdCQUF3QjtBQUNwRixvRUFBb0UsU0FBUyxHQUFHLE1BQU0sR0FBRywyQkFBMkI7QUFDcEg7QUFDQTtBQUNBO0FBQ0EsNERBQTRELFlBQVk7QUFDeEUsb0VBQW9FLFNBQVMsR0FBRyxNQUFNLEdBQUcsMkJBQTJCO0FBQ3BIO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDViw0REFBNEQsd0JBQXdCO0FBQ3BGLG9FQUFvRSxTQUFTLEdBQUcsMEJBQTBCLEdBQUcsT0FBTztBQUNwSDtBQUNBO0FBQ0E7QUFDQSw0REFBNEQsWUFBWTtBQUN4RSxvRUFBb0UsU0FBUyxHQUFHLDBCQUEwQixHQUFHLE9BQU87QUFDcEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCxTQUFTO0FBQ2pFLHFEQUFxRCxTQUFTO0FBQzlEO0FBQ0EsK0NBQStDLFNBQVM7QUFDeEQsb0RBQW9ELFNBQVM7QUFDN0QscURBQXFELFNBQVM7QUFDOUQsdURBQXVELFNBQVM7QUFDaEUsdURBQXVELFNBQVM7QUFDaEUsMERBQTBELFNBQVM7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxTQUFTO0FBQ3pELHlEQUF5RCxTQUFTO0FBQ2xFO0FBQ0Esc0RBQXNELFNBQVM7QUFDL0QsdURBQXVELFNBQVM7QUFDaEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELFVBQVU7QUFDOUQ7QUFDQSxvREFBb0QsU0FBUztBQUM3RCxtRkFBbUYsb0JBQW9CO0FBQ3ZHLFVBQVU7QUFDVjtBQUNBLG9EQUFvRCxVQUFVO0FBQzlELG9EQUFvRCxTQUFTO0FBQzdELGtGQUFrRixvQkFBb0I7QUFDdEc7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELFVBQVU7QUFDOUQ7QUFDQSxvREFBb0QsU0FBUztBQUM3RCxtRkFBbUYsb0JBQW9CO0FBQ3ZHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxTQUFTO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG9GQUFvRixTQUFTO0FBQzdGLGdGQUFnRixTQUFTO0FBQ3pGO0FBQ0EseURBQXlELDBCQUEwQjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRSxTQUFTO0FBQzFFO0FBQ0EsNERBQTRELGlCQUFpQjtBQUM3RSwwREFBMEQsZUFBZTtBQUN6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMEZBQTBGO0FBQzFGO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0M7QUFDcEM7QUFDQTtBQUNBO0FBQ0EsVUFBVSwwQkFBMEI7QUFDcEM7QUFDQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVSxnREFBZ0Q7QUFDMUQ7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxtQkFBbUI7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsUUFBUTtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsVUFBVSxPQUFPO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsbUJBQW1CO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Q7QUFDbEQsNkNBQTZDLG1CQUFtQjtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0EsVUFBVSxPQUFPO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsUUFBUTtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMkNBQTJDLFFBQVE7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQsUUFBUTtBQUMvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsUUFBUTtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxtQkFBbUI7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQSxVQUFVLE9BQU87QUFDakI7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSw4Q0FBOEMsUUFBUSxPQUFPO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHdCQUF3QixzQkFBc0I7QUFDOUMsNEJBQTRCLHlCQUF5QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlGQUFpRixvQkFBb0I7QUFDckc7QUFDQSw4QkFBOEIsbURBQVM7QUFDdkM7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULDZFQUE2RSxFQUFFLEVBQUUsRUFBRSxHQUFHLFNBQVM7QUFDL0Y7QUFDQTtBQUNBLHNDQUFzQyxZQUFZO0FBQ2xELHlEQUF5RCxFQUFFLEdBQUcsU0FBUztBQUN2RTtBQUNBLG1EQUFtRCxFQUFFLEVBQUUsT0FBTztBQUM5RCx5RUFBeUUsa0JBQWtCO0FBQzNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsSUFBSTtBQUMxQjtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsRUFBRTtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RCxVQUFVLEVBQUUsT0FBTztBQUMxRTtBQUNBO0FBQ0EsdUJBQXVCLGFBQWEsSUFBSSw2QkFBNkIsRUFBRSxZQUFZLFdBQVcsaUJBQWlCO0FBQy9HO0FBQ0EsbURBQW1ELFNBQVMsR0FBRyxTQUFTLEdBQUcsVUFBVTtBQUNyRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLG9CQUFvQjtBQUNsRzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQXVCLG1DQUFtQztBQUMxRCwyQkFBMkIsc0NBQXNDO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0RBQXdELFVBQVUscUNBQXFDO0FBQ3ZHO0FBQ0EsVUFBVTtBQUNWLHdEQUF3RCxVQUFVO0FBQ2xFO0FBQ0E7O0FBRUEseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRkFBa0Ysb0JBQW9CO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsc0JBQXNCO0FBQ2hELDhCQUE4QixzQkFBc0I7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUZBQXFGLG9CQUFvQjtBQUN6RztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRSxPQUFPLElBQUksSUFBSSxTQUFTLFlBQVksVUFBVSxXQUFXLGNBQWM7QUFDdkk7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRDtBQUNuRCxvQ0FBb0MsSUFBSTtBQUN4QztBQUNBLDhCQUE4QjtBQUM5QixrREFBa0Q7QUFDbEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUEsaUVBQWUsTUFBTTs7Ozs7Ozs7Ozs7Ozs7OztBQ2hqRHJCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVELEVBQUU7QUFDekQ7QUFDQSw2REFBNkQsRUFBRTtBQUMvRDtBQUNBLHVEQUF1RCxFQUFFO0FBQ3pELGlCQUFpQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUztBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILDZSQUE2Uix3QkFBd0I7QUFDclQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLG9CQUFvQjtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILHNSQUFzUixvQkFBb0I7QUFDMVM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUk7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EseUJBQXlCLGVBQWU7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLHlDQUF5QztBQUNyRCxpR0FBaUcsRUFBRTtBQUNuRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLHFCQUFxQjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsS0FBSztBQUNoQjtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxXQUFXLEtBQUs7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEtBQUs7QUFDaEI7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBSUU7Ozs7Ozs7VUN4ZUY7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTnNDO0FBQ0s7QUFDaEI7QUFDUTs7QUFFbkM7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDBEQUFRO0FBQy9CLHdCQUF3Qix1REFBTTtBQUM5Qix1QkFBdUIsYUFBYTtBQUNwQztBQUNBO0FBQ0EsS0FBSztBQUNMLCtCQUErQiw4Q0FBTSxLQUFLLGFBQWE7QUFDdkQ7QUFDQSxzQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvY3NzL2p4d29yZC5sZXNzP2M5YmQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL25vZGVfbW9kdWxlcy94ZC1jcm9zc3dvcmQtcGFyc2VyL2luZGV4LmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvanMvZXZlbnRzLmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvanMvanh3b3JkLWdyaWQuanMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS8uL25vZGVfbW9kdWxlcy9maXJld29ya3MtanMvZGlzdC9pbmRleC5lcy5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGV4dHJhY3RlZCBieSBtaW5pLWNzcy1leHRyYWN0LXBsdWdpblxuZXhwb3J0IHt9OyIsIi8vIEEgbGlicmFyeSBmb3IgY29udmVydGluZyAueGQgQ3Jvc3N3b3JkIGRhdGEgdG8gSlNPTiAoYXMgZGVmaW5lZCBieSBTYXVsIFB3YW5zb24gLSBodHRwOi8veGQuc2F1bC5wdykgd3JpdHRlbiBieSBKYXNvbiBOb3J3b29kLVlvdW5nXG5cbmZ1bmN0aW9uIFhEUGFyc2VyKGRhdGEpIHtcbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YShkYXRhKSB7XG4gICAgICAgIC8vIFNwbGl0IGludG8gcGFydHNcbiAgICAgICAgbGV0IHBhcnRzID0gZGF0YS5zcGxpdCgvXiReJC9nbSkuZmlsdGVyKHMgPT4gcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgICBwYXJ0cyA9IGRhdGEuc3BsaXQoL1xcclxcblxcclxcbi9nKS5maWx0ZXIocyA9PiAocy50cmltKCkpKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhcnRzW2ldID0gcGFydHNbaV0ucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgVG9vIG1hbnkgcGFydHMgLSBleHBlY3RlZCA0LCBmb3VuZCAke3BhcnRzLmxlbmd0aH1gKTtcbiAgICAgICAgY29uc3QgcmF3TWV0YSA9IHBhcnRzWzBdO1xuICAgICAgICBjb25zdCByYXdHcmlkID0gcGFydHNbMV07XG4gICAgICAgIGNvbnN0IHJhd0Fjcm9zcyA9IHBhcnRzWzJdO1xuICAgICAgICBjb25zdCByYXdEb3duID0gcGFydHNbM107XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcm9jZXNzTWV0YShyYXdNZXRhKTtcbiAgICAgICAgY29uc3QgZ3JpZCA9IHByb2Nlc3NHcmlkKHJhd0dyaWQpO1xuICAgICAgICBjb25zdCBhY3Jvc3MgPSBwcm9jZXNzQ2x1ZXMocmF3QWNyb3NzKTtcbiAgICAgICAgY29uc3QgZG93biA9IHByb2Nlc3NDbHVlcyhyYXdEb3duKTtcbiAgICAgICAgcmV0dXJuIHsgbWV0YSwgZ3JpZCwgYWNyb3NzLCBkb3duLCByYXdHcmlkLCByYXdBY3Jvc3MsIHJhd0Rvd24sIHJhd01ldGEsIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc01ldGEocmF3TWV0YSkge1xuICAgICAgICBjb25zdCBtZXRhTGluZXMgPSByYXdNZXRhLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgbGV0IG1ldGEgPSB7fTtcbiAgICAgICAgbWV0YUxpbmVzLmZvckVhY2gobWV0YUxpbmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGluZVBhcnRzID0gbWV0YUxpbmUuc3BsaXQoXCI6IFwiKTtcbiAgICAgICAgICAgIG1ldGFbbGluZVBhcnRzWzBdXSA9IGxpbmVQYXJ0c1sxXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NHcmlkKHJhd0dyaWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0dyaWQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSBsaW5lc1t4XS5zcGxpdChcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDbHVlcyhyYXdDbHVlcykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3Q2x1ZXMuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBjb25zdCByZWdleCA9IC8oXi5cXGQqKVxcLlxccyguKilcXHN+XFxzKC4qKS87XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGlmICghbGluZXNbeF0udHJpbSgpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gbGluZXNbeF0ubWF0Y2gocmVnZXgpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBDb3VsZCBub3QgcGFyc2UgcXVlc3Rpb24gJHtsaW5lc1t4XX1gKTtcbiAgICAgICAgICAgIC8vIFVuZXNjYXBlIHN0cmluZ1xuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb24gPSBwYXJ0c1syXS5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xuICAgICAgICAgICAgcmVzdWx0W3hdID0ge1xuICAgICAgICAgICAgICAgIG51bTogcGFydHNbMV0sXG4gICAgICAgICAgICAgICAgcXVlc3Rpb246IHF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgIGFuc3dlcjogcGFydHNbM11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc0RhdGEoZGF0YSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWERQYXJzZXI7IiwiLy8gRXZlbnQgbGlzdGVuZXJzIGZvciBvdXIgcHV6emxlIGdhbWVcbmNvbnN0IGd0YWcgPSB3aW5kb3cuZ3RhZztcblxuZXhwb3J0IGZ1bmN0aW9uIEV2ZW50cyhjb250YWluZXJfZWxlbWVudCkge1xuICAgIC8vIEdldCB0aGUgY29udGFpbmVyXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb250YWluZXJfZWxlbWVudCk7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29udGFpbmVyIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBjb250YWluZXJcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignanh3b3JkOmxvYWQnLCBsb2FkSGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpjaGVhdCcsIGNoZWF0SGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpjb21wbGV0ZScsIGNvbXBsZXRlSGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpyZXNldCcsIHJlc2V0SGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpwcm9ncmVzcycsIHByb2dyZXNzSGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpwYXVzZScsIHBhdXNlSGFuZGxlcik7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2p4d29yZDpyZXN1bWUnLCByZXN1bWVIYW5kbGVyKTtcbn1cblxuZnVuY3Rpb24gZmlyZV9ndGFnX2V2ZW50KG5hbWUsIGRhdGEgPSB7fSkge1xuICAgIGlmICh0eXBlb2YgZ3RhZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBndGFnKCdldmVudCcsIG5hbWUsIGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBndGFnIG5vdCBmb3VuZDogJHtuYW1lfWAsIGRhdGEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZEhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgbG9hZCBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX2xvYWQnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2hlYXRIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIGNoZWF0IGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfY2hlYXQnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcGxldGVIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIGNvbXBsZXRlIGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfY29tcGxldGUnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIHJlc2V0IGV2ZW50XG4gICAgZmlyZV9ndGFnX2V2ZW50KCdjcm9zc3dvcmRfcmVzZXQnLCB7XG4gICAgICAgIGVuZ2FnZW1lbnRfdGltZV9tc2VjOiBlLmRldGFpbC50aW1lX3Rha2VuICogMTAwMCxcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcHJvZ3Jlc3NIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIHByb2dyZXNzIGV2ZW50XG4gICAgY29uc29sZS5sb2coZS5kZXRhaWwpO1xuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX3Byb2dyZXNzJywge1xuICAgICAgICBlbmdhZ2VtZW50X3RpbWVfbXNlYzogZS5kZXRhaWwudGltZV90YWtlbiAqIDEwMDAsXG4gICAgICAgIHByb2dyZXNzOiBlLmRldGFpbC5wcm9ncmVzcyxcbiAgICAgICAgcXVhcnRpbGU6IGUuZGV0YWlsLnF1YXJ0aWxlLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwYXVzZUhhbmRsZXIoZSkge1xuICAgIC8vIEhhbmRsZSB0aGUgcGF1c2UgZXZlbnRcbiAgICBmaXJlX2d0YWdfZXZlbnQoJ2Nyb3Nzd29yZF9wYXVzZScsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZXN1bWVIYW5kbGVyKGUpIHtcbiAgICAvLyBIYW5kbGUgdGhlIHJlc3VtZSBldmVudFxuICAgIGZpcmVfZ3RhZ19ldmVudCgnY3Jvc3N3b3JkX3Jlc3VtZScsIHtcbiAgICAgICAgZW5nYWdlbWVudF90aW1lX21zZWM6IGUuZGV0YWlsLnRpbWVfdGFrZW4gKiAxMDAwLFxuICAgIH0pO1xufSIsIi8qXG4qIEpYV29yZCBHcmlkIC0gQSBDcm9zc3dvcmQgU3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlxuKiBDb3B5cmlnaHQgMjAyMCBKYXNvbiBOb3J3b29kLVlvdW5nXG4qL1xuXG4vLyBDb2wsICAgUm93XG4vLyBYLCAgICAgWVxuLy8gd2lkdGgsIGhlaWdodFxuXG5pbXBvcnQgeyBGaXJld29ya3MgfSBmcm9tICdmaXJld29ya3MtanMnXG5cbmNsYXNzIEpYV29yZCB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkpYV29yZCwgYSBjcm9zc3dvcmQgc3lzdGVtIGJ5IEphc29uIE5vcndvb2QtWW91bmcgPGphc29uQDEwbGF5ZXIuY29tPlwiKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0X25hbWUgPSBcIkpYV29yZFwiO1xuICAgICAgICBpZiAod2luZG93Lmp4d29yZF9wcm9kdWN0X25hbWUpIHtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdF9uYW1lID0gd2luZG93Lmp4d29yZF9wcm9kdWN0X25hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRzLmNvbnRhaW5lcikgdGhyb3cgXCInY29udGFpbmVyJyByZXF1aXJlZFwiO1xuICAgICAgICBpZiAoIW9wdHMuZGF0YSkgdGhyb3cgXCInZGF0YScgcmVxdWlyZWRcIjtcbiAgICAgICAgLy8gU2V0IHNvbWUgZGVmYXVsdHNcbiAgICAgICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7IFxuICAgICAgICAgICAgd2lkdGg6IDUwMCwgXG4gICAgICAgICAgICBoZWlnaHQ6IDUwMCwgXG4gICAgICAgICAgICBvdXRlckJvcmRlcldpZHRoOiAxLjUsIFxuICAgICAgICAgICAgaW5uZXJCb3JkZXJXaWR0aDogMSwgXG4gICAgICAgICAgICBtYXJnaW46IDMsIFxuICAgICAgICAgICAgb3V0ZXJCb3JkZXJDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBpbm5lckJvcmRlckNvbG91cjogXCJibGFja1wiLCBcbiAgICAgICAgICAgIGZpbGxDb2xvdXI6IFwiYmxhY2tcIiwgXG4gICAgICAgICAgICBjb2xzOiBvcHRzLmRhdGEuZ3JpZC5sZW5ndGgsXG4gICAgICAgICAgICByb3dzOiBvcHRzLmRhdGEuZ3JpZFswXS5sZW5ndGgsIFxuICAgICAgICAgICAgZm9udFJhdGlvOiAwLjgwLFxuICAgICAgICAgICAgbnVtUmF0aW86IDAuMjUsXG4gICAgICAgICAgICBzZWxlY3RDZWxsQ29sb3VyOiBcIiNmN2Y0NTdcIixcbiAgICAgICAgICAgIHNlbGVjdFdvcmRDb2xvdXI6IFwiIzljZTBmYlwiLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG91cjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICAgICAgcmVzdG9yZVN0YXRlOiBmYWxzZSxcbiAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgcXVhcnRpbGU6IDAsXG4gICAgICAgIH0sIG9wdHMpO1xuICAgICAgICBpZiAod2luZG93Lmp4d29yZF9jb21wbGV0ZWRfYXVkaW8pIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5jb21wbGV0ZUF1ZGlvID0gd2luZG93Lmp4d29yZF9jb21wbGV0ZWRfYXVkaW87XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51aWQgPSArbmV3IERhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHRpbWVfdGFrZW46IDAsXG4gICAgICAgICAgICBhdXRvY2hlY2s6IGZhbHNlLFxuICAgICAgICAgICAgY2hlYXRlZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hY3Jvc3NfcXVlc3Rpb25zID0gW107XG4gICAgICAgIHRoaXMuZG93bl9xdWVzdGlvbnMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgdGhpcy5pc19oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc19wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sYXN0X3F1YXJ0aWxlID0gMDtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5jb21wbGV0ZUF1ZGlvKSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKHRoaXMub3B0cy5jb21wbGV0ZUF1ZGlvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXVkaW8gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBkb2N1bWVudCB0byBsb2FkXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIHRoaXMub25Mb2FkLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8vIHRocm93RXZlbnQoZXZlbnROYW1lLCBkZXRhaWwpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2codGhpcy5ldmVudHMsIGV2ZW50TmFtZSk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnRzLnB1Ymxpc2goZXZlbnROYW1lLCBkZXRhaWwpO1xuICAgIC8vIH1cblxuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLm9wdHMuY29udGFpbmVyKTtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5lckVsZW1lbnQpIHRocm93IChgQ291bGQgbm90IGZpbmQgJHt0aGlzLm9wdHMuY29udGFpbmVyfWApO1xuICAgICAgICB0aGlzLnRvdGFsV2lkdGggPSB0aGlzLm9wdHMud2lkdGggKyAodGhpcy5vcHRzLm1hcmdpbiAqIDIpO1xuICAgICAgICB0aGlzLnRvdGFsSGVpZ2h0ID0gdGhpcy5vcHRzLmhlaWdodCArICh0aGlzLm9wdHMubWFyZ2luICogMik7XG4gICAgICAgIHRoaXMuY2VsbFdpZHRoID0gdGhpcy5vcHRzLndpZHRoIC8gdGhpcy5vcHRzLmNvbHM7XG4gICAgICAgIHRoaXMuY2VsbEhlaWdodCA9IHRoaXMub3B0cy5oZWlnaHQgLyB0aGlzLm9wdHMucm93cztcbiAgICAgICAgdGhpcy5mb250U2l6ZSA9IHRoaXMuY2VsbFdpZHRoICogdGhpcy5vcHRzLmZvbnRSYXRpbzsgLy8gRm9udCBzaXplIHglIHNpemUgb2YgY2VsbFxuICAgICAgICB0aGlzLmdyaWQgPSBbXTtcbiAgICAgICAgdGhpcy5ncmlkID0gdGhpcy5vcHRzLmRhdGEuZ3JpZFswXS5tYXAoKGNvbCwgaSkgPT4gdGhpcy5vcHRzLmRhdGEuZ3JpZC5tYXAocm93ID0+IHJvd1tpXSkpOyAvLyBUcmFuc3Bvc2Ugb3VyIG1hdHJpeFxuICAgICAgICB0aGlzLmhhc2ggPSB0aGlzLmNhbGNIYXNoKHRoaXMuZ3JpZCk7IC8vIENhbGN1bGF0ZSBvdXIgaGFzaCByZXN1bHRcbiAgICAgICAgdGhpcy5zdG9yYWdlTmFtZSA9IGBqeHdvcmQtJHtNYXRoLmFicyh0aGlzLmhhc2gpfWA7XG4gICAgICAgIHRoaXMuZHJhd0xheW91dCgpO1xuICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XG4gICAgICAgIHRoaXMuZHJhd0JvcmRlcigpO1xuICAgICAgICB0aGlzLmRyYXdOdW1iZXJzKCk7XG4gICAgICAgIHRoaXMuZHJhd1F1ZXN0aW9ucygpO1xuICAgICAgICB0aGlzLnJlc3RvcmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckFjdGlvbnMoKTtcbiAgICAgICAgdGhpcy5zZXRGb2N1cygpO1xuICAgICAgICB0aGlzLmxpc3RlblF1ZXN0aW9ucygpO1xuICAgICAgICB0aGlzLnNldFRpbWVyKCk7XG4gICAgICAgIHRoaXMuZHJhd1RpbWVyKCk7XG4gICAgICAgIHRoaXMuY2hlY2tPdmVybGF5KCk7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlXaW4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldHVwSU9TS2V5Ym9hcmQoKTtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOmxvYWRcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgIH1cblxuICAgIHNldFRpbWVyKCkge1xuICAgICAgICBzZXRJbnRlcnZhbCgoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfaGlkZGVuKSByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHJldHVybjtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmNvbXBsZXRlKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUudGltZV90YWtlbikgdGhpcy5zdGF0ZS50aW1lX3Rha2VuID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbisrO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd1RpbWVyKCk7XG4gICAgICAgIH0pLmJpbmQodGhpcyksIDEwMDApO1xuICAgIH1cblxuICAgIGRyYXdMYXlvdXQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtY29udGFpbmVyXCIgaWQ9XCJqeHdvcmQtY29udGFpbmVyLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5IGp4d29yZC1vdmVybGF5LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2VkLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcGF1c2VkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBZb3VyIEdhbWUgaXMgQ3VycmVudGx5IFBhdXNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW92ZXJsYXktcmVzdW1lLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXN1bWVcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1jb21wbGV0ZV9vdmVybGF5LSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29uZ3JhdHVsYXRpb25zISBZb3UndmUgV29uIVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGltZVwiIGlkPVwianh3b3JkLW92ZXJsYXlfdGltZS0ke3RoaXMudWlkfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5X3NoYXJlLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1zaGFyZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC1vdmVybGF5LXJlc3RhcnQtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1vdmVybGF5LWJ1dHRvbiBqeHdvcmQtcmVzZXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1idXR0b24ganh3b3JkLWNsb3NlLW92ZXJsYXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwianh3b3JkLW1ldGFfb3ZlcmxheS0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLW1ldGFfb3ZlcmxheVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1vdmVybGF5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt0aGlzLm9wdHMuZGF0YS5tZXRhLlRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHsgT2JqZWN0LmtleXModGhpcy5vcHRzLmRhdGEubWV0YSkubWFwKGsgPT4gayA9PT0gXCJUaXRsZVwiID8gXCJcIiA6IGA8bGk+JHtrfTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dGhpcy5vcHRzLmRhdGEubWV0YVtrXX08L2xpPmAgKS5qb2luKFwiXFxuXCIpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktYnV0dG9uIGp4d29yZC1jbG9zZS1vdmVybGF5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1wbGF5LWFyZWFcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLWdyaWQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bmF2IGNsYXNzPVwianh3b3JkLWNvbnRyb2xzXCIgcm9sZT1cIm5hdmlnYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW1lbnUtdG9nZ2xlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImp4d29yZC1oYW1iZXJkZXJcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLWhhbWJlcmRlclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqeHdvcmQtaGFtYmVyZGVyXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJqeHdvcmQtbWVudVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQWJvdXQgVGhpcyBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwianh3b3JkLW1ldGEtJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+QWJvdXQgVGhpcyBQdXp6bGU8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwianh3b3JkLW1lbnUtYnJlYWtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIEF1dG9jaGVja1wiIGNsYXNzPVwianh3b3JkLWJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJqeHdvcmQtYXV0b2NoZWNrLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPkF1dG9jaGVjazwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJDaGVjayBTcXVhcmVcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwianh3b3JkLWNoZWNrX3NxdWFyZS0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5DaGVjayBTcXVhcmU8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1jaGVja193b3JkLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPkNoZWNrIFdvcmQ8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiQ2hlY2sgUHV6emxlXCIgY2xhc3M9XCJqeHdvcmQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1jaGVja19wdXp6bGUtJHt0aGlzLnVpZH1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+Q2hlY2sgUHV6emxlPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cImp4d29yZC1tZW51LWJyZWFrXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgYXJpYS1sYWJlbD1cIlByaW50IChCbGFuaylcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwianh3b3JkLXByaW50X2JsYW5rLSR7dGhpcy51aWR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPlByaW50IChCbGFuayk8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiUHJpbnQgKEZpbGxlZClcIiBjbGFzcz1cImp4d29yZC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwianh3b3JkLXByaW50X2ZpbGxlZC0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5QcmludCAoRmlsbGVkKTwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJqeHdvcmQtbWVudS1icmVha1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxocj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJSZXNldCBQdXp6bGVcIiBjbGFzcz1cImp4d29yZC1idXR0b24ganh3b3JkLXJlc2V0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImp4d29yZC1yZXNldC0ke3RoaXMudWlkfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5SZXNldDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L25hdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJqeHdvcmQtcGF1c2UtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1wYXVzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwianh3b3JkLXBhdXNlLXRleHQganh3b3JkLXNyLW9ubHlcIj5QYXVzZTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImp4d29yZC10aW1lci0ke3RoaXMudWlkfVwiIGNsYXNzPVwianh3b3JkLXRpbWVyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXN2Zy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdmcgaWQ9J2p4d29yZC1zdmctJHt0aGlzLnVpZH0nIGNsYXNzPSdqeHdvcmQtc3ZnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgJHsgdGhpcy50b3RhbFdpZHRoIH0gJHsgdGhpcy50b3RhbEhlaWdodCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGcgY2xhc3M9XCJjZWxsLWdyb3VwXCIgaWQ9J2p4d29yZC1nLWNvbnRhaW5lci0ke3RoaXMudWlkIH0nPjwvZz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tY29udGFpbmVyIGp4d29yZC1tb2JpbGUtb25seVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1hcnJvdyBqeHdvcmQtYXJyb3ctYmFja1wiIGlkPVwianh3b3JkLWFycm93LWJhY2stJHsgdGhpcy51aWQgfVwiPiZsYW5nOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb25cIiBpZD1cImp4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHsgdGhpcy51aWQgfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1hcnJvdyBqeHdvcmQtYXJyb3ctZm9yd2FyZFwiIGlkPVwianh3b3JkLWFycm93LWZvcndhcmQtJHsgdGhpcy51aWQgfVwiPiZyYW5nOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlib2FyZCBqeHdvcmQtbW9iaWxlLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlFcIj5RPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIldcIj5XPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkVcIj5FPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlJcIj5SPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlRcIj5UPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIllcIj5ZPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlVcIj5VPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIklcIj5JPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk9cIj5PPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlBcIj5QPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkFcIj5BPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlNcIj5TPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkRcIj5EPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkZcIj5GPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkdcIj5HPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkhcIj5IPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkpcIj5KPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIktcIj5LPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkxcIj5MPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQta2V5Ym9hcmQtcm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlpcIj5aPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlhcIj5YPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkNcIj5DPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIlZcIj5WPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIkJcIj5CPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk5cIj5OPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXlcIiBkYXRhLWtleT1cIk1cIj5NPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImp4d29yZC1rZXkganh3b3JkLWtleS1iYWNrc3BhY2VcIiBkYXRhLWtleT1cIkJBQ0tTUEFDRVwiPiZsQXJyOzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb24tY29udGFpbmVyIGp4d29yZC1kZXNrdG9wLW9ubHlcIiBpZD1cImp4d29yZC1xdWVzdGlvbi1jb250YWluZXItJHsgdGhpcy51aWQgfVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3NcIiBpZD1cImp4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHsgdGhpcy51aWQgfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0PkFjcm9zczwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1kb3duXCIgaWQ9XCJqeHdvcmQtcXVlc3Rpb24tZG93bi0keyB0aGlzLnVpZCB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDQ+RG93bjwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgICAgICB0aGlzLnN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtc3ZnLSR7IHRoaXMudWlkIH1gKTtcbiAgICAgICAgdGhpcy5jZWxsR3JvdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWctY29udGFpbmVyLSR7dGhpcy51aWQgfWApO1xuICAgIH1cblxuICAgIGRyYXdHcmlkKCkge1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbEdyb3VwLmlubmVySFRNTCArPSB0aGlzLmRyYXdDZWxsKHRoaXMuZ3JpZFtjb2xdW3Jvd10sIGNvbCwgcm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdDZWxsKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgY29uc3QgeCA9ICh0aGlzLmNlbGxXaWR0aCAqIGNvbCkgKyB0aGlzLm9wdHMubWFyZ2luO1xuICAgICAgICBjb25zdCB5ID0gKHRoaXMuY2VsbEhlaWdodCAqIHJvdykgKyB0aGlzLm9wdHMubWFyZ2luO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuY2VsbFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmNlbGxIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxldHRlclggPSB4ICsgKHdpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IGxldHRlclkgPSB5ICsgdGhpcy5mb250U2l6ZSAtIHRoaXMub3B0cy5tYXJnaW47XG4gICAgICAgIGxldCBmaWxsID0gdGhpcy5vcHRzLmJhY2tncm91bmRDb2xvdXI7XG4gICAgICAgIGxldCBpc0JsYW5rID0gXCJpcy1sZXR0ZXJcIjtcbiAgICAgICAgbGV0IGNvbnRhaW5lckNsYXNzPVwiaXMtbGV0dGVyLWNvbnRhaW5lclwiO1xuICAgICAgICBpZiAobGV0dGVyID09IFwiI1wiKSB7XG4gICAgICAgICAgICBmaWxsID0gdGhpcy5vcHRzLmZpbGxDb2xvdXI7XG4gICAgICAgICAgICBpc0JsYW5rID0gXCJpcy1ibGFua1wiO1xuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M9XCJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYDxnIGlkPVwianh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHtjb2x9LSR7cm93fVwiIGNsYXNzPVwianh3b3JkLWNlbGwgJHtjb250YWluZXJDbGFzc31cIiBzdHlsZT1cInotaW5kZXg6IDIwXCI+PHJlY3QgY2xhc3M9XCJqeHdvcmQtY2VsbC1yZWN0ICR7aXNCbGFua31cIiByb2xlPVwiY2VsbFwiIHRhYmluZGV4PVwiLTFcIiBhcmlhLWxhYmVsPVwiXCIgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiBzdHJva2U9XCIke3RoaXMub3B0cy5pbm5lckJvcmRlckNvbG91cn1cIiBzdHJva2Utd2lkdGg9XCIke3RoaXMub3B0cy5pbm5lckJvcmRlcldpZHRofVwiIGZpbGw9XCIke2ZpbGx9XCIgZGF0YS1jb2w9XCIke2NvbH1cIiBkYXRhLXJvdz1cIiR7cm93IH1cIiBjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCI+PC9yZWN0Pjx0ZXh0IGlkPVwianh3b3JkLWxldHRlci0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9XCIgY2xhc3M9XCJqeHdvcmQtbGV0dGVyXCIgeD1cIiR7IGxldHRlclggfVwiIHk9XCIkeyBsZXR0ZXJZIH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZvbnQtc2l6ZT1cIiR7IHRoaXMuZm9udFNpemUgfVwiIHdpZHRoPVwiJHsgd2lkdGggfVwiPjwvdGV4dD48L2c+YDtcbiAgICB9XG5cbiAgICBkcmF3TGV0dGVyKGxldHRlciwgY29sLCByb3cpIHtcbiAgICAgICAgY29uc3QgbGV0dGVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWxldHRlci0ke3RoaXMudWlkfS0ke2NvbH0tJHtyb3d9YCk7XG4gICAgICAgIGNvbnN0IGNvcnJlY3QgPSB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW2NvbF1bcm93XTtcbiAgICAgICAgaWYgKGNvcnJlY3QpIHtcbiAgICAgICAgICAgIGxldHRlckVsLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtbGV0dGVyLWlzLWNvcnJlY3RcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXR0ZXJFbC5jbGFzc0xpc3QucmVtb3ZlKFwianh3b3JkLWxldHRlci1pcy1jb3JyZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGxldHRlcik7XG4gICAgICAgIHdoaWxlKGxldHRlckVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIGxldHRlckVsLnJlbW92ZUNoaWxkKGxldHRlckVsLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0dGVyRWwuYXBwZW5kQ2hpbGQodHh0KTtcbiAgICB9XG5cbiAgICBkcmF3VGltZXIoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUodCkge1xuICAgICAgICAgICAgdmFyIHNlY19udW0gPSBwYXJzZUludCh0LCAxMCk7IC8vIGRvbid0IGZvcmdldCB0aGUgc2Vjb25kIHBhcmFtXG4gICAgICAgICAgICB2YXIgaG91cnMgICA9IE1hdGguZmxvb3Ioc2VjX251bSAvIDM2MDApO1xuICAgICAgICAgICAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNfbnVtIC0gKGhvdXJzICogMzYwMCkpIC8gNjApO1xuICAgICAgICAgICAgdmFyIHNlY29uZHMgPSBzZWNfbnVtIC0gKGhvdXJzICogMzYwMCkgLSAobWludXRlcyAqIDYwKTtcbiAgICAgICAgXG4gICAgICAgICAgICBpZiAoaG91cnMgICA8IDEwKSB7aG91cnMgICA9IFwiMFwiK2hvdXJzO31cbiAgICAgICAgICAgIGlmIChtaW51dGVzIDwgMTApIHttaW51dGVzID0gXCIwXCIrbWludXRlczt9XG4gICAgICAgICAgICBpZiAoc2Vjb25kcyA8IDEwKSB7c2Vjb25kcyA9IFwiMFwiK3NlY29uZHM7fVxuICAgICAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgbWludXRlcyArICc6JyArIHNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGltZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtdGltZXItJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGltZXJFbC5pbm5lckhUTUwgPSBgPHNwYW4gaWQ9XCJqeHdvcmQtdGltZXItdGV4dC0ke3RoaXMudWlkfVwiPiR7Zm9ybWF0VGltZSh0aGlzLnN0YXRlLnRpbWVfdGFrZW4pfTwvc3Bhbj5gO1xuICAgIH1cblxuICAgIGh1bWFuVGltZSgpIHtcbiAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHRoaXMuc3RhdGUudGltZV90YWtlbjtcbiAgICAgICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICAgICAgY29uc3QgaG91cnMgPSBNYXRoLmZsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHNMZWZ0ID0gc2Vjb25kcyAtIChtaW51dGVzICogNjApO1xuICAgICAgICBjb25zdCBtaW51dGVzTGVmdCA9IG1pbnV0ZXMgLSAoaG91cnMgKiA2MCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHNfcGx1cmFsID0gc2Vjb25kc0xlZnQgPT0gMSA/IFwiXCIgOiBcInNcIjtcbiAgICAgICAgY29uc3QgbWludXRlc19wbHVyYWwgPSBtaW51dGVzTGVmdCA9PSAxID8gXCJcIiA6IFwic1wiO1xuICAgICAgICBjb25zdCBob3Vyc19wbHVyYWwgPSBob3VycyA9PSAxID8gXCJcIiA6IFwic1wiO1xuICAgICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtzZWNvbmRzfSBzZWNvbmQke3NlY29uZHNfcGx1cmFsfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhvdXJzID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHttaW51dGVzfSBtaW51dGUke21pbnV0ZXNfcGx1cmFsfSBhbmQgJHtzZWNvbmRzTGVmdH0gc2Vjb25kJHtzZWNvbmRzX3BsdXJhbH1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtob3Vyc30gaG91ciR7aG91cnNfcGx1cmFsfSwgJHttaW51dGVzTGVmdH0gbWludXRlJHttaW51dGVzX3BsdXJhbH0gYW5kICR7c2Vjb25kc0xlZnR9IHNlY29uZCR7c2Vjb25kc19wbHVyYWx9YDtcbiAgICB9XG5cbiAgICBkcmF3U2hhcmUoKSB7XG4gICAgICAgIGNvbnN0IGVuY29kZWRfcHJvZHVjdF9uYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucHJvZHVjdF9uYW1lKTtcbiAgICAgICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICAgICAgbGV0IHNoYXJlX3VybCA9IHVybFBhcmFtcy5nZXQoJ3NoYXJlX3VybCcpIHx8IHdpbmRvdy5qeHdvcmRfcGVybWFsaW5rIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICBjb25zdCB0aW1lX3Rha2VuID0gdGhpcy5odW1hblRpbWUodGhpcy5zdGF0ZS50aW1lX3Rha2VuKTtcbiAgICAgICAgY29uc3QgZW5jb2RlZF90aW1lX3Rha2VuID0gZW5jb2RlVVJJQ29tcG9uZW50KHRpbWVfdGFrZW4pO1xuICAgICAgICBjb25zdCBzaGFyZV9odG1sID0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktc2hhcmUtb3B0aW9uIGp4d29yZC1vdmVybGF5LXNoYXJlLW9wdGlvbi1jbGlwYm9hcmRcIiBkYXRhLXRleHQ9XCJJJTIwanVzdCUyMGNvbXBsZXRlZCUyMHRoZSUyMCR7ZW5jb2RlZF9wcm9kdWN0X25hbWV9JTIwaW4lMjAke2VuY29kZWRfdGltZV90YWtlbn0hJTIwQ2FuJTIweW91JTIwYmVhdCUyMG15JTIwdGltZT8gJHtlbmNvZGVVUklDb21wb25lbnQoc2hhcmVfdXJsKX1cIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZGFzaGljb25zIGRhc2hpY29ucy1jbGlwYm9hcmRcIj48L3NwYW4+Jm5ic3A7Jm5ic3A7Q29weSB5b3VyIHJlc3VsdHNcbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqeHdvcmQtb3ZlcmxheS1zaGFyZS1vcHRpb25cIj5cbiAgICAgICAgICAgIDxhIGhyZWY9XCJodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD90ZXh0PUklMjBqdXN0JTIwY29tcGxldGVkJTIwdGhlJTIwJHtlbmNvZGVkX3Byb2R1Y3RfbmFtZX0lMjBpbiUyMCR7ZW5jb2RlZF90aW1lX3Rha2VufSElMjBDYW4lMjB5b3UlMjBiZWF0JTIwbXklMjB0aW1lPyZ1cmw9JHtlbmNvZGVVUklDb21wb25lbnQoc2hhcmVfdXJsKX1cIiB0YXJnZXQ9XCJfYmxhbmtcIj48c3BhbiBjbGFzcz1cImRhc2hpY29ucyBkYXNoaWNvbnMtdHdpdHRlclwiPjwvc3Bhbj4gU2hhcmUgeW91ciByZXN1bHRzIG9uIFR3aXR0ZXI8L2E+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwianh3b3JkLW92ZXJsYXktc2hhcmUtb3B0aW9uXCI+XG4gICAgICAgICAgICA8YSBocmVmPVwid2hhdHNhcHA6Ly9zZW5kP3RleHQ9SSUyMGp1c3QlMjBjb21wbGV0ZWQlMjB0aGUlMjAke2VuY29kZWRfcHJvZHVjdF9uYW1lfSUyMGluJTIwJHtlbmNvZGVkX3RpbWVfdGFrZW59ISUyMENhbiUyMHlvdSUyMGJlYXQlMjBteSUyMHRpbWU/JTIwJHtlbmNvZGVVUklDb21wb25lbnQoc2hhcmVfdXJsKX1cIiB0YXJnZXQ9XCJfYmxhbmtcIj48c3BhbiBjbGFzcz1cImRhc2hpY29ucyBkYXNoaWNvbnMtd2hhdHNhcHBcIj48L3NwYW4+IFNoYXJlIHlvdXIgcmVzdWx0cyBvbiBXaGF0c0FwcDwvYT5cbiAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgY29uc3Qgc2hhcmVFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheV9zaGFyZS0ke3RoaXMudWlkfWApO1xuICAgICAgICBzaGFyZUVsLmlubmVySFRNTCA9IHNoYXJlX2h0bWw7XG4gICAgICAgIGNvbnN0IHRpbWVFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheV90aW1lLSR7dGhpcy51aWR9YCk7XG4gICAgICAgIHRpbWVFbC5pbm5lckhUTUwgPSBgWW91ciB0aW1lOiAke3RoaXMuaHVtYW5UaW1lKHRoaXMuc3RhdGUudGltZV90YWtlbil9YDtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtb3ZlcmxheS1zaGFyZS1vcHRpb24tY2xpcGJvYXJkXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNvcHlUb0NsaXBib2FyZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBpc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpIHtcbiAgICAgICAgaWYgKChjb2wgPT09IDApICYmICh0aGlzLmdyaWRbY29sXVtyb3ddICE9PSBcIiNcIikgJiYgKHRoaXMuZ3JpZFtjb2wgKyAxXVtyb3ddICE9PSBcIiNcIikpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF0aGlzLmdyaWRbY29sICsgMV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKChjb2wgPT09IDApIHx8ICh0aGlzLmdyaWRbY29sIC0gMV1bcm93XSA9PSBcIiNcIikpIHtcbiAgICAgICAgICAgIC8vIGlmIChyb3cgPCB0aGlzLmdyaWRbMF0ubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vIGlmICh0aGlzLmdyaWRbY29sXVtyb3cgKyAxXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgaXNTdGFydE9mRG93bihjb2wsIHJvdykge1xuICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF0aGlzLmdyaWRbY29sXVtyb3cgKyAxXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoKHJvdyA9PT0gMCkgfHwgKHRoaXMuZ3JpZFtjb2xdW3JvdyAtIDFdID09IFwiI1wiKSkge1xuICAgICAgICAgICAgLy8gaWYgKGNvbCA8IHRoaXMuZ3JpZC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMuZ3JpZFtjb2wgKyAxXVtyb3ddICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZHJhd051bWJlcnMoKSB7XG4gICAgICAgIC8vIEEgY2VsbCBnZXRzIGEgbnVtYmVyIGlmIGl0IGhhcyBhIGJsb2NrIG9yIGVkZ2UgYWJvdmUgb3IgdG8gdGhlIGxlZnQgb2YgaXQsIGFuZCBhIGJsYW5rIGxldHRlciB0byB0aGUgYm90dG9tIG9yIHJpZ2h0IG9mIGl0IHJlc3BlY3RpdmVseVxuICAgICAgICAvLyBQb3B1bGF0ZSBhIG51bWJlciBncmlkIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgICAgIGxldCBudW0gPSAxO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IHRoaXMub3B0cy5jb2xzOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIGxldCBkcmF3TnVtID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGFydE9mQWNyb3NzKGNvbCwgcm93KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sICE9PSB0aGlzLm9wdHMuY29scyAtIDEgJiYgdGhpcy5ncmlkW2NvbCsxXVtyb3ddICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd051bSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjcm9zc19xdWVzdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpcy5vcHRzLmRhdGEuYWNyb3NzLmZpbmQocSA9PiBxLm51bSA9PT0gYEEke251bX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhcnRPZkRvd24oY29sLCByb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3cgIT09IHRoaXMub3B0cy5yb3dzIC0gMSAmJiB0aGlzLmdyaWRbY29sXVtyb3crMV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3TnVtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG93bl9xdWVzdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpcy5vcHRzLmRhdGEuZG93bi5maW5kKHEgPT4gcS5udW0gPT09IGBEJHtudW19YClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGxldCBkcmF3TnVtID0gdGhpcy5pc1N0YXJ0T2ZBY3Jvc3MoY29sLCByb3cpIHx8IHRoaXMuaXNTdGFydE9mRG93bihjb2wsIHJvdyk7XG4gICAgICAgICAgICAgICAgaWYgKGRyYXdOdW0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TnVtYmVyKGNvbCwgcm93LCBudW0rKyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd051bWJlcihjb2wsIHJvdywgbnVtKSB7XG4gICAgICAgIGNvbnN0IG51bUZvbnRTaXplID0gdGhpcy5jZWxsV2lkdGggKiB0aGlzLm9wdHMubnVtUmF0aW87XG4gICAgICAgIGNvbnN0IHggPSAodGhpcy5jZWxsV2lkdGggKiBjb2wpICsgdGhpcy5vcHRzLm1hcmdpbiArICh0aGlzLmNlbGxXaWR0aCAqIDAuMDQpO1xuICAgICAgICBjb25zdCB5ID0gKHRoaXMuY2VsbEhlaWdodCAqIHJvdykgKyB0aGlzLm9wdHMubWFyZ2luIC0gKHRoaXMuY2VsbFdpZHRoICogMC4wMikgKyBudW1Gb250U2l6ZTtcbiAgICAgICAgY29uc3QgY2VsbEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7IHRoaXMudWlkIH0tJHsgY29sIH0tJHsgcm93IH1gKTtcbiAgICAgICAgXG4gICAgICAgIGNlbGxFbC5pbm5lckhUTUwgKz0gYDx0ZXh0IHg9XCIkeyB4IH1cIiB5PVwiJHsgeSB9XCIgdGV4dC1hbmNob3I9XCJsZWZ0XCIgZm9udC1zaXplPVwiJHsgbnVtRm9udFNpemUgfVwiPiR7IG51bSB9PC90ZXh0PmBcbiAgICB9XG5cbiAgICBkcmF3Qm9yZGVyKCkge1xuICAgICAgICB0aGlzLmNlbGxHcm91cC5pbm5lckhUTUwgKz0gYDxyZWN0IHg9XCIke3RoaXMub3B0cy5tYXJnaW59XCIgeT1cIiR7dGhpcy5vcHRzLm1hcmdpbn1cIiB3aWR0aD1cIiR7dGhpcy5vcHRzLndpZHRofVwiIGhlaWdodD1cIiR7dGhpcy5vcHRzLmhlaWdodH1cIiBzdHJva2U9XCIke3RoaXMub3B0cy5vdXRlckJvcmRlckNvbG91ciB9XCIgc3Ryb2tlLXdpZHRoPVwiJHt0aGlzLm9wdHMub3V0ZXJCb3JkZXJXaWR0aCB9XCIgZmlsbD1cIm5vbmVcIj5gO1xuICAgIH1cblxuICAgIGRyYXdRdWVzdGlvbnMoKSB7XG4gICAgICAgIGxldCBhY3Jvc3MgPSBgPG9sIGlkPVwianh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3MtJHt0aGlzLnVpZH1cIiBjbGFzcz1cImp4d29yZC1xdWVzdGlvbnMtbGlzdFwiPmBcbiAgICAgICAgdGhpcy5vcHRzLmRhdGEuYWNyb3NzLmZvckVhY2gocSA9PiB7XG4gICAgICAgICAgICBhY3Jvc3MgKz0gdGhpcy5kcmF3UXVlc3Rpb24ocSk7XG4gICAgICAgIH0pXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7dGhpcy51aWR9YCkuaW5uZXJIVE1MICs9IGFjcm9zcztcbiAgICAgICAgbGV0IGRvd24gPSBgPG9sIGlkPVwianh3b3JkLXF1ZXN0aW9ucy1kb3duLSR7dGhpcy51aWR9XCIgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3RcIj5gXG4gICAgICAgIHRoaXMub3B0cy5kYXRhLmRvd24uZm9yRWFjaChxID0+IHtcbiAgICAgICAgICAgIGRvd24gKz0gdGhpcy5kcmF3UXVlc3Rpb24ocSk7XG4gICAgICAgIH0pXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tZG93bi0ke3RoaXMudWlkfWApLmlubmVySFRNTCArPSBkb3duO1xuICAgIH1cblxuICAgIGRyYXdRdWVzdGlvbihxKSB7XG4gICAgICAgIHJldHVybiBgPGxpIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW1cIiBpZD1cImp4d29yZC1xdWVzdGlvbi1hY3Jvc3MtJHtxLm51bX0tJHt0aGlzLnVpZH1cIiBkYXRhLXE9XCIke3EubnVtfVwiPjxzcGFuIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0tbnVtXCI+JHtxLm51bS5yZXBsYWNlKC9eXFxELywgXCJcIil9PC9zcGFuPjxzcGFuIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0tcXVlc3Rpb25cIj4ke3EucXVlc3Rpb259PC9zcGFuPjwvbGk+YDtcbiAgICB9XG5cbiAgICBzaG93T3ZlcmxheShzdGF0ZSA9IFwicGF1c2VkXCIpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtcGF1c2VkXCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1ldGFfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gXCJwYXVzZWRcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtcGF1c2VkXCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtY29tcGxldGVfb3ZlcmxheVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBcIm1ldGFcIikge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtbWV0YV9vdmVybGF5XCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LmFkZChcImp4d29yZC1vdmVybGF5LXNob3dcIik7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtb3ZlcmxheS1oaWRlXCIpO1xuICAgIH1cblxuICAgIGhpZGVPdmVybGF5KCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW92ZXJsYXktJHt0aGlzLnVpZH1gKS5jbGFzc0xpc3QuYWRkKFwianh3b3JkLW92ZXJsYXktaGlkZVwiKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1vdmVybGF5LSR7dGhpcy51aWR9YCkuY2xhc3NMaXN0LnJlbW92ZShcImp4d29yZC1vdmVybGF5LXNob3dcIik7XG4gICAgfVxuXG4gICAgY2hlY2tPdmVybGF5KCkge1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd092ZXJsYXkoXCJwYXVzZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVPdmVybGF5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRTdGF0ZSgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwOyAvLyAwID0gYWNyb3NzLCAxID0gZG93blxuICAgICAgICB0aGlzLnN0YXRlLmNvbXBsZXRlID0gZmFsc2U7IC8vIEFyZSB3ZSBkb25lIHlldD9cbiAgICAgICAgdGhpcy5zdGF0ZS5oaW50cyA9IGZhbHNlOyAvLyBIYWQgYW55IGhlbHA/XG4gICAgICAgIHRoaXMuc3RhdGUudGltZV90YWtlbiA9IDA7IC8vIEhvdyBsb25nIGhhdmUgd2UgYmVlbiBwbGF5aW5nP1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoID0gbmV3IEFycmF5KHRoaXMub3B0cy5jb2xzKS5maWxsKFwiXCIpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoXCJcIikpOyAvLyBBIG1hdHJpeCBmaWxsZWQgd2l0aCBlbXB0eSBjaGFyc1xuICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHsgLy8gRmlsbCBpbiB0aGUgIydzXG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW2NvbF1bcm93XSA9PT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gPSBcIiNcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZS5oYXNoID0gdGhpcy5jYWxjSGFzaCh0aGlzLnN0YXRlLmdyYXBoKTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FsYXJzIChmb3IgYWNyb3NzIGFuZCBkb3duKSB0aGF0IHdlIHVzZSB3aGVuIGRlY2lkaW5nIHdoaWNoIGNlbGwgdG8gZ28gdG8gaW4gdGhlIGV2ZW50IHRoYXQgYSBsZXR0ZXIgaXMgdHlwZWQsIHRhYiBpcyBwcmVzc2VkIGV0Yy4gXG4gICAgICAgIC8vIERvd24gU2NhbGFyXG4gICAgICAgIHRoaXMuc3RhdGUuc2NhbGFyRG93biA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCBxdWVzdGlvbiBvZiB0aGlzLmRvd25fcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckRvd24ucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJEb3duLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjb2w6IHF1ZXN0aW9uLmNvbCxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3cgKyBpLFxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4KyssXG4gICAgICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICAgICAgY29ycmVjdDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2codGhpcy5zdGF0ZS5zY2FsYXJEb3duKTtcbiAgICAgICAgLy8gQWNyb3NzIFNjYWxhclxuICAgICAgICB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyA9IFtdO1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHF1ZXN0aW9uIG9mIHRoaXMuYWNyb3NzX3F1ZXN0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgY29sOiBxdWVzdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgbGV0dGVyOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCsrLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXN0aW9uLm51bSxcbiAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHF1ZXN0aW9uLmRhdGEuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbDogcXVlc3Rpb24uY29sICsgaSxcbiAgICAgICAgICAgICAgICAgICAgcm93OiBxdWVzdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZldvcmQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgrKyxcbiAgICAgICAgICAgICAgICAgICAgcTogcXVlc3Rpb24ubnVtLFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnNjYWxhckFjcm9zcyk7XG4gICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGwgPSBbdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3NbMF0uY29sLCB0aGlzLnN0YXRlLnNjYWxhckFjcm9zc1swXS5yb3ddOyAvLyBTdGFydCBhdCBmaXJzdCBhY3Jvc3NcbiAgICAgICAgLy8gQ29ycmVjdCBncmlkXG4gICAgICAgIHRoaXMuc3RhdGUuY29ycmVjdEdyaWQgPSBuZXcgQXJyYXkodGhpcy5vcHRzLmNvbHMpLmZpbGwoZmFsc2UpLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5vcHRzLnJvd3MpLmZpbGwoZmFsc2UpKTtcbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5wcm9ncmVzcyA9IDA7XG4gICAgICAgIHRoaXMuc3RhdGUucXVhcnRpbGUgPSAwO1xuICAgIH1cblxuICAgIHNhdmVTdGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKFwiU2F2aW5nIFN0YXRlXCIpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5zdG9yYWdlTmFtZSwgSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZSkpO1xuICAgIH1cblxuICAgIHJlc3RvcmVTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLnN0b3JhZ2VOYW1lKTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsZXR0ZXIgPSB0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxldHRlciAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0xldHRlcihsZXR0ZXIsIGNvbCwgcm93KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgICAgICB0aGlzLnNldEF1dG9jaGVjaygpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZVJlc3RvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlN0YXRlIFJlc3RvcmVkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FsY0hhc2gobWF0cml4KSB7XG4gICAgICAgIGxldCBzID0gXCJcIjtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5vcHRzLnJvd3M7IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLm9wdHMuY29sczsgY29sKyspIHtcbiAgICAgICAgICAgICAgICBzICs9IG1hdHJpeFtjb2xdW3Jvd107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhhc2ggPSAwLCBjaHI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2hyID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hyO1xuICAgICAgICAgICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhoYXNoLCBzKTtcbiAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuXG4gICAgbWFya0NlbGxzKCkge1xuICAgICAgICBsZXQgYWxsQ2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1jZWxsLXJlY3QuaXMtbGV0dGVyXCIpO1xuICAgICAgICBhbGxDZWxscy5mb3JFYWNoKGNlbGwgPT4ge1xuICAgICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5iYWNrZ3JvdW5kQ29sb3VyKTtcbiAgICAgICAgICAgIGNlbGwuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgLTEpO1xuICAgICAgICB9KVxuICAgICAgICBsZXQgY3VycmVudENlbGxSZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSB9LSR7IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gfSA+IHJlY3RgKTtcbiAgICAgICAgY3VycmVudENlbGxSZWN0LnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdENlbGxDb2xvdXIpO1xuICAgICAgICBjdXJyZW50Q2VsbFJlY3Quc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgMSk7XG4gICAgICAgIGxldCBtYXJrZWRDZWxsID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICsgMTsgY291bnQgPCB0aGlzLm9wdHMuY29sczsgY291bnQgKyspIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y291bnR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXX0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBjb3VudCA9IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gLSAxOyBjb3VudCA+PSAwOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2VsbC0ke3RoaXMudWlkfS0ke2NvdW50fS0ke3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV19ID4gcmVjdGApO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZWRDZWxsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWJsYW5rXCIpKSBicmVhaztcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgdGhpcy5vcHRzLnNlbGVjdFdvcmRDb2xvdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgY291bnQgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdICsgMTsgY291bnQgPCB0aGlzLm9wdHMucm93czsgY291bnQrKykge1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWNlbGwtJHt0aGlzLnVpZH0tJHt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdfS0ke2NvdW50fSA+IHJlY3RgKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VkQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1ibGFua1wiKSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgbWFya2VkQ2VsbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIHRoaXMub3B0cy5zZWxlY3RXb3JkQ29sb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGNvdW50ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSAtIDE7IGNvdW50ID49IDA7IGNvdW50LS0pIHtcbiAgICAgICAgICAgICAgICBtYXJrZWRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7dGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXX0tJHtjb3VudH0gPiByZWN0YCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlZENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYmxhbmtcIikpIGJyZWFrO1xuICAgICAgICAgICAgICAgIG1hcmtlZENlbGwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCB0aGlzLm9wdHMuc2VsZWN0V29yZENvbG91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oaWdobGlnaHRRdWVzdGlvbih0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG5cbiAgICByZWdpc3RlckFjdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCB0aGlzLnZpc2liaWxpdHlDaGFuZ2VkLmJpbmQodGhpcykpO1xuICAgICAgICBsZXQgYWxsQ2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwicmVjdC5pcy1sZXR0ZXJcIik7XG4gICAgICAgIGZvcihsZXQgY2VsbCBvZiBhbGxDZWxscykge1xuICAgICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jYXRjaENlbGxDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmNhdGNoS2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtYXJyb3ctZm9yd2FyZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm1vdmVUb05leHRXb3JkLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWFycm93LWJhY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5tb3ZlVG9QcmV2aW91c1dvcmQuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtcmVzZXRgKS5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNlbGYucmVzZXQuYmluZChzZWxmKSkpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLW1ldGEtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaG93TWV0YS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy50b2dnbGVBdXRvY2hlY2suYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtY2hlY2tfd29yZC0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmNoZWNrV29yZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja19zcXVhcmUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGVja1NxdWFyZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jaGVja19wdXp6bGUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGVja1B1enpsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1zaW5nbGUtcXVlc3Rpb24tJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jaGFuZ2VEaXJlY3Rpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IGtleXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmp4d29yZC1rZXlcIik7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coa2V5KTtcbiAgICAgICAgICAgIGtleS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5rZXlDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucGF1c2UuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtb3ZlcmxheS1yZXN1bWUtJHt0aGlzLnVpZH1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wbGF5LmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuanh3b3JkLWNsb3NlLW92ZXJsYXlgKS5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLmhpZGVPdmVybGF5LmJpbmQoc2VsZikpKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wcmludF9ibGFuay0ke3RoaXMudWlkfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByaW50QmxhbmsuYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcHJpbnRfZmlsbGVkLSR7dGhpcy51aWR9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJpbnRGaWxsZWQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgdmlzaWJpbGl0eUNoYW5nZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSk7XG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLmlzX2hpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhcIlBhdXNlXCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpyZXN1bWVcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pc19wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfSA+IC5qeHdvcmQtcGF1c2UtdGV4dGApLmlubmVySFRNTCA9IFwiUGxheVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5hZGQoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpwYXVzZVwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVja092ZXJsYXkoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coXCJQbGF5XCIpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaXNfcGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXBhdXNlLSR7dGhpcy51aWR9ID4gLmp4d29yZC1wYXVzZS10ZXh0YCkuaW5uZXJIVE1MID0gXCJQYXVzZVwiO1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzIHRvIHBhdXNlIGJ1dHRvblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1wYXVzZS0ke3RoaXMudWlkfWApLmNsYXNzTGlzdC5yZW1vdmUoXCJqeHdvcmQtcGxheVwiKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpyZXN1bWVcIiwgeyBkZXRhaWw6IHRoaXMuc3RhdGUgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2tPdmVybGF5KCk7XG4gICAgfVxuXG4gICAgc2hvd01ldGEoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2hvd092ZXJsYXkoXCJtZXRhXCIpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpXG4gICAgfVxuXG4gICAgcHJpbnRCbGFuayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKVxuICAgICAgICBjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXN2Zy0ke3RoaXMudWlkfWApLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgY29uc3QgbGV0dGVycyA9IHN2Zy5xdWVyeVNlbGVjdG9yQWxsKGAuanh3b3JkLWxldHRlcmApO1xuICAgICAgICBmb3IgKGxldCBsZXR0ZXIgb2YgbGV0dGVycykge1xuICAgICAgICAgICAgbGV0dGVyLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJpbnQoc3ZnKTtcbiAgICB9XG5cbiAgICBwcmludEZpbGxlZChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgY29uc3Qgc3ZnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1zdmctJHt0aGlzLnVpZH1gKTtcbiAgICAgICAgdGhpcy5wcmludChzdmcpO1xuICAgIH1cblxuICAgIHByaW50KHN2Zykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhzdmcpO1xuICAgICAgICBjb25zdCBzdmdfdGV4dCA9IHN2Zy5vdXRlckhUTUwucmVwbGFjZSgvZmlsbD1cIiNmN2Y0NTdcIi9nLCBgZmlsbD1cIiNmZmZmZmZcImApLnJlcGxhY2UoL2ZpbGw9XCIjOWNlMGZiXCIvZywgYGZpbGw9XCIjZmZmZmZmXCJgKTtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25zX2Fjcm9zcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcy0ke3RoaXMudWlkfWApLm91dGVySFRNTDtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25zX2Rvd24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLXF1ZXN0aW9ucy1kb3duLSR7dGhpcy51aWR9YCkub3V0ZXJIVE1MO1xuICAgICAgICBsZXQgcHJpbnRXaW5kb3cgPSB3aW5kb3cub3BlbigpO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGh0bWw+PGhlYWQ+PHRpdGxlPiR7dGhpcy5vcHRzLmRhdGEubWV0YS5UaXRsZX08L3RpdGxlPmApO1xuICAgICAgICBwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPHN0eWxlPlxuICAgICAgICAgICAgLnN2Zy1jb250YWluZXIge1xuICAgICAgICAgICAgICAgIGhlaWdodDogMzVlbTtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OmJsb2NrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmp4d29yZC1zdmcge1xuICAgICAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC5qeHdvcmQtcXVlc3Rpb25zLWxpc3Qge1xuICAgICAgICAgICAgICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNTtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgcGFkZGluZy1sZWZ0OiAwcHg7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgICAgIG1hcmdpbi1yaWdodDogMjBweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS1udW0ge1xuICAgICAgICAgICAgICAgIG1hcmdpbi1yaWdodDogNXB4O1xuICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgICAgICAgICAgICAgIHdpZHRoOiAyNXB4O1xuICAgICAgICAgICAgICAgIG1pbi13aWR0aDogMjVweDtcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC5xdWVzdGlvbnMge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgICAgICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIDwvc3R5bGU+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8ZGl2IGNsYXNzPVwic3ZnLWNvbnRhaW5lclwiPiR7c3ZnX3RleHR9PC9kaXY+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8ZGl2IGNsYXNzPVwicXVlc3Rpb25zXCI+XFxuYCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8ZGl2PjxoND5BY3Jvc3M8L2g0PlxcbiR7cXVlc3Rpb25zX2Fjcm9zc308L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXY+PGg0PkRvd248L2g0PlxcbiR7cXVlc3Rpb25zX2Rvd259PC9kaXY+YCk7XG4gICAgICAgIHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8L2Rpdj5gKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZG9jdW1lbnQuY2xvc2UoKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuZm9jdXMoKTtcbiAgICAgICAgcHJpbnRXaW5kb3cucHJpbnQoKTtcbiAgICAgICAgcHJpbnRXaW5kb3cuY2xvc2UoKTtcbiAgICB9XG5cbiAgICBjYXRjaENlbGxDbGljayhlKSB7XG4gICAgICAgIGNvbnN0IGNvbCA9IE51bWJlcihlLnRhcmdldC5kYXRhc2V0LmNvbCk7XG4gICAgICAgIGNvbnN0IHJvdyA9IE51bWJlcihlLnRhcmdldC5kYXRhc2V0LnJvdyk7XG4gICAgICAgIGlmICgoY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdKSAmJiAocm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKSkgeyAvLyBDbGlja2VkIG9uIGFscmVhZHkgc2VsZWN0ZWQgY2VsbFxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBjb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gcm93O1xuICAgICAgICAgICAgY29uc3Qgd29yZCA9IHRoaXMuZ2V0V29yZCh0aGlzLnN0YXRlLmRpcmVjdGlvbiwgY29sLCByb3cpO1xuICAgICAgICAgICAgaWYgKCF3b3JkKSB0aGlzLmNoYW5nZURpcmVjdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgICAgIHRoaXMuc2hvd0lPU0tleWJvYXJkKCk7XG4gICAgfVxuXG4gICAgbW92ZVRvTmV4dENlbGwoKSB7XG4gICAgICAgIGxldCBzY2FsYXI7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFNjYWxhckluZGV4ID0gc2NhbGFyLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGl0ZW0ucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgaWYgKGN1cnJlbnRTY2FsYXJJbmRleCA8IHNjYWxhci5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW2N1cnJlbnRTY2FsYXJJbmRleCArIDFdLmNvbDtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbY3VycmVudFNjYWxhckluZGV4ICsgMV0ucm93O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHR5cGVMZXR0ZXIobGV0dGVyKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHRDZWxsKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGFzTGV0dGVyID0gKHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dID0gbGV0dGVyO1xuICAgICAgICB0aGlzLnNldFNjYWxhcnMobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKVxuICAgICAgICB0aGlzLmRyYXdMZXR0ZXIobGV0dGVyLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgLy8gdGhpcy5jaGVja0hpbnQoKTtcbiAgICAgICAgdGhpcy5jaGVja1dpbigpO1xuICAgICAgICBpZiAoIWhhc0xldHRlcikge1xuICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb05leHRDZWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYXRjaEtleVByZXNzKGUpIHtcbiAgICAgICAgY29uc3Qga2V5Y29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZSk7XG4gICAgICAgIGlmIChlLm1ldGFLZXkpIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJpbnRhYmxlID0gKGtleWNvZGUgPiA2NCAmJiBrZXljb2RlIDwgOTEpO1xuICAgICAgICBpZiAodGhpcy5pc19wYXVzZWQpIHJldHVybjsgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgcGF1c2VkXG4gICAgICAgIGlmIChwcmludGFibGUgJiYgIXRoaXMuc3RhdGUuY29tcGxldGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGUua2V5LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLnR5cGVMZXR0ZXIobGV0dGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSA4KSB7IC8vIEJhY2tzcGFjZVxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmNvbXBsZXRlKSB7IC8vIERvbid0IGFsbG93IGNoYW5nZXMgaWYgd2UndmUgZmluaXNoZWQgb3VyIHB1enpsZVxuICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Y29kZSA9PSAzMikge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlVG9OZXh0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGtleWNvZGUgPT09IDkpIHx8IChrZXljb2RlID09PSAxMykpIHsgLy8gVGFiIG9yIEVudGVyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvUHJldmlvdXNXb3JkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRvTmV4dFdvcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChrZXljb2RlID09PSAzNykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM4KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVVcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM5KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVSaWdodCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleWNvZGUgPT09IDQwKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVEb3duKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlTGVmdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB4ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgeC0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt4XVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXJrQ2VsbHMoKTtcbiAgICB9XG5cbiAgICBtb3ZlVXAoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgICAgIGxldCBjdXJyZW50Q2VsbCA9IHNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5jb2wgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gJiYgY2VsbC5yb3cgPT09IHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gY3VycmVudENlbGwuaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbaW5kZXggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCAtIDFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3NjYWxhci5sZW5ndGggLSAxXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB5ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgeS0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt5XSAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgbW92ZVJpZ2h0KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJpYSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudENlbGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBjdXJyZW50Q2VsbC5pbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhcltpbmRleCArMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbaW5kZXggKzFdLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzY2FsYXJbaW5kZXggKzFdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBzY2FsYXJbMF0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhclswXS5yb3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB4ID0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoeCA8IHRoaXMub3B0cy5yb3dzIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB4Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW3hdW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dICE9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVEb3duKCkge1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBsZXQgY3VycmVudENlbGwgPSBzY2FsYXIuZmluZChjZWxsID0+IGNlbGwuY29sID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdICYmIGNlbGwucm93ID09PSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGN1cnJlbnRDZWxsLmluZGV4O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyW2luZGV4ICsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhcltpbmRleCArMV0uY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IHNjYWxhcltpbmRleCArMV0ucm93O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IHNjYWxhclswXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyWzBdLnJvdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh5IDwgdGhpcy5vcHRzLmNvbHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHkrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZ3JhcGhbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1beV0gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0NlbGxzKCk7XG4gICAgfVxuXG4gICAgc2V0U2NhbGFycyhsZXR0ZXIsIGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBhY3Jvc3MgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICBpZiAoYWNyb3NzKSB7XG4gICAgICAgICAgICBhY3Jvc3MubGV0dGVyID0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkb3duID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY2VsbC5jb2wgPT09IGNvbCAmJiBjZWxsLnJvdyA9PT0gcm93KSk7XG4gICAgICAgIGlmIChkb3duKSB7XG4gICAgICAgICAgICBkb3duLmxldHRlciA9IGxldHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5hdXRvY2hlY2spIHtcbiAgICAgICAgICAgIGlmIChsZXR0ZXIgPT09IHRoaXMuZ3JpZFtjb2xdW3Jvd10pIHtcbiAgICAgICAgICAgICAgICBpZiAoZG93bikgZG93bi5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoYWNyb3NzKSBhY3Jvc3MuY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFtjb2xdW3Jvd10gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZVRvTmV4dCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhjdXJzb3IpO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coeCwgc2NhbGFyW3hdKTtcbiAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRDZWxsKSB7IC8vIEZvdW5kIGEgY2VsbCB0byBtb3ZlIHRvXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gbmV4dENlbGwuY29sO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRDZWxsLnJvdztcbiAgICAgICAgfSBlbHNlIHsgLy8gQ2hhbmdlIGRpcmVjdGlvblxuICAgICAgICAgICAgY29uc3QgbmV4dEJsYW5rID0gb3RoZXJTY2FsYXIuZmluZChjZWxsID0+IGNlbGwubGV0dGVyID09PSBcIlwiKTtcbiAgICAgICAgICAgIGlmIChuZXh0QmxhbmspIHsgLy8gSXMgdGhlcmUgc3RpbGwgYSBibGFuayBkb3duP1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0QmxhbmsuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBuZXh0Qmxhbmsucm93O1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGlyZWN0aW9uKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIG1vdmVUb1ByZXZpb3VzTGV0dGVyKCkge1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJBY3Jvc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnJlbnRDZWxsID0gc2NhbGFyLmZpbmQoY2VsbCA9PiBjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSk7XG4gICAgICAgIGxldCBjdXJzb3IgPSBjdXJyZW50Q2VsbC5pbmRleCAtIDE7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3I7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLmxldHRlciAhPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc2NhbGFyW3hdLmNvbDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gc2NhbGFyW3hdLnJvdztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIGRlbGV0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29ycmVjdEdyaWRbdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXV1bdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXV0pICB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGV0dGVyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmdyYXBoW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMF1dW3RoaXMuc3RhdGUuY3VycmVudENlbGxbMV1dKSB7XG4gICAgICAgICAgICAvLyBNb3ZlIGJhY2sgYW5kIHRoZW4gZGVsZXRlXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGV0dGVyKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSkgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd0xldHRlcihcIlwiLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5ncmFwaFt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdXVt0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdXSA9IFwiXCI7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFycyhcIlwiLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVDb21wbGV0ZSgpO1xuICAgIH1cbiAgICBcbiAgICBtb3ZlVG9OZXh0V29yZCgpIHtcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICBpZiAoIWN1cnNvcikgcmV0dXJuO1xuICAgICAgICBmb3IgKGxldCB4ID0gY3Vyc29yLmluZGV4ICsgMTsgeCA8IHNjYWxhci5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgIG5leHRDZWxsID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0Q2VsbCAmJiBuZXh0Q2VsbC5sZXR0ZXIgIT09IFwiXCIpIHsgLy8gRmlyc3QgbGV0dGVyIGlzIG5vdCBibGFuaywgXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gbmV4dENlbGwuaW5kZXggKyAxOyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBvdGhlclNjYWxhci5maW5kKGNlbGwgPT4gY2VsbC5sZXR0ZXIgPT09IFwiXCIpO1xuICAgICAgICAgICAgaWYgKG5leHRCbGFuaykgeyAvLyBJcyB0aGVyZSBzdGlsbCBhIGJsYW5rIGRvd24/XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IG5leHRCbGFuay5jb2w7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IG5leHRCbGFuay5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIGZpbmRTdGFydE9mQ3VycmVudFdvcmQoKSB7XG4gICAgICAgIGxldCBzY2FsYXI7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgfSBlbHNlIHsgLy8gRG93blxuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBTdGFydCBvZiBjdXJyZW50IHdvcmRcbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IHggPSBjdXJzb3IuaW5kZXg7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICBpZiAoc2NhbGFyW3hdLnN0YXJ0T2ZXb3JkKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRPZkN1cnJlbnRXb3JkID0gc2NhbGFyW3hdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGFydE9mQ3VycmVudFdvcmQ7XG4gICAgfVxuXG4gICAgbW92ZVRvUHJldmlvdXNXb3JkKCkge1xuICAgICAgICBmdW5jdGlvbiBmaW5kTGFzdChhcnJheSwgcHJlZGljYXRlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gYXJyYXlbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZSh4KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gTW92ZSB0byBmaXN0IGxldHRlciBvZiBjdXJyZW50IHdvcmQsIHRoZW4gc2VhcmNoIGJhY2t3YXJkIGZvciBhIGZyZWUgc3BhY2UsIHRoZW4gbW92ZSB0byB0aGUgc3RhcnQgb2YgdGhhdCB3b3JkLCB0aGVuIG1vdmUgZm9yd2FyZCB1bnRpbCBhIGZyZWUgc3BhY2VcbiAgICAgICAgbGV0IG5leHRDZWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHNjYWxhciA9IG51bGw7XG4gICAgICAgIGxldCBvdGhlclNjYWxhciA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHsgLy8gQWNyb3NzXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIG90aGVyU2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICB9IGVsc2UgeyAvLyBEb3duXG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICBvdGhlclNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxldCBjdXJzb3IgPSBzY2FsYXIuZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSAmJiBjZWxsLnJvdyA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSkpO1xuICAgICAgICAvLyBTdGFydCBvZiBjdXJyZW50IHdvcmRcbiAgICAgICAgbGV0IHN0YXJ0T2ZDdXJyZW50V29yZCA9IHRoaXMuc3RhcnRPZkN1cnJlbnRXb3JkKCk7XG4gICAgICAgIGxldCBibGFua1NwYWNlID0gbnVsbDtcbiAgICAgICAgLy8gS2VlcCBnb2luZyBiYWNrIHVudGlsIHdlIGhpdCBhIGJsYW5rIHNwYWNlXG4gICAgICAgIGlmIChzdGFydE9mQ3VycmVudFdvcmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSBzdGFydE9mQ3VycmVudFdvcmQuaW5kZXggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2FsYXJbeF0ubGV0dGVyID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJsYW5rU3BhY2UgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RhcnRPZkxhc3RXb3JkID0gbnVsbDtcbiAgICAgICAgaWYgKGJsYW5rU3BhY2UpIHtcbiAgICAgICAgICAgIC8vIE5vdyBmaW5kIHN0YXJ0IG9mIHRoaXMgd29yZFxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IGJsYW5rU3BhY2UuaW5kZXg7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5zdGFydE9mV29yZCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydE9mTGFzdFdvcmQgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRPZkxhc3RXb3JkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gc3RhcnRPZkxhc3RXb3JkLmluZGV4OyB4IDwgc2NhbGFyLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxhclt4XS5sZXR0ZXIgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENlbGwgPSBzY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dENlbGwpIHsgLy8gRm91bmQgYSBjZWxsIHRvIG1vdmUgdG9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBuZXh0Q2VsbC5jb2w7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdID0gbmV4dENlbGwucm93O1xuICAgICAgICB9IGVsc2UgeyAvLyBDaGFuZ2UgZGlyZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBuZXh0QmxhbmsgPSBmaW5kTGFzdChvdGhlclNjYWxhciwgY2VsbCA9PiBjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICBpZiAobmV4dEJsYW5rKSB7IC8vIElzIHRoZXJlIHN0aWxsIGEgYmxhbmsgZG93bj9cbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRPZldvcmQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSBuZXh0QmxhbmsuaW5kZXg7IHggPj0gMDsgeC0tKSB7IC8vIE1vdmUgdG8gc3RhcnQgb2Ygd29yZFxuICAgICAgICAgICAgICAgICAgICBpZiAob3RoZXJTY2FsYXJbeF0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2ZXb3JkID0gb3RoZXJTY2FsYXJbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdID0gc3RhcnRPZldvcmQuY29sO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBzdGFydE9mV29yZC5yb3c7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEaXJlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHNldEZvY3VzKCkge1xuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLWNlbGwtcmVjdFwiKTtcbiAgICAgICAgZWwuZm9jdXMoKTtcbiAgICAgICAgdGhpcy5zaG93SU9TS2V5Ym9hcmQoKTtcbiAgICAgICAgLy8gdGhpcy5jb250YWluZXJFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgY2hlY2tXaW4oKSB7XG4gICAgICAgIGxldCB3aW4gPSB0cnVlO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMuZ3JpZC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLmdyaWRbeF0ubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSBcIiNcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgbGV0IHNjYWxhckFjcm9zcyA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoc2NhbGFyID0+IHNjYWxhci5yb3cgPT0geSAmJiBzY2FsYXIuY29sID09IHgpO1xuICAgICAgICAgICAgICAgIGxldCBzY2FsYXJEb3duID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoc2NhbGFyID0+IHNjYWxhci5yb3cgPT0geSAmJiBzY2FsYXIuY29sID09IHgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbeF1beV0gPT09IHRoaXMuc3RhdGUuZ3JhcGhbeF1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxhckFjcm9zcykgc2NhbGFyQWNyb3NzLmNvcnJlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyRG93bikgc2NhbGFyRG93bi5jb3JyZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyQWNyb3NzKSBzY2FsYXJBY3Jvc3MuY29ycmVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGFyRG93bikgc2NhbGFyRG93bi5jb3JyZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNvbXBsZXRlKCk7XG4gICAgICAgIC8vIHRoaXMuc3RhdGUuaGFzaCA9IHRoaXMuY2FsY0hhc2godGhpcy5zdGF0ZS5ncmFwaCk7XG4gICAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheVdpbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzcGxheVdpbigpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtb3ZlcmxheS10aXRsZVwiKS5pbm5lckhUTUwgPSBcIllvdSBXaW4hXCI7XG4gICAgICAgIHRoaXMuZHJhd1NoYXJlKCk7XG4gICAgICAgIHRoaXMuc2hvd092ZXJsYXkoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmF1ZGlvKSB0aGlzLmF1ZGlvLnBsYXkoKTtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOmNvbXBsZXRlXCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJGaXJld29ya3MhXCIpO1xuICAgICAgICBjb25zdCBmaXJld29ya3MgPSBuZXcgRmlyZXdvcmtzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW92ZXJsYXktY29udGVudFwiKSwge1xuICAgICAgICAgICAgYWNjZWxlcmF0aW9uOiAxLFxuICAgICAgICAgICAgdHJhY2VTcGVlZDogMyxcbiAgICAgICAgfSk7XG4gICAgICAgIGZpcmV3b3Jrcy5zdGFydCgpO1xuICAgIH1cblxuICAgIGhpZ2hsaWdodFF1ZXN0aW9uKGNvbCwgcm93KSB7XG4gICAgICAgIGxldCBkID0gbnVsbDtcbiAgICAgICAgbGV0IGNlbGwgPSBudWxsO1xuICAgICAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcy5maW5kKGNlbGwgPT4gKGNlbGwuY29sID09PSBjb2wgJiYgY2VsbC5yb3cgPT09IHJvdykpO1xuICAgICAgICAgICAgZCA9IFwiQVwiO1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMub3B0cy5kYXRhLmFjcm9zcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLnN0YXRlLnNjYWxhckRvd24uZmluZChjZWxsID0+IChjZWxsLmNvbCA9PT0gY29sICYmIGNlbGwucm93ID09PSByb3cpKTtcbiAgICAgICAgICAgIGQgPSBcIkRcIjtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLm9wdHMuZGF0YS5kb3duO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY2VsbCkgcmV0dXJuO1xuICAgICAgICBsZXQgcSA9IGNlbGwucTtcbiAgICAgICAgdmFyIGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qeHdvcmQtcXVlc3Rpb25zLWxpc3QtaXRlbS5hY3RpdmVcIik7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtcywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25FbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNqeHdvcmQtcXVlc3Rpb24tYWNyb3NzLSR7ZH0ke3F9LSR7dGhpcy51aWR9YCk7XG4gICAgICAgIGlmICghcXVlc3Rpb25FbCkgcmV0dXJuO1xuICAgICAgICBxdWVzdGlvbkVsLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyh7IHF1ZXN0aW9uRWwgfSk7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSAgY29uc29sZS5sb2coYCNqeHdvcmQtcXVlc3Rpb24tJHtkfS0ke3RoaXMudWlkfWApO1xuICAgICAgICB0aGlzLmVuc3VyZVZpc2liaWxpdHkocXVlc3Rpb25FbCwgcXVlc3Rpb25FbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQpO1xuICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZH0ke2NlbGwucX1gKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qeHdvcmQtc2luZ2xlLXF1ZXN0aW9uXCIpLmlubmVySFRNTCA9IGAke3F1ZXN0aW9uLnF1ZXN0aW9ufWA7XG4gICAgfVxuXG4gICAgZW5zdXJlVmlzaWJpbGl0eShlbCwgY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyUmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKHJlY3QuYm90dG9tID4gY29udGFpbmVyUmVjdC5ib3R0b20pIHtcbiAgICAgICAgICAgIGVsLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVjdC50b3AgPCBjb250YWluZXJSZWN0LnRvcCkge1xuICAgICAgICAgICAgZWwuc2Nyb2xsSW50b1ZpZXcodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsaXN0ZW5RdWVzdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW1cIik7XG4gICAgICAgIGZvcihsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zKSB7XG4gICAgICAgICAgICBxdWVzdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jbGlja1F1ZXN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xpY2tRdWVzdGlvbihlKSB7XG4gICAgICAgIGNvbnN0IHEgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5xO1xuICAgICAgICBjb25zdCBkaXIgPSBxWzBdO1xuICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIocS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICBsZXQgc2NhbGFyID0gbnVsbDtcbiAgICAgICAgaWYgKGRpciA9PT0gXCJBXCIpIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmlhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckRvd247XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLnNldEFyaWEoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwucSA9PT0gbnVtKSB7XG4gICAgICAgICAgICAgICAgLy8gTW92ZSB0byB0aGUgZmlyc3QgZW1wdHkgbGV0dGVyIGluIGEgd29yZC4gSWYgdGhlcmUgaXNuJ3QgYW4gZW1wdHkgbGV0dGVyLCBtb3ZlIHRvIHN0YXJ0IG9mIHdvcmQuXG4gICAgICAgICAgICAgICAgbGV0IGVtcHR5bGV0dGVycyA9IHNjYWxhci5maWx0ZXIod29yZGNlbGwgPT4gd29yZGNlbGwucSA9PT0gbnVtICYmIHdvcmRjZWxsLmxldHRlciA9PT0gXCJcIik7XG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5bGV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFswXSA9IGVtcHR5bGV0dGVyc1swXS5jb2w7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0gPSBlbXB0eWxldHRlcnNbMF0ucm93O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0gPSBjZWxsLmNvbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50Q2VsbFsxXSA9IGNlbGwucm93O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgIH1cblxuICAgIHNldEFyaWEoKSB7XG4gICAgICAgIGxldCB0aCA9IG51bSA9PiB7XG4gICAgICAgICAgICBpZiAobnVtID09PSAxKSByZXR1cm4gXCIxc3RcIjtcbiAgICAgICAgICAgIGlmIChudW0gPT09IDIpIHJldHVybiBcIjJuZFwiO1xuICAgICAgICAgICAgaWYgKG51bSA9PT0gMykgcmV0dXJuIFwiM3JkXCI7XG4gICAgICAgICAgICByZXR1cm4gYCR7bnVtfXRoYDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZnVsbHN0b3AgPSBzID0+IHtcbiAgICAgICAgICAgIGlmIChzLm1hdGNoKC9bLj9dJC8pKSByZXR1cm4gcztcbiAgICAgICAgICAgIHJldHVybiBgJHtzfS5gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzY2FsYXIgPSBudWxsO1xuICAgICAgICBsZXQgZGlyTGV0dGVyID0gbnVsbDtcbiAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSB0aGlzLnN0YXRlLnNjYWxhckFjcm9zcztcbiAgICAgICAgICAgIGRpckxldHRlciA9XCJBXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuYWNyb3NzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGFyID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duO1xuICAgICAgICAgICAgZGlyTGV0dGVyID0gXCJEXCI7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5vcHRzLmRhdGEuZG93bjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbGV0dGVyQ291bnQgPSAxO1xuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHNjYWxhcikge1xuICAgICAgICAgICAgaWYgKGNlbGwuc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgICAgICBsZXR0ZXJDb3VudCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcXVlc3Rpb24gPSBkYXRhLmZpbmQocSA9PiBxLm51bSA9PT0gYCR7ZGlyTGV0dGVyfSR7Y2VsbC5xfWApO1xuICAgICAgICAgICAgaWYgKCFxdWVzdGlvbikgY29udGludWU7XG4gICAgICAgICAgICBsZXQgd29yZExlbmd0aCA9IHF1ZXN0aW9uLnF1ZXN0aW9uLmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBzID0gYCR7cXVlc3Rpb24ubnVtfS4gJHtmdWxsc3RvcChxdWVzdGlvbi5xdWVzdGlvbil9ICR7d29yZExlbmd0aH0gbGV0dGVycywgJHt0aChsZXR0ZXJDb3VudCl9IGxldHRlci5gXG4gICAgICAgICAgICBsZXR0ZXJDb3VudCsrO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1jZWxsLSR7dGhpcy51aWR9LSR7Y2VsbC5jb2x9LSR7Y2VsbC5yb3d9ID4gLmp4d29yZC1jZWxsLXJlY3RgKSAuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjaGVhdGVkID0gdGhpcy5zdGF0ZS5jaGVhdGVkO1xuICAgICAgICB0aGlzLnNldFN0YXRlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IGNoZWF0ZWQ7IC8vIE5pY2UgdHJ5IVxuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLnJlc3RvcmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmhpZGVPdmVybGF5KCk7XG4gICAgICAgIHRoaXMuY2xvc2VNZW51KCk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpyZXNldFwiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgfVxuXG4gICAgY2hhbmdlRGlyZWN0aW9uKCkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY2FuIGNoYW5nZSBkaXJlY3Rpb24uXG4gICAgICAgIGNvbnN0IHdvcmQgPSB0aGlzLmdldFdvcmQoIXRoaXMuc3RhdGUuZGlyZWN0aW9uLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzBdLCB0aGlzLnN0YXRlLmN1cnJlbnRDZWxsWzFdKTtcbiAgICAgICAgaWYgKCF3b3JkKSByZXR1cm47XG4gICAgICAgIHRoaXMuc3RhdGUuZGlyZWN0aW9uID0gIXRoaXMuc3RhdGUuZGlyZWN0aW9uO1xuICAgICAgICB0aGlzLm1hcmtDZWxscygpO1xuICAgICAgICB0aGlzLnNldEFyaWEoKTtcblxuICAgIH1cblxuICAgIGdldFdvcmQoZGlyZWN0aW9uLCBjb2wsIHJvdykge1xuICAgICAgICBsZXQgY2VsbCA9IG51bGw7XG4gICAgICAgIGlmICghZGlyZWN0aW9uKSB7IC8vIEFjcm9zc1xuICAgICAgICAgICAgY2VsbCA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzLmZpbmQoY2VsbCA9PiAoY29sID09PSBjZWxsLmNvbCAmJiByb3cgPT09IGNlbGwucm93KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5zdGF0ZS5zY2FsYXJEb3duLmZpbmQoY2VsbCA9PiAoY29sID09PSBjZWxsLmNvbCAmJiByb3cgPT09IGNlbGwucm93KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNlbGw7XG4gICAgfVxuXG4gICAga2V5Q2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGVsID0gZS50YXJnZXQ7XG4gICAgICAgIGxldCBsZXR0ZXIgPSBlbC5kYXRhc2V0LmtleTtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKHsgbGV0dGVyIH0pO1xuICAgICAgICBpZiAobGV0dGVyID09PSBcIkJBQ0tTUEFDRVwiKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50eXBlTGV0dGVyKGxldHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1RpbGUoeCwgeSkge1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSBcIiNcIikgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jb3JyZWN0R3JpZFt4XVt5XSkgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5ncmlkW3hdW3ldID09PSB0aGlzLnN0YXRlLmdyYXBoW3hdW3ldKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdW3ldID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0xldHRlcih0aGlzLmdyaWRbeF1beV0sIHgsIHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tTcXVhcmUoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuY2hlY2tUaWxlKHRoaXMuc3RhdGUuY3VycmVudENlbGxbMF0sIHRoaXMuc3RhdGUuY3VycmVudENlbGxbMV0pO1xuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrV29yZChlKSB7IC8vVE9ET1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxldCBzY2FsYXIgPSBcIlwiO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyRG93bjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuc3RhdGUuc2NhbGFyQWNyb3NzO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydE9mQ3VycmVudFdvcmQgPSB0aGlzLmZpbmRTdGFydE9mQ3VycmVudFdvcmQoKTtcbiAgICAgICAgdGhpcy5jaGVja1RpbGUoc3RhcnRPZkN1cnJlbnRXb3JkLmNvbCwgc3RhcnRPZkN1cnJlbnRXb3JkLnJvdyk7XG4gICAgICAgIGxldCBpID0gc3RhcnRPZkN1cnJlbnRXb3JkLmluZGV4ICsgMTtcbiAgICAgICAgd2hpbGUoc2NhbGFyW2ldICYmICFzY2FsYXJbaV0uc3RhcnRPZldvcmQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjYWxhcltpXSk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVGlsZShzY2FsYXJbaV0uY29sLCBzY2FsYXJbaV0ucm93KTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNoZWNrUHV6emxlKGUpIHtcbiAgICAgICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZm9yKGxldCB4ID0gMDsgeCA8IHRoaXMuc3RhdGUuY29ycmVjdEdyaWQubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvcihsZXQgeSA9IDA7IHkgPCB0aGlzLnN0YXRlLmNvcnJlY3RHcmlkW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja1RpbGUoeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuY2hlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEF1dG9jaGVjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjanh3b3JkLWF1dG9jaGVjay0ke3RoaXMudWlkfSA+IGxpYCkuaW5uZXJIVE1MID0gXCJBdXRvY2hlY2sgJmNoZWNrO1wiO1xuICAgICAgICAgICAgdGhpcy5jaGVja1B1enpsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2p4d29yZC1hdXRvY2hlY2stJHt0aGlzLnVpZH0gPiBsaWApLmlubmVySFRNTCA9IFwiQXV0b2NoZWNrXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGVBdXRvY2hlY2soZSkgeyAvL1RPRE9cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnN0YXRlLmF1dG9jaGVjayA9ICF0aGlzLnN0YXRlLmF1dG9jaGVjaztcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b2NoZWNrKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrUHV6emxlKCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmNoZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwianh3b3JkOmNoZWF0XCIsIHsgZGV0YWlsOiB0aGlzLnN0YXRlIH0pKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEF1dG9jaGVjaygpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgIH1cblxuICAgIGNsb3NlTWVudSgpIHtcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanh3b3JkLW1lbnUtdG9nZ2xlIGlucHV0OmNoZWNrZWRcIik7XG4gICAgICAgIGlmIChpbnB1dEVsKSBpbnB1dEVsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVDb21wbGV0ZSgpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGhvdyBtdWNoIG9mIHRoZSBncmlkIGlzIGZpbGxlZCBpblxuICAgICAgICBsZXQgZmlsbGVkID0gMDtcbiAgICAgICAgbGV0IHRvdGFsX2NlbGxzID0gMDtcbiAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5vcHRzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLm9wdHMucm93czsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5ncmFwaFtjb2xdW3Jvd10gIT09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsX2NlbGxzKys7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmdyYXBoW2NvbF1bcm93XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbGVkKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsbGVkX3BlcmNlbnQgPSBNYXRoLmZsb29yKGZpbGxlZCAvIHRvdGFsX2NlbGxzICogMTAwKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5wcm9ncmVzcyA9IGZpbGxlZF9wZXJjZW50O1xuICAgICAgICB0aGlzLnN0YXRlLnF1YXJ0aWxlID0gTWF0aC5mbG9vcihmaWxsZWRfcGVyY2VudCAvIDI1KTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucXVhcnRpbGUgPiB0aGlzLmxhc3RfcXVhcnRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImp4d29yZDpwcm9ncmVzc1wiLCB7IGRldGFpbDogdGhpcy5zdGF0ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLmxhc3RfcXVhcnRpbGUgPSB0aGlzLnN0YXRlLnF1YXJ0aWxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNLZXlib2FyZFNob3dpbmcoKSB7XG4gICAgICAgIHJldHVybiAod2luZG93LmlubmVyV2lkdGggPD0gNDgwKTtcbiAgICB9XG5cbiAgICBzZXR1cElPU0tleWJvYXJkKCkge1xuICAgICAgICBpZiAodGhpcy5pc0tleWJvYXJkU2hvd2luZygpKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGlucHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuICAgICAgICBpbnB1dEVsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsICdoaWRkZW5JT1NJbnB1dCcpO1xuICAgICAgICBpbnB1dEVsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvY29ycmVjdCcsICdvZmYnKTtcbiAgICAgICAgaW5wdXRFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXV0b2NhcGl0YWxpemUnLCAnb2ZmJyk7XG4gICAgICAgIGlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3NwZWxsY2hlY2snLCAnZmFsc2UnKTtcbiAgICAgICAgY29uc3QgdG9wID0gd2luZG93LnNjcm9sbFk7XG4gICAgICAgIGlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAke3RvcH1weDsgbGVmdDogMDsgb3BhY2l0eTogMDsgd2lkdGg6IDA7IGhlaWdodDogMDsgei1pbmRleDogLTEwMDtgKTtcbiAgICAgICAgbGV0IGN1cnJlbnRUb3AgPSB0b3A7XG4gICAgICAgIGlucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKCkgPT4ge1xuICAgICAgICAgICAgY3VycmVudFRvcCA9IHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKCkgPT4ge1xuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIGN1cnJlbnRUb3ApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0RWxlbWVudCk7XG4gICAgfVxuXG4gICAgc2hvd0lPU0tleWJvYXJkKCkge1xuICAgICAgICBjb25zdCB0b3AgPSB3aW5kb3cuc2Nyb2xsWTtcbiAgICAgICAgY29uc3QgaW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZGRlbklPU0lucHV0Jyk7XG4gICAgICAgIGlmICghaW5wdXRFbGVtZW50KSByZXR1cm47XG4gICAgICAgIGlucHV0RWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnOyAvLyB1bmhpZGUgdGhlIGlucHV0XG4gICAgICAgIGlucHV0RWxlbWVudC5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgICAgICBpbnB1dEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBpbnB1dEVsZW1lbnQuZm9jdXMoKTsgLy8gZm9jdXMgb24gaXQgc28ga2V5Ym9hcmQgcG9wc1xuICAgICAgICBpbnB1dEVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nOyAvLyBoaWRlIGl0IGFnYWluXG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCB0b3ApO1xuICAgIH1cblxuICAgIGNvcHlUb0NsaXBib2FyZChlKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC50ZXh0O1xuICAgICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChkZWNvZGVVUklDb21wb25lbnQodGV4dCkpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ29waWVkIHRvIGNsaXBib2FyZFwiKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEpYV29yZDsiLCIvKipcbiAqIG5hbWU6IGZpcmV3b3Jrcy1qc1xuICogdmVyc2lvbjogMi4xMC43XG4gKiBhdXRob3I6IFZpdGFsaWogUnluZGluIChodHRwczovL2NyYXNobWF4LnJ1KVxuICogaG9tZXBhZ2U6IGh0dHBzOi8vZmlyZXdvcmtzLmpzLm9yZ1xuICogbGljZW5zZSBNSVRcbiAqL1xuZnVuY3Rpb24gZihlKSB7XG4gIHJldHVybiBNYXRoLmFicyhNYXRoLmZsb29yKGUpKTtcbn1cbmZ1bmN0aW9uIGMoZSwgdCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKSAqICh0IC0gZSkgKyBlO1xufVxuZnVuY3Rpb24gbyhlLCB0KSB7XG4gIHJldHVybiBNYXRoLmZsb29yKGMoZSwgdCArIDEpKTtcbn1cbmZ1bmN0aW9uIG0oZSwgdCwgaSwgcykge1xuICBjb25zdCBuID0gTWF0aC5wb3c7XG4gIHJldHVybiBNYXRoLnNxcnQobihlIC0gaSwgMikgKyBuKHQgLSBzLCAyKSk7XG59XG5mdW5jdGlvbiB4KGUsIHQsIGkgPSAxKSB7XG4gIGlmIChlID4gMzYwIHx8IGUgPCAwKVxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgaHVlIDAtMzYwIHJhbmdlLCBnb3QgXFxgJHtlfVxcYGApO1xuICBpZiAodCA+IDEwMCB8fCB0IDwgMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGxpZ2h0bmVzcyAwLTEwMCByYW5nZSwgZ290IFxcYCR7dH1cXGBgKTtcbiAgaWYgKGkgPiAxIHx8IGkgPCAwKVxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYWxwaGEgMC0xIHJhbmdlLCBnb3QgXFxgJHtpfVxcYGApO1xuICByZXR1cm4gYGhzbGEoJHtlfSwgMTAwJSwgJHt0fSUsICR7aX0pYDtcbn1cbmNvbnN0IGcgPSAoZSkgPT4ge1xuICBpZiAodHlwZW9mIGUgPT0gXCJvYmplY3RcIiAmJiBlICE9PSBudWxsKSB7XG4gICAgaWYgKHR5cGVvZiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCB0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGUpO1xuICAgICAgcmV0dXJuIHQgPT09IE9iamVjdC5wcm90b3R5cGUgfHwgdCA9PT0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChlKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIjtcbiAgfVxuICByZXR1cm4gITE7XG59LCB5ID0gW1xuICBcIl9fcHJvdG9fX1wiLFxuICBcImNvbnN0cnVjdG9yXCIsXG4gIFwicHJvdG90eXBlXCJcbl0sIHYgPSAoLi4uZSkgPT4gZS5yZWR1Y2UoKHQsIGkpID0+IChPYmplY3Qua2V5cyhpKS5mb3JFYWNoKChzKSA9PiB7XG4gIHkuaW5jbHVkZXMocykgfHwgKEFycmF5LmlzQXJyYXkodFtzXSkgJiYgQXJyYXkuaXNBcnJheShpW3NdKSA/IHRbc10gPSBpW3NdIDogZyh0W3NdKSAmJiBnKGlbc10pID8gdFtzXSA9IHYodFtzXSwgaVtzXSkgOiB0W3NdID0gaVtzXSk7XG59KSwgdCksIHt9KTtcbmZ1bmN0aW9uIGIoZSwgdCkge1xuICBsZXQgaTtcbiAgcmV0dXJuICguLi5zKSA9PiB7XG4gICAgaSAmJiBjbGVhclRpbWVvdXQoaSksIGkgPSBzZXRUaW1lb3V0KCgpID0+IGUoLi4ucyksIHQpO1xuICB9O1xufVxuY2xhc3MgUyB7XG4gIHg7XG4gIHk7XG4gIGN0eDtcbiAgaHVlO1xuICBmcmljdGlvbjtcbiAgZ3Jhdml0eTtcbiAgZmxpY2tlcmluZztcbiAgbGluZVdpZHRoO1xuICBleHBsb3Npb25MZW5ndGg7XG4gIGFuZ2xlO1xuICBzcGVlZDtcbiAgYnJpZ2h0bmVzcztcbiAgY29vcmRpbmF0ZXMgPSBbXTtcbiAgZGVjYXk7XG4gIGFscGhhID0gMTtcbiAgY29uc3RydWN0b3Ioe1xuICAgIHg6IHQsXG4gICAgeTogaSxcbiAgICBjdHg6IHMsXG4gICAgaHVlOiBuLFxuICAgIGRlY2F5OiBoLFxuICAgIGdyYXZpdHk6IGEsXG4gICAgZnJpY3Rpb246IHIsXG4gICAgYnJpZ2h0bmVzczogdSxcbiAgICBmbGlja2VyaW5nOiBwLFxuICAgIGxpbmVXaWR0aDogbCxcbiAgICBleHBsb3Npb25MZW5ndGg6IGRcbiAgfSkge1xuICAgIGZvciAodGhpcy54ID0gdCwgdGhpcy55ID0gaSwgdGhpcy5jdHggPSBzLCB0aGlzLmh1ZSA9IG4sIHRoaXMuZ3Jhdml0eSA9IGEsIHRoaXMuZnJpY3Rpb24gPSByLCB0aGlzLmZsaWNrZXJpbmcgPSBwLCB0aGlzLmxpbmVXaWR0aCA9IGwsIHRoaXMuZXhwbG9zaW9uTGVuZ3RoID0gZCwgdGhpcy5hbmdsZSA9IGMoMCwgTWF0aC5QSSAqIDIpLCB0aGlzLnNwZWVkID0gbygxLCAxMCksIHRoaXMuYnJpZ2h0bmVzcyA9IG8odS5taW4sIHUubWF4KSwgdGhpcy5kZWNheSA9IGMoaC5taW4sIGgubWF4KTsgdGhpcy5leHBsb3Npb25MZW5ndGgtLTsgKVxuICAgICAgdGhpcy5jb29yZGluYXRlcy5wdXNoKFt0LCBpXSk7XG4gIH1cbiAgdXBkYXRlKHQpIHtcbiAgICB0aGlzLmNvb3JkaW5hdGVzLnBvcCgpLCB0aGlzLmNvb3JkaW5hdGVzLnVuc2hpZnQoW3RoaXMueCwgdGhpcy55XSksIHRoaXMuc3BlZWQgKj0gdGhpcy5mcmljdGlvbiwgdGhpcy54ICs9IE1hdGguY29zKHRoaXMuYW5nbGUpICogdGhpcy5zcGVlZCwgdGhpcy55ICs9IE1hdGguc2luKHRoaXMuYW5nbGUpICogdGhpcy5zcGVlZCArIHRoaXMuZ3Jhdml0eSwgdGhpcy5hbHBoYSAtPSB0aGlzLmRlY2F5LCB0aGlzLmFscGhhIDw9IHRoaXMuZGVjYXkgJiYgdCgpO1xuICB9XG4gIGRyYXcoKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuY29vcmRpbmF0ZXMubGVuZ3RoIC0gMTtcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKSwgdGhpcy5jdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGgsIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHgodGhpcy5odWUsIHRoaXMuYnJpZ2h0bmVzcywgdGhpcy5hbHBoYSksIHRoaXMuY3R4Lm1vdmVUbyhcbiAgICAgIHRoaXMuY29vcmRpbmF0ZXNbdF1bMF0sXG4gICAgICB0aGlzLmNvb3JkaW5hdGVzW3RdWzFdXG4gICAgKSwgdGhpcy5jdHgubGluZVRvKHRoaXMueCwgdGhpcy55KSwgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB4KFxuICAgICAgdGhpcy5odWUsXG4gICAgICB0aGlzLmZsaWNrZXJpbmcgPyBjKDAsIHRoaXMuYnJpZ2h0bmVzcykgOiB0aGlzLmJyaWdodG5lc3MsXG4gICAgICB0aGlzLmFscGhhXG4gICAgKSwgdGhpcy5jdHguc3Ryb2tlKCk7XG4gIH1cbn1cbmNsYXNzIEUge1xuICBjb25zdHJ1Y3Rvcih0LCBpKSB7XG4gICAgdGhpcy5vcHRpb25zID0gdCwgdGhpcy5jYW52YXMgPSBpLCB0aGlzLnBvaW50ZXJEb3duID0gdGhpcy5wb2ludGVyRG93bi5iaW5kKHRoaXMpLCB0aGlzLnBvaW50ZXJVcCA9IHRoaXMucG9pbnRlclVwLmJpbmQodGhpcyksIHRoaXMucG9pbnRlck1vdmUgPSB0aGlzLnBvaW50ZXJNb3ZlLmJpbmQodGhpcyk7XG4gIH1cbiAgYWN0aXZlID0gITE7XG4gIHg7XG4gIHk7XG4gIGdldCBtb3VzZU9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tb3VzZTtcbiAgfVxuICBtb3VudCgpIHtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5wb2ludGVyRG93biksIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5wb2ludGVyVXApLCB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgdGhpcy5wb2ludGVyTW92ZSk7XG4gIH1cbiAgdW5tb3VudCgpIHtcbiAgICB0aGlzLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5wb2ludGVyRG93biksIHRoaXMuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5wb2ludGVyVXApLCB0aGlzLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgdGhpcy5wb2ludGVyTW92ZSk7XG4gIH1cbiAgdXNlUG9pbnRlcih0LCBpKSB7XG4gICAgY29uc3QgeyBjbGljazogcywgbW92ZTogbiB9ID0gdGhpcy5tb3VzZU9wdGlvbnM7XG4gICAgKHMgfHwgbikgJiYgKHRoaXMueCA9IHQucGFnZVggLSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0LCB0aGlzLnkgPSB0LnBhZ2VZIC0gdGhpcy5jYW52YXMub2Zmc2V0VG9wLCB0aGlzLmFjdGl2ZSA9IGkpO1xuICB9XG4gIHBvaW50ZXJEb3duKHQpIHtcbiAgICB0aGlzLnVzZVBvaW50ZXIodCwgdGhpcy5tb3VzZU9wdGlvbnMuY2xpY2spO1xuICB9XG4gIHBvaW50ZXJVcCh0KSB7XG4gICAgdGhpcy51c2VQb2ludGVyKHQsICExKTtcbiAgfVxuICBwb2ludGVyTW92ZSh0KSB7XG4gICAgdGhpcy51c2VQb2ludGVyKHQsIHRoaXMuYWN0aXZlKTtcbiAgfVxufVxuY2xhc3MgTyB7XG4gIGh1ZTtcbiAgcm9ja2V0c1BvaW50O1xuICBvcGFjaXR5O1xuICBhY2NlbGVyYXRpb247XG4gIGZyaWN0aW9uO1xuICBncmF2aXR5O1xuICBwYXJ0aWNsZXM7XG4gIGV4cGxvc2lvbjtcbiAgbW91c2U7XG4gIGJvdW5kYXJpZXM7XG4gIHNvdW5kO1xuICBkZWxheTtcbiAgYnJpZ2h0bmVzcztcbiAgZGVjYXk7XG4gIGZsaWNrZXJpbmc7XG4gIGludGVuc2l0eTtcbiAgdHJhY2VMZW5ndGg7XG4gIHRyYWNlU3BlZWQ7XG4gIGxpbmVXaWR0aDtcbiAgbGluZVN0eWxlO1xuICBhdXRvcmVzaXplO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmF1dG9yZXNpemUgPSAhMCwgdGhpcy5saW5lU3R5bGUgPSBcInJvdW5kXCIsIHRoaXMuZmxpY2tlcmluZyA9IDUwLCB0aGlzLnRyYWNlTGVuZ3RoID0gMywgdGhpcy50cmFjZVNwZWVkID0gMTAsIHRoaXMuaW50ZW5zaXR5ID0gMzAsIHRoaXMuZXhwbG9zaW9uID0gNSwgdGhpcy5ncmF2aXR5ID0gMS41LCB0aGlzLm9wYWNpdHkgPSAwLjUsIHRoaXMucGFydGljbGVzID0gNTAsIHRoaXMuZnJpY3Rpb24gPSAwLjk1LCB0aGlzLmFjY2VsZXJhdGlvbiA9IDEuMDUsIHRoaXMuaHVlID0ge1xuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiAzNjBcbiAgICB9LCB0aGlzLnJvY2tldHNQb2ludCA9IHtcbiAgICAgIG1pbjogNTAsXG4gICAgICBtYXg6IDUwXG4gICAgfSwgdGhpcy5saW5lV2lkdGggPSB7XG4gICAgICBleHBsb3Npb246IHtcbiAgICAgICAgbWluOiAxLFxuICAgICAgICBtYXg6IDNcbiAgICAgIH0sXG4gICAgICB0cmFjZToge1xuICAgICAgICBtaW46IDEsXG4gICAgICAgIG1heDogMlxuICAgICAgfVxuICAgIH0sIHRoaXMubW91c2UgPSB7XG4gICAgICBjbGljazogITEsXG4gICAgICBtb3ZlOiAhMSxcbiAgICAgIG1heDogMVxuICAgIH0sIHRoaXMuZGVsYXkgPSB7XG4gICAgICBtaW46IDMwLFxuICAgICAgbWF4OiA2MFxuICAgIH0sIHRoaXMuYnJpZ2h0bmVzcyA9IHtcbiAgICAgIG1pbjogNTAsXG4gICAgICBtYXg6IDgwXG4gICAgfSwgdGhpcy5kZWNheSA9IHtcbiAgICAgIG1pbjogMC4wMTUsXG4gICAgICBtYXg6IDAuMDNcbiAgICB9LCB0aGlzLnNvdW5kID0ge1xuICAgICAgZW5hYmxlZDogITEsXG4gICAgICBmaWxlczogW1xuICAgICAgICBcImV4cGxvc2lvbjAubXAzXCIsXG4gICAgICAgIFwiZXhwbG9zaW9uMS5tcDNcIixcbiAgICAgICAgXCJleHBsb3Npb24yLm1wM1wiXG4gICAgICBdLFxuICAgICAgdm9sdW1lOiB7XG4gICAgICAgIG1pbjogNCxcbiAgICAgICAgbWF4OiA4XG4gICAgICB9XG4gICAgfSwgdGhpcy5ib3VuZGFyaWVzID0ge1xuICAgICAgZGVidWc6ICExLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgICAgd2lkdGg6IDAsXG4gICAgICB4OiA1MCxcbiAgICAgIHk6IDUwXG4gICAgfTtcbiAgfVxuICB1cGRhdGUodCkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgdih0aGlzLCB0KSk7XG4gIH1cbn1cbmNsYXNzIHoge1xuICBjb25zdHJ1Y3Rvcih0LCBpKSB7XG4gICAgdGhpcy5vcHRpb25zID0gdCwgdGhpcy5yZW5kZXIgPSBpO1xuICB9XG4gIHRpY2sgPSAwO1xuICByYWZJZCA9IDA7XG4gIGZwcyA9IDYwO1xuICB0b2xlcmFuY2UgPSAwLjE7XG4gIG5vdztcbiAgbW91bnQoKSB7XG4gICAgdGhpcy5ub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBjb25zdCB0ID0gMWUzIC8gdGhpcy5mcHMsIGkgPSAocykgPT4ge1xuICAgICAgdGhpcy5yYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShpKTtcbiAgICAgIGNvbnN0IG4gPSBzIC0gdGhpcy5ub3c7XG4gICAgICBuID49IHQgLSB0aGlzLnRvbGVyYW5jZSAmJiAodGhpcy5yZW5kZXIoKSwgdGhpcy5ub3cgPSBzIC0gbiAlIHQsIHRoaXMudGljayArPSBuICogKHRoaXMub3B0aW9ucy5pbnRlbnNpdHkgKiBNYXRoLlBJKSAvIDFlMyk7XG4gICAgfTtcbiAgICB0aGlzLnJhZklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGkpO1xuICB9XG4gIHVubW91bnQoKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG4gIH1cbn1cbmNsYXNzIEwge1xuICBjb25zdHJ1Y3Rvcih0LCBpLCBzKSB7XG4gICAgdGhpcy5vcHRpb25zID0gdCwgdGhpcy51cGRhdGVTaXplID0gaSwgdGhpcy5jb250YWluZXIgPSBzO1xuICB9XG4gIHJlc2l6ZXI7XG4gIG1vdW50KCkge1xuICAgIGlmICghdGhpcy5yZXNpemVyKSB7XG4gICAgICBjb25zdCB0ID0gYigoKSA9PiB0aGlzLnVwZGF0ZVNpemUoKSwgMTAwKTtcbiAgICAgIHRoaXMucmVzaXplciA9IG5ldyBSZXNpemVPYnNlcnZlcih0KTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zLmF1dG9yZXNpemUgJiYgdGhpcy5yZXNpemVyLm9ic2VydmUodGhpcy5jb250YWluZXIpO1xuICB9XG4gIHVubW91bnQoKSB7XG4gICAgdGhpcy5yZXNpemVyICYmIHRoaXMucmVzaXplci51bm9ic2VydmUodGhpcy5jb250YWluZXIpO1xuICB9XG59XG5jbGFzcyBNIHtcbiAgY29uc3RydWN0b3IodCkge1xuICAgIHRoaXMub3B0aW9ucyA9IHQsIHRoaXMuaW5pdCgpO1xuICB9XG4gIGJ1ZmZlcnMgPSBbXTtcbiAgYXVkaW9Db250ZXh0O1xuICBvbkluaXQgPSAhMTtcbiAgZ2V0IGlzRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNvdW5kLmVuYWJsZWQ7XG4gIH1cbiAgZ2V0IHNvdW5kT3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNvdW5kO1xuICB9XG4gIGluaXQoKSB7XG4gICAgIXRoaXMub25Jbml0ICYmIHRoaXMuaXNFbmFibGVkICYmICh0aGlzLm9uSW5pdCA9ICEwLCB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyAod2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0KSgpLCB0aGlzLmxvYWRTb3VuZHMoKSk7XG4gIH1cbiAgYXN5bmMgbG9hZFNvdW5kcygpIHtcbiAgICBmb3IgKGNvbnN0IHQgb2YgdGhpcy5zb3VuZE9wdGlvbnMuZmlsZXMpIHtcbiAgICAgIGNvbnN0IGkgPSBhd2FpdCAoYXdhaXQgZmV0Y2godCkpLmFycmF5QnVmZmVyKCk7XG4gICAgICB0aGlzLmF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoaSkudGhlbigocykgPT4ge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMucHVzaChzKTtcbiAgICAgIH0pLmNhdGNoKChzKSA9PiB7XG4gICAgICAgIHRocm93IHM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcGxheSgpIHtcbiAgICBpZiAodGhpcy5pc0VuYWJsZWQgJiYgdGhpcy5idWZmZXJzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpLCBpID0gdGhpcy5idWZmZXJzW28oMCwgdGhpcy5idWZmZXJzLmxlbmd0aCAtIDEpXSwgcyA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgIHQuYnVmZmVyID0gaSwgcy5nYWluLnZhbHVlID0gYyhcbiAgICAgICAgdGhpcy5zb3VuZE9wdGlvbnMudm9sdW1lLm1pbiAvIDEwMCxcbiAgICAgICAgdGhpcy5zb3VuZE9wdGlvbnMudm9sdW1lLm1heCAvIDEwMFxuICAgICAgKSwgcy5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKSwgdC5jb25uZWN0KHMpLCB0LnN0YXJ0KDApO1xuICAgIH0gZWxzZVxuICAgICAgdGhpcy5pbml0KCk7XG4gIH1cbn1cbmNsYXNzIEMge1xuICB4O1xuICB5O1xuICBzeDtcbiAgc3k7XG4gIGR4O1xuICBkeTtcbiAgY3R4O1xuICBodWU7XG4gIHNwZWVkO1xuICBhY2NlbGVyYXRpb247XG4gIHRyYWNlTGVuZ3RoO1xuICB0b3RhbERpc3RhbmNlO1xuICBhbmdsZTtcbiAgYnJpZ2h0bmVzcztcbiAgY29vcmRpbmF0ZXMgPSBbXTtcbiAgY3VycmVudERpc3RhbmNlID0gMDtcbiAgY29uc3RydWN0b3Ioe1xuICAgIHg6IHQsXG4gICAgeTogaSxcbiAgICBkeDogcyxcbiAgICBkeTogbixcbiAgICBjdHg6IGgsXG4gICAgaHVlOiBhLFxuICAgIHNwZWVkOiByLFxuICAgIHRyYWNlTGVuZ3RoOiB1LFxuICAgIGFjY2VsZXJhdGlvbjogcFxuICB9KSB7XG4gICAgZm9yICh0aGlzLnggPSB0LCB0aGlzLnkgPSBpLCB0aGlzLnN4ID0gdCwgdGhpcy5zeSA9IGksIHRoaXMuZHggPSBzLCB0aGlzLmR5ID0gbiwgdGhpcy5jdHggPSBoLCB0aGlzLmh1ZSA9IGEsIHRoaXMuc3BlZWQgPSByLCB0aGlzLnRyYWNlTGVuZ3RoID0gdSwgdGhpcy5hY2NlbGVyYXRpb24gPSBwLCB0aGlzLnRvdGFsRGlzdGFuY2UgPSBtKHQsIGksIHMsIG4pLCB0aGlzLmFuZ2xlID0gTWF0aC5hdGFuMihuIC0gaSwgcyAtIHQpLCB0aGlzLmJyaWdodG5lc3MgPSBvKDUwLCA3MCk7IHRoaXMudHJhY2VMZW5ndGgtLTsgKVxuICAgICAgdGhpcy5jb29yZGluYXRlcy5wdXNoKFt0LCBpXSk7XG4gIH1cbiAgdXBkYXRlKHQpIHtcbiAgICB0aGlzLmNvb3JkaW5hdGVzLnBvcCgpLCB0aGlzLmNvb3JkaW5hdGVzLnVuc2hpZnQoW3RoaXMueCwgdGhpcy55XSksIHRoaXMuc3BlZWQgKj0gdGhpcy5hY2NlbGVyYXRpb247XG4gICAgY29uc3QgaSA9IE1hdGguY29zKHRoaXMuYW5nbGUpICogdGhpcy5zcGVlZCwgcyA9IE1hdGguc2luKHRoaXMuYW5nbGUpICogdGhpcy5zcGVlZDtcbiAgICB0aGlzLmN1cnJlbnREaXN0YW5jZSA9IG0oXG4gICAgICB0aGlzLnN4LFxuICAgICAgdGhpcy5zeSxcbiAgICAgIHRoaXMueCArIGksXG4gICAgICB0aGlzLnkgKyBzXG4gICAgKSwgdGhpcy5jdXJyZW50RGlzdGFuY2UgPj0gdGhpcy50b3RhbERpc3RhbmNlID8gdCh0aGlzLmR4LCB0aGlzLmR5LCB0aGlzLmh1ZSkgOiAodGhpcy54ICs9IGksIHRoaXMueSArPSBzKTtcbiAgfVxuICBkcmF3KCkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmNvb3JkaW5hdGVzLmxlbmd0aCAtIDE7XG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCksIHRoaXMuY3R4Lm1vdmVUbyhcbiAgICAgIHRoaXMuY29vcmRpbmF0ZXNbdF1bMF0sXG4gICAgICB0aGlzLmNvb3JkaW5hdGVzW3RdWzFdXG4gICAgKSwgdGhpcy5jdHgubGluZVRvKHRoaXMueCwgdGhpcy55KSwgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB4KHRoaXMuaHVlLCB0aGlzLmJyaWdodG5lc3MpLCB0aGlzLmN0eC5zdHJva2UoKTtcbiAgfVxufVxuY2xhc3MgVCB7XG4gIHRhcmdldDtcbiAgY29udGFpbmVyO1xuICBjYW52YXM7XG4gIGN0eDtcbiAgd2lkdGg7XG4gIGhlaWdodDtcbiAgdHJhY2VzID0gW107XG4gIGV4cGxvc2lvbnMgPSBbXTtcbiAgd2FpdFN0b3BSYWY7XG4gIHJ1bm5pbmcgPSAhMTtcbiAgb3B0cztcbiAgc291bmQ7XG4gIHJlc2l6ZTtcbiAgbW91c2U7XG4gIHJhZjtcbiAgY29uc3RydWN0b3IodCwgaSA9IHt9KSB7XG4gICAgdGhpcy50YXJnZXQgPSB0LCB0aGlzLmNvbnRhaW5lciA9IHQsIHRoaXMub3B0cyA9IG5ldyBPKCksIHRoaXMuY3JlYXRlQ2FudmFzKHRoaXMudGFyZ2V0KSwgdGhpcy51cGRhdGVPcHRpb25zKGkpLCB0aGlzLnNvdW5kID0gbmV3IE0odGhpcy5vcHRzKSwgdGhpcy5yZXNpemUgPSBuZXcgTChcbiAgICAgIHRoaXMub3B0cyxcbiAgICAgIHRoaXMudXBkYXRlU2l6ZS5iaW5kKHRoaXMpLFxuICAgICAgdGhpcy5jb250YWluZXJcbiAgICApLCB0aGlzLm1vdXNlID0gbmV3IEUodGhpcy5vcHRzLCB0aGlzLmNhbnZhcyksIHRoaXMucmFmID0gbmV3IHoodGhpcy5vcHRzLCB0aGlzLnJlbmRlci5iaW5kKHRoaXMpKTtcbiAgfVxuICBnZXQgaXNSdW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bm5pbmc7XG4gIH1cbiAgZ2V0IHZlcnNpb24oKSB7XG4gICAgcmV0dXJuIFwiMi4xMC43XCI7XG4gIH1cbiAgZ2V0IGN1cnJlbnRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLm9wdHM7XG4gIH1cbiAgc3RhcnQoKSB7XG4gICAgdGhpcy5ydW5uaW5nIHx8ICh0aGlzLmNhbnZhcy5pc0Nvbm5lY3RlZCB8fCB0aGlzLmNyZWF0ZUNhbnZhcyh0aGlzLnRhcmdldCksIHRoaXMucnVubmluZyA9ICEwLCB0aGlzLnJlc2l6ZS5tb3VudCgpLCB0aGlzLm1vdXNlLm1vdW50KCksIHRoaXMucmFmLm1vdW50KCkpO1xuICB9XG4gIHN0b3AodCA9ICExKSB7XG4gICAgIXRoaXMucnVubmluZyB8fCAodGhpcy5ydW5uaW5nID0gITEsIHRoaXMucmVzaXplLnVubW91bnQoKSwgdGhpcy5tb3VzZS51bm1vdW50KCksIHRoaXMucmFmLnVubW91bnQoKSwgdGhpcy5jbGVhcigpLCB0ICYmIHRoaXMuY2FudmFzLnJlbW92ZSgpKTtcbiAgfVxuICBhc3luYyB3YWl0U3RvcCh0KSB7XG4gICAgaWYgKCEhdGhpcy5ydW5uaW5nKVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChpKSA9PiB7XG4gICAgICAgIHRoaXMud2FpdFN0b3BSYWYgPSAoKSA9PiB7XG4gICAgICAgICAgIXRoaXMud2FpdFN0b3BSYWYgfHwgKHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLndhaXRTdG9wUmFmKSwgIXRoaXMudHJhY2VzLmxlbmd0aCAmJiAhdGhpcy5leHBsb3Npb25zLmxlbmd0aCAmJiAodGhpcy53YWl0U3RvcFJhZiA9IG51bGwsIHRoaXMuc3RvcCh0KSwgaSgpKSk7XG4gICAgICAgIH0sIHRoaXMud2FpdFN0b3BSYWYoKTtcbiAgICAgIH0pO1xuICB9XG4gIHBhdXNlKCkge1xuICAgIHRoaXMucnVubmluZyA9ICF0aGlzLnJ1bm5pbmcsIHRoaXMucnVubmluZyA/IHRoaXMucmFmLm1vdW50KCkgOiB0aGlzLnJhZi51bm1vdW50KCk7XG4gIH1cbiAgY2xlYXIoKSB7XG4gICAgIXRoaXMuY3R4IHx8ICh0aGlzLnRyYWNlcyA9IFtdLCB0aGlzLmV4cGxvc2lvbnMgPSBbXSwgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KSk7XG4gIH1cbiAgbGF1bmNoKHQgPSAxKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0OyBpKyspXG4gICAgICB0aGlzLmNyZWF0ZVRyYWNlKCk7XG4gICAgdGhpcy53YWl0U3RvcFJhZiB8fCAodGhpcy5zdGFydCgpLCB0aGlzLndhaXRTdG9wKCkpO1xuICB9XG4gIHVwZGF0ZU9wdGlvbnModCkge1xuICAgIHRoaXMub3B0cy51cGRhdGUodCk7XG4gIH1cbiAgdXBkYXRlU2l6ZSh7XG4gICAgd2lkdGg6IHQgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCxcbiAgICBoZWlnaHQ6IGkgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHRcbiAgfSA9IHt9KSB7XG4gICAgdGhpcy53aWR0aCA9IHQsIHRoaXMuaGVpZ2h0ID0gaSwgdGhpcy5jYW52YXMud2lkdGggPSB0LCB0aGlzLmNhbnZhcy5oZWlnaHQgPSBpLCB0aGlzLnVwZGF0ZUJvdW5kYXJpZXMoe1xuICAgICAgLi4udGhpcy5vcHRzLmJvdW5kYXJpZXMsXG4gICAgICB3aWR0aDogdCxcbiAgICAgIGhlaWdodDogaVxuICAgIH0pO1xuICB9XG4gIHVwZGF0ZUJvdW5kYXJpZXModCkge1xuICAgIHRoaXMudXBkYXRlT3B0aW9ucyh7IGJvdW5kYXJpZXM6IHQgfSk7XG4gIH1cbiAgY3JlYXRlQ2FudmFzKHQpIHtcbiAgICB0IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQgPyAodC5pc0Nvbm5lY3RlZCB8fCBkb2N1bWVudC5ib2R5LmFwcGVuZCh0KSwgdGhpcy5jYW52YXMgPSB0KSA6ICh0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHRoaXMuY29udGFpbmVyLmFwcGVuZCh0aGlzLmNhbnZhcykpLCB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoXCIyZFwiKSwgdGhpcy51cGRhdGVTaXplKCk7XG4gIH1cbiAgcmVuZGVyKCkge1xuICAgIGlmICghdGhpcy5jdHggfHwgIXRoaXMucnVubmluZylcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCB7IG9wYWNpdHk6IHQsIGxpbmVTdHlsZTogaSwgbGluZVdpZHRoOiBzIH0gPSB0aGlzLm9wdHM7XG4gICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIiwgdGhpcy5jdHguZmlsbFN0eWxlID0gYHJnYmEoMCwgMCwgMCwgJHt0fSlgLCB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCksIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwibGlnaHRlclwiLCB0aGlzLmN0eC5saW5lQ2FwID0gaSwgdGhpcy5jdHgubGluZUpvaW4gPSBcInJvdW5kXCIsIHRoaXMuY3R4LmxpbmVXaWR0aCA9IGMocy50cmFjZS5taW4sIHMudHJhY2UubWF4KSwgdGhpcy5pbml0VHJhY2UoKSwgdGhpcy5kcmF3VHJhY2UoKSwgdGhpcy5kcmF3RXhwbG9zaW9uKCk7XG4gIH1cbiAgY3JlYXRlVHJhY2UoKSB7XG4gICAgY29uc3Qge1xuICAgICAgaHVlOiB0LFxuICAgICAgcm9ja2V0c1BvaW50OiBpLFxuICAgICAgYm91bmRhcmllczogcyxcbiAgICAgIHRyYWNlTGVuZ3RoOiBuLFxuICAgICAgdHJhY2VTcGVlZDogaCxcbiAgICAgIGFjY2VsZXJhdGlvbjogYSxcbiAgICAgIG1vdXNlOiByXG4gICAgfSA9IHRoaXMub3B0cztcbiAgICB0aGlzLnRyYWNlcy5wdXNoKFxuICAgICAgbmV3IEMoe1xuICAgICAgICB4OiB0aGlzLndpZHRoICogbyhpLm1pbiwgaS5tYXgpIC8gMTAwLFxuICAgICAgICB5OiB0aGlzLmhlaWdodCxcbiAgICAgICAgZHg6IHRoaXMubW91c2UueCAmJiByLm1vdmUgfHwgdGhpcy5tb3VzZS5hY3RpdmUgPyB0aGlzLm1vdXNlLnggOiBvKHMueCwgcy53aWR0aCAtIHMueCAqIDIpLFxuICAgICAgICBkeTogdGhpcy5tb3VzZS55ICYmIHIubW92ZSB8fCB0aGlzLm1vdXNlLmFjdGl2ZSA/IHRoaXMubW91c2UueSA6IG8ocy55LCBzLmhlaWdodCAqIDAuNSksXG4gICAgICAgIGN0eDogdGhpcy5jdHgsXG4gICAgICAgIGh1ZTogbyh0Lm1pbiwgdC5tYXgpLFxuICAgICAgICBzcGVlZDogaCxcbiAgICAgICAgYWNjZWxlcmF0aW9uOiBhLFxuICAgICAgICB0cmFjZUxlbmd0aDogZihuKVxuICAgICAgfSlcbiAgICApO1xuICB9XG4gIGluaXRUcmFjZSgpIHtcbiAgICBpZiAodGhpcy53YWl0U3RvcFJhZilcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCB7IGRlbGF5OiB0LCBtb3VzZTogaSB9ID0gdGhpcy5vcHRzO1xuICAgICh0aGlzLnJhZi50aWNrID4gbyh0Lm1pbiwgdC5tYXgpIHx8IHRoaXMubW91c2UuYWN0aXZlICYmIGkubWF4ID4gdGhpcy50cmFjZXMubGVuZ3RoKSAmJiAodGhpcy5jcmVhdGVUcmFjZSgpLCB0aGlzLnJhZi50aWNrID0gMCk7XG4gIH1cbiAgZHJhd1RyYWNlKCkge1xuICAgIGxldCB0ID0gdGhpcy50cmFjZXMubGVuZ3RoO1xuICAgIGZvciAoOyB0LS07IClcbiAgICAgIHRoaXMudHJhY2VzW3RdLmRyYXcoKSwgdGhpcy50cmFjZXNbdF0udXBkYXRlKChpLCBzLCBuKSA9PiB7XG4gICAgICAgIHRoaXMuaW5pdEV4cGxvc2lvbihpLCBzLCBuKSwgdGhpcy5zb3VuZC5wbGF5KCksIHRoaXMudHJhY2VzLnNwbGljZSh0LCAxKTtcbiAgICAgIH0pO1xuICB9XG4gIGluaXRFeHBsb3Npb24odCwgaSwgcykge1xuICAgIGNvbnN0IHtcbiAgICAgIHBhcnRpY2xlczogbixcbiAgICAgIGZsaWNrZXJpbmc6IGgsXG4gICAgICBsaW5lV2lkdGg6IGEsXG4gICAgICBleHBsb3Npb246IHIsXG4gICAgICBicmlnaHRuZXNzOiB1LFxuICAgICAgZnJpY3Rpb246IHAsXG4gICAgICBncmF2aXR5OiBsLFxuICAgICAgZGVjYXk6IGRcbiAgICB9ID0gdGhpcy5vcHRzO1xuICAgIGxldCB3ID0gZihuKTtcbiAgICBmb3IgKDsgdy0tOyApXG4gICAgICB0aGlzLmV4cGxvc2lvbnMucHVzaChcbiAgICAgICAgbmV3IFMoe1xuICAgICAgICAgIHg6IHQsXG4gICAgICAgICAgeTogaSxcbiAgICAgICAgICBjdHg6IHRoaXMuY3R4LFxuICAgICAgICAgIGh1ZTogcyxcbiAgICAgICAgICBmcmljdGlvbjogcCxcbiAgICAgICAgICBncmF2aXR5OiBsLFxuICAgICAgICAgIGZsaWNrZXJpbmc6IG8oMCwgMTAwKSA8PSBoLFxuICAgICAgICAgIGxpbmVXaWR0aDogYyhcbiAgICAgICAgICAgIGEuZXhwbG9zaW9uLm1pbixcbiAgICAgICAgICAgIGEuZXhwbG9zaW9uLm1heFxuICAgICAgICAgICksXG4gICAgICAgICAgZXhwbG9zaW9uTGVuZ3RoOiBmKHIpLFxuICAgICAgICAgIGJyaWdodG5lc3M6IHUsXG4gICAgICAgICAgZGVjYXk6IGRcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cbiAgZHJhd0V4cGxvc2lvbigpIHtcbiAgICBsZXQgdCA9IHRoaXMuZXhwbG9zaW9ucy5sZW5ndGg7XG4gICAgZm9yICg7IHQtLTsgKVxuICAgICAgdGhpcy5leHBsb3Npb25zW3RdLmRyYXcoKSwgdGhpcy5leHBsb3Npb25zW3RdLnVwZGF0ZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9ucy5zcGxpY2UodCwgMSk7XG4gICAgICB9KTtcbiAgfVxufVxuZXhwb3J0IHtcbiAgVCBhcyBGaXJld29ya3MsXG4gIFQgYXMgZGVmYXVsdFxufTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgSlhXb3JkIGZyb20gXCIuL2pzL2p4d29yZC1ncmlkXCI7XG5pbXBvcnQgeGRwYXJzZXIgZnJvbSBcInhkLWNyb3Nzd29yZC1wYXJzZXJcIjtcbmltcG9ydCBcIi4vY3NzL2p4d29yZC5sZXNzXCI7XG5pbXBvcnQge0V2ZW50c30gZnJvbSBcIi4vanMvZXZlbnRzXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIF9hZGRfY3Jvc3N3b3JkKGNyb3Nzd29yZF9kYXRhLCBjb250YWluZXJfaWQsIGRlYnVnID0gZmFsc2UpIHtcbiAgICBpZiAoIWNyb3Nzd29yZF9kYXRhKSByZXR1cm47XG4gICAgY29uc3QgdW5lbmNvZGVkX2RhdGEgPSBhdG9iKGNyb3Nzd29yZF9kYXRhKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgeGRwYXJzZXIodW5lbmNvZGVkX2RhdGEpO1xuICAgIHdpbmRvdy5qeHdvcmQgPSBuZXcgSlhXb3JkKHsgXG4gICAgICAgIGNvbnRhaW5lcjogYCMke2NvbnRhaW5lcl9pZH1gLFxuICAgICAgICBkYXRhLFxuICAgICAgICBkZWJ1Z1xuICAgIH0pO1xuICAgIHdpbmRvdy5qeHdvcmQuZXZlbnRzID0gbmV3IEV2ZW50cyhgIyR7Y29udGFpbmVyX2lkfWApO1xufVxud2luZG93LmFkZF9jcm9zc3dvcmQgPSBfYWRkX2Nyb3Nzd29yZDsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=