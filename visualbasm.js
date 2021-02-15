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
const memoryFontColor = "white";
const memoryHighlightColor = "yellow";
const newCellPadding = new Vector(0, -30);
let fontSize = 16;
let memoryLineHight = fontSize * 1.5;
let memoryPadding = 16;



class Cell {
    constructor(pos, value = 0) {
        this.pos = pos;
        this.size = new Vector(memoryLineHight * 4, memoryLineHight);
        this.value = value;
        this.description = descriptionInComment;
    }
    draw() {
        const visualPos = this.pos.sub(this.size.scale(0.5));
        ctx.fillStyle = "#27356b";
        ctx.fillRect(visualPos.x, visualPos.y, this.size.x, this.size.y);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.value, this.pos.x, this.pos.y + this.size.y / 4);
        ctx.fillStyle = "grey";
        ctx.textAlign = "left";
        ctx.fillText(this.description, visualPos.x + this.size.x + 10, this.pos.y + this.size.y / 4);
    }
}
let descriptionInComment = "";
const cells = [];
const cell = new Cell(new Vector( width / 3, height * 7 / 8), "Stack");
cells.push(cell);

let prevExecutedInstCount = parseInt(localStorage.getItem("prevExecutedInstCount")) || 0;
const delay = 200;
let executedInstCount = 0;
let lastStepEditorTime = 0;
let rawCodeLines;
const lineElems = [];
let labels = {};
let natives = {};
let memoryString = "";
let memoryConstants = {};
let memoryChanged = false;

let instrLineIndex = -1;
let jumpToIndex = -1;
let instrLine = "";
let instrParts = [];
let instrType;
let entryLabel;
let halted = false;
const LINE_TYPE = {PRE_PROCESSOR: 0, LABEL: 1, INSTRUCTION: 2};

parseInput();

