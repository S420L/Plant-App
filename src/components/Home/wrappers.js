import styled from 'styled-components';

// Container for the grid layout
export const GridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  gap: 20px; /* Adds spacing between items */
  background-color: #f9f9f9;
  min-height: 100vh;
`;

// Individual light box
export const LightBox = styled.div`
  width: 200px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  border: 2px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s;

  &:hover {
    transform: translateY(-5px);
    background-color: #e6f7ff;
  }
`;

// Title for the home screen
export const HomeTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  text-align: center;
  margin: 20px 0;
`;
