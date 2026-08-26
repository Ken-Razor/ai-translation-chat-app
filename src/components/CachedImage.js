import React, { useState } from 'react';
import { Image } from 'react-native';

export default function CachedImage({ source, style, fallbackUri, ...props }) {
  const [hasError, setHasError] = useState(false);

  let rawUri = null;
  if (typeof source === 'object' && source?.uri) {
    rawUri = source.uri;
  } else if (typeof source === 'string') {
    rawUri = source;
  }

  const cleanUri = (rawUri && rawUri.trim().length > 0 && !hasError)
    ? rawUri.trim()
    : (fallbackUri || 'https://ui-avatars.com/api/?name=User&background=4B1A56&color=ffffff&size=256');

  // Strip invalid defaultSource if passed to prevent Android Fresco native crashes
  const { defaultSource, ...safeProps } = props;

  return (
    <Image
      source={{ uri: cleanUri }}
      style={style}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
      {...safeProps}
    />
  );
}
