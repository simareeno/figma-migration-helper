import React from 'react';
import ReactDOM from 'react-dom';

import {ThemeProvider} from '@gravity-ui/uikit';

import '@gravity-ui/uikit/styles/styles.css';

interface IState {
    step: 'initial' | 'loading' | 'done';
    data: string;
}

class App extends React.Component<{}, IState> {
    state: IState = {
        step: 'initial',
        data: '',
    };

    render() {
        return (
            <div className="Page">
                123
            </div>
            
        );
    }
}

ReactDOM.render(<ThemeProvider theme="light"><App /></ThemeProvider>, document.getElementById('page'));
