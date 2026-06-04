import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { PlantBox } from './components/PlantBox';
import { Login } from './components/Login';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { fetchUserDevices } from './data/slice';

/* Full-viewport centering shell — only visible on desktop */
const Shell = styled.div`
  display: block;
  width: 100%;
  min-height: 100dvh;
  background: #0d1117;

  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    min-height: unset;
  }
`;

/* The app viewport — full-screen on mobile, phone-frame on desktop */
const PhoneApp = styled.div`
  width: 100%;
  max-width: 100%;
  min-height: 100dvh;
  background: #0d1117;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-x: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.10),
    0 0 0 9px #12161e,
    0 0 0 10px rgba(255, 255, 255, 0.05),
    0 8px 30px rgba(0, 0, 0, 0.6);

  @media (min-width: 768px) {
    width: 375px;
    height: 812px;
    min-height: unset;
    border-radius: 44px;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.10),
      0 0 0 14px #12161e,
      0 0 0 16px rgba(255, 255, 255, 0.05),
      0 40px 100px rgba(0, 0, 0, 0.9),
      0 20px 40px rgba(0, 0, 0, 0.6);

    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const App = () => {
  const dispatch = useDispatch();
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('plantapp-token'));

  useEffect(() => {
    if (authed) dispatch(fetchUserDevices());
  }, [authed, dispatch]);

  if (!authed) {
    return (
      <Shell>
        <PhoneApp>
          <Login onLogin={() => setAuthed(true)} />
        </PhoneApp>
      </Shell>
    );
  }

  return (
    <Router>
      <Shell>
        <PhoneApp>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plantbox/:id" element={<PlantBox />} />
          </Routes>
        </PhoneApp>
      </Shell>
    </Router>
  );
};
