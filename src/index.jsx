import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {Editor, EditorState} from 'draft-js';

class MyEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
  }
  render() {
    const {editorState} = this.state;
    return <Editor editorState={editorState} onChange={this.onChange} />;
  }
}

const App = () => {
  return (
    <div>
      <h1>Draftjs Playground</h1>
      <MyEditor />
    </div>
  );
};

window.addEventListener('load', () => {
  const el = document.querySelector('#app');
  ReactDOM.render(<App />, el);
});
