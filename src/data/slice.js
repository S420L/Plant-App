import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lights: [
    {
      name: '420',
      ip: '192.168.0.144',
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
    {
      name: 'light 3',
      ip: '192.168.0.108',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
    {
      name: 'light 69',
      ip: '192.168.0.196',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
    {
      name: 'light 69420',
      ip: '192.168.0.156',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
    {
      name: 'light 4',
      ip: '192.168.0.185',
      isOn: false,
      timeOn: 0,
      timeOff: 0,
      startTime: 0,
      endTime: 0,
    },
    {
      name: 'light 6',
      ip: '192.168.0.186',
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
  toggleIsOn: false,
};

export const lightSlice = createSlice({
  name: 'light',
  initialState,
  reducers: {
    setCurrentLight: (state, action) => {
      state.currentLight = action.payload;
    },
    toggleLightState: (state, action) => {
        console.log(`toggling all lights`);
    },
    setToggleIsOn: (state, action) => {
      state.toggleIsOn = !state.toggleIsOn;
    },
    updateCurrentLightState: (state) => {
      state.currentLight.isOn = !state.currentLight.isOn;
      const light = state.lights.find((l) => l.ip === state.currentLight.ip);
      if (light) {
        console.log("toggling current light");
        light.isOn = state.currentLight.isOn;
      }
    },
    updateLightState: (state, action) => {
      const { ip, isOn } = action.payload;
      const light = state.lights.find((l) => l.ip === ip);
      console.log(`updating state of light ${ip}`);
      if (light) {
        light.isOn = isOn;
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
  updateLightState,
  setToggleIsOn,
} = lightSlice.actions;

export const lightReducer = lightSlice.reducer;
