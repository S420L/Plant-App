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
  justify-content: flex-start;
  height: 93vh;
  /*background-color: #f0f0f0;*/

  border: 8px solid #d4d4d4;
  border-radius: 12px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2), 
              -4px -4px 8px rgba(255, 255, 255, 0.7);
  background-color: #f9f9f9;
  overflow: hidden; /* Prevents content from spilling over the border */

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
