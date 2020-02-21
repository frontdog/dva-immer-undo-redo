# dva-immer-undo-redo

A plugin of dva to support undo redo based on [Immer](https://immerjs.github.io/immer/docs/introduction). :clap
## Install

```bash
$ npm install dva-immer-undo-redo --save
```

## Usage

```javascript
import createUndoRedo from 'dva-immer-undo-redo';

const app = dva();
app.use(createUndoRedo(options));
```

### options

- `options.namespace`: property key on global state, type String, Default `timeline`
- `options.include`: namespaces that you want to include in the timeline. Default `[]`
- `options.limit`: the max times to undo or redo, Default `1024`

### Undo
```js
dispatch({ type: 'timeline/undo' });
```

### Redo
```js
dispatch({ type: 'timeline/redo' });
```

### Clear all undo redo status
```js
dispatch({ type: 'timeline/clear' });
```

### Replace timeline
```js
// state of count's model
{
    count: 0,
}
// add reducer
add(state) {
    state.count += 1;
}
dispatch({ type: 'count/add' }); // { count: 1 }
dispatch({ type: 'count/add' }); // { count: 2 }
dispatch({ type: 'count/add', replace: true }); // { count: 3 }
dispatch({ type: 'timeline/undo' }); // { count: 1 }
dispatch({ type: 'timeline/redo' }); // { count: 3 }
```

### Clear timeline
```js
// state of count's model
{
    count: 0,
}
// add reducer
add(state) {
    state.count += 1;
}
dispatch({ type: 'count/add' }); // { count: 1 }
dispatch({ type: 'count/add' }); // { count: 2 }
dispatch({ type: 'count/add', clear: true }); // { canRedo: false, canUndo: false }
```

## State Structure

```
timeline: {
  canRedo: false,
  canUndo: false,
  undoCount: 0,
  redoCount: 0,
}
```

## License

[MIT](https://tldrlegal.com/license/mit-license)
