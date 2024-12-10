import styled from 'styled-components';

export const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 60vw;
  background-color: #f9f9f9;
  box-sizing: border-box;
`;

export const LightBox = styled.div`
  width: 69vw;
  height: 20vh;
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
  margin-bottom: 20px;

  @media (min-width: 768px) {
    width: 20vw;
    height: 20vh;
  }

  &:hover {
    transform: translateY(-5px);
    background-color: #e6f7ff;
  }
`;

export const HomeTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  text-align: center;
`;

export const ToggleButton = styled.button`
  display: inline-block;
  width: 60px;
  height: 30px;
  background-color: ${props => (props.toggleIsOn ? "#4caf50" : "#ccc")};
  border: none;
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;

  &::before {
    content: "";
    width: 24px;
    height: 24px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: ${props => (props.toggleIsOn ? "calc(100% - 27px)" : "3px")};
    transition: left 0.3s;
  }

  &:hover {
    background-color: ${props => (props.toggleIsOn ? "#45a049" : "#bbb")};
  }

  &:active::before {
    width: 26px;
    height: 26px;
  }
`;
