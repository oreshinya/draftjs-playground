import 'babel-polyfill';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'node-uuid';
import {
  Editor,
  EditorState,
  ContentState,
  convertToRaw,
  getDefaultKeyBinding,
  DefaultDraftBlockRenderMap,
  EditorBlock
} from 'draft-js';
import isEmpty from 'lodash/isEmpty';
import compact from 'lodash/compact';
import { Map } from 'immutable';

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
  listeners.forEach((listener) => {
    listener(state);
  });
};
const destroyEntity = (entity) => {
  const itemState = Object.assign({}, state.items);
  delete itemState[entity.id];
  state = Object.assign({}, state, { items: itemState });
  listeners.forEach((listener) => {
    listener(state);
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

const RenderMap = Map({
  'check-list-item': {
    element: 'div'
  }
}).merge(DefaultDraftBlockRenderMap);

const myKeyBindingFn = (e) => {
  if (e.keyCode === 8 && isEmpty(e.target.textContent)) {
    return 'destroyItem';
  }
  return getDefaultKeyBinding(e);
};

const getDefaultBlockData = (blockType, initialData={}) => {
  switch(blockType) {
    case 'check-list-item': return { checked: false };
    default: return initialData;
  }
};

export const getCurrentBlock = (editorState) => {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(selectionState.getStartKey());
  return block;
};

export const resetBlockWithType = (editorState, newType='unstyled') => {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const key = selectionState.getStartKey();
  const blockMap = contentState.getBlockMap();
  const block = blockMap.get(key);

  let newText = "";
  let text = block.getText();
  if (block.getLength() >= 2) {
    newText = text.substr(1);
  }
  const newBlock = block.merge({
    text: newText,
    type: newType,
    data: getDefaultBlockData(newType),
  });
  const newContentState = contentState.merge({
    blockMap: blockMap.set(key, newBlock),
    selectionAfter: selectionState.merge({
      anchorOffset: 0,
      focusOffset: 0,
    }),
  });
  return EditorState.push(editorState, newContentState, 'change-block-type');
};


window.hoge = () => {
  return state;
};

class CheckListItem extends Component {
  render() {
    const data = this.props.block.getData();
    const checked = data.get('checked') === true ? true : false;
    return (
      <div>
        <input type="checkbox" style={{
          cursor: 'pointer',
          float: 'left',
          position: 'relative',
          top: '4px',
          left: '-4px'
        }} checked={ checked } />
        <EditorBlock {...this.props} />
      </div>
    );
  }
}

const blockRenderer = (contentBlock) => {
  const type = contentBlock.getType();
  switch (type) {
    case 'check-list-item':
      return {
        component: CheckListItem
      };
    default:
      return null;
  }
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
    console.log('onChange');
    const name = editorState.getCurrentContent().getPlainText();
    const { item } = this.props;
    updateEntity(Object.assign({}, item, { name }));
    this.setState({editorState});
  };

  onCommand = (command) => {
    if (command !== 'destroyItem') { return false; }
    const { item } = this.props;
    destroyEntity(item);
    return true;
  };

  onBeforeInput = (str) => {
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    const block = getCurrentBlock(editorState);
    const blockType = block.getType();
    const blockLength = block.getLength();
    if (selection.getAnchorOffset() > 1 || blockLength > 1) {
      return false;
    }
    const mapping = {'[]': 'check-list-item'};
    const blockTo = mapping[block.getText()[0] + str];
    if (!blockTo) { return false; }

    const finalType = blockTo.split(':');
    if (finalType.length < 1 || finalType.length > 3) {
      return false;
    }
    let fType = finalType[0];
    if (finalType.length == 1) {
      if (blockType == finalType[0]) {
        return false;
      }
    } else if (finalType.length == 2) {
      if (blockType == finalType[1]) {
        return false;
      }
      if (blockType == finalType[0]) {
        fType = finalType[1];
      }
    } else if (finalType.length == 3) {
      if (blockType == finalType[2]) {
        return false;
      }
      if (blockType == finalType[0]) {
        fType = finalType[1];
      } else {
        fType = finalType[2];
      }
    }
    this.onChange(resetBlockWithType(editorState, fType));
    return true;
  };

  render() {
    const { editorState } = this.state;
    return (
      <Editor
        editorState={editorState}
        onChange={this.onChange}
        handleKeyCommand={this.onCommand}
        keyBindingFn={myKeyBindingFn}
        blockRendererFn={blockRenderer}
        handleBeforeInput={this.onBeforeInput}
        blockRenderMap={RenderMap}
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
    const items = compact(stateSource.ids.map((id) => {
      return stateSource.items[id];
    }));
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
