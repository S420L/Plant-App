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
  CameraStage,
  CameraFrame,
  CameraPlaceholder,
  CameraPlaceholderHint,
  OpenFeedLink,
} from './wrappers';

/* Single shared feed for now — every light points here until per-device
   camera URLs land in the registry. */
export const CAMERA_URL = 'https://testcam.site';

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

        {analysis.status === 'done' && (
          <ResultsPanel>
            <ResultRow>
              <ResultLabel>Plant</ResultLabel>
              <ResultValue>{analysis.plant || '—'}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>Species</ResultLabel>
              <ResultValue>{analysis.species || '—'}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>Watering</ResultLabel>
              <ResultValue>{analysis.watering || '—'}</ResultValue>
            </ResultRow>
          </ResultsPanel>
        )}

        {analysis.status === 'error' && (
          <ResultsPanel>
            <ResultRow>
              <ResultLabel>Analysis failed</ResultLabel>
              <ResultError>{analysis.error}</ResultError>
            </ResultRow>
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
