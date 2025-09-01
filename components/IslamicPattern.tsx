import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface IslamicPatternProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export function IslamicPattern({ size = 100, color = '#059669', opacity = 0.1 }: IslamicPatternProps) {
  return (
    <View style={[styles.container, { width: size, height: size, opacity }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G>
          <Path
            d="M50 10 L60 30 L80 30 L65 45 L70 65 L50 55 L30 65 L35 45 L20 30 L40 30 Z"
            fill={color}
            fillOpacity={0.3}
          />
          <Path
            d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 53 L37 60 L42 45 L30 35 L45 35 Z"
            fill={color}
            fillOpacity={0.5}
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});