import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lights: [
    {
      name: 'lemon tree',
      ip: '192.168.0.100',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
    {
      name: 'light 2',
      ip: '192.168.0.150',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
  ],
  currentLight: {
    name: '',
    ip: '',
    isOn: false,
    timeOn: 0,
    timeOff: 0,
    startTime: 0,
    endTime: 0,
  },
};

export const lightSlice = createSlice({
  name: 'light',
  initialState,
  reducers: {
    setCurrentLight: (state, action) => {
      state.currentLight = action.payload;
    },
    toggleLightState: (state, action) => {
      const light = state.lights.find((l) => l.ip === action.payload);
      if (light) {
        light.isOn = !light.isOn;
      }
    },
    updateCurrentLightState: (state) => {
      state.currentLight.isOn = !state.currentLight.isOn;
      const light = state.lights.find((l) => l.ip === state.currentLight.ip);
      if (light) {
        light.isOn = state.currentLight.isOn;
      }
    },
    updateLightTimers: (state, action) => {
      const { ip, timeOn, timeOff, startTime, endTime } = action.payload;
      const light = state.lights.find((l) => l.ip === ip);
      if (light) {
        light.timeOn = timeOn ?? light.timeOn;
        light.timeOff = timeOff ?? light.timeOff;
        light.startTime = startTime ?? light.startTime;
        light.endTime = endTime ?? light.endTime;
      }
      if (state.currentLight.ip === ip) {
        state.currentLight = { ...state.currentLight, timeOn, timeOff, startTime, endTime };
      }
    },
    apiCallSuccess: (state, action) => {
      console.log('API Success:', action.payload);
    },
  },
});

export const {
  setCurrentLight,
  toggleLightState,
  updateCurrentLightState,
  updateLightTimers,
  apiCallSuccess,
} = lightSlice.actions;

export const lightReducer = lightSlice.reducer;
