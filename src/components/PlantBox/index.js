import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setCurrentLight, updateLightTimers, updateCurrentLightState } from '../../data/slice';
import {
  Box,
  SwitchContainer,
  SwitchButton,
  FieldGroup,
  FieldTitle,
  SubmitButton,
  BackButton,
  WheelWrapper,
  WheelContainer,
  WheelItem,
  WheelPad,
  WheelOverlayTop,
  WheelOverlayBottom,
  WheelSelector,
  WheelUnit,
  PickerRow,
  PickerColon,
  PickerRowLabel,
  PickerTrigger,
  PickerTriggerLabel,
  PickerTriggerValue,
  PickerChevron,
  PickerExpandArea,
  AmPmRow,
  AmPmButton,
  ResetButton,
} from './wrappers';

/* ── Value arrays (defined once outside render) ── */
/* null is the "no selection" sentinel — rendered as — in the wheel */
const HOURS_99 = [null, ...Array.from({ length: 100 }, (_, i) => i)];
const HOURS_12 = [null, ...Array.from({ length: 12 }, (_, i) => i + 1)];
const MINUTES  = [null, ...Array.from({ length: 60 }, (_, i) => i)];
const SECONDS  = [null, ...Array.from({ length: 60 }, (_, i) => i)];

/* ── WheelPicker component ── */
const WheelPicker = ({ values, selected, onChange, unit }) => {
  const trackRef = useRef(null);
  const debounceRef = useRef(null);
  const isProg = useRef(false);

  // Scroll to selected position (runs when selected changes externally, e.g. light switch)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const idx = values.indexOf(selected);
    if (idx < 0) return;
    isProg.current = true;
    el.scrollTop = idx * 44;
    requestAnimationFrame(() => { isProg.current = false; });
  }, [selected, values]);

  const handleScroll = useCallback(() => {
    if (isProg.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = trackRef.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(Math.round(el.scrollTop / 44), values.length - 1));
      isProg.current = true;
      el.scrollTop = idx * 44;
      requestAnimationFrame(() => { isProg.current = false; });
      if (values[idx] !== selected) onChange(values[idx]);
    }, 150);
  }, [values, selected, onChange]);

  return (
    <WheelWrapper>
      <WheelSelector />
      <WheelOverlayTop />
      <WheelOverlayBottom />
      <WheelContainer ref={trackRef} onScroll={handleScroll}>
        <WheelPad /><WheelPad />
        {values.map((v, i) => (
          <WheelItem key={i} $selected={v === selected}>{v === null ? '—' : String(v).padStart(2, '0')}</WheelItem>
        ))}
        <WheelPad /><WheelPad />
      </WheelContainer>
      <WheelUnit>{unit}</WheelUnit>
    </WheelWrapper>
  );
};