resizeHandler();
if (prevExecutedInstCount) {
    setTimeout(stepLineHandler, delay);
}

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
                    console.error(`Not enought argument for const directive "${inst}" on line ${i}.`);
                    return;
                }
                const string = directiveParts[2].match(/"(.*)"/)?.[1];
                if (string !== undefined) {
                    if (string.length === 0) {
                        console.error(`Provided empty string on line ${i}.`);
                        return;
                    }
                    memoryConstants[directiveParts[1]] = memoryString.length;
                    memoryString += string;
                } else {
                    const number = parseFloat(directiveParts[2]);
                    if (isNaN(number)) {
                        console.error(`Invalid expression ${directiveParts[2]} on line ${i}`)
                    } else {
                        memoryConstants[directiveParts[1]] = number;
                    }
                }
                } break;
            case "native": {
                if (!directiveParts[1] || !directiveParts[2]) {
                    console.error(`Not enought argument for native directive "${inst}" on line ${i}.`);
                    return;
                }
                if ("write" === directiveParts[1]) {
                    natives[directiveParts[1]] = console.log;
                }
                } break;
            case "include": {

                } break;
            case "entry": {
                if (entryLabel) {
                    console.error(`Redefenition of entry label "${entryLabel}" on line "${i}"`)
                    return;
                }
                if (!directiveParts[1]) {
                    console.error(`Provided no argument for entry directive "${inst}" on line ${i}`);
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
    if (jumpToIndex >= 0) {
        instrLineIndex = jumpToIndex;
        jumpToIndex = -1;
    }
    while (instrLineIndex < lineElems.length) {
        instrLineIndex++;
        instrLine = lineElems[instrLineIndex]?.textContent.trim()
        if (instrLine && !instrLine.startsWith(";")) {
            break;
        }
    }
    lineElems[instrLineIndex]?.classList.add("current-line");
    const newStepEditorTime = performance.now();
    const dt = newStepEditorTime - lastStepEditorTime;
    const smooth = 0 === prevExecutedInstCount && dt > delay * 2
    lastStepEditorTime = newStepEditorTime;
    if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop < editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - editorHeight / 4,
          left: 0,
          behavior: (smooth ? "smooth" : "auto")
        });
    } else if (lineElems[instrLineIndex]?.offsetTop - inputElem.scrollTop > 3 * editorHeight / 4) {
        inputElem.scroll({
          top: lineElems[instrLineIndex]?.offsetTop - 3 * editorHeight / 4,
          left: 0,
          behavior: (smooth ? "smooth" : "auto")
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
    const lineParts = instrLine.split(";");
    descriptionInComment = lineParts.slice(1).join(";").trim();

    instrParts = lineParts[0].trim().split(/\s+/);
    if (instrParts[0].startsWith("%")) {
        instrType = LINE_TYPE.PRE_PROCESSOR;
    } else if (instrParts[0].endsWith(":")) {
        instrType = LINE_TYPE.LABEL;
    } else {
        instrType = LINE_TYPE.INSTRUCTION;
    }
}
function binaryOperation(f) {
    if (cells.length < 2) {
        console.error(`Stack underflow on line ${instrLineIndex}`);
        return;
    }
    const currentCell = cells.pop();
    const previousCell = cells.pop();
    const newPos = previousCell.pos;
    const value = f(parseFloat(previousCell.value), parseFloat(currentCell.value));
    cells.push(new Cell(newPos, value));
}
function executeInstruction() {
    if (instrType !== LINE_TYPE.INSTRUCTION) {
        return;
    }
    executedInstCount++;
    switch (instrParts[0]) {
    case "native":
    case "call":
    case "jmp_if":
    case "dup":
    case "swap":
    case "push": {
        if (instrParts.length < 1) {
            console.error(`No value was provided to "${instrParts[0]}" on line ${instrLineIndex}.`);
            return;
        }
    } break;

    case "write8":
    case "divi":
    case "divu":
    case "modu":
    case "modi":
    case "minusi":
    case "plusi": {
        if (cells.length < 2) {
            console.error(`Stack underflow on line ${instrLineIndex}`);
            return;
        }
    } break;

    case "not":
    case "eqi":
    case "equ":
    case "drop":
    case "ret":
    case "halt": {
    } break;
    default:
        console.error(`Invalid instruction ${instrParts[0]} in "${instrLine}" on line ${instrLineIndex}.`);
        return;
    }

    switch (instrParts[0]) {
    case "push": {
        let value = parseFloat(instrParts[1]);
        if (isNaN(value)){
            if (memoryConstants[instrParts[1]] !== undefined) {
                value = memoryConstants[instrParts[1]];
            } else if (instrParts[1].match(/'.'/)) {
                value = instrParts[1].charCodeAt(1);
            } else {
                console.error(`Can't push "${instrParts[1]}" on line ${instrLineIndex}"`)
                return;
            }
        }
        const prevCell = cells[cells.length - 1];
        const newPos = prevCell.pos.add(newCellPadding);
        cells.push(new Cell(newPos, value));
        } break;

    case "plusi": {
        const currentCell = cells.pop();
        const previousCell = cells.pop();
        const newPos = previousCell.pos;
        const value = parseInt(previousCell.value) + parseInt(currentCell.value);
        cells.push(new Cell(newPos, value));
        } break;

    case "minusi": {
        const currentCell = cells.pop();
        const previousCell = cells.pop();
        const newPos = previousCell.pos;
        const value = parseInt(previousCell.value) - parseInt(currentCell.value);
        cells.push(new Cell(newPos, value));
        } break;

    case "swap": {
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

    case "dup": {
        const value = parseInt(instrParts[1]);
        if (isNaN(value)){
            console.error(`Invalid value "${instrParts[1]} on line ${instrLineIndex}"`)
            return;
        }
        if (cells.length - 1 < value) {
            console.error(`Stack underflow on line ${instrLineIndex}.`);
            return;
        }
        const currentCell = cells[cells.length - 1];
        const sourceCell = cells[cells.length - 1 - value];
        const newCell = new Cell(currentCell.pos.add(newCellPadding), sourceCell.value);
        if (!descriptionInComment) {
            newCell.description = sourceCell.description;
        }
        cells.push(newCell);
        } break;

    case "modu":
    case "modi": {
        if (cells[cells.length - 1].value == 0) {
            console.error(`Division by zero on line ${instrLineIndex}`);
            return;
        }
        binaryOperation((a, b) => a % b);
        } break;

    case "divu":
    case "divi": {
        if (cells[cells.length - 1].value == 0) {
            console.error(`Division by zero on line ${instrLineIndex}`);
            return;
        }
        binaryOperation((a, b) => Math.floor(a / b));
        } break;

    case "eqi":
    case "equ": {
        binaryOperation((a, b) => a == b ? 1 : 0);
        } break;

    case "not": {
        const currentCell = cells.pop();
        const newPos = currentCell.pos;
        const value = parseFloat(currentCell.value) === 0 ? 1 : 0;
        cells.push(new Cell(newPos, value));
        } break;

    case "write8": {
        const currentCell = cells.pop();
        const previousCell = cells.pop();
        const char = String.fromCharCode(parseInt(currentCell.value));
        const memoryIndex = parseInt(previousCell.value);
        memoryString = memoryString.substring(0, memoryIndex) + char + memoryString.substring(memoryIndex + 1);
        memoryChanged = true;
        } break;

    case "drop": {
        cells.pop();
        } break;

    case "jmp_if": {
        if (null == labels[instrParts[1]]) {
            console.error(`Invalid subroutine name on line "${instrLineIndex}"`);
        }
        const currentCell = cells.pop();
        if (parseFloat(currentCell.value) !== 0) {
            jumpToIndex = labels[instrParts[1]];
            instrType = LINE_TYPE.LABEL;
            console.log(`Will jump to ${jumpToIndex}`);
        }
        } break;

    case "ret": {
        const currentCell = cells.pop();
        jumpToIndex = parseInt(currentCell.value);
        console.log(`Will jump to ${jumpToIndex}`)
        } break;

    case "native": {
        if (null == natives[instrParts[1]]) {
            console.error(`Invalid native function "${instrParts[1]}" on line "${instrLineIndex}"`);
        }
        if ("write" === instrParts[1]) {
            if (cells.length < 2) {
                console.error(`Stack underflow on line ${instrLineIndex}`);
                return;
            }
            const stringLength = parseInt(cells.pop().value);
            const memoryPointer = parseInt(cells.pop().value);
            natives[instrParts[1]](memoryString.substr(memoryPointer, stringLength));
        }
        } break;

    case "call": {
        if (null == labels[instrParts[1]]) {
            console.error(`Invalid subroutine name on line "${instrLineIndex}"`);
        }
        const prevCell = cells[cells.length - 1];
        const newPos = prevCell.pos.add(newCellPadding);
        const value = instrLineIndex;
        cells.push(new Cell(newPos, value));
        jumpToIndex = labels[instrParts[1]];
        instrType = LINE_TYPE.LABEL;
        console.log(`Will jump to ${jumpToIndex}.`);
        } break;
    case "halt": {
        console.log("Program succesfully halted.");
        halted = true;
        stepLineElem.disabled = true;
        } break;
    default:
        console.error("Unreachable.");
    }
}

function render() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    cells.map(cell => cell.draw());

    ctx.fillStyle = memoryChanged ? memoryHighlightColor : memoryFontColor;
    memoryChanged = false;
    ctx.textAlign = "left";
    ctx.fillText(`memory: ${memoryString.replaceAll("\n", "\\n")}`, memoryPadding, height - memoryPadding);
    ctx.fillStyle = memoryFontColor;
    let yPos = height - memoryPadding - memoryLineHight;
    for (const name in memoryConstants) {
        ctx.fillText(`${name}: ${memoryConstants[name]}`, memoryPadding, yPos);
        yPos -= memoryLineHight;
    }
    ctx.fillText(`Instructions count: ${executedInstCount}`, memoryPadding, memoryPadding);
}

function resizeHandler() {
    width = innerWidth / 2;
    height = innerHeight;
    canvas.height = height;
    canvas.width = width;
    ctx.font = `${fontSize}px "Lucida Console", monospace`;
    editorHeight = inputElem.offsetHeight;
    render();
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
    if (halted) {
        console.error("Program is halted");
        return;
    }
    stepEditor();
    parseInstruction();
    executeInstruction();
    if (prevExecutedInstCount) {
        if (executedInstCount < prevExecutedInstCount) {
            setTimeout(stepLineHandler, delay);
        } else {
            localStorage.setItem("prevExecutedInstCount", 0);
            prevExecutedInstCount = 0;
        }
    }
    render();
};

stepLineElem.addEventListener("click", stepLineHandler)
window.addEventListener("keydown", e => {
    if (e.target.nodeName === "TEXTAREA" || e.target.nodeName === "INPUT") {
        return;
    } else {
        if (e.code === "Space" && e.target.nodeName !== "BUTTON") {
            stepLineHandler();
        } else if (e.code === "KeyR") {
            if (e.shiftKey) {
                localStorage.setItem("prevExecutedInstCount", 0);
                prevExecutedInstCount = 0;
            } else {
                localStorage.setItem("prevExecutedInstCount", executedInstCount);
                location.reload();
            }
        }
    }
});
window.addEventListener("blur", e => {
    stepLineElem.classList.add('unfocused');
});
window.addEventListener("focus", e => {
    stepLineElem.classList.remove('unfocused');
});
