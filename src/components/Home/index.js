import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentLight, toggleLightState, setToggleIsOn } from '../../data/slice';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { GridContainer, LightBox, HomeTitle, ToggleButton } from './wrappers';

export const Home = () => {
  const lights = useSelector((state) => state.light.lights || []);
  const toggleIsOn = useSelector((state) => state.light.toggleIsOn);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isItemLoaded = (index) => index < lights.length;
  const loadMoreItems = () =>
    new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

  const handleBoxClick = (light, index) => {
    dispatch(setCurrentLight(light));
    navigate(`/plantbox/${index + 1}`);
  };

  const handleToggleAll = () => {
      dispatch(toggleLightState());
      dispatch(setToggleIsOn());
  };

  return (
    <GridContainer>
      <HomeTitle>Grow Lights</HomeTitle>
      <ToggleButton onClick={handleToggleAll} toggleIsOn={toggleIsOn}>
      </ToggleButton>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={lights.length + 10}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            height={window.innerHeight - 20}
            itemCount={lights.length}
            itemSize={140}
            width="80vw"
            onItemsRendered={onItemsRendered}
            ref={ref}
          >
            {({ index, style }) => {
              const light = lights[index];
              if (!light) return null;

              return (
                <LightBox
                  onClick={() => handleBoxClick(light, index)}
                  style={style}
                  isOn={light.isOn}
                >
                  {light.name}
                </LightBox>
              );
            }}
          </List>
        )}
      </InfiniteLoader>
    </GridContainer>
  );
};
