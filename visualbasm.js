"use strict";
const tabsElem = document.querySelector("#TabsElem");
const mainTabElem = document.querySelector("#MainTabElem");
const includeOptionElem = document.querySelector("#IncludeOptionElem");
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
let labels = {};
let staticMemory = {};

let instrLineIndex = -1;
let jumpToIndex = -1;
let instrLine = "";
let instrParts = [];
let instrType;
let entryLabel;
const LINE_TYPE = {PRE_PROCESSOR: 0, LABEL: 1, INSTRUCTION: 2};

parseInput();

includeOptionElem.innerHTML = "";
for(let inst of inputElem.value.matchAll(/%include\s+(\S+)/g)) {
    const option = document.createElement("option");
    option.value = inst[1];
    option.textContent = inst[1];
    includeOptionElem.appendChild(option);
}

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
    labels = {};
    rawCodeLines.map((line, i) => {
        const inst = line.trim()
        if (!inst || inst.length < 2 || inst.startsWith(";")) return;
        if (inst.startsWith("%")) {
            const directiveParts = inst.split(/\s+/);
            switch (directiveParts[0].slice(1)) {
            case "const": {
                if (!directiveParts[1] || !directiveParts[2]) {
                    console.error(`Not enought argument for const directive "${inst}" on line ${i}`);
                    return;
                }
                const string = directiveParts[2].match(/"(.*)"/)?.[1];
                staticMemory[directiveParts[1]] = string ? string : parseFloat(directiveParts[2]);
                } break;
            case "native": {

                } break;
            case "include": {

                } break;
            case "entry": {
                if (entryLabel) {
                    console.error(`Redefenition of entry label "${entryLabel}" on line "${i}"`)
                    return;
                }
                if (!directiveParts[1]) {
                    console.error(`Not enought argument for entry directive "${inst}" on line ${i}`);
                    return;
                }
                entryLabel = directiveParts[1];
                mainTabElem.textContent = entryLabel;
                } break;
            case "include": {

                } break;
            default: {
                console.error(`Unknown pre-processor directive "${inst}" on line ${i}`);
                }
            }
            if (!entryLabel) {
                mainTabElem.textContent = "No entry label";
            }
        } else if (inst.endsWith(":")) {
            const label = inst.slice(0, -1);
            if (labels[label] !== undefined) {
                console.error(`Label "${label}" on line ${i} was alredy defined on line ${labels[label]}`);
                return;
            }
            labels[label] = i;
        }
    });
}

function stepEditor() {
    lineElems[instrLineIndex]?.classList.remove("current-line");

    if (instrLineIndex < 0 && entryLabel) {
        jumpToIndex = labels[entryLabel];
        instrType = LINE_TYPE.LABEL;
    }

    instrLine = "";
    if (jumpToIndex < 0) { // Previous instr wasn't jump
        while (instrLineIndex < lineElems.length) {
            instrLineIndex++;
            instrLine = lineElems[instrLineIndex]?.textContent.trim()
            if (instrLine && !instrLine.startsWith(";")) {
                break;
            }
        }
    } else { // Need to jump
        instrLineIndex = jumpToIndex;
        jumpToIndex = -1;
        instrLine = lineElems[instrLineIndex]?.textContent.trim()
    }
    lineElems[instrLineIndex]?.classList.add("current-line");
    if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop < editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - editorHeight / 4,
          left: 0,
          behavior: "smooth"
        });
    } else if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop > 3 * editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - 3 * editorHeight / 4,
          left: 0,
          behavior: "smooth"
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
        if (null == instrParts[1]) {
            console.error(`No value was provided to "push" on line ${instrLineIndex}.`);
            return;
        }
        const value = parseFloat(instrParts[1]);
        if (isNaN(value)){
            console.error(`Invalid value "${instrParts[1]} on line ${instrLineIndex}"`)
            return;
        }

        const prevCell = cells[cells.length - 1];
        const newPos = prevCell.pos.add(new Vector(0, -30));
        cells.push(new Cell(newPos, value));
        } break;

    case "plusi": {
        if (cells.length < 2) {
            console.error(`Stack underflow on line ${instrLineIndex}`);
            return;
        }
        const currentCell = cells.pop();
        const previousCell = cells.pop();
        const newPos = previousCell.pos;
        const value = parseInt(previousCell.value) + parseInt(currentCell.value);
        cells.push(new Cell(newPos, value));
        } break;

    case "swap": {
        if (null == instrParts[1]) {
            console.error(`No offset was provided to "swap" on line ${instrLineIndex}.`);
            return;
        }
        const value = parseInt(instrParts[1]);
        if (isNaN(value)){
            console.error(`Invalid value "${instrParts[1]} on line ${instrLineIndex}"`)
            return;
        }
        if (cells.length - 1 < value) {
            console.error(`Stack underflow on line ${instrLineIndex}.`);
            return;
        }
        const currentCell = cells.pop();
        const swappingCell = cells[cells.length - value];
        cells[cells.length - value] = currentCell;
        cells.push(swappingCell);

        const tempPos = currentCell.pos.copy();
        currentCell.pos.setFrom(swappingCell.pos);
        swappingCell.pos.setFrom(tempPos);
        } break;

    case "call": {
        const prevCell = cells[cells.length - 1];
        const newPos = prevCell.pos.add(new Vector(0, -30));
        const value = instrLineIndex + 1;
        cells.push(new Cell(newPos, value));
        jumpToIndex = labels[instrParts[1]];
        instrType = LINE_TYPE.LABEL;
        console.log(`Will jump to ${jumpToIndex}`)
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

tabsElem.addEventListener("click", e => {
    if (e.target.nodeName !== "SELECT") {
        Array.prototype.slice.call(tabsElem.children).map(tab => {
            if(e.target === tab || e.target.parentNode === tab) {
                tab.classList.add("selected");
            } else {
                tab.classList.remove("selected");
            }
        })
    }
})

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
