import { View, Text, Button, StyleSheet } from "react-native";
import React from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withSpring,
} from "react-native-reanimated";

interface IndexProps {
  width: number;
}

const index = () => {
  const width = useSharedValue(100);
  const offset = useSharedValue(width / 2 - 160);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const handlePress = () => {
    width.value = withSpring(width.value + 50, {
      mass: 0.5,
    });
  };

  const handleReset = () => {
    width.value = withSpring(width.value - 50);
  };

  React.useEffect(() => {
    offset.value = withRepeat(
      withTiming(-offset.value, { duration: 1750 }),
      -1,
      true
    );
  }, []);

  return (
    <>
      <Animated.View
        style={{
          width,
          height: 100,
          backgroundColor: "violet",
        }}
      />
      <Button onPress={handlePress} title="Click me" />
      <Button onPress={handleReset} title="Reset" />

      <View style={styles.container}>
        <Animated.View style={[styles.box2, animatedStyles]} />
      </View>
    </>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  box: {
    height: 80,
    width: 80,
    margin: 20,
    borderWidth: 1,
    borderColor: "#b58df1",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#b58df1",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  box2: {
    height: 120,
    width: 120,
    backgroundColor: "#b58df1",
    borderRadius: 20,
  },
});
