import { View, type ViewProps } from 'react-native';


export type ThemedViewProps = ViewProps & {
  backgroundColor?: string;
};

export function ThemedView({ style, backgroundColor, ...otherProps }: ThemedViewProps) {

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
