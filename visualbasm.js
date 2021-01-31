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
let inputProgram = rawCodeLines
    .map(line => line.trim())
    .filter(String)
    .filter(line => !line.startsWith("%"));

const editorElem = document.querySelector("#EditorElem");
const highlightingOverlayElem = document.querySelector("#HighlightingOverlay");
const lineElems = []
rawCodeLines.map(line => {
    const lineElem = document.createElement("div");
    lineElem.innerHTML = line.replace(/ /g, "&nbsp;") || "&nbsp;";
    highlightingOverlayElem.appendChild(lineElem);
    lineElems.push(lineElem);
})

lineElems[0].classList.add('current-line');

let currentLineIndex = 0;
let currentLineCode = "";


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
