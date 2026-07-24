import { Image, StyleSheet } from "react-native";

import { mascotImages, type MascotImageName } from "../lib/assets";
import { imageSizes } from "../theme/tokens";

type MascotImageProps = {
  name: MascotImageName;
  size?: keyof typeof imageSizes;
};

export function MascotImage({ name, size = "mascotMedium" }: MascotImageProps) {
  const imageSize = imageSizes[size];

  return (
    <Image
      source={mascotImages[name]}
      style={[styles.image, { width: imageSize, height: imageSize }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "center"
  }
});
