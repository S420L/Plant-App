import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  masterLightBox: {
    name: 'change settings (all)',
    timeOn: 0,
    timeOff: 0,
    startTime: 0,
    endTime: 0,
  },
  // Hardcoded lights removed — populated by GET /api/me/devices on boot.
  lights: [],
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
  viewingIsOn: false,
  manualOverride: true,
  unclaimedDevices: [],
};

export const lightSlice = createSlice({
  name: 'light',
  initialState,
  reducers: {
    setCurrentLight: (state, action) => {
      state.currentLight = action.payload;
    },
    setLightsState: (state, action) => {
      const updatedLights = action.payload;
      state.lights = state.lights.map((light) => {
        const updatedLight = updatedLights.find((l) => l.ip === light.ip);
        return updatedLight ? { ...light, isOn: updatedLight.isOn } : light;
      });
    },
    toggleLightState: (state, action) => {
        console.log(`toggling all lights`);
    },
    setToggleIsOn: (state, action) => {
      state.toggleIsOn = !state.toggleIsOn;
    },
    toggleViewingState: (state, action) => {
      console.log(`toggling viewing lights`);
  },
    setViewingIsOn: (state, action) => {
      state.viewingIsOn = !state.viewingIsOn;
    },
    toggleManualRelease: (state, action) => {
      console.log(`releasing manual control`);
  },
    setManualOverride: (state, action) => {
      state.manualOverride = !state.manualOverride;
    },
    updateCurrentLightState: (state) => {
      state.currentLight.isOn = !state.currentLight.isOn;
      const light = state.lights.find((l) => l.mac === state.currentLight.mac);
      if (light) light.isOn = state.currentLight.isOn;
    },
    updateLightState: (state, action) => {
      const { mac, isOn } = action.payload;
      const light = state.lights.find((l) => l.mac === mac);
      if (light) light.isOn = isOn;
    },
    updateLightTimers: (state, action) => {
      const { mac, timeOn, timeOff, startTime, endTime } = action.payload;
      if (!mac) {
        // Master settings — apply to all lights.
        state.lights.forEach((light) => {
          light.timeOn = timeOn ?? light.timeOn;
          light.timeOff = timeOff ?? light.timeOff;
          light.startTime = startTime ?? light.startTime;
          light.endTime = endTime ?? light.endTime;
        });
        state.masterLightBox = { name: 'Settings for all', timeOn, timeOff, startTime, endTime };
      } else {
        const light = state.lights.find((l) => l.mac === mac);
        if (light) {
          light.timeOn = timeOn ?? light.timeOn;
          light.timeOff = timeOff ?? light.timeOff;
          light.startTime = startTime ?? light.startTime;
          light.endTime = endTime ?? light.endTime;
        }
      }
    },
    updateBrightness: (state, action) => {
      const { mac, level } = action.payload;
      const light = state.lights.find((l) => l.mac === mac);
      if (light) light.brightness = level;
      if (state.currentLight.mac === mac) state.currentLight.brightness = level;
    },
    // Saga trigger — handled by handleFetchUserDevices; payload ignored
    fetchUserDevices: () => {},
    // Saga trigger — handled by handleFetchUnclaimedDevices
    fetchUnclaimedDevices: () => {},
    // Saga trigger — payload { mac, nickname }; handled by handleClaimDevice
    claimDevice: () => {},
    // Saga trigger — payload { mac, nickname }; handled by handleRenameDevice
    renameDevice: () => {},
    // Saga trigger — payload { mac }; handled by handleUnclaimDevice
    unclaimDevice: () => {},
    // Reducer — removes a light from state.lights once unclaim succeeds
    removeLight: (state, action) => {
      const { mac } = action.payload;
      state.lights = state.lights.filter((l) => l.mac !== mac);
      if (state.currentLight.mac === mac) state.currentLight = { name: '', ip: '', mac: '', isOn: false, timeOn: 0, timeOff: 0, startTime: 0, endTime: 0 };
    },
    // Reducer — applies a new nickname to an existing light
    renameLight: (state, action) => {
      const { mac, nickname } = action.payload;
      const light = state.lights.find((l) => l.mac === mac);
      if (light) light.name = nickname;
      if (state.currentLight.mac === mac) state.currentLight.name = nickname;
    },
    // Reducer — merges devices returned by GET /api/me/devices into state.lights
    // Existing entries (matched by mac) get their name updated to the nickname;
    // unknown MACs are added as new light tiles.
    mergeRegistryDevices: (state, action) => {
      const devices = action.payload || [];
      devices.forEach((rd) => {
        const existing = state.lights.find((l) => l.mac === rd.mac);
        if (existing) {
          if (rd.nickname) existing.name = rd.nickname;
        } else {
          state.lights.push({
            name: rd.nickname || rd.mac,
            ip: '',
            mac: rd.mac,
            isOn: false,
            timeOn: 0,
            timeOff: 0,
            startTime: 0,
            endTime: 0,
          });
        }
      });
    },
    setUnclaimedDevices: (state, action) => {
      state.unclaimedDevices = action.payload || [];
    },
    mqttStatusReceived: (state, action) => {
      const { mac, key, value } = action.payload;
      const light = state.lights.find((l) => l.mac === mac);
      if (!light) return;
      if (key === 'led') {
        light.isOn = value === 'on';
        if (state.currentLight.mac === mac) state.currentLight.isOn = value === 'on';
      } else if (key === 'brightness') {
        const level = parseInt(value, 10);
        if (!Number.isNaN(level)) {
          light.brightness = level;
          if (state.currentLight.mac === mac) state.currentLight.brightness = level;
        }
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
  toggleViewingState,
  updateCurrentLightState,
  updateLightTimers,
  apiCallSuccess,
  updateLightState,
  setToggleIsOn,
  setLightsState,
  setViewingIsOn,
  setManualOverride,
  toggleManualRelease,
  updateBrightness,
  mqttStatusReceived,
  fetchUserDevices,
  fetchUnclaimedDevices,
  claimDevice,
  renameDevice,
  unclaimDevice,
  removeLight,
  renameLight,
  mergeRegistryDevices,
  setUnclaimedDevices
} = lightSlice.actions;

export const lightReducer = lightSlice.reducer;
