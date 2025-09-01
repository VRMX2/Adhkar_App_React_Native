// components/CustomText.tsx
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
}

export default function CustomText({ 
  weight = 'regular', 
  style, 
  children, 
  ...props 
}: CustomTextProps) {
  const fontFamily = {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extraBold: 'PlusJakartaSans-ExtraBold',
  }[weight];

  return (
    <RNText style={[{ fontFamily }, style]} {...props}>
      {children}
    </RNText>
  );
}