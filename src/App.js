import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home } from './components/Home';
import { PlantBox } from './components/PlantBox';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  background-color: #f0f0f0;
`;

export const App = () => {
  const lights = useSelector((state) => state.light.lights || []);

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
