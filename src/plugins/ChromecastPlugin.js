import { registerPlugin } from '@capacitor/core';

/**
 * Bridge JS → plugin natif Android (ChromecastPlugin.java).
 * Sur navigateur web, le fichier est importé mais non utilisé
 * (VideoPlayer utilise le SDK Cast JS à la place).
 */
const ChromecastNative = registerPlugin('Chromecast');

export default ChromecastNative;
