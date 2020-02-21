"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var immer_1 = __importStar(require("immer"));
var defaultOptions = {
    namespace: 'timeline',
    include: [],
    limit: 1024,
};
var initialState = {
    canUndo: false,
    canRedo: false,
};
exports.default = (function (options) {
    var _a;
    if (options === void 0) { options = defaultOptions; }
    var newOptions = __assign(__assign({}, defaultOptions), options);
    var namespace = newOptions.namespace;
    var stack = [];
    var inverseStack = [];
    return {
        /**
         * Make sure that every reducer is wrapped by immer.
         * At the same time, we collect patches
         *
         * @param {Function} reducer
         * @return {Function}
         */
        _handleActions: function (handlers, defaultState) {
            return function (state, action) {
                if (state === void 0) { state = defaultState; }
                var type = action.type;
                var result = immer_1.default(state, function (draft) {
                    var handler = handlers[type];
                    if (typeof handler === 'function') {
                        var compatiableRet = handler(draft, action);
                        if (compatiableRet !== undefined) {
                            return compatiableRet;
                        }
                    }
                }, function (patches, inversePatches) {
                    // Only record the action whose namespace is in the include array.
                    if (patches.length) {
                        var namespace_1 = type.split('/')[0];
                        // Namespace with '@@' will be filtered because of some dva's plugin(dva-loading)
                        if (newOptions.include.includes(namespace_1) && !namespace_1.includes('@@')) {
                            // Clear the redo stack when a new change comes.
                            inverseStack = [];
                            // Make sure the length of changes is less than options.limit
                            stack = stack.slice(-newOptions.limit);
                            if (action.clear === true) {
                                stack = [];
                            }
                            else if (action.replace === true) {
                                stack.pop();
                            }
                            if (action.escape !== true && action.clear !== true) {
                                stack.push({ namespace: namespace_1, patches: patches, inversePatches: inversePatches });
                            }
                        }
                    }
                });
                return result === undefined ? {} : result;
            };
        },
        /**
         * High-Order reducer to undo or redo
         *
         * @param {Function} redux's reducer
         * @return {Function} redux's reducer
         */
        onReducer: function (reducer) {
            return function (state, action) {
                var newState = state;
                // Execute undo operation
                if (action.type === namespace + "/undo") {
                    var stackItem_1 = stack.pop();
                    if (stackItem_1) {
                        inverseStack.push(stackItem_1);
                        newState = immer_1.default(state, function (draft) {
                            var nsp = stackItem_1.namespace, inversePatches = stackItem_1.inversePatches;
                            draft[nsp] = immer_1.applyPatches(draft[nsp], inversePatches);
                        });
                    }
                }
                else if (action.type === namespace + "/redo") {
                    // Execute redo operation
                    var stackItem_2 = inverseStack.pop();
                    if (stackItem_2) {
                        stack.push(stackItem_2);
                        newState = immer_1.default(state, function (draft) {
                            var nsp = stackItem_2.namespace, patches = stackItem_2.patches;
                            draft[nsp] = immer_1.applyPatches(draft[nsp], patches);
                        });
                    }
                }
                else if (action.type === namespace + "/clear") {
                    // Execute clear operation
                    stack = [];
                    inverseStack = [];
                }
                else {
                    newState = reducer(state, action);
                }
                // When the state is changed,
                // determine whether it is canUndo(canRedo) or not.
                return immer_1.default(newState, function (draft) {
                    var canUndo = stack.length > 0;
                    var canRedo = inverseStack.length > 0;
                    if (draft[namespace].canUndo !== canUndo) {
                        draft[namespace].canUndo = canUndo;
                    }
                    if (draft[namespace].canRedo !== canRedo) {
                        draft[namespace].canRedo = canRedo;
                    }
                });
            };
        },
        /**
         * The reducer to set initial state
         */
        extraReducers: (_a = {},
            _a[namespace] = function (state) {
                if (state === void 0) { state = initialState; }
                return state;
            },
            _a),
    };
});
