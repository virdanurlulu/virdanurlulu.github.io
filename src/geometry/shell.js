// cylindricalShell.js
class CylindricalShell {
    constructor(radius, height) {
        this.radius = radius;
        this.height = height;
    }
    volume() {
        return Math.PI * Math.pow(this.radius, 2) * this.height;
    }
    surfaceArea() {
        return 2 * Math.PI * this.radius * this.height + 2 * Math.PI * Math.pow(this.radius, 2);
    }
}

// taperedShell.js
class TaperedShell {
    constructor(radius1, radius2, height) {
        this.radius1 = radius1;
        this.radius2 = radius2;
        this.height = height;
    }
    volume() {
        return (1/3) * Math.PI * this.height * (Math.pow(this.radius1, 2) + this.radius1 * this.radius2 + Math.pow(this.radius2, 2));
    }
    surfaceArea() {
        const slantHeight = Math.sqrt(Math.pow(this.radius2 - this.radius1, 2) + Math.pow(this.height, 2));
        return Math.PI * (this.radius1 + this.radius2) * slantHeight + Math.PI * Math.pow(this.radius1, 2) + Math.PI * Math.pow(this.radius2, 2);
    }
}