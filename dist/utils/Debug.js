var Debug = /** @class */ (function () {
    function Debug() {
    }
    Debug.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!Debug.enabled)
            return;
        console.log.apply(console, args);
    };
    Debug.table = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!Debug.enabled)
            return;
        console.table.apply(console, args);
    };
    Debug.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!Debug.enabled)
            return;
        console.warn.apply(console, args);
    };
    Debug.enabled = false;
    return Debug;
}());
export { Debug };
