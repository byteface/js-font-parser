// com/byteface/font/utils/Color.ts
var Color = /** @class */ (function () {
    function Color() {
        // set black and white as defaults
        this.range = ['#000000', '#ffffff'];
    }
    // returns a completely random color
    Color.prototype.rndColor = function () {
        return '#' + ('00000' + ((Math.random() * 16777216) << 0).toString(16)).slice(-6);
    };
    // returns a random color from the range you set
    Color.prototype.rndColorFromPalette = function () {
        var index = Math.floor(Math.random() * this.range.length);
        return this.range[index];
    };
    Color.prototype.setPalette = function (array) {
        this.range = array;
    };
    return Color;
}());
export { Color };
