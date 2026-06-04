import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import axios from 'axios';
import { lightReducer } from './slice';
import rootSaga from './saga';

// Restore the bearer token from localStorage on every page load.
// This runs before any API call so authenticated requests "just work"
// for a returning user without needing to sign in again.
const storedToken = localStorage.getItem('plantapp-token');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// On 401 from an authenticated endpoint, the token is invalid/expired —
// clear it and reload, which sends the user back to the login screen.
// EXCEPTION: don't auto-reload for /api/auth/* — those are the login and
// register endpoints, which legitimately return 401 on bad credentials, and
// the Login component needs to surface that error to the user.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/api/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('plantapp-token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    light: lightReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;
