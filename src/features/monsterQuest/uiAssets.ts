/**
 * Painted interface graphics (icons, logo, platforms, banners, menu background).
 * Files live in public/monster-quest/ui and public/monster-quest/banners.
 */
const BASE = `${import.meta.env.BASE_URL}monster-quest/`;
/** Icon / logo / platform / background: ui('nav-home'), ui('coin'), ui('logo'), ui('platform-normal'), ui('bg') … */
export const ui = (name: string) => `${BASE}ui/${name}.webp`;
/** Wide banner pictures: arena zones (forest, desert, snow, jungle, volcano, ocean, crystal, city) and difficulties (easy, normal, hard). */
export const banner = (name: string) => `${BASE}banners/${name}.webp`;
export const BANNER_ZONES = new Set(['forest', 'desert', 'snow', 'jungle', 'volcano', 'ocean', 'crystal', 'city']);
export const zoneBanner = (zoneId: string) => banner(BANNER_ZONES.has(zoneId) ? zoneId : 'forest');
/** The CSS value of the menu background picture (used as the --mq-bg variable on the game's root element). */
export const menuBackground = () => `url(${ui('bg')}) center / cover no-repeat`;
