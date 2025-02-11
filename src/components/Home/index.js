import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight, toggleLightState, setToggleIsOn, setViewingIsOn, toggleViewingState, setManualOverride, toggleManualRelease } from '../../data/slice';
import {
  GridContainer,
  LightBox,
  HomeTitle,
  ToggleButton,
  SettingsButton,
  ViewingModeButton, // Add new styled button
  ButtonContainer,
  LightBoxWrapper,
  ManualReleaseButton,
  WrapperOng,
} from './wrappers';

export const Home = () => {
  const allLights = useSelector((state) => state.light.lights || []);
  const manualOverride = useSelector((state) => state.light.manualOverride || false);
  console.log(manualOverride);
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
  }, [allLights]);

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
  const handleManualRelease = () => {
    dispatch(toggleManualRelease())
    dispatch(setManualOverride());
  };

  const handleSettingsAllClick = () => {
    navigate('/plantbox/master');
  };

  const handleViewingMode = () => {
    dispatch(toggleViewingState());
    dispatch(setViewingIsOn());
  };

  return (
    <WrapperOng>
    <ButtonContainer>
        ON/OFF switch (all)
        <ToggleButton
          onClick={handleToggleAll}
          toggleIsOn={
            allLights.filter((light) => light.isOn).length > allLights.length / 2
          }
        />
        Viewing Mode
        <ViewingModeButton
          onClick={handleViewingMode}
          viewingIsOn={
            allLights.filter((light) => light.ip==="192.168.0.137")[0].isOn
          }
        />
        <ManualReleaseButton onClick={handleManualRelease} toggleManualOverride={manualOverride}>
          Manual Release
        </ManualReleaseButton>
        <SettingsButton onClick={handleSettingsAllClick}>
          Settings (all)
        </SettingsButton>
      </ButtonContainer>
    <GridContainer ref={gridRef}>
      
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
    </WrapperOng>
  );
};
