import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Home } from './components/Home';
import { PlantBox } from './components/PlantBox';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'APP/INIT_FETCH_PIN_STATES' }); // Trigger fetching pin states on app load
  }, [dispatch]);

  return (
    <Router>
      <Wrapper>
        <Routes>
          {/* Home route */}
          <Route path="/" element={<Home />} />

          {/* Single dynamic route to handle all plantbox pages */}
          <Route path="/plantbox/:id" element={<PlantBox />} />
        </Routes>
      </Wrapper>
    </Router>
  );
};
