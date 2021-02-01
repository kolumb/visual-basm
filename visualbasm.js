"use strict";
const inputElem = document.querySelector("#InputElem");
const highlightingOverlayElem = document.querySelector("#HighlightingOverlay");
const stepLineElem = document.querySelector("#StepLineElem");

const canvas = document.querySelector("#Canvas");
const ctx = canvas.getContext("2d", {alpha: false});
let width = innerWidth / 2
let height = innerHeight;
let editorHeight;
const backgroundColor = "#282923";


class Cell {
    constructor(pos, value = 0) {
        this.pos = pos;
        this.size = new Vector(50, 15);
        this.value = value
    }
    draw() {
        const visualPos = this.pos.sub(this.size.scale(0.5));
        ctx.fillStyle = "#27356b";
        ctx.fillRect(visualPos.x, visualPos.y, this.size.x, this.size.y);
        ctx.fillStyle = "white";
        ctx.fillText(this.value, this.pos.x, this.pos.y + this.size.y / 4);
    }
}
const cells = [];
const cell = new Cell(new Vector( width / 2, height * 7 / 8))
cells.push(cell);

resizeHandler();

let rawCodeLines;
const lineElems = [];

let instrLineIndex = -1;
let instrLine = "";
let instrParts = [];
let instrType;
const LINE_TYPE = {PRE_PROCESSOR: 0, LABEL: 1, INSTRUCTION: 2};

parseInput();

function addLineToEditor(line) {
    const lineElem = document.createElement("pre");
    lineElem.innerHTML = line;
    lineElems.push(lineElem);
    highlightingOverlayElem.appendChild(lineElem);
}

function parseInput() {
    rawCodeLines = inputElem.value.split("\n");

    lineElems.length = 0;
    highlightingOverlayElem.innerHTML = "";
    rawCodeLines.map(addLineToEditor);
}

function stepEditor() {
    lineElems[instrLineIndex]?.classList.remove("current-line");
    while (instrLineIndex < lineElems.length) {
        instrLineIndex++;
        instrLine = lineElems[instrLineIndex]?.textContent.trim()
        if (instrLine && !instrLine.startsWith(";")) {
            break;
        }
    } // side effects: instrLineIndex
    lineElems[instrLineIndex]?.classList.add("current-line");
    if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop < editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - editorHeight / 4,
          left: 0,
          behavior: 'smooth'
        });
    } else if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop > 3 * editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - 3 * editorHeight / 4,
          left: 0,
          behavior: 'smooth'
        });
    }
}
function parseInstruction() {
    if (!instrLine) {
        if (instrLineIndex !== lineElems.length) {
            console.error(`Expected instruction on line ${instrLineIndex}.`);
        } else {
            console.log(`Reached the end of the program on line ${instrLineIndex}.`);
            stepLineElem.disabled = true;
        }
        return;
    }
    instrParts = instrLine.split(/\s+/);
    if (instrParts[0].startsWith("%")) {
        instrType = LINE_TYPE.PRE_PROCESSOR;
    } else if (instrParts[0].endsWith(":")) {
        instrType = LINE_TYPE.LABEL;
    } else {
        instrType = LINE_TYPE.INSTRUCTION;
    }
}
function executeInstruction() {
    if (instrType !== LINE_TYPE.INSTRUCTION) {
        console.log(`Skipping "${instrLine}"`);
        return;
    }
    switch (instrParts[0]) {
    case "push": {
        const prevCell = cells[cells.length - 1];
        const newPos = prevCell.pos.add(new Vector(0, -30));
        const value = instrParts[1];
        cells.push(new Cell(newPos, value));
        } break;
    case "plusi": {
        const prevCell = cells.pop();
        const prevPrevCell = cells.pop();
        const newPos = prevPrevCell.pos;
        const value = parseInt(prevPrevCell.value) + parseInt(prevCell.value);
        cells.push(new Cell(newPos, value));
        } break;
    case "call": {
        } break;
    case "halt": {
        } break;
    default:
        console.error(`Invalid instruction ${instrParts[0]} in "${instrLine}" on line ${instrLineIndex}.`);
    }
}

function frame() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    cells.map(cell => cell.draw());
}

function resizeHandler() {
    width = innerWidth / 2;
    height = innerHeight;
    canvas.height = height;
    canvas.width = width;
    ctx.textAlign = "center";
    editorHeight = inputElem.offsetHeight;
    frame();
};
window.addEventListener("resize", resizeHandler);

inputElem.addEventListener("input", e => {
    const newLines = inputElem.value.split("\n")
    newLines.map((newLine, i) => {
        if (newLine !== rawCodeLines[i]) {
            if (newLine === rawCodeLines[i+1]) {
                lineElems[i].textContent = newLine;
            } else if (newLine === rawCodeLines[i-1]) {
                if (lineElems[i]) {
                    lineElems[i].textContent = newLine;
                } else {
                    addLineToEditor(newLine);
                }
            } else {
                if (lineElems[i]) {
                    lineElems[i].textContent = newLine;
                } else {
                    addLineToEditor(newLine);
                }
            }
        }
    });
    for (let i = lineElems.length - 1; lineElems.length > newLines.length; i--) {
        lineElems.pop().remove();
    }
    rawCodeLines = newLines;
});

inputElem.addEventListener("scroll", e => {
    highlightingOverlayElem.scrollTop = inputElem.scrollTop;
});

function stepLineHandler (e) {
    stepEditor();
    parseInstruction();
    executeInstruction();
    frame();
};

stepLineElem.addEventListener("click", stepLineHandler)
window.addEventListener("keydown", e => {
    if (e.target.nodeName === "TEXTAREA" || e.target.nodeName === "INPUT") {
        return;
    } else {
        if (e.code === "Space") {
            stepLineHandler();
        }
    }
});
