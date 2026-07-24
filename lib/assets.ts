import type { ImageSourcePropType } from "react-native";

const happyMascot = require("../imagem/imagem/pixo 01.png") as ImageSourcePropType;
const laptopMascot = require("../imagem/imagem/pixo 02.png") as ImageSourcePropType;
const coinMascot = require("../imagem/imagem/pixo 03.png") as ImageSourcePropType;
const cashMascot = require("../imagem/imagem/imagem 04.png") as ImageSourcePropType;
const tiredMascot = require("../imagem/imagem/imagem 05.png") as ImageSourcePropType;
const targetMascot = require("../imagem/imagem/pixo 06.png") as ImageSourcePropType;
const radarMascot = require("../imagem/imagem/pixo 07.png") as ImageSourcePropType;
const appReference = require("../imagem/imagem/pixo app.png") as ImageSourcePropType;

export const mascotImages = {
  happy: happyMascot,
  laptop: laptopMascot,
  coin: coinMascot,
  cash: cashMascot,
  tired: tiredMascot,
  target: targetMascot,
  radar: radarMascot,
  reference: appReference
} as const;

export type MascotImageName = keyof typeof mascotImages;
