import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight, toggleLightState, setToggleIsOn, setViewingIsOn, toggleViewingState, setManualOverride, toggleManualRelease, fetchUnclaimedDevices, claimDevice } from '../../data/slice';
import { logout, getUser, forceRefresh } from '../../data/auth';
import {
  GridContainer,
  LightBox,
  LightBoxName,
  LightBoxStatus,
  ToggleButton,
  SettingsButton,
  ViewingModeButton,
  ButtonContainer,
  ControlRow,
  ControlLabel,
  ActionRow,
  LightBoxWrapper,
  ManualReleaseButton,
  WrapperOng,
  AddLightButton,
  UnclaimedPanel,
  UnclaimedItem,
  UnclaimedMac,
  ClaimButton,
  EmptyUnclaimed,
  LogoutButton,
  HeaderRow,
  HeaderTitle,
} from './wrappers';

export const Home = () => {
  const allLights = useSelector((state) => state.light.lights || []);
  const unclaimedDevices = useSelector((state) => state.light.unclaimedDevices || []);
  const manualOverride = useSelector((state) => state.light.manualOverride || false);
  const [showUnclaimed, setShowUnclaimed] = useState(false);
  const user = getUser();
  console.log(manualOverride);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [visibleLights, setVisibleLights] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const gridRef = useRef(null);

  const loadMoreLights = useCallback(() => {
    console.log("in loadmorelights!@!!");
    console.log(currentPage);
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

  // Re-paginate whenever allLights changes (including down to zero).
  useEffect(() => {
    setCurrentPage(0);
    setVisibleLights(allLights.slice(0, itemsPerPage));
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
    dispatch(toggleManualRelease());
    dispatch(setManualOverride());
  };

  const handleSettingsAllClick = () => {
    navigate('/plantbox/master');
  };

  const handleViewingMode = () => {
    dispatch(toggleViewingState());
    dispatch(setViewingIsOn());
  };

  const handleToggleUnclaimed = () => {
    const next = !showUnclaimed;
    setShowUnclaimed(next);
    if (next) dispatch(fetchUnclaimedDevices());
  };

  const handleClaim = (mac) => {
    const nickname = window.prompt(`Name for ${mac}?`, mac);
    if (nickname === null) return;
    dispatch(claimDevice({ mac, nickname: nickname.trim() || null }));
  };

  const lightsOnCount = allLights.filter((light) => light.isOn).length;
  const majorityOn = lightsOnCount > allLights.length / 2;

  return (
    <WrapperOng>
      <HeaderRow>
        <HeaderTitle>{user?.username ? `${user.username}'s Grow Lights` : 'Grow Lights'}</HeaderTitle>
        <LogoutButton onClick={forceRefresh} title="Force cache clear + reload">↻</LogoutButton>
        <LogoutButton onClick={logout}>Sign out</LogoutButton>
      </HeaderRow>
      <ButtonContainer>
        <ControlRow>
          <ControlLabel>ON / OFF (all)</ControlLabel>
          <ToggleButton onClick={handleToggleAll} toggleIsOn={majorityOn} />
        </ControlRow>
        <ControlRow>
          <ControlLabel>Viewing Mode</ControlLabel>
          <ViewingModeButton
            onClick={handleViewingMode}
            viewingIsOn={false}
          />
        </ControlRow>
        <ActionRow>
          <ManualReleaseButton onClick={handleManualRelease} toggleManualOverride={manualOverride}>
            Manual Release
          </ManualReleaseButton>
          <SettingsButton onClick={handleSettingsAllClick}>
            Settings (all)
          </SettingsButton>
        </ActionRow>
        <AddLightButton onClick={handleToggleUnclaimed}>
          {showUnclaimed ? 'Hide unclaimed lights' : '+ Add Light'}
        </AddLightButton>
        {showUnclaimed && (
          <UnclaimedPanel>
            {unclaimedDevices.length === 0 ? (
              <EmptyUnclaimed>No unclaimed devices found. Power up a light or register one.</EmptyUnclaimed>
            ) : (
              unclaimedDevices.map((d) => (
                <UnclaimedItem key={d.mac}>
                  <UnclaimedMac>{d.mac}</UnclaimedMac>
                  <ClaimButton onClick={() => handleClaim(d.mac)}>Claim</ClaimButton>
                </UnclaimedItem>
              ))
            )}
          </UnclaimedPanel>
        )}
      </ButtonContainer>

      <GridContainer ref={gridRef}>
        {visibleLights.map((light, index) => (
          <LightBoxWrapper key={light.id || index}>
            <LightBox onClick={() => handleBoxClick(light, index)} isOn={light.isOn} ip={light.ip}>
              <LightBoxName>{light.name || 'Untitled'}</LightBoxName>
              <LightBoxStatus isOn={light.isOn}>{light.isOn ? 'ON' : 'OFF'}</LightBoxStatus>
            </LightBox>
          </LightBoxWrapper>
        ))}
      </GridContainer>
    </WrapperOng>
  );
};
