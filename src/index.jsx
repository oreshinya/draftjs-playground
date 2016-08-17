import 'babel-polyfill';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'node-uuid';
import {Editor, EditorState, ContentState} from 'draft-js';

import decorator from 'decorator';

let state = {items: {}, ids: []};
const listeners = [];
const createEntity = (data) => {
  const entity = Object.assign({}, data, {id: uuid.v4()});
  state = Object.assign({}, state, {
    items: Object.assign({}, state.items, {[entity.id]: entity}),
    ids: state.ids.concat([entity.id])
  });
  listeners.forEach((listener) => {
    listener(state);
  });
};
const addListener = (listener) => {
  listeners.push(listener);
};

[
  {name: 'hoge', label: 'bug', assignee: 'oreshinya'},
  {name: 'fuga', label: 'enhancement', assignee: 'tera'},
  {name: 'piyo', label: 'bug', assignee: 'tera'}
].forEach((data) => {
  createEntity(data);
});

class ItemEditor extends Component {
  constructor(props) {
    super(props);
    const item = props.item;
    const text = `${item.name} @${item.assignee} #${item.label}`;
    const contentState = ContentState.createFromText(text);
    this.state = {
      editorState: EditorState.createWithContent(contentState, decorator)
    };
  }
  render() {
    const { editorState } = this.state;
    return (
      <Editor
        editorState={editorState}
      />
    );
  }
}

class Item extends Component {
  render() {
    const { item } = this.props;
    return (
      <div>
        <ItemEditor item={item} />
      </div>
    );
  }
}

class ItemList extends Component {
  constructor(props) {
    super(props);
    this.state = this._createComponentState(state);
  }

  componentDidMount() {
    addListener(::this._onStateChange);
  }

  render() {
    const { items } = this.state;
    return (
      <div>
        {items.map(this._renderItem)}
      </div>
    );
  }

  _renderItem(item) {
    return (
      <Item
        key={item.id}
        item={item}
      />
    );
  }

  _createComponentState(stateSource) {
    const items = stateSource.ids.map((id) => {
      return stateSource.items[id];
    });
    return { items };
  }

  _onStateChange(stateSource) {
    this.setState(this._createComponentState(stateSource));
  }
}

window.hoge = state;
const App = () => {
  return (
    <div>
      <h1>Draftjs Playground</h1>
      <ItemList />
    </div>
  );
};

window.addEventListener('load', () => {
  const el = document.querySelector('#app');
  ReactDOM.render(<App />, el);
});
