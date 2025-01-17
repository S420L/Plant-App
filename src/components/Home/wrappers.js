import styled from 'styled-components';

export const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  width: 100%; /* Ensures full width for responsiveness */
  max-width: 1200px; /* Optional: Limit max width for larger screens */
  background-color: #f9f9f9;
  height: 69vh; /* Full screen height */
  overflow-y: auto; /* Enable scrolling for dynamic content */
  overflow-x: hidden; /* Prevent horizontal scrolling */
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 5px 10px; /* Adjust padding for smaller screens */
  }
`;

export const LightBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px; /* Space between items */
`;

export const LightBox = styled.div`
  width: 250px; /* Fixed width for stability */
  height: 160px; /* Matches item size */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (props.isOn ? '#d4ffd4' : '#ffd4d4')};
  border: 2px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s;
  margin: 0 auto;

  @media (min-width: 768px) {
    width: 20vw; /* Dynamic width for medium screens */
    height: 20vh; /* Dynamic height for medium screens */
  }

  &:hover {
    transform: translateY(-5px);
    background-color: #e6f7ff;
  }
`;

export const HomeTitle = styled.h1`
  font-size: 1.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 20px; /* Add spacing between title and buttons */
  z-index: 1; /* Ensure it appears above any overlapping content */

  @media (max-width: 768px) {
    font-size: 1.2rem; /* Adjust for mobile screens */
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px; /* Add spacing between buttons */
  margin-bottom: 20px; /* Add spacing below the buttons */
  z-index: 1; /* Ensure it stays above the grid content */
`;

export const ToggleButton = styled.button`
  display: inline-block;
  width: 50px;
  height: 25px;
  background-color: ${(props) => (props.toggleIsOn ? '#4caf50' : '#ccc')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative; /* Needed for proper alignment of the pseudo-element */
  overflow: hidden; /* Ensures the pseudo-element doesn't extend outside the button */

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    position: absolute; /* Aligns relative to the button */
    top: 2.5px; /* Centers vertically within the button */
    left: ${(props) => (props.toggleIsOn ? 'calc(100% - 23px)' : '2.5px')}; /* Toggles position */
    transition: left 0.3s;
  }

  &:hover {
    background-color: ${(props) => (props.toggleIsOn ? '#45a049' : '#bbb')};
  }

  &:active::before {
    width: 22px;
    height: 22px;
  }
`;

export const SettingsButton = styled.button`
  display: inline-block;
  width: auto;
  padding: 6px 12px;
  background-color: #4caf50;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #45a049;
    transform: translateY(-2px);
  }

  &:active {
    background-color: #3d8b41;
    transform: translateY(1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 3px #4caf50;
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 10px;
  }
`;

export const ViewingModeButton = styled.button`
  display: inline-block;
  width: 50px;
  height: 25px;
  background-color: ${(props) => (props.viewingIsOn ? '#4caf50' : '#ccc')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative; /* Needed for proper alignment of the pseudo-element */
  overflow: hidden; /* Ensures the pseudo-element doesn't extend outside the button */

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    position: absolute; /* Aligns relative to the button */
    top: 2.5px; /* Centers vertically within the button */
    left: ${(props) => (props.viewingIsOn ? 'calc(100% - 23px)' : '2.5px')}; /* Toggles position */
    transition: left 0.3s;
  }

  &:hover {
    background-color: ${(props) => (props.viewingIsOn ? '#45a049' : '#bbb')};
  }

  &:active::before {
    width: 22px;
    height: 22px;
  }
`;