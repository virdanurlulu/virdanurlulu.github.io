// heads.js

// Ellipsoidal head geometry
class EllipsoidalHead {
    constructor(diameter, height) {
        this.diameter = diameter;
        this.height = height;
    }

    volume() {
        return (1/3) * Math.PI * (this.diameter / 2) ** 2 * this.height;
    }
}

// Hemispherical head geometry
class HemisphericalHead {
    constructor(diameter) {
        this.diameter = diameter;
    }

    volume() {
        return (2/3) * Math.PI * (this.diameter / 2) ** 3;
    }
}

// Conical head geometry
class ConicalHead {
    constructor(diameter, height) {
        this.diameter = diameter;
        this.height = height;
    }

    volume() {
        return (1/3) * Math.PI * (this.diameter / 2) ** 2 * this.height;
    }
}

// Flat head geometry
class FlatHead {
    constructor(diameter, thickness) {
        this.diameter = diameter;
        this.thickness = thickness;
    }

    volume() {
        return Math.PI * (this.diameter / 2) ** 2 * this.thickness;
    }
}