import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight, toggleLightState, setToggleIsOn } from '../../data/slice';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { GridContainer, LightBox, HomeTitle, ToggleButton, SettingsButton, LightBoxWrapper } from './wrappers';

export const Home = () => {
  const lights = useSelector((state) => state.light.lights || []);
  const areMajorityLightsOn = lights.filter((light) => light.isOn).length >= lights.length / 2;
  const toggleIsOn = useSelector((state) => state.light.toggleIsOn);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isItemLoaded = (index) => index < lights.length;
  const loadMoreItems = () => {};


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
    <GridContainer>
      <HomeTitle>Grow Lights</HomeTitle>
      <ToggleButton onClick={handleToggleAll} toggleIsOn={areMajorityLightsOn}></ToggleButton>
      <SettingsButton onClick={handleSettingsAllClick}>Settings (all)</SettingsButton>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={lights.length}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
          height={window.innerHeight}
          itemCount={lights.length}
          itemSize={160}
          onItemsRendered={({ overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex }) => {
            console.log(`Visible: ${visibleStartIndex} to ${visibleStopIndex}`);
            console.log(`Overscan: ${overscanStartIndex} to ${overscanStopIndex}`);
            onItemsRendered({ overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex });
          }}
          ref={ref}
          itemKey={(index) => lights[index]?.id || index}
        >
          {({ index, style }) => {
            const light = lights[index];
            if (!light) return null;
        
            return (
              <LightBoxWrapper>
                <LightBox
                  onClick={() => handleBoxClick(light, index)}
                  isOn={light.isOn}
                >
                  {light.name}
                </LightBox>
              </LightBoxWrapper>
            );
          }}
        </List>
        
        )}
      </InfiniteLoader>
    </GridContainer>
  );
};
