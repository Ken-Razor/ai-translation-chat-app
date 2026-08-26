import React, { useState, useEffect } from 'react';
import { Image, Platform } from 'react-native';
import { imageCacheService } from '../services/imageCacheService';

export default function CachedImage({ source, style, defaultSource, ...props }) {
  const remoteUri = typeof source === 'object' && source?.uri ? source.uri : (typeof source === 'string' ? source : null);
  
  const [imageUri, setImageUri] = useState(() => {
    if (!remoteUri) return null;
    const fastLocal = imageCacheService.getSyncLocalUri(remoteUri);
    return fastLocal || remoteUri;
  });

  useEffect(() => {
    if (!remoteUri || Platform.OS === 'web' || !remoteUri.startsWith('http')) {
      setImageUri(remoteUri);
      return;
    }

    let isMounted = true;
    imageCacheService.getCachedImageUri(remoteUri).then(cachedPath => {
      if (isMounted && cachedPath && cachedPath !== imageUri) {
        setImageUri(cachedPath);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [remoteUri]);

  if (!imageUri) {
    return <Image source={defaultSource || { uri: 'https://ui-avatars.com/api/?name=User&background=4B1A56&color=ffffff' }} style={style} {...props} />;
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      defaultSource={defaultSource}
      {...props}
    />
  );
}
