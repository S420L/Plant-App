import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyzeFootage } from '../../data/slice';
import {
  CameraScreen,
  AnalyzePanel,
  AnalyzeButton,
  ResultsPanel,
  ResultRow,
  ResultLabel,
  ResultValue,
  ResultNote,
  ResultError,
  Dots,
  Dot,
  CameraStage,
  CameraFrame,
  CameraPlaceholder,
  CameraPlaceholderHint,
  OpenFeedLink,
} from './wrappers';

/* Single shared feed for now — every light points here until per-device
   camera URLs land in the registry. */
export const CAMERA_URL = 'https://testcam.site';

/* One colour per question, in the order AItest.py answers them */
const RESULT_ROWS = [
  { key: 'plant',    label: 'Plant',    accent: '#22c55e' },
  { key: 'species',  label: 'Species',  accent: '#a855f7' },
  { key: 'watering', label: 'Watering', accent: '#60a5fa' },
];

const LoadingDots = ({ accent }) => (
  <Dots aria-label="Working">
    <Dot $accent={accent} $i={0} />
    <Dot $accent={accent} $i={1} />
    <Dot $accent={accent} $i={2} />
  </Dots>
);

export const CameraView = ({ src = CAMERA_URL, title = 'Camera feed' }) => {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);
  const analysis = useSelector((state) => state.light.analysis);
  const running = analysis.status === 'running';

  useEffect(() => { setLoaded(false); }, [src]);

  return (
    <CameraScreen>
      <AnalyzePanel>
        <AnalyzeButton onClick={() => dispatch(analyzeFootage())} disabled={running}>
          {running ? 'Analyzing…' : 'Analyze Footage'}
        </AnalyzeButton>

        {running && (
          <ResultNote>Reading the frame — this takes a minute or two.</ResultNote>
        )}

        {analysis.status !== 'idle' && (
          <ResultsPanel>
            {RESULT_ROWS.map(({ key, label, accent }) => (
              <ResultRow key={key} $accent={accent}>
                <ResultLabel $accent={accent}>{label}</ResultLabel>
                {analysis[key]
                  ? <ResultValue>{analysis[key]}</ResultValue>
                  : running
                    ? <LoadingDots accent={accent} />
                    : <ResultValue>—</ResultValue>}
              </ResultRow>
            ))}
            {analysis.status === 'error' && (
              <ResultRow $accent="#ef4444">
                <ResultLabel $accent="#ef4444">Analysis failed</ResultLabel>
                <ResultError>{analysis.error}</ResultError>
              </ResultRow>
            )}
          </ResultsPanel>
        )}
      </AnalyzePanel>

      <CameraStage>
        <CameraFrame
          src={src}
          title={title}
          onLoad={() => setLoaded(true)}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        <CameraPlaceholder $hidden={loaded}>
          Connecting to feed
          <CameraPlaceholderHint>{src.replace(/^https?:\/\//, '')}</CameraPlaceholderHint>
        </CameraPlaceholder>
        <OpenFeedLink href={src} target="_blank" rel="noreferrer">Open feed ↗</OpenFeedLink>
      </CameraStage>
    </CameraScreen>
  );
};
