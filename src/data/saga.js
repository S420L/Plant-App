import { takeLatest, put, call, select, delay, spawn } from 'redux-saga/effects';
import axios from 'axios';
import { updateLightTimers, updateCurrentLightState, apiCallSuccess, toggleLightState, toggleViewingState, updateLightState, setLightsState, toggleManualRelease  } from './slice';

// Selector to get the current light from the state
const selectCurrentLight = (state) => state.light.currentLight;

/*function* watchFanStatus() {
  const ip = '192.168.0.154'; // Hardcoded IP
  
  while (true) {
    try {
      const response = yield call(axios.post, 'https://S420L.club/api/toggle_lights', {
        ip: [`http://${ip}/pin/status`],
      });
      console.log(response.data);
      
      const isOn = response.data[0].response.includes('LOW'); // Parse "LOW" (ON) from response

      // Dispatch an action to update the state of the specific light
      yield put(updateLightState({ ip, isOn }));
    } catch (error) {
      console.log(`Failed to fetch state for ${ip}:`, error);
      yield put(updateLightState({ ip, isOn: false })); // Default to "OFF" on error
    }

    yield delay(3000); // Retry every 5 seconds
  }
}*/

// Handle toggling the light ON/OFF
function* handleToggleBox() {
  try {
    console.log("toggling current light");
    const { ip, isOn } = yield select(selectCurrentLight);
    const url = `http://${ip}/led/${isOn ? 'on' : 'off'}`;
    const response = yield call(axios.post, 'https://S420L.club/api/toggle_lights', {'ip': [url]});
    yield put(apiCallSuccess(response.data));
  } catch (error) {
    console.error('Toggle API call failed:', error);
  }
}

function* fetchPinStates() {
  try {
    var lights = yield select((state) => state.light.lights);

    // Iterate over each light and handle responses individually
    for (const light of lights) {
      try {
        const response = yield call(axios.post, 'https://S420L.club/api/toggle_lights', {
          ip: [`http://${light.ip}/pin/status`],
        });
        console.log(response.data);
        const isOn = response.data[0].response.includes('LOW'); // Parse "LOW" (ON) from the response

        // Dispatch an action to update the state of the specific light
        yield put(updateLightState({ ip: light.ip, isOn }));
      } catch (error) {
          console.log(`Failed to fetch state for ${light.name}:`, error);
          yield put(updateLightState({ ip: light.ip, isOn: false })); // Default "OFF" for true errors
      }
    }
  } catch (error) {
    console.error('Error fetching pin states:', error);
  }
}

function* handleManualRelease() {
  try {
    // Select all lights from the Redux state
    var lights = yield select((state) => state.light.lights);
    lights = lights.filter((light) => light.name!=="fan");
    
    // hit manual release endpoint
    let url_list = [];
    for (let i = 0; i < lights.length; i++) {
      let light = lights[i];
    
      const url = `http://${light.ip}/manual/release`;
      console.log(`Calling ${url}`);
      url_list.push(url);
      
    }
     yield call(axios.post, 'https://S420L.club/api/toggle_lights', {'ip': url_list});

     yield call(fetchPinStates);
    
  } catch (error) {
    console.error('Error during manual override:', error);
  }
}

function* handleToggleBoxes() {
  try {
    // Select all lights from the Redux state
    var lights = yield select((state) => state.light.lights);
    lights = lights.filter((light) => light.name!=="fan");

    // Determine the majority state (on or off)
    const onCount = lights.filter((light) => light.isOn).length;
    console.log(lights);
    console.log(onCount);
    const majorityState = onCount >= lights.length / 2; // True if majority are ON
    console.log(majorityState);
    console.log(`TARGET STATE: ${majorityState ? 'off' : 'on'}`);
    // Target state for all lights
    const targetState = majorityState ? 'off' : 'on';
    
    // Toggle all lights to the target state
    let url_list = [];
    for (let i = 0; i < lights.length; i++) {
      let light = lights[i];
    
      const url = `http://${light.ip}/led/${targetState}`;
      console.log(`Calling ${url}`);
      url_list.push(url);
      yield put(updateLightState({"ip": light.ip, "isOn": !majorityState}));
    }
     yield call(axios.post, 'https://S420L.club/api/toggle_lights', {'ip': url_list});
    
  } catch (error) {
    console.error('Error during toggle operation:', error);
  }
}

