import styled, { css } from 'styled-components';

// Container for the grow light controls
export const Box = styled.div`
  width: 30%;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background-color: ${(props) => (props.isOn ? '#d4ffd4' : '#ffd4d4')};
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  padding: 10px;
  margin: 20px; /* Add spacing between elements */

  @media (max-width: 768px) {
    width: 80%;
    padding: 20px;
  }
`;

// Container for the on/off switch
export const SwitchContainer = styled.div`
  display: flex;
  width: 90%;
  max-width: 300px;
  height: 40px;
  background-color: #ffffff;
  border: 2px solid #cccccc;
  border-radius: 20px;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
  position: relative;
  margin: 10px auto;

  @media (max-width: 768px) {
    width: 100%;
    height: 50px;
    margin-bottom: 20px;
  }
`;

// Buttons for toggling on/off state
export const SwitchButton = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: ${(props) => (props.active ? '#ffffff' : '#666666')};
  background-color: ${(props) => (props.active ? '#4caf50' : 'transparent')};
  border-radius: 20px;
  cursor: ${(props) => (props.active ? 'default' : 'pointer')};
  border: 1px solid #cccccc;
  transition: all 0.3s ease;

  &:hover {
    border: ${(props) => (props.active ? 'none' : '3px solid #cccccc')};
    background-color: ${(props) =>
      props.active ? '#4caf50' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

// Group container for fields (e.g., timers, IP address)
export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 2px solid #ccc;
  border-radius: 6px;
  margin: 10px; /* Add spacing between groups */

  ${(props) =>
    props.position === 'middle-left' &&
    css`
      align-self: flex-start;
    `}

  ${(props) =>
    props.position === 'middle-right' &&
    css`
      align-self: flex-end;
    `}

  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 20px;
  }
`;

// Title for each field group
export const FieldTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

// Input fields for numeric values
export const InputField = styled.input`
  width: 100px;
  margin: 4px 0;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;

  appearance: textfield;
  -moz-appearance: textfield;
  -webkit-appearance: none;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    border-color: #4caf50;
    outline: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 14px;
  }
`;

// Button for submitting updates
export const SubmitButton = styled.button`
  position: relative;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    background-color: #3d8b41;
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 16px;
  }
`;
