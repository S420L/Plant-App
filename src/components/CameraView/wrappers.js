import styled, { keyframes } from 'styled-components';

/* Fills the camera screen: controls on top, feed taking the rest */
export const CameraScreen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #0d1117;
`;

/* Clears the absolute Back button / view switch above it */
export const AnalyzePanel = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 68px 16px 12px;
`;

export const AnalyzeButton = styled.button`
  padding: 13px 20px;
  background: ${(p) => (p.disabled ? '#21262d' : 'linear-gradient(135deg, #16a34a, #22c55e)')};
  color: ${(p) => (p.disabled ? '#4d5566' : '#fff')};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: none;
  border-radius: 10px;
  cursor: ${(p) => (p.disabled ? 'default' : 'pointer')};
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: ${(p) => (p.disabled ? 'none' : '0 4px 16px rgba(34, 197, 94, 0.25)')};

  &:hover:enabled {
    opacity: 0.9;
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
  }

  &:active:enabled { transform: scale(0.98); }
`;

export const ResultsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #161b22;
  border: 1.5px solid #282e36;
  border-radius: 12px;
  padding: 12px 14px;
  max-height: 34dvh;
  overflow-y: auto;
`;

/* Each question owns a colour: plant green, species purple, watering blue */
export const ResultRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 10px;
  border-left: 2px solid ${(p) => p.$accent || '#282e36'};
`;

export const ResultLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${(p) => p.$accent || '#8b949e'};
`;

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40%           { opacity: 1;    transform: translateY(-2px); }
`;

/* Same height as one line of ResultValue, so the row doesn't jump when the
   answer replaces the dots */
export const Dots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 19px;
`;

export const Dot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(p) => p.$accent || '#8b949e'};
  animation: ${dotPulse} 1.2s ease-in-out infinite;
  animation-delay: ${(p) => (p.$i || 0) * 0.16}s;
`;

export const ResultValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #e6edf3;
  line-height: 1.45;
  white-space: pre-wrap;
`;

export const ResultNote = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #8b949e;
  text-align: center;
`;

export const ResultError = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #ef4444;
  line-height: 1.45;
`;

/* Full-bleed stage — takes whatever height the controls leave */
export const CameraStage = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
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
