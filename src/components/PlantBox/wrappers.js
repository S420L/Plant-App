import styled from 'styled-components';

export const Box = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: ${(props) =>
    props.isOn
      ? 'radial-gradient(ellipse at top, rgba(34,197,94,0.06) 0%, #0d1117 60%)'
      : 'radial-gradient(ellipse at top, rgba(239,68,68,0.05) 0%, #0d1117 60%)'
  };
  /* Extra top padding so content clears the absolute BackButton */
  padding: 68px 20px 40px;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;

  @media (min-width: 768px) {
    min-height: 100%;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #e6edf3;
    letter-spacing: -0.02em;
    margin: 0 0 24px;
    text-align: center;
  }
`;

export const SwitchContainer = styled.div`
  display: flex;
  height: 44px;
  background: #161b22;
  border: 1.5px solid #282e36;
  border-radius: 22px;
  overflow: hidden;
  margin: 0 0 24px;
  min-width: 0;
`;

export const SwitchButton = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: ${(props) => (props.active ? 'default' : 'pointer')};
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  border-radius: 22px;

  color: ${(props) => (props.active ? '#fff' : '#4d5566')};
  background: ${(props) =>
    props.active
      ? props.isOnButton
        ? 'linear-gradient(135deg, #16a34a, #22c55e)'
        : 'linear-gradient(135deg, #b91c1c, #ef4444)'
      : 'transparent'
  };
  box-shadow: ${(props) =>
    props.active
      ? props.isOnButton
        ? '0 2px 12px rgba(34,197,94,0.3)'
        : '0 2px 12px rgba(239,68,68,0.3)'
      : 'none'
  };

  &:hover {
    background: ${(props) =>
      props.active ? undefined : 'rgba(255,255,255,0.04)'
    };
    color: ${(props) => (props.active ? '#fff' : '#8b949e')};
  }
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #161b22;
  border: 1.5px solid #282e36;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  gap: 10px;
  min-width: 0;
`;

export const FieldTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8b949e;
  margin-bottom: 2px;
`;

export const InputField = styled.input`
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 400;
  color: #e6edf3;
  background: #0d1117;
  border: 1.5px solid #3a4149;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  appearance: textfield;
  -moz-appearance: textfield;
  min-width: 0;

  &::placeholder {
    color: #4d5566;
  }

  &:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px 20px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25);
  margin-top: 8px;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 10px;
  background: #161b22;
  color: #adbac7;
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid #282e36;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
  top: 20px;
  left: 20px;

  &::before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 7px solid #adbac7;
    flex-shrink: 0;
    transition: border-right-color 0.2s ease;
  }

  &:hover {
    background: #1c2333;
    border-color: #30363d;
    color: #e6edf3;

    &::before {
      border-right-color: #e6edf3;
    }
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #161b22;
  color: #8b949e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1.5px solid #282e36;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
  top: 20px;
  right: 20px;

  &:hover {
    background: #1c2333;
    border-color: #30363d;
    color: #e6edf3;
  }

  &:active {
    transform: scale(0.97);
  }
`;

/* ── Wheel picker ── */

export const WheelWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
`;

export const WheelContainer = styled.div`
  width: 64px;
  height: 220px;
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const WheelItem = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: ${(p) => (p.$selected ? '22px' : '17px')};
  font-weight: ${(p) => (p.$selected ? '600' : '400')};
  color: ${(p) => (p.$selected ? '#e6edf3' : '#4d5566')};
  transition: font-size 0.1s ease, color 0.1s ease;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
`;

export const WheelPad = styled.div`
  height: 44px;
  scroll-snap-align: none;
  flex-shrink: 0;
`;

export const WheelOverlayTop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: linear-gradient(to bottom, #161b22 15%, transparent 100%);
  pointer-events: none;
`;

export const WheelOverlayBottom = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  height: 88px;
  background: linear-gradient(to top, #161b22 15%, transparent 100%);
  pointer-events: none;
`;

export const WheelSelector = styled.div`
  position: absolute;
  top: 88px;
  left: 4px;
  right: 4px;
  height: 44px;
  border-top: 1.5px solid #3a4149;
  border-bottom: 1.5px solid #3a4149;
  pointer-events: none;
`;

export const WheelUnit = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4d5566;
  margin-top: 4px;
  height: 16px;
`;

export const PickerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

export const PickerColon = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #4d5566;
  padding-bottom: 20px;
  flex-shrink: 0;
`;

export const PickerRowLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4d5566;
  text-align: center;
`;

export const PickerTrigger = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  background: #0d1117;
  border: 1.5px solid ${(p) => (p.$active ? '#22c55e' : '#3a4149')};
  border-radius: ${(p) => (p.$active ? '8px 8px 0 0' : '8px')};
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${(p) => (p.$active ? '0 0 0 3px rgba(34,197,94,0.12)' : 'none')};
  text-align: left;
  gap: 8px;
`;

export const PickerTriggerLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4d5566;
  flex-shrink: 0;
`;

export const PickerTriggerValue = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 400;
  color: ${(p) => (p.$empty ? '#4d5566' : '#e6edf3')};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

export const PickerChevron = styled.span`
  flex-shrink: 0;
  font-size: 10px;
  color: ${(p) => (p.$open ? '#22c55e' : '#4d5566')};
  transform: ${(p) => (p.$open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease, color 0.2s ease;
  line-height: 1;
`;

export const PickerExpandArea = styled.div`
  background: #0d1117;
  border: 1.5px solid #22c55e;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
  padding: 8px 0 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const AmPmRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
`;

export const AmPmButton = styled.button`
  flex: 1;
  padding: 7px 20px;
  background: ${(p) => (p.$active ? 'rgba(34,197,94,0.15)' : 'transparent')};
  color: ${(p) => (p.$active ? '#22c55e' : '#4d5566')};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 1.5px solid ${(p) => (p.$active ? 'rgba(34,197,94,0.45)' : '#3a4149')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
`;
