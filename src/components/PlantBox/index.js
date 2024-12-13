import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setCurrentLight, updateLightTimers, updateCurrentLightState } from '../../data/slice';
import {
  Box,
  SwitchContainer,
  SwitchButton,
  FieldGroup,
  FieldTitle,
  InputField,
  SubmitButton,
} from './wrappers';

export const PlantBox = () => {
  const dispatch = useDispatch();
  const { id } = useParams(); // Get the dynamic parameter from the route
  const navigate = useNavigate();
  const lights = useSelector((state) => state.light.lights || []);
  console.log('Route ID:', id);
  console.log('Lights array:', lights);

  // State for local inputs
  const [localTimeOn, setLocalTimeOn] = useState('');
  const [localTimeOff, setLocalTimeOff] = useState('');
  const [localStartTime, setLocalStartTime] = useState('');
  const [localEndTime, setLocalEndTime] = useState('');

  useEffect(() => {
    const lightIndex = parseInt(id, 10) - 1; // Convert ID to zero-based index
    const light = lights[lightIndex];

    if (light || id === "master") {
      dispatch(setCurrentLight(light));
    } else {
      console.warn('Invalid light ID. Redirecting to home.');
      navigate('/');
    }
  }, [id, lights, dispatch, navigate]);

  const currentLight = useSelector((state) =>
    id === 'master' ? state.light.masterLightBox : state.light.currentLight
  );

  if (!currentLight.name) {
    return <p>Loading...</p>; // Show loading state if currentLight isn't set
  }

  const handleSubmit = () => {
    // Get current values from state
    const currentTimeOn = currentLight.timeOn;
    const currentTimeOff = currentLight.timeOff;
    const currentStartTime = currentLight.startTime;
    const currentEndTime = currentLight.endTime;

    // Parse local input values
    const timeOn = Number(localTimeOn);
    const timeOff = Number(localTimeOff);
    const startTime = Number(localStartTime);
    const endTime = Number(localEndTime);

    const payload = { ip: currentLight.ip };
    let hasTimerChanged = false;
    let hasTimeRangeChanged = false;

    // Check if timer values have changed
    if (timeOn !== currentTimeOn || timeOff !== currentTimeOff) {
      if (timeOn > 0 && timeOff > 0) {
        payload.timeOn = timeOn;
        payload.timeOff = timeOff;
        hasTimerChanged = true;
      } else {
        console.warn('Invalid timer inputs. Timer update skipped.');
      }
    }

    // Check if time range values have changed
    if (startTime !== currentStartTime || endTime !== currentEndTime) {
      if (startTime > 0 && endTime > 0) {
        payload.startTime = startTime;
        payload.endTime = endTime;
        hasTimeRangeChanged = true;
      } else {
        console.warn('Invalid time range inputs. Time range update skipped.');
      }
    }

    // Dispatch only if there are changes
    if (hasTimerChanged || hasTimeRangeChanged) {
      dispatch(updateLightTimers(payload));
    } else {
      console.log('No changes detected. API calls skipped.');
    }
  };

  const toggleLight = () => {
    dispatch(updateCurrentLightState());
  };

  if (id === 'master') {
    const handleMasterSubmit = () => {
      handleSubmit();
      navigate('/');
    };
  return (
    <Box>
      <h2>Settings for all</h2>
      <FieldGroup>
        <FieldTitle>Cycle</FieldTitle>
        <InputField
          type="number"
          value={localTimeOn}
          onChange={(e) => setLocalTimeOn(e.target.value)}
          placeholder="Time On"
        />
        <InputField
          type="number"
          value={localTimeOff}
          onChange={(e) => setLocalTimeOff(e.target.value)}
          placeholder="Time Off"
        />
      </FieldGroup>
      <FieldGroup>
        <FieldTitle>Time Range</FieldTitle>
        <InputField
          type="number"
          value={localStartTime}
          onChange={(e) => setLocalStartTime(e.target.value)}
          placeholder="Start Time"
        />
        <InputField
          type="number"
          value={localEndTime}
          onChange={(e) => setLocalEndTime(e.target.value)}
          placeholder="End Time"
        />
      </FieldGroup>
      <SubmitButton onClick={handleMasterSubmit}>Submit</SubmitButton>
    </Box>
  );
} else {
  return (
    <Box isOn={currentLight.isOn}>
      <h2>{currentLight.name || 'Unknown Light'}</h2>
      <FieldGroup>
        <FieldTitle>IP Address</FieldTitle>
        <p>{currentLight.ip}</p>
      </FieldGroup>
      <SwitchContainer>
        <SwitchButton active={currentLight.isOn} onClick={toggleLight}>
          ON
        </SwitchButton>
        <SwitchButton active={!currentLight.isOn} onClick={toggleLight}>
          OFF
        </SwitchButton>
      </SwitchContainer>
      <FieldGroup>
        <FieldTitle>Cycle</FieldTitle>
        <InputField
          type="number"
          value={localTimeOn}
          onChange={(e) => setLocalTimeOn(e.target.value)}
          placeholder="Time On"
        />
        <InputField
          type="number"
          value={localTimeOff}
          onChange={(e) => setLocalTimeOff(e.target.value)}
          placeholder="Time Off"
        />
      </FieldGroup>
      <FieldGroup>
        <FieldTitle>Time Range</FieldTitle>
        <InputField
          type="number"
          value={localStartTime}
          onChange={(e) => setLocalStartTime(e.target.value)}
          placeholder="Start Time"
        />
        <InputField
          type="number"
          value={localEndTime}
          onChange={(e) => setLocalEndTime(e.target.value)}
          placeholder="End Time"
        />
      </FieldGroup>
      <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
    </Box>
  );
}
};
