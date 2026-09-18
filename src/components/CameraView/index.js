import React, { useEffect, useState } from 'react';
import {
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [src]);

  return (
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
  );
};
