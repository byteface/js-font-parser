var GlyfSimpleDescript = /** @class */ (function () {
    function GlyfSimpleDescript(parentTable, numberOfContours, bais) {
        // Constants for flag checks
        this.onCurve = 0x01;
        this.xShortVector = 0x02;
        this.yShortVector = 0x04;
        this.repeat = 0x08;
        this.xDual = 0x10;
        this.yDual = 0x20;
        this.instructions = null;
        this.parentTable = parentTable;
        this.numberOfContours = numberOfContours;
        this.xMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.xMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        // Initialize end points of contours
        this.endPtsOfContours = [];
        for (var i = 0; i < this.numberOfContours; i++) {
            this.endPtsOfContours.push((bais.readUnsignedByte() << 8) | bais.readUnsignedByte());
        }
        // Calculate the total number of points
        this.count = this.endPtsOfContours[this.numberOfContours - 1] + 1;
        this.flags = [];
        this.xCoordinates = [];
        this.yCoordinates = [];
        var instructionCount = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.readInstructions(bais, instructionCount);
        this.readFlags(this.count, bais);
        this.readCoords(this.count, bais);
    }
    GlyfSimpleDescript.prototype.readInstructions = function (byte_ar, count) {
        this.instructions = [];
        for (var i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    };
    GlyfSimpleDescript.prototype.getEndPtOfContours = function (i) {
        return this.endPtsOfContours[i];
    };
    GlyfSimpleDescript.prototype.getFlags = function (i) {
        return this.flags[i];
    };
    GlyfSimpleDescript.prototype.getXCoordinate = function (i) {
        return this.xCoordinates[i];
    };
    GlyfSimpleDescript.prototype.getYCoordinate = function (i) {
        return this.yCoordinates[i];
    };
    GlyfSimpleDescript.prototype.isComposite = function () {
        return false;
    };
    GlyfSimpleDescript.prototype.getPointCount = function () {
        return this.count;
    };
    GlyfSimpleDescript.prototype.getContourCount = function () {
        return this.numberOfContours;
    };
    GlyfSimpleDescript.prototype.readCoords = function (count, bais) {
        var x = 0;
        var y = 0;
        for (var i = 0; i < count; i++) {
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
                    var xPos = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
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
        for (var j = 0; j < count; j++) {
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
                    var yPos = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
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
    };
    GlyfSimpleDescript.prototype.readFlags = function (flagCount, bais) {
        for (var index = 0; index < flagCount; index++) {
            this.flags.push(bais.readUnsignedByte());
            if ((this.flags[index] & this.repeat) !== 0) {
                var repeats = bais.readUnsignedByte();
                for (var i = 1; i <= repeats; i++) {
                    this.flags[index + i] = this.flags[index];
                }
                index += repeats;
            }
        }
    };
    GlyfSimpleDescript.prototype.resolve = function () {
        // Implement resolve logic here if needed
    };
    GlyfSimpleDescript.prototype.getXMaximum = function () {
        return 0;
    };
    GlyfSimpleDescript.prototype.getXMinimum = function () {
        return 0;
    };
    GlyfSimpleDescript.prototype.getYMaximum = function () {
        return 0;
    };
    GlyfSimpleDescript.prototype.getYMinimum = function () {
        return 0;
    };
    return GlyfSimpleDescript;
}());
export { GlyfSimpleDescript };
