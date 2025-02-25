import styled from 'styled-components';

export const WrapperOng = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 94vh;
  width: 95vw;
  background-color: #e0e0e0;  /* Background inside the border */
  border: 8px solid #9e9e9e;  /* Distinct border color */
  position: relative;
  border-radius: 20px;  /* Curved corners for the main container */
  overflow: hidden;

  /* Outer shadow for overall lift */
  box-shadow: 
    6px 6px 12px rgba(0, 0, 0, 0.3), 
    -6px -6px 12px rgba(255, 255, 255, 0.7);

  /* Pseudo-element to create the 3D curved border effect */
  &::before {
    content: '';
    position: absolute;
    top: 8px;     /* Move inside the border */
    left: 8px;
    right: 8px;
    bottom: 8px;
    border-radius: 12px;  /* Slightly smaller radius to fit inside the border */
    background: linear-gradient(145deg, #d0d0d0, #f0f0f0);  /* Lighter gradient for inner area */
    box-shadow: 
      inset 4px 4px 8px rgba(0, 0, 0, 0.2),   /* Inner shadows to add depth */
      inset -4px -4px 8px rgba(255, 255, 255, 0.8);  /* Highlight for convex effect */
    z-index: -1;  /* Ensure the pseudo-element is behind the content */
  }

  @media (min-width: 1420px) {
    width: 25vw;
  }
`;


export const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  width: 22vw;
  height: 62vh;
  max-width: 1200px; /* Optional: Limit max width for larger screens */
  background-color: #eeeeee;
  border: 4px solid #b0b0b0;  /* Darker border for contrast */
border-radius: 10px;



  overflow-y: auto; /* Enable scrolling for dynamic content */
  overflow-x: hidden; /* Prevent horizontal scrolling */
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 5px 5px; /* Adjust padding for smaller screens */
    width: 75vw;
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
  background-color: ${(props) =>
                        props.ip === "192.168.0.154"
                          ? props.isOn
                            ? "#d4d4ff" // Light blue when on
                            : "#ffffd4" // Light yellow when off
                          : props.isOn
                          ? "#d4ffd4" // Light green when on
                          : "#ffd4d4"
                    }; // Light red when off
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

export const ManualReleaseButton = styled.button`
  display: inline-block;
  width: auto;
  padding: 6px 12px;
  background-color: ${(props) => (props.toggleManualOverride ? '#45a049' : '#bbb')};
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