import { Patch } from 'immer';
import { AnyAction } from 'redux';
export interface IUndoRedoState {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
}
export interface IDvaUndoRedoPluginOptions {
    namespace: string;
    include: string[];
    limit?: number;
}
export interface IPatchStack {
    patches: Patch[];
    inversePatches: Patch[];
    namespace: string;
}
declare const _default: <IState = any>(options?: IDvaUndoRedoPluginOptions) => {
    /**
     * Make sure that every reducer is wrapped by immer.
     * At the same time, we collect patches
     *
     * @param {Function} reducer
     * @return {Function}
     */
    _handleActions(handlers: {
        [k: string]: Function;
    }, defaultState: any): (state: any, action: AnyAction) => any;
    /**
     * High-Order reducer to undo or redo
     *
     * @param {Function} redux's reducer
     * @return {Function} redux's reducer
     */
    onReducer(reducer: Function): (state: IState, action: AnyAction) => IState;
    /**
     * The reducer to set initial state
     */
    extraReducers: {
        [x: string]: (state?: IUndoRedoState) => IUndoRedoState;
    };
};
export default _default;
