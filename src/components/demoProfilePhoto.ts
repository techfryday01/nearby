import type { ImageSourcePropType } from 'react-native';

const DEMO_PROFILE_PHOTOS: Record<string, ImageSourcePropType> = {
  'demo-maya': require('../../assets/demo-profiles/maya.png'),
  'demo-nina': require('../../assets/demo-profiles/nina.png'),
  'demo-isha': require('../../assets/demo-profiles/isha.png'),
  'demo-tara': require('../../assets/demo-profiles/tara.png'),
};

export function demoProfilePhoto(id: string): ImageSourcePropType | undefined {
  return DEMO_PROFILE_PHOTOS[id];
}
