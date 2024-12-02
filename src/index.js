import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
//import { HelmetProvider } from 'react-helmet-async';
//import { BrowserRouter } from 'react-router-dom';
//import { ThemeProvider } from 'styled-components';
//import ReactModal from 'react-modal';
import { App } from './App';
import store from './data/store';
//import { GlobalStyle } from './shared/globalStyle';
//import themePrimary from './shared/themePrimary';

const container = document.getElementById('root');
const root = createRoot(container);
//ReactModal.setAppElement(container);


root.render(
  <Provider store={store}>
    <React.StrictMode>
        <App />
    </React.StrictMode>
  </Provider>
  );

/*root.render(
  <Provider store={store}>
    <LanguageProvider defaultLocale="en">
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider theme={themePrimary}>
            <React.StrictMode>
              <App />
            </React.StrictMode>
            <GlobalStyle />
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </LanguageProvider>
  </Provider>,
);*/