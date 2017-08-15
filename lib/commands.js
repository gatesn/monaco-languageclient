"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MonacoCommands = (function () {
    function MonacoCommands(_editor) {
        this._editor = _editor;
    }
    MonacoCommands.prototype.registerCommand = function (command, callback, thisArg) {
        return this._editor._commandService.addCommand(command, {
            handler: function (id) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                console.log("Executing command", command, id, args);
                callback.apply(void 0, args);
            }
        });
    };
    return MonacoCommands;
}());
exports.MonacoCommands = MonacoCommands;
//# sourceMappingURL=commands.js.map