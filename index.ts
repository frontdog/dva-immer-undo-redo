
import immer, { applyPatches, Patch } from 'immer';
import { AnyAction } from 'redux';

export interface IUndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
}

export interface IDvaUndoRedoPluginOptions {
  namespace: string
  include: string[]
  limit?: number
}

export interface IPatchStack {
  patches: Patch[]
  inversePatches: Patch[]
  namespace: string
}

const defaultOptions: IDvaUndoRedoPluginOptions = {
  namespace: 'timeline',
  include: [],
  limit: 1024,
};

const initialState: IUndoRedoState = {
  canUndo: false,
  canRedo: false,
};

export default <IState = any>(options: IDvaUndoRedoPluginOptions = defaultOptions) => {
  const newOptions = { ...defaultOptions, ...options };
  const { namespace } = newOptions;
  let stack: IPatchStack[] = [];
  let inverseStack: IPatchStack[] = [];

  return {
    /**
     * Make sure that every reducer is wrapped by immer.
     * At the same time, we collect patches
     *
     * @param {Function} reducer
     * @return {Function}
     */
    _handleActions(handlers: { [k: string]: Function }, defaultState: any) {
      return (state = defaultState, action: AnyAction) => {
        const { type } = action;

        const result = immer(state, (draft: any) => {
          const handler = handlers[type];
          if (typeof handler === 'function') {
            const compatiableRet = handler(draft, action);
            if (compatiableRet !== undefined) {
              return compatiableRet;
            }
          }
        }, (patches: Patch[], inversePatches: Patch[]) => {
          // Only record the action whose namespace is in the include array.
          if (patches.length) {
            const namespace = type.split('/')[0];
            // Namespace with '@@' will be filtered because of some dva's plugin(dva-loading)
            if (newOptions.include.includes(namespace) && !namespace.includes('@@')) {
              // Clear the redo stack when a new change comes.
              inverseStack = [];
              // Make sure the length of changes is less than options.limit
              stack = stack.slice(-<number>newOptions.limit);
              if (action.clear === true) {
                stack = [];
              } else if (action.replace === true) {
                stack.pop();
              }
              if (action.escape !== true && action.clear !== true) {
                stack.push({ namespace, patches, inversePatches });
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
    onReducer(reducer: Function) {
      return (state: IState, action: AnyAction) => {
        let newState: IState = state;
        // Execute undo operation
        if (action.type === `${namespace}/undo`) {
          const stackItem = stack.pop();
          if (stackItem) {
            inverseStack.push(stackItem);
            newState = immer(state, (draft: any) => {
              const { namespace: nsp, inversePatches } = stackItem;
              draft[nsp] = applyPatches(draft[nsp], inversePatches);
            });
          }
        } else if (action.type === `${namespace}/redo`) {
          // Execute redo operation
          const stackItem = inverseStack.pop();
          if (stackItem) {
            stack.push(stackItem);
            newState = immer(state, (draft: any) => {
              const { namespace: nsp, patches } = stackItem;
              draft[nsp] = applyPatches(draft[nsp], patches);
            });
          }
        } else if (action.type === `${namespace}/clear`) {
          // Execute clear operation
          stack = [];
          inverseStack = [];
        } else {
          newState = reducer(state, action);
        }
        // When the state is changed,
        // determine whether it is canUndo(canRedo) or not.
        return immer(newState, (draft: any) => {
          const canUndo = stack.length > 0;
          const canRedo = inverseStack.length > 0;
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
    extraReducers: {
      [namespace](state = initialState) {
        return state;
      }
    },
  };
};
