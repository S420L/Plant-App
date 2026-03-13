import styled from 'styled-components';

export const WrapperOng = styled.div`
  display: block;
  padding: 24px 0 32px;
  min-height: 100dvh;
  background: #0d1117;
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
      ? props.isOn ? 'rgba(99, 102, 241, 0.5)' : 'rgba(250, 204, 21, 0.4)'
      : props.isOn ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.4)'
  };

  background: ${(props) =>
    props.ip === '192.168.0.154'
      ? props.isOn ? 'rgba(99, 102, 241, 0.14)' : 'rgba(250, 204, 21, 0.10)'
      : props.isOn ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.10)'
  };

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

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
        ? props.isOn ? '#6366f1' : '#facc15'
        : props.isOn ? '#22c55e' : '#ef4444'
    };
    box-shadow: ${(props) =>
      props.ip === '192.168.0.154'
        ? props.isOn ? '0 0 8px rgba(99,102,241,0.7)' : '0 0 8px rgba(250,204,21,0.5)'
        : props.isOn ? '0 0 10px rgba(34,197,94,0.6)' : '0 0 8px rgba(239,68,68,0.5)'
    };
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    border-color: ${(props) =>
      props.ip === '192.168.0.154'
        ? props.isOn ? 'rgba(99,102,241,0.7)' : 'rgba(250,204,21,0.6)'
        : props.isOn ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.5)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

export const LightBoxName = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #e6edf3;
  letter-spacing: 0.01em;
  margin-left: 8px;
`;

export const LightBoxStatus = styled.span`
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(props) => (props.isOn ? '#22c55e' : '#ef4444')};
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
  background: #161b22;
  border: 1.5px solid #282e36;
  border-radius: 10px;
`;

export const ControlLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #8b949e;
`;

export const ToggleButton = styled.button`
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.toggleIsOn ? '#22c55e' : '#30363d')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  flex-shrink: 0;
  box-shadow: ${(props) => props.toggleIsOn ? '0 0 12px rgba(34,197,94,0.4)' : 'none'};

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
    background-color: ${(props) => (props.toggleIsOn ? '#16a34a' : '#3d444d')};
  }
`;

export const ViewingModeButton = styled.button`
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.viewingIsOn ? '#22c55e' : '#30363d')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  flex-shrink: 0;
  box-shadow: ${(props) => props.viewingIsOn ? '0 0 12px rgba(34,197,94,0.4)' : 'none'};

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
    background-color: ${(props) => (props.viewingIsOn ? '#16a34a' : '#3d444d')};
  }
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const ManualReleaseButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${(props) => props.toggleManualOverride ? 'rgba(34,197,94,0.08)' : '#161b22'};
  color: ${(props) => props.toggleManualOverride ? '#22c55e' : '#8b949e'};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1.5px solid ${(props) => props.toggleManualOverride ? 'rgba(34,197,94,0.4)' : '#282e36'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.toggleManualOverride ? 'rgba(34,197,94,0.14)' : '#1c2333'};
    color: ${(props) => props.toggleManualOverride ? '#4ade80' : '#adbac7'};
    border-color: ${(props) => props.toggleManualOverride ? 'rgba(34,197,94,0.55)' : '#30363d'};
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const SettingsButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: #161b22;
  color: #e6edf3;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1.5px solid #282e36;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1c2333;
    border-color: #30363d;
  }

  &:active {
    transform: scale(0.97);
  }
`;
