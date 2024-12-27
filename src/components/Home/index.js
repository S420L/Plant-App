import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight, toggleLightState, setToggleIsOn } from '../../data/slice';
import {
  GridContainer,
  LightBox,
  HomeTitle,
  ToggleButton,
  SettingsButton,
  ButtonContainer,
  LightBoxWrapper,
} from './wrappers';

export const Home = () => {
  const allLights = useSelector((state) => state.light.lights || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [visibleLights, setVisibleLights] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const gridRef = useRef(null);

  const loadMoreLights = useCallback(() => {
    const nextPage = currentPage + 1;
    const newLights = allLights.slice(
      nextPage * itemsPerPage,
      (nextPage + 1) * itemsPerPage
    );

    if (newLights.length > 0) {
      setVisibleLights((prev) => [...prev, ...newLights]);
      setCurrentPage(nextPage);
    }
  }, [allLights, currentPage]);

  // Initial load
  useEffect(() => {
    if (allLights.length > 0) {
      setVisibleLights(allLights.slice(0, itemsPerPage));
    }
  }, [allLights]); // Removed `visibleLights` to ensure updates on `allLights` changes

  // Scroll detection
  const handleScroll = useCallback(() => {
    if (!gridRef.current) return;

    const { scrollTop, clientHeight, scrollHeight } = gridRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreLights();
    }
  }, [loadMoreLights]);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('scroll', handleScroll);
      return () => gridElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleBoxClick = (light, index) => {
    dispatch(setCurrentLight(light));
    navigate(`/plantbox/${index + 1}`);
  };

  const handleToggleAll = () => {
    dispatch(toggleLightState());
    dispatch(setToggleIsOn());
  };

  const handleSettingsAllClick = () => {
    navigate('/plantbox/master');
  };

  return (
    <GridContainer ref={gridRef}>
      <HomeTitle>Grow Lights</HomeTitle>
      <ButtonContainer>
        <ToggleButton
          onClick={handleToggleAll}
          toggleIsOn={
            allLights.filter((light) => light.isOn).length > allLights.length / 2
          }
        />
        <SettingsButton onClick={handleSettingsAllClick}>
          Settings (all)
        </SettingsButton>
      </ButtonContainer>
      <div>
        {visibleLights.map((light, index) => (
          <LightBoxWrapper key={light.id}>
            <LightBox onClick={() => handleBoxClick(light, index)} isOn={light.isOn}>
              {light.name || 'Untitled'}
            </LightBox>
          </LightBoxWrapper>
        ))}
      </div>
    </GridContainer>
  );
};
