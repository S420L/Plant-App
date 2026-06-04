import styled from 'styled-components';

export const LoginContainer = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #0d1117;
`;

export const LoginCard = styled.form`
  width: 100%;
  max-width: 320px;
  background: #161b22;
  border: 1.5px solid #21262d;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
`;

export const LoginTitle = styled.h1`
  margin: 0;
  text-align: center;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #22c55e;
`;

export const LoginSubtitle = styled.div`
  text-align: center;
  font-size: 13px;
  color: #8b949e;
  margin-top: -8px;
  margin-bottom: 8px;
`;

export const LoginField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const LoginLabel = styled.label`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8b949e;
`;

export const LoginInput = styled.input`
  padding: 11px 14px;
  font-size: 14px;
  color: #e6edf3;
  background: #0d1117;
  border: 1.5px solid #3a4149;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }
`;

export const LoginButton = styled.button`
  padding: 13px 16px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25);
  margin-top: 4px;

  &:hover { opacity: 0.92; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: default; }
`;

export const LoginToggle = styled.button`
  background: none;
  border: none;
  color: #adbac7;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  text-align: center;
  padding: 6px;

  &:hover { color: #e6edf3; }
`;

export const LoginError = styled.div`
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
`;
