import React from 'react';
import { Text } from 'react-native';

export default function MonoText() {
  return <Text {...this.props} style={[this.props.style, { fontFamily: 'space-mono' }]} />;
}
