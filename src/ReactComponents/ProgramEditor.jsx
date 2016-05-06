
import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';// this module is imported to get rid of "mispelled options" warning from react-ace

import {Program} from '../Runner/Parsing/Program.js';

/*
ProgramEditor
	A component responsible for the UI of editing a program.
	It has to have a way of communicating/signaling that it produced a new version of the program.
	It is just a top-level/abstract component as it doesn't impose any specific way of editing the program.
	CompositeEditor
		Edits a part of a program using other editors.
	TextFragmentEditor
		Edits a part of a program using the normal text editor.
	LockedView
		A part of the editor that is not being edited right now.
Cursors
	Does it have cursors controlled by the keyboard?
	Does it have mouse interaction?
	If there are multiple types of editors, how do we manage cursors and mouse interaction?
*/
// TODO Handle syntactically invalid text programs.
// TODO Hide ace editor disorientation when the program is updated.



class ProgramEditor extends React.Component {
	//TODO Remove loop of ace editor changes.
	// AceEditor calls onChange both when the user changes the editor and when React re-renders
	// It emits a "delete everything" change followed by a "this is the new contents" change.
	// This behavior breaks Ace's javascript linting.
	// TODO Convert ace editor changes into program changes.
	handleChange(newValue) {
		if(Program.isSyntaticallyCorrect(newValue)) {
			this.props.onValidProgram(Program.fromSourceCode(newValue));
		}
	}
	handlePaste() {
	}
	render() {
		return (
			<AceEditor
				onChange={this.handleChange.bind(this)}
				onPaste={this.handlePaste.bind(this)}
				value={this.props.program.getSourceCode()}
				mode="javascript"
				theme="monokai"
				width="100%"
				height="100%"
				editorProps={{$blockScrolling: Infinity}}/>
		);
	}
}

export default ProgramEditor;