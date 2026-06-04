import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

// Cache nuke on every page load. iOS Safari (especially) hangs onto stale
// assets across deploys; this kills any service worker registrations and
// CacheStorage entries before React even renders. Fire-and-forget — we
// don't block render on it.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}
if ('caches' in window) {
  caches.keys()
    .then((names) => names.forEach((name) => caches.delete(name)))
    .catch(() => {});
}
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