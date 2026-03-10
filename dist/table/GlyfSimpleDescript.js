export class GlyfSimpleDescript {
    instructions;
    parentTable;
    numberOfContours;
    xMin;
    yMin;
    xMax;
    yMax;
    endPtsOfContours;
    flags;
    xCoordinates;
    yCoordinates;
    count;
    // Constants for flag checks
    onCurve = 0x01;
    xShortVector = 0x02;
    yShortVector = 0x04;
    repeat = 0x08;
    xDual = 0x10;
    yDual = 0x20;
    constructor(parentTable, numberOfContours, bais) {
        this.instructions = null;
        this.parentTable = parentTable;
        this.numberOfContours = numberOfContours;
        this.xMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.xMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        // Initialize end points of contours
        this.endPtsOfContours = [];
        for (let i = 0; i < this.numberOfContours; i++) {
            this.endPtsOfContours.push((bais.readUnsignedByte() << 8) | bais.readUnsignedByte());
        }
        // Calculate the total number of points
        this.count = this.endPtsOfContours[this.numberOfContours - 1] + 1;
        this.flags = [];
        this.xCoordinates = [];
        this.yCoordinates = [];
        const instructionCount = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.readInstructions(bais, instructionCount);
        this.readFlags(this.count, bais);
        this.readCoords(this.count, bais);
    }
    readInstructions(byte_ar, count) {
        this.instructions = [];
        for (let i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    }
    getEndPtOfContours(i) {
        return this.endPtsOfContours[i];
    }
    getFlags(i) {
        return this.flags[i];
    }
    getXCoordinate(i) {
        return this.xCoordinates[i];
    }
    getYCoordinate(i) {
        return this.yCoordinates[i];
    }
    isComposite() {
        return false;
    }
    getPointCount() {
        return this.count;
    }
    getContourCount() {
        return this.numberOfContours;
    }
    readCoords(count, bais) {
        let x = 0;
        let y = 0;
        for (let i = 0; i < count; i++) {
            if ((this.flags[i] & this.xDual) !== 0) {
                if ((this.flags[i] & this.xShortVector) !== 0) {
                    x += bais.readUnsignedByte();
                }
            }
            else {
                if ((this.flags[i] & this.xShortVector) !== 0) {
                    x += -bais.readUnsignedByte();
                }
                else {
                    let xPos = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
                    if (xPos > 60000) {
                        xPos = 65536 - xPos;
                        x -= xPos;
                    }
                    else {
                        x += xPos;
                    }
                }
            }
            this.xCoordinates.push(x);
        }
        for (let j = 0; j < count; j++) {
            if ((this.flags[j] & this.yDual) !== 0) {
                if ((this.flags[j] & this.yShortVector) !== 0) {
                    y += bais.readUnsignedByte();
                }
            }
            else {
                if ((this.flags[j] & this.yShortVector) !== 0) {
                    y += -bais.readUnsignedByte();
                }
                else {
                    let yPos = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
                    if (yPos > 60000) {
                        yPos = 65536 - yPos;
                        y -= yPos;
                    }
                    else {
                        y += yPos;
                    }
                }
            }
            this.yCoordinates.push(y);
        }
    }
    readFlags(flagCount, bais) {
        for (let index = 0; index < flagCount; index++) {
            this.flags.push(bais.readUnsignedByte());
            if ((this.flags[index] & this.repeat) !== 0) {
                const repeats = bais.readUnsignedByte();
                for (let i = 1; i <= repeats; i++) {
                    this.flags[index + i] = this.flags[index];
                }
                index += repeats;
            }
        }
    }
    resolve() {
        // Implement resolve logic here if needed
    }
    getInstructions() {
        return this.instructions;
    }
    getXMaximum() {
        return this.xMax;
    }
    getXMinimum() {
        return this.xMin;
    }
    getYMaximum() {
        return this.yMax;
    }
    getYMinimum() {
        return this.yMin;
    }
}
