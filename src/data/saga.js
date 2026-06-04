import { takeLatest, throttle, put, call, select, spawn, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import mqtt from 'mqtt';
import axios from 'axios';
import {
  updateLightTimers,
  updateCurrentLightState,
  toggleLightState,
  toggleViewingState,
  toggleManualRelease,
  updateBrightness,
  mqttStatusReceived,
  fetchUserDevices,
  fetchUnclaimedDevices,
  claimDevice,
  mergeRegistryDevices,
  setUnclaimedDevices,
  updateLightState,
} from './slice';

const API_BASE = 'https://server67.site';

// ---------- MQTT client (singleton) ----------

let mqttClient = null;

function getMqttClient() {
  if (mqttClient) return mqttClient;
  mqttClient = mqtt.connect('wss://s420l.club/mqtt', {
    clientId: `plantapp-${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: 5000,
  });
  return mqttClient;
}

function publishMqtt(topic, message, options = {}) {
  if (!mqttClient || !mqttClient.connected) {
    console.warn('MQTT not connected; cannot publish', topic);
    return false;
  }
  mqttClient.publish(topic, message, options);
  return true;
}

function createMqttChannel(client) {
  return eventChannel((emit) => {
    const onMessage = (topic, payload) => emit({ type: 'message', topic, payload: payload.toString() });
    const onConnect = () => emit({ type: 'connect' });
    const onError = (err) => console.error('MQTT error', err);
    client.on('message', onMessage);
    client.on('connect', onConnect);
    client.on('error', onError);
    return () => {
      client.off('message', onMessage);
      client.off('connect', onConnect);
      client.off('error', onError);
    };
  });
}

function* watchMqtt() {
  const client = getMqttClient();
  const channel = yield call(createMqttChannel, client);

  while (true) {
    const event = yield take(channel);
    if (event.type === 'message') {
      const match = event.topic.match(/^plantapp\/device\/([^/]+)\/status\/(.+)$/);
      if (!match) continue;
      const [, mac, key] = match;
      yield put(mqttStatusReceived({ mac, key, value: event.payload }));
    } else if (event.type === 'connect') {
      // Refetch + resubscribe on every (re)connection.
      console.log('MQTT connected — refreshing device list');
      yield put(fetchUserDevices());
    }
  }
}

// ---------- Registry ----------

function* handleFetchUserDevices() {
  try {
    const response = yield call(axios.get, `${API_BASE}/api/me/devices`);
    yield put(mergeRegistryDevices(response.data));
    if (mqttClient && mqttClient.connected) {
      response.data.forEach((d) => {
        mqttClient.subscribe(`plantapp/device/${d.mac}/status/#`);
      });
    }
  } catch (err) {
    console.error('fetchUserDevices failed:', err);
  }
}

function* handleFetchUnclaimedDevices() {
  try {
    const response = yield call(axios.get, `${API_BASE}/api/devices/unclaimed`);
    yield put(setUnclaimedDevices(response.data));
  } catch (err) {
    console.error('fetchUnclaimedDevices failed:', err);
  }
}

function* handleClaimDevice(action) {
  try {
    const { mac, nickname } = action.payload;
    yield call(axios.post, `${API_BASE}/api/me/devices`, { mac, nickname });
    yield call(handleFetchUserDevices);
    yield call(handleFetchUnclaimedDevices);
  } catch (err) {
    console.error('claimDevice failed:', err);
  }
}

// ---------- Device control (MQTT-only) ----------

const selectCurrentLight = (state) => state.light.currentLight;

function* handleToggleBox() {
  const { mac, isOn } = yield select(selectCurrentLight);
  if (!mac) return;
  publishMqtt(`plantapp/device/${mac}/cmd/led`, isOn ? 'on' : 'off');
}

function* handleToggleBoxes() {
  const lights = yield select((state) => state.light.lights);
  if (lights.length === 0) return;
  const onCount = lights.filter((l) => l.isOn).length;
  const targetState = onCount >= lights.length / 2 ? 'off' : 'on';
  for (const light of lights) {
    if (!light.mac) continue;
    publishMqtt(`plantapp/device/${light.mac}/cmd/led`, targetState);
    yield put(updateLightState({ mac: light.mac, isOn: targetState === 'on' }));
  }
}

function* handleManualRelease() {
  const lights = yield select((state) => state.light.lights);
  for (const light of lights) {
    if (!light.mac) continue;
    publishMqtt(`plantapp/device/${light.mac}/cmd/manual_release`, '');
  }
}

function* handleViewingBoxes() {
  // Legacy: viewing mode was tied to hardcoded IP 192.168.0.137.
  // Not yet redefined under the registry model.
  console.log('Viewing mode: no-op pending redesign under registry model');
}

function* handleBrightnessChange(action) {
  const { mac, level } = action.payload;
  if (!mac) return;
  publishMqtt(`plantapp/device/${mac}/cmd/brightness`, String(level));
}

function* handleTimerChange(action) {
  if (action.meta?.selfDispatched) return;
  const { mac, timeOn, timeOff } = action.payload;
  if (timeOn === undefined || timeOff === undefined) return;

  if (!mac) {
    // Master — publish to every owned device.
    const lights = yield select((state) => state.light.lights);
    for (const light of lights) {
      if (!light.mac) continue;
      publishMqtt(`plantapp/device/${light.mac}/cmd/timer`, `${timeOn}:${timeOff}`);
    }
    yield put({
      type: updateLightTimers.type,
      payload: { timeOn, timeOff },
      meta: { selfDispatched: true },
    });
  } else {
    publishMqtt(`plantapp/device/${mac}/cmd/timer`, `${timeOn}:${timeOff}`);
  }
}

function* handleTimeRangeChange(action) {
  if (action.meta?.selfDispatched) return;
  const { mac, startTime, endTime } = action.payload;
  if (startTime === undefined || endTime === undefined) return;

  if (!mac) {
    const lights = yield select((state) => state.light.lights);
    for (const light of lights) {
      if (!light.mac) continue;
      publishMqtt(`plantapp/device/${light.mac}/cmd/timerange`, `${startTime}:${endTime}`);
    }
    yield put({
      type: updateLightTimers.type,
      payload: { startTime, endTime },
      meta: { selfDispatched: true },
    });
  } else {
    publishMqtt(`plantapp/device/${mac}/cmd/timerange`, `${startTime}:${endTime}`);
  }
}

// ---------- Root saga ----------

export default function* rootSaga() {
  yield takeLatest(updateCurrentLightState.type, handleToggleBox);
  yield takeLatest(toggleLightState.type, handleToggleBoxes);
  yield takeLatest(toggleViewingState.type, handleViewingBoxes);
  yield takeLatest(toggleManualRelease.type, handleManualRelease);
  yield throttle(150, updateBrightness.type, handleBrightnessChange);

  yield takeLatest(updateLightTimers.type, function* (action) {
    const { timeOn, timeOff, startTime, endTime } = action.payload;
    if (timeOn !== undefined && timeOff !== undefined) yield* handleTimerChange(action);
    if (startTime !== undefined && endTime !== undefined) yield* handleTimeRangeChange(action);
  });

  yield takeLatest(fetchUserDevices.type, handleFetchUserDevices);
  yield takeLatest(fetchUnclaimedDevices.type, handleFetchUnclaimedDevices);
  yield takeLatest(claimDevice.type, handleClaimDevice);

  yield spawn(watchMqtt);
}
