import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight } from '../../data/slice';
import { GridContainer, LightBox, HomeTitle } from './wrappers';

export const Home = () => {
  const lights = useSelector((state) => state.light.lights || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleBoxClick = (light, index) => {
    dispatch(setCurrentLight(light)); // Set the clicked light as currentLight
    navigate(`/plantbox/${index + 1}`); // Navigate to the new dynamic route
  };

  return (
    <GridContainer>
      <HomeTitle>Manage Your Grow Lights</HomeTitle>
      {lights.map((light, index) => (
        <LightBox key={index} onClick={() => handleBoxClick(light, index)}>
          {light.name}
        </LightBox>
      ))}
    </GridContainer>
  );
};
