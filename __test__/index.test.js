import dva from 'dva';
import createUndoRedo from '../index.js';

function getApp(options) {
  const app = dva();

  app.use(createUndoRedo(options));

  app.model({
    namespace: 'count',
    state: { value: 0 },
    reducers: {
      add(state) {
        state.value += 1;
      },
    },
  });

  app.model({
    namespace: 'content',
    state: { value: 0 },
    reducers: {
      add(state) {
        state.value += 1;
      },
    },
  });

  app.router(() => 1);
  app.start();
  return app;
}

describe('dva-immer-undo-redo', () => {
  it(`options.namespace's default value is 'timeline'.`, () => {
    const app = getApp();
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: false,
      redoCount: 0,
      undoCount: 0,
    });
  });

  it(`options.namespace can be set.`, () => {
    const app = getApp({ namespace: 'other' });
    expect(app._store.getState().other).toEqual({
      canRedo: false,
      canUndo: false,
      redoCount: 0,
      undoCount: 0,
    });
  });

  it(`options.include`, () => {
    const app = getApp({ include: ['content'] });
    app._store.dispatch({ type: 'count/add' });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: false,
      redoCount: 0,
      undoCount: 0,
    });
    app._store.dispatch({ type: 'content/add' });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 1,
    });
  });

  it(`options.limit`, () => {
    let app = getApp({ include: ['content'] });
    for (let i = 0; i < 2000; i++) {
      app._store.dispatch({ type: 'content/add' });
    }
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 1024,
    });
    app = getApp({ include: ['content'], limit: 50 });
    for (let i = 0; i < 2000; i++) {
      app._store.dispatch({ type: 'content/add' });
    }
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 50,
    });
  });

  it(`undo and redo`, () => {
    const app = getApp({ include: ['content'] });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add' });
    expect(app._store.getState().content).toEqual({
      value: 3
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 3,
    });
    app._store.dispatch({ type: 'timeline/undo' });
    expect(app._store.getState().content).toEqual({
      value: 2
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: true,
      canUndo: true,
      redoCount: 1,
      undoCount: 2,
    });
    app._store.dispatch({ type: 'timeline/undo' });
    app._store.dispatch({ type: 'timeline/undo' });
    app._store.dispatch({ type: 'timeline/undo' });
    app._store.dispatch({ type: 'timeline/undo' });
    expect(app._store.getState().content).toEqual({
      value: 0
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: true,
      canUndo: false,
      redoCount: 3,
      undoCount: 0,
    });
    app._store.dispatch({ type: 'timeline/redo' });
    expect(app._store.getState().content).toEqual({
      value: 1
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: true,
      canUndo: true,
      redoCount: 2,
      undoCount: 1,
    });
    app._store.dispatch({ type: 'content/add' });
    expect(app._store.getState().content).toEqual({
      value: 2
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 2,
    });
  });

  it(`action.replace`, () => {
    const app = getApp({ include: ['content'] });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add', replace: true });
    expect(app._store.getState().content).toEqual({
      value: 3
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 2,
    });
    app._store.dispatch({ type: 'timeline/undo' });
    expect(app._store.getState().content).toEqual({
      value: 1
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: true,
      canUndo: true,
      redoCount: 1,
      undoCount: 1,
    });
    app._store.dispatch({ type: 'timeline/undo' });
    expect(app._store.getState().content).toEqual({
      value: 0
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: true,
      canUndo: false,
      redoCount: 2,
      undoCount: 0,
    });
    app._store.dispatch({ type: 'timeline/redo' });
    app._store.dispatch({ type: 'timeline/redo' });
    expect(app._store.getState().content).toEqual({
      value: 3
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: true,
      redoCount: 0,
      undoCount: 2,
    });
  });

  it(`action.clear`, () => {
    const app = getApp({ include: ['content'] });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add' });
    app._store.dispatch({ type: 'content/add', clear: true });
    expect(app._store.getState().content).toEqual({
      value: 3
    });
    expect(app._store.getState().timeline).toEqual({
      canRedo: false,
      canUndo: false,
      redoCount: 0,
      undoCount: 0,
    });
  });
});

