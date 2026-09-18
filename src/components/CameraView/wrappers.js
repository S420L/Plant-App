import styled from 'styled-components';

/* Full-bleed stage — fills the PlantBox camera screen edge to edge */
export const CameraStage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  overflow: hidden;
`;

export const CameraFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
`;

export const CameraPlaceholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #0d1117;
  color: #8b949e;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  opacity: ${(p) => (p.$hidden ? 0 : 1)};
  transition: opacity 0.2s ease;
`;

export const CameraPlaceholderHint = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4d5566;
`;

/* Fallback for feeds that refuse to be framed */
export const OpenFeedLink = styled.a`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 7px 14px;
  background: rgba(13, 17, 23, 0.72);
  border: 1.5px solid #282e36;
  border-radius: 8px;
  color: #8b949e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #e6edf3;
    border-color: #30363d;
  }

  &:active { transform: translateX(-50%) scale(0.97); }
`;
