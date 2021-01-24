class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    add(v) {
        let x = this.x + v.x;
        let y = this.y + v.y;
        return new Vector(x, y);
    }
    addMut(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        return this.add(v.scale(-1));
    }
    mult(v) {
        return new Vector(this.x * v.x, this.y * v.y);
    }
    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }
    angleTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.atan2(-dy, dx);
    }
    scale(f) {
        return new Vector(this.x * f, this.y * f);
    }
    scaleMut(f) {
        this.x *= f;
        this.y *= f;
        return this;
    }
    copy() {
        return new Vector(this.x, this.y);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    clamp(length) {
        if (this.length() < length) return this;
        const angle = Math.atan2(this.y, this.x);
        return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    clampMut(length) {
        if (this.length() < length) return this;
        const angle = Math.atan2(this.y, this.x);
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
        return this;
    }
    swap() {
        return new Vector(this.y, this.x);
    }
    static fromAngle(a) {
        return new Vector(Math.cos(a), -Math.sin(a));
    }
    drawFrom(v) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(v.x + this.x, v.y + this.y);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.restore();
    }
}
