// welded-join.js

/**
 * Handles welded joint geometry between shell and heads.
 */

class WeldedJoint {
    constructor(shellDiameter, headDiameter, weldThickness) {
        this.shellDiameter = shellDiameter;
        this.headDiameter = headDiameter;
        this.weldThickness = weldThickness;
    }

    /**
     * Calculate the joint area.
     */
    calculateJointArea() {
        const shellRadius = this.shellDiameter / 2;
        const headRadius = this.headDiameter / 2;
        const jointArea = Math.PI * (Math.pow(headRadius, 2) - Math.pow(shellRadius, 2));
        return jointArea;
    }

    /**
     * Calculate the volume of weld material required.
     */
    calculateWeldVolume() {
        const weldVolume = this.calculateJointArea() * this.weldThickness;
        return weldVolume;
    }

    /**
     * Display the joint specifications.
     */
    displaySpecifications() {
        console.log(`Shell Diameter: ${this.shellDiameter}`);
        console.log(`Head Diameter: ${this.headDiameter}`);
        console.log(`Weld Thickness: ${this.weldThickness}`);
        console.log(`Joint Area: ${this.calculateJointArea()}`);
        console.log(`Weld Volume: ${this.calculateWeldVolume()}`);
    }
}

// Example usage:
const weldJoint = new WeldedJoint(100, 150, 5);
weldJoint.displaySpecifications();