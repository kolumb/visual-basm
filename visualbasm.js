"use strict";
const canvas = document.querySelector("#Canvas");
const ctx = canvas.getContext("2d", {alpha: false});
let width, height;
const backgroundColor = "#282923";

resizeHandler();

class Cell {
    constructor(pos) {
        this.pos = pos;
        this.size = new Vector(50, 15);
    }
    draw() {
        const visualPos = this.pos.sub(this.size.scale(0.5));
        ctx.fillStyle = "blue";
        ctx.fillRect(visualPos.x, visualPos.y, this.size.x, this.size.y);
    }
}
const cell = new Cell(new Vector( width / 2, height * 7 / 8))

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
let currentLineCode = "";
let instruction = "";

const stepLineElem = document.querySelector("#StepLineElem");
stepLineElem.addEventListener("click", e => {
    lineElems[currentLineIndex]?.classList.remove("current-line");
    while (currentLineIndex < lineElems.length) {
        currentLineIndex++;
        const lineText = lineElems[currentLineIndex]?.textContent.trim();
        if (lineText) {
            lineElems[currentLineIndex].classList.add("current-line");
            break;
        }
    }
    currentLineCode = lineElems[currentLineIndex]?.textContent;
    instruction = currentLineCode?.trim();
})


function frame() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    cell.draw();
}

function resizeHandler() {
    width = innerWidth / 2;
    height = innerHeight;
    canvas.height = height;
    canvas.width = width;
};
window.addEventListener("resize", resizeHandler);
