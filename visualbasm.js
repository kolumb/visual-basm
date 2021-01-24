"use strict";
const canvas = document.querySelector("#Canvas");
const ctx = canvas.getContext("2d", {alpha: false});
let width, height;
const backgroundColor = "#282923";

resizeHandler();

frame(new Vector( width / 2, height * 7 / 8));

const inputElem = document.querySelector("#InputElem");
let inputProgram = inputElem.value
    .split("\n")
    .map(line => line.trim())
    .filter(String)
    .filter(line => !line.startsWith("%"));

function frame(v) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const pos = v.copy();
    // const pos = new Vector(width / 2, height - 50);
    const size = new Vector(50, 15);
    const visualPos = pos.sub(size.scale(0.5));
    ctx.fillStyle = "blue";
    ctx.fillRect(visualPos.x, visualPos.y, size.x, size.y);
}

function resizeHandler() {
    width = innerWidth / 2;
    height = innerHeight;
    canvas.height = height;
    canvas.width = width;
};
window.addEventListener("resize", resizeHandler);
