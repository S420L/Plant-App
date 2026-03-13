import styled from 'styled-components';

export const WrapperOng = styled.div`
  display: block;
  padding: 24px 0 32px;
  min-height: 100dvh;
  background: #0d0918;
  overflow: hidden;

  @media (min-width: 768px) {
    min-height: 100%;
  }
`;

export const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
`;

export const LightBoxWrapper = styled.div`
  display: block;
`;

export const LightBox = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  border: 1.5px solid ${(props) =>
    props.ip === '192.168.0.154'
      ? props.isOn ? 'rgba(22, 163, 74, 0.55)' : 'rgba(251, 113, 133, 0.45)'
      : props.isOn ? 'rgba(22, 163, 74, 0.55)' : 'rgba(167, 139, 250, 0.45)'
  };

  background: ${(props) =>
    props.ip === '192.168.0.154'
      ? props.isOn ? 'linear-gradient(to right, rgba(22, 163, 74, 0.35) 0%, rgba(13, 9, 24, 0) 100%)' : 'rgba(251, 113, 133, 0.08)'
      : props.isOn ? 'linear-gradient(to right, rgba(22, 163, 74, 0.35) 0%, rgba(13, 9, 24, 0) 100%)' : 'rgba(167, 139, 250, 0.08)'
  };

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  /* Left accent bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
    background: ${(props) =>
      props.ip === '192.168.0.154'
        ? props.isOn ? '#16a34a' : '#fb7185'
        : props.isOn ? '#16a34a' : '#a78bfa'
    };
    box-shadow: ${(props) =>
      props.ip === '192.168.0.154'
        ? props.isOn ? '0 0 10px rgba(22,163,74,0.8)' : '0 0 8px rgba(251,113,133,0.7)'
        : props.isOn ? '0 0 10px rgba(22,163,74,0.8)' : '0 0 8px rgba(167,139,250,0.7)'
    };
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    border-color: ${(props) =>
      props.ip === '192.168.0.154'
        ? props.isOn ? 'rgba(22,163,74,0.75)' : 'rgba(251,113,133,0.65)'
        : props.isOn ? 'rgba(22,163,74,0.75)' : 'rgba(167,139,250,0.65)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

export const LightBoxName = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #f5e6ff;
  letter-spacing: 0.01em;
  margin-left: 8px;
`;

export const LightBoxStatus = styled.span`
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(props) => (props.isOn ? '#16a34a' : '#a78bfa')};
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  margin: 0 16px 20px;
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #160d27;
  border: 1.5px solid #2d1b4e;
  border-radius: 10px;
`;

export const ControlLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #f5e6ff;
  letter-spacing: 0.03em;
`;

export const ToggleButton = styled.button`
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.toggleIsOn ? '#2dd4bf' : '#2d1b4e')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  flex-shrink: 0;
  box-shadow: ${(props) => props.toggleIsOn ? '0 0 14px rgba(45,212,191,0.55)' : 'none'};

  &::before {
    content: '';
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: ${(props) => (props.toggleIsOn ? 'calc(100% - 21px)' : '3px')};
    transition: left 0.25s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }

  &:hover {
    background-color: ${(props) => (props.toggleIsOn ? '#14b8a6' : '#3d2060')};
  }
`;

export const ViewingModeButton = styled.button`
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.viewingIsOn ? '#c084fc' : '#2d1b4e')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  flex-shrink: 0;
  box-shadow: ${(props) => props.viewingIsOn ? '0 0 14px rgba(192,132,252,0.55)' : 'none'};

  &::before {
    content: '';
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: ${(props) => (props.viewingIsOn ? 'calc(100% - 21px)' : '3px')};
    transition: left 0.25s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }

  &:hover {
    background-color: ${(props) => (props.viewingIsOn ? '#a855f7' : '#3d2060')};
  }
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const ManualReleaseButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${(props) => props.toggleManualOverride ? 'rgba(244,114,182,0.10)' : '#160d27'};
  color: ${(props) => props.toggleManualOverride ? '#f472b6' : '#9d77c4'};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1.5px solid ${(props) => props.toggleManualOverride ? 'rgba(244,114,182,0.45)' : '#2d1b4e'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.toggleManualOverride ? 'rgba(244,114,182,0.18)' : '#1e1035'};
    color: ${(props) => props.toggleManualOverride ? '#f9a8d4' : '#c4a8e8'};
    border-color: ${(props) => props.toggleManualOverride ? 'rgba(244,114,182,0.65)' : '#3d2060'};
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const SettingsButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: rgba(45, 212, 191, 0.10);
  color: #2dd4bf;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1.5px solid rgba(45, 212, 191, 0.45);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 10px rgba(45, 212, 191, 0.15);

  &:hover {
    background: rgba(45, 212, 191, 0.18);
    border-color: rgba(45, 212, 191, 0.7);
    box-shadow: 0 0 16px rgba(45, 212, 191, 0.3);
  }

  &:active {
    transform: scale(0.97);
  }
`;
