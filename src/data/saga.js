import { takeLatest, put, call, select } from 'redux-saga/effects';
import axios from 'axios';
import { updateLightTimers, updateCurrentLightState, apiCallSuccess, toggleLightState } from './slice';

// Selector to get the current light from the state
const selectCurrentLight = (state) => state.light.currentLight;

// Handle toggling the light ON/OFF
function* handleToggleBox() {
  try {
    const { ip, isOn } = yield select(selectCurrentLight);
    const url = `http://${ip}/led/${isOn ? 'on' : 'off'}`;
    const response = yield call(axios.get, url);
    yield put(apiCallSuccess(response.data));
  } catch (error) {
    console.error('Toggle API call failed:', error);
  }
}

function* handleToggleBoxes() {
  try {
    // Select all lights from the Redux state
    const lights = yield select((state) => state.light.lights);

    // Determine the majority state (on or off)
    const onCount = lights.filter((light) => light.isOn).length;
    const majorityState = onCount >= lights.length / 2; // True if majority are ON

    // Target state for all lights
    const targetState = majorityState ? 'off' : 'on';

    // Toggle all lights to the target state
    for (const light of lights) {
      const url = `http://${light.ip}/led/${targetState}`;
      try {
        const response = yield call(axios.get, url);

        // Dispatch success for each toggled light (optional)
        yield put(apiCallSuccess({ ip: light.ip, data: response.data }));
      } catch (error) {
        console.error(`Failed to toggle light at IP: ${light.ip}`, error);
      }
    }
  } catch (error) {
    console.error('Error during toggle operation:', error);
  }
}



// Handle updating the timer (timeOn and timeOff)
function* handleTimerChange(action) {
  try {
    const { ip, timeOn, timeOff } = action.payload;

    if (timeOn !== undefined && timeOff !== undefined) {
      const url = `http://${ip}/timer?time_on=${timeOn}&time_off=${timeOff}`;
      const response = yield call(axios.get, url);
      yield put(apiCallSuccess(response.data));
    }
  } catch (error) {
    console.error('Timer API call failed:', error);
  }
}

// Handle updating the time range (startTime and endTime)
function* handleTimeRangeChange(action) {
  try {
    const { ip, startTime, endTime } = action.payload;

    if (startTime !== undefined && endTime !== undefined) {
      const url = `http://${ip}/timerange?start=${startTime}&end=${endTime}`;
      const response = yield call(axios.get, url);
      yield put(apiCallSuccess(response.data));
    }
  } catch (error) {
    console.error('Time Range API call failed:', error);
  }
}

// Root Saga to handle all relevant actions
export default function* rootSaga() {
  yield takeLatest(updateCurrentLightState.type, handleToggleBox);
  yield takeLatest(toggleLightState.type, handleToggleBoxes);

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
}
