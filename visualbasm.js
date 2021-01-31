"use strict";
const canvas = document.querySelector("#Canvas");
const ctx = canvas.getContext("2d", {alpha: false});
let width, height;
const backgroundColor = "#282923";

resizeHandler();

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

frame();


const inputElem = document.querySelector("#InputElem");
const rawCodeLines = inputElem.value
    .split("\n");

const highlightingOverlayElem = document.querySelector("#HighlightingOverlay");
const lineElems = [];
rawCodeLines.map(line => {
    const lineElem = document.createElement("div");
    lineElem.innerHTML = line.replace(/ /g, "&nbsp;") || "&nbsp;";
    lineElems.push(lineElem);
    highlightingOverlayElem.appendChild(lineElem);
})

let currentLineIndex = -1;
let instruction = "";

function stepEditor() {
    lineElems[currentLineIndex]?.classList.remove("current-line");
    while (currentLineIndex < lineElems.length) {
        currentLineIndex++;
        if (lineElems[currentLineIndex]?.textContent.trim()) {
            break;
        }
    } // side effects: currentLineIndex
    lineElems[currentLineIndex]?.classList.add("current-line");
    instruction = lineElems[currentLineIndex]?.textContent.trim();
}

function executeInstruction() {
    if (!instruction) {
        if (currentLineIndex !== lineElems.length) {
            console.error("Instruction was not parsed.");
        } else {
            console.log("Reached the end of the program.");
            stepLineElem.disabled = true;
        }
        return;
    }
    const instructionParts = instruction.split(/\s+/);
    if (instructionParts.length > 2) {
        console.error(`Invalid instruction "${instruction}" on line ${currentLineIndex}`);
    } else {
        switch (instructionParts[0]) {
        case "push": {
            const prevCell = cells[cells.length - 1];
            const newPos = prevCell.pos.add(new Vector(0, -30));
            const value = instructionParts[1];
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
        case "%include": {
            } break;
        case "%entry": {
            } break;
        case "main:": {
            } break;
        default:
            console.error(`Instruction "${instructionParts[0]}" on line ${currentLineIndex} is not implemented.`);
        }
    }
}

const stepLineElem = document.querySelector("#StepLineElem");
stepLineElem.addEventListener("click", e => {
    stepEditor();
    executeInstruction();
    frame();
})


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
};
window.addEventListener("resize", resizeHandler);