function* handleViewingBoxes() {
  try {
    // Select all lights from the Redux state
    var lights = yield select((state) => state.light.lights);
    lights = lights.filter((light) => light.name!=="fan");

    const viewingState = false;//lights.filter((light) => light.ip === "192.168.0.137")[0].isOn;
    console.log(viewingState);
    // Target state for all lights
    const targetStateViewing = viewingState ? 'off' : 'on';
    const targetStateNonViewing = viewingState ? 'on' : 'off';
    console.log(`TARGET STATE VIEWING: ${targetStateViewing}`);
    console.log(`TARGET STATE NON-VIEWING: ${targetStateNonViewing}`);
    
    let viewing_lights = [];
    let non_viewing_lights = [];
    if(viewingState){
      viewing_lights = lights.filter((light) => light.name === "viewing light");
      non_viewing_lights = lights.filter((light) => light.ip !== "192.168.0.137");
    } else {
      viewing_lights = lights.filter((light) => light.ip === "192.168.0.137");
      non_viewing_lights = lights.filter((light) => light.name !== "viewing light");
    }
    
    // Toggle all lights to the target state
    
      
      let url_list = [];
      for (let i = 0; i < viewing_lights.length; i++) {
        let light = viewing_lights[i];
        const url = `http://${light.ip}/led/${targetStateViewing}`;
        console.log(`Calling ${url}`);
        url_list.push(url);
        yield put(updateLightState({"ip": light.ip, "isOn": !viewingState}));
      }
       yield call(axios.post, 'https://S420L.club/api/toggle_lights', {'ip': url_list});
       url_list = [];

    for (let i = 0; i < non_viewing_lights.length; i++) {
      let light = non_viewing_lights[i];
      const url = `http://${light.ip}/led/${targetStateNonViewing}`;
      console.log(`Calling ${url}`);
      url_list.push(url);
      yield put(updateLightState({"ip": light.ip, "isOn": viewingState}));
    }
     yield call(axios.post, 'https://S420L.club/api/toggle_lights', {'ip': url_list});
    
  } catch (error) {
    console.error('Error during toggle operation:', error);
  }
}

// Handle updating the timer (timeOn and timeOff)
function* handleTimerChange(action) {
  // Skip self-triggered actions
  if (action.meta?.selfDispatched) {
    console.log('Skipping self-triggered timer change...');
    return;
  }
  console.log("HERE AGAIN!!");
  try {
    console.log("HERE first!!");
    const { ip, timeOn, timeOff, startTime, endTime } = action.payload;
    console.log("_____________");
    console.log(ip);
    console.log(startTime);
    console.log(endTime);
    console.log(timeOn);
    console.log(timeOff);
    console.log("===============");
    if(timeOn !== undefined && timeOff !== undefined){
      if (!ip) {
        var url_list = [];
        // Master settings: Apply to all lights
        var lights = yield select((state) => state.light.lights);
        lights = lights.filter((light) => light.name!=="fan");
        for (const light of lights) {
          url_list.push(`http://${light.ip}/timer?time_on=${timeOn}&time_off=${timeOff}`);
        }
        yield call(axios.post, 'https://S420L.club/api/toggle_lights', { ip: url_list });
        yield put({
          type: updateLightTimers.type,
          payload: { timeOn, timeOff },
          meta: { selfDispatched: true },
        });
      } else {
        // Individual light settings
        const url = `http://${ip}/timer?time_on=${timeOn}&time_off=${timeOff}`;
        const response = yield call(axios.post, 'https://S420L.club/api/toggle_lights', { ip: [url] });
        yield put(apiCallSuccess(response.data));
      }
    }
  } catch (error) {
    console.error('Timer API call failed:', error);
  }
}


// Handle updating the time range (startTime and endTime)
function* handleTimeRangeChange(action) {
  console.log("HERE AGAIN!!");
  if (action.meta?.selfDispatched) {
    console.log('Skipping self-triggered timer change...');
    return;
  }
  try {
    console.log("HERE first!!");
    const { ip, startTime, endTime } = action.payload;
    console.log("_____________");
    console.log(ip);
    console.log(startTime);
    console.log(endTime);
    if(startTime !== undefined && endTime !== undefined){
      console.log("HERE AGAIN!!");
      if (!ip) {
        var url_list = [];
        console.log("HERE first!!");
        // Master settings: Apply time range to all lights
        var lights = yield select((state) => state.light.lights);
        lights = lights.filter((light) => light.name!=="fan" && light.ip !== "192.168.0.137");
        for (const light of lights) {
          url_list.push(`http://${light.ip}/timerange?start=${startTime}&end=${endTime}`);
        }
        yield call(axios.post, 'https://S420L.club/api/toggle_lights', { ip: url_list });
        // Update masterLightBox and all lights in Redux state
        yield put({
          type: updateLightTimers.type,
          payload: { startTime, endTime },
          meta: { selfDispatched: true },
        });
      } else {
        // Individual light settings
        const url = `http://${ip}/timerange?start=${startTime}&end=${endTime}`;
        const response = yield call(axios.post, 'https://S420L.club/api/toggle_lights', { ip: [url] });
        yield put(apiCallSuccess(response.data));
      }
    }
  } catch (error) {
    console.error('Time Range API call failed:', error);
  }
}

// Root Saga to handle all relevant actions
export default function* rootSaga() {
  yield takeLatest('APP/INIT_FETCH_PIN_STATES', fetchPinStates);
  yield takeLatest(updateCurrentLightState.type, handleToggleBox);
  yield takeLatest(toggleLightState.type, handleToggleBoxes);
  yield takeLatest(toggleViewingState.type, handleViewingBoxes);
  yield takeLatest(toggleManualRelease.type, handleManualRelease);

  yield takeLatest(updateLightTimers.type, function* (action) {
    const { timeOn, timeOff, startTime, endTime } = action.payload;

    // Handle timer change if timer values are included in the payload
    if (timeOn !== undefined && timeOff !== undefined) {
      yield* handleTimerChange(action);
    }

    // Handle time range change if time range values are included in the payload
    if (startTime !== undefined && endTime !== undefined) {
      yield* handleTimeRangeChange(action);
    }
  });

    // Spawn non-blocking fan status watcher
    //yield spawn(watchFanStatus);
}
