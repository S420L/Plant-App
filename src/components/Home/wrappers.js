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
  background-color: #ffffff;
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
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    background-color: #3d8b41;
  }
`;
