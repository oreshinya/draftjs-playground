import 'babel-polyfill';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'node-uuid';
import {Editor, EditorState, ContentState, convertToRaw} from 'draft-js';

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
const updateEntity = (entity) => {
  state = Object.assign({}, state, {
    items: Object.assign({}, state.items, {[entity.id]: entity})
  });
};
const addListener = (listener) => {
  listeners.push(listener);
};

[
  {name: 'hoge @oreshinya #bug', label: 'bug', assignee: 'oreshinya'},
  {name: 'fuga @tera #enhancement', label: 'enhancement', assignee: 'tera'},
  {name: 'piyo @tera #bug', label: 'bug', assignee: 'tera'}
].forEach((data) => {
  createEntity(data);
});

window.hoge = () => {
  return state;
};

class ItemEditor extends Component {
  constructor(props) {
    super(props);
    const item = props.item;
    const contentState = ContentState.createFromText(item.name);
    this.state = {
      editorState: EditorState.createWithContent(contentState, decorator)
    };
  }

  onChange = (editorState) => {
    const name = editorState.getCurrentContent().getPlainText();
    const { item } = this.props;
    updateEntity(Object.assign({}, item, { name }));
    this.setState({editorState});
  };

  render() {
    const { editorState } = this.state;
    return (
      <Editor
        editorState={editorState}
        onChange={this.onChange}
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
        <div onClick={this._addItem}>Add item</div>
        <div>
          {items.map(this._renderItem)}
        </div>
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

  _addItem() {
    createEntity({name: 'Some name @kwmt'});
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
