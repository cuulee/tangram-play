import React from 'react';
import { connect } from 'react-redux';
import EditorTabs from './EditorTabs';
import IconButton from './IconButton';
import DocsPanel from './DocsPanel';
import { initEditor } from '../editor/editor';
import Divider from './Divider';

let docsHasInitAlready = false;

class Editor extends React.PureComponent {
    componentDidMount() {
        // instantiate CodeMirror with the editor container element's
        // DOM node reference
        initEditor(this.editorEl);
    }

    componentDidUpdate() {
        // DocsPanel is only available behind an admin flag.
        // Update after props have determined sign-in, and init docsPanel.
        // Only do this once.
        if (!docsHasInitAlready && this.props.admin) {
            this.docsPanel.init();
            docsHasInitAlready = true;
        }
    }

    render() {
        return (
            /* id='content' is used only as a hook for Divider right now */
            <div className="editor-container" id="content">
                <Divider />
                <EditorTabs />
                <IconButton
                    className="editor-collapse-button"
                    icon="bt-caret-right"
                    tooltip="Hide editor"
                />

                <div className="editor" id="editor" ref={(ref) => { this.editorEl = ref; }} />
                {(() => {
                    if (this.props.admin) {
                        return (
                            <DocsPanel ref={(ref) => { this.docsPanel = ref; }} />
                        );
                    }
                    return null;
                })()}
            </div>
        );
    }
}

Editor.propTypes = {
    admin: React.PropTypes.bool,
};

Editor.defaultProps = {
    admin: false,
};

function mapStateToProps(state) {
    return {
        admin: state.user.admin || false,
    };
}

export default connect(mapStateToProps)(Editor);
