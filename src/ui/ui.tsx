import React from 'react';
import ReactDOM from 'react-dom';

import {ThemeProvider} from '@gravity-ui/uikit';
import App from './App';

import '@gravity-ui/uikit/styles/styles.css';

interface IState {
    step: 'initial' | 'loading' | 'done';
    data: string;
}

class Application extends React.Component<{}, IState> {
    state: IState = {
        step: 'initial',
        data: '',
    };

    render() {
        return <div className="Page"><App /></div>;
    }
}

ReactDOM.render(<ThemeProvider theme="light"><Application /></ThemeProvider>, document.getElementById('page'));