/* ── PlantBox component ── */
export const PlantBox = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const lights = useSelector((state) => state.light.lights || []);

  // Cycle ON
  const [onH, setOnH]   = useState(null);
  const [onM, setOnM]   = useState(null);
  const [onS, setOnS]   = useState(null);
  // Cycle OFF
  const [offH, setOffH] = useState(null);
  const [offM, setOffM] = useState(null);
  const [offS, setOffS] = useState(null);
  // Time Range
  const [startH, setStartH]       = useState(null);
  const [startM, setStartM]       = useState(null);
  const [startAmPm, setStartAmPm] = useState('AM');
  const [endH, setEndH]           = useState(null);
  const [endM, setEndM]           = useState(null);
  const [endAmPm, setEndAmPm]     = useState('AM');

  // Accordion: which field is expanded
  const [activeField, setActiveField] = useState(null);
  const toggleField = (key) => setActiveField((prev) => (prev === key ? null : key));

  useEffect(() => {
    const lightIndex = parseInt(id, 10) - 1;
    const light = lights[lightIndex];
    if (light || id === 'master') {
      dispatch(setCurrentLight(light));
    } else {
      console.warn('Invalid light ID. Redirecting to home.');
      navigate('/');
    }
  }, [id, lights, dispatch, navigate]);

  const currentLight = useSelector((state) =>
    id === 'master' ? state.light.masterLightBox : state.light.currentLight
  );

  // Initialize pickers from currentLight whenever the light changes
  useEffect(() => {
    if (!currentLight?.name) return;

    const toHMS = (dec) => {
      const total = Math.round((dec || 0) * 3600);
      return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
    };
    const toHM = (dec) => {
      const total = Math.round((dec || 0) * 60);
      const h24 = Math.floor(total / 60) % 24;
      const m   = total % 60;
      const ampm = h24 < 12 ? 'AM' : 'PM';
      const h12  = h24 % 12 || 12;
      return [h12, m, ampm];
    };

    if (currentLight.timeOn > 0) {
      const [h1, m1, s1] = toHMS(currentLight.timeOn);
      setOnH(h1); setOnM(m1); setOnS(s1);
    } else {
      setOnH(null); setOnM(null); setOnS(null);
    }
    if (currentLight.timeOff > 0) {
      const [h2, m2, s2] = toHMS(currentLight.timeOff);
      setOffH(h2); setOffM(m2); setOffS(s2);
    } else {
      setOffH(null); setOffM(null); setOffS(null);
    }
    if (currentLight.startTime > 0) {
      const [sh, sm, sAmPm] = toHM(currentLight.startTime);
      setStartH(sh); setStartM(sm); setStartAmPm(sAmPm);
    } else {
      setStartH(null); setStartM(null); setStartAmPm('AM');
    }
    if (currentLight.endTime > 0) {
      const [eh, em, eAmPm] = toHM(currentLight.endTime);
      setEndH(eh); setEndM(em); setEndAmPm(eAmPm);
    } else {
      setEndH(null); setEndM(null); setEndAmPm('AM');
    }
    setActiveField(null);
  }, [currentLight?.name, currentLight?.ip]);

  if (!currentLight?.name) return <p>Loading...</p>;

  const handleSubmit = () => {
    const timeOn    = (onH  ?? 0) + (onM  ?? 0) / 60 + (onS  ?? 0) / 3600;
    const timeOff   = (offH ?? 0) + (offM ?? 0) / 60 + (offS ?? 0) / 3600;
    const to24h = (h12, ampm) => ampm === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
    const startTime = startH != null ? to24h(startH, startAmPm) + (startM ?? 0) / 60 : 0;
    const endTime   = endH   != null ? to24h(endH,   endAmPm)   + (endM   ?? 0) / 60 : 0;

    const currentTimeOn    = currentLight.timeOn;
    const currentTimeOff   = currentLight.timeOff;
    const currentStartTime = currentLight.startTime;
    const currentEndTime   = currentLight.endTime;

    const payload = { ip: currentLight.ip };
    let hasTimerChanged     = false;
    let hasTimeRangeChanged = false;

    if (Math.abs(timeOn - currentTimeOn) > 0.0001 || Math.abs(timeOff - currentTimeOff) > 0.0001) {
      if (timeOn > 0 && timeOff > 0) {
        payload.timeOn  = timeOn;
        payload.timeOff = timeOff;
        hasTimerChanged = true;
      } else {
        console.warn('Invalid timer inputs. Timer update skipped.');
      }
    }

    if (Math.abs(startTime - currentStartTime) > 0.0001 || Math.abs(endTime - currentEndTime) > 0.0001) {
      if (startTime > 0 && endTime > 0) {
        payload.startTime   = startTime;
        payload.endTime     = endTime;
        hasTimeRangeChanged = true;
      } else {
        console.warn('Invalid time range inputs. Time range update skipped.');
      }
    }

    if (hasTimerChanged || hasTimeRangeChanged) {
      dispatch(updateLightTimers(payload));
    } else {
      console.log('No changes detected. API calls skipped.');
    }
  };

  const toggleLight = () => dispatch(updateCurrentLightState());
  const handleBack  = () => navigate(-1);
  const handleReset = () => {
    setOnH(null); setOnM(null); setOnS(null);
    setOffH(null); setOffM(null); setOffS(null);
    setStartH(null); setStartM(null); setStartAmPm('AM');
    setEndH(null); setEndM(null); setEndAmPm('AM');
    setActiveField(null);
  };
  const dismissPicker = () => { if (activeField) setActiveField(null); };

  /* Display helpers */
  const fmtDur  = (h, m, s)    => (h != null || m != null || s != null)
    ? `${h ?? 0}h ${String(m ?? 0).padStart(2,'0')}m ${String(s ?? 0).padStart(2,'0')}s`
    : null;
  const fmtTime = (h, m, ampm) => h != null
    ? `${String(h).padStart(2,'0')}:${String(m ?? 0).padStart(2,'0')} ${ampm}`
    : null;

  /* Reusable field row: collapsed trigger + expanded picker */
  const Field = ({ fieldKey, label, placeholder, displayValue, children }) => (
    <div onClick={e => e.stopPropagation()}>
      <PickerTrigger onClick={() => toggleField(fieldKey)} $active={activeField === fieldKey}>
        <PickerTriggerLabel>{label}</PickerTriggerLabel>
        <PickerTriggerValue $empty={!displayValue}>{displayValue || placeholder}</PickerTriggerValue>
        <PickerChevron $open={activeField === fieldKey}>▾</PickerChevron>
      </PickerTrigger>
      {activeField === fieldKey && (
        <PickerExpandArea ref={el => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>{children}</PickerExpandArea>
      )}
    </div>
  );

  /* Shared sections */
  const cycleSection = (
    <FieldGroup>
      <FieldTitle>Cycle</FieldTitle>
      <Field fieldKey="onDur" label="ON Duration" placeholder="Set duration" displayValue={fmtDur(onH, onM, onS)}>
        <PickerRowLabel>ON Duration</PickerRowLabel>
        <PickerRow>
          <WheelPicker values={HOURS_99} selected={onH}  onChange={setOnH}  unit="hr" />
          <WheelPicker values={MINUTES}  selected={onM}  onChange={setOnM}  unit="min" />
          <WheelPicker values={SECONDS}  selected={onS}  onChange={setOnS}  unit="sec" />
        </PickerRow>
      </Field>
      <Field fieldKey="offDur" label="OFF Duration" placeholder="Set duration" displayValue={fmtDur(offH, offM, offS)}>
        <PickerRowLabel>OFF Duration</PickerRowLabel>
        <PickerRow>
          <WheelPicker values={HOURS_99} selected={offH} onChange={setOffH} unit="hr" />
          <WheelPicker values={MINUTES}  selected={offM} onChange={setOffM} unit="min" />
          <WheelPicker values={SECONDS}  selected={offS} onChange={setOffS} unit="sec" />
        </PickerRow>
      </Field>
    </FieldGroup>
  );

  const timeRangeSection = (
    <FieldGroup>
      <FieldTitle>Time Range (EST)</FieldTitle>
      <Field fieldKey="startT" label="Start" placeholder="Set time" displayValue={fmtTime(startH, startM, startAmPm)}>
        <PickerRowLabel>Start Time</PickerRowLabel>
        <PickerRow>
          <WheelPicker values={HOURS_12} selected={startH} onChange={setStartH} unit="hr" />
          <PickerColon>:</PickerColon>
          <WheelPicker values={MINUTES}  selected={startM} onChange={setStartM} unit="min" />
        </PickerRow>
        <AmPmRow>
          <AmPmButton $active={startAmPm === 'AM'} onClick={() => setStartAmPm('AM')}>AM</AmPmButton>
          <AmPmButton $active={startAmPm === 'PM'} onClick={() => setStartAmPm('PM')}>PM</AmPmButton>
        </AmPmRow>
      </Field>
      <Field fieldKey="endT" label="End" placeholder="Set time" displayValue={fmtTime(endH, endM, endAmPm)}>
        <PickerRowLabel>End Time</PickerRowLabel>
        <PickerRow>
          <WheelPicker values={HOURS_12} selected={endH} onChange={setEndH} unit="hr" />
          <PickerColon>:</PickerColon>
          <WheelPicker values={MINUTES}  selected={endM} onChange={setEndM} unit="min" />
        </PickerRow>
        <AmPmRow>
          <AmPmButton $active={endAmPm === 'AM'} onClick={() => setEndAmPm('AM')}>AM</AmPmButton>
          <AmPmButton $active={endAmPm === 'PM'} onClick={() => setEndAmPm('PM')}>PM</AmPmButton>
        </AmPmRow>
      </Field>
    </FieldGroup>
  );

  if (id === 'master') {
    return (
      <Box onClick={dismissPicker}>
        <BackButton onClick={handleBack}>Back</BackButton>
        <ResetButton onClick={handleReset}>Reset</ResetButton>
        <h2>Settings for all</h2>
        {cycleSection}
        {timeRangeSection}
        <SubmitButton onClick={() => { handleSubmit(); navigate('/'); }}>Submit</SubmitButton>
      </Box>
    );
  }

  return (
    <Box isOn={currentLight.isOn} onClick={dismissPicker}>
      <BackButton onClick={handleBack}>Back</BackButton>
      <ResetButton onClick={handleReset}>Reset</ResetButton>
      <h2>{currentLight.name || 'Unknown Light'}</h2>
      <FieldGroup>
        <FieldTitle>IP Address</FieldTitle>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#adbac7', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
          {currentLight.ip}
        </p>
      </FieldGroup>
      <SwitchContainer>
        <SwitchButton active={currentLight.isOn}  isOnButton onClick={toggleLight}>ON</SwitchButton>
        <SwitchButton active={!currentLight.isOn}            onClick={toggleLight}>OFF</SwitchButton>
      </SwitchContainer>
      {cycleSection}
      {timeRangeSection}
      <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
    </Box>
  );
};
