"use strict";
const canvas = document.querySelector("#Canvas");
const ctx = canvas.getContext("2d", {alpha: false});
let width, height;

ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 40, 40);