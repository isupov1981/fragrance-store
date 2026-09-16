import {
  EXPRESS_SHIPPING_ILS_CENTS,
  FREE_SHIPPING_ILS_CENTS,
  STANDARD_SHIPPING_ILS_CENTS,
} from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";

export const INTL_ZONE1_SHIPPING_ILS_CENTS = 5000;
export const INTL_ZONE2_SHIPPING_ILS_CENTS = 7500;
export const INTL_FREE_SHIPPING_ILS_CENTS = 69900;
export const SHIPPING_CANCELLATION_FEE_PERCENT = 5;
export const SHIPPING_CANCELLATION_FEE_CAP_ILS_CENTS = 10000;

export type ShippingZone = "israel" | "us" | "zone1" | "zone2";

export const EUROPE_ZONE1_COUNTRY_CODES = [
  "AD", "AT", "BE", "CH", "CY", "DE", "DK", "ES", "FI", "FR", "GB", "GG", "GI", "GR", "IE", "IT",
  "JE", "LI", "LU", "MC", "MT", "NL", "NO", "PT", "SE", "SM",
] as const;

export const EUROPE_ZONE2_COUNTRY_CODES = [
  "AL", "BA", "BG", "BY", "CZ", "EE", "FO", "HR", "HU", "IS", "LT", "LV", "MD", "ME", "MK", "PL",
  "RO", "RS", "SI", "SK", "XK",
] as const;

export const SHIPPABLE_COUNTRY_CODES = [
  "IL",
  "US",
  ...EUROPE_ZONE1_COUNTRY_CODES,
  ...EUROPE_ZONE2_COUNTRY_CODES,
] as const;

const zone1Set = new Set<string>(EUROPE_ZONE1_COUNTRY_CODES);
const zone2Set = new Set<string>(EUROPE_ZONE2_COUNTRY_CODES);
const shippableSet = new Set<string>(SHIPPABLE_COUNTRY_CODES);

export function isShippableCountry(country: string) {
  return shippableSet.has(country.toUpperCase());
}

export function getShippingZone(country: string): ShippingZone | null {
  const code = country.toUpperCase();
  if (code === "IL") return "israel";
  if (code === "US") return "us";
  if (zone1Set.has(code)) return "zone1";
  if (zone2Set.has(code)) return "zone2";
  return null;
}

export function quoteShippingIls(
  country: string,
  subtotalIls: number,
  shippingMethod: "standard" | "express" = "standard",
) {
  const zone = getShippingZone(country);
  if (!zone) return null;
  if (zone === "israel") {
    if (shippingMethod === "express") return EXPRESS_SHIPPING_ILS_CENTS;
    return subtotalIls >= FREE_SHIPPING_ILS_CENTS ? 0 : STANDARD_SHIPPING_ILS_CENTS;
  }
  const rate =
    zone === "zone2" ? INTL_ZONE2_SHIPPING_ILS_CENTS : INTL_ZONE1_SHIPPING_ILS_CENTS;
  return subtotalIls >= INTL_FREE_SHIPPING_ILS_CENTS ? 0 : rate;
}

export type LocalizedPlace = Record<Locale, string>;

function place(en: string, he: string, ru: string): LocalizedPlace {
  return { en, he, ru };
}

/** All 50 US states, as published on the worldwide deliveries table. */
export const unitedStatesDestinations: LocalizedPlace[] = [
  place("Alabama", "אלבמה", "Алабама"),
  place("Alaska", "אלסקה", "Аляска"),
  place("Arizona", "אריזונה", "Аризона"),
  place("Arkansas", "ארקנסו", "Арканзас"),
  place("California", "קליפורניה", "Калифорния"),
  place("Colorado", "קולורדו", "Колорадо"),
  place("Connecticut", "קונטיקט", "Коннектикут"),
  place("Delaware", "דלאוור", "Делавэр"),
  place("Florida", "פלורידה", "Флорида"),
  place("Georgia", "ג'ורג'יה", "Джорджия"),
  place("Hawaii", "הוואי", "Гавайи"),
  place("Idaho", "איידהו", "Айдахо"),
  place("Illinois", "אילינוי", "Иллинойс"),
  place("Indiana", "אינדיאנה", "Индиана"),
  place("Iowa", "איווה", "Айова"),
  place("Kansas", "קנזס", "Канзас"),
  place("Kentucky", "קנטקי", "Кентукки"),
  place("Louisiana", "לואיזיאנה", "Луизиана"),
  place("Maine", "מיין", "Мэн"),
  place("Maryland", "מרילנד", "Мэриленд"),
  place("Massachusetts", "מסצ'וסטס", "Массачусетс"),
  place("Michigan", "מישיגן", "Мичиган"),
  place("Minnesota", "מינסוטה", "Миннесота"),
  place("Mississippi", "מיסיסיפי", "Миссисипи"),
  place("Missouri", "מיזורי", "Миссури"),
  place("Montana", "מונטנה", "Монтана"),
  place("Nebraska", "נברסקה", "Небраска"),
  place("Nevada", "נבדה", "Невада"),
  place("New Hampshire", "ניו המפשייר", "Нью-Гэмпшир"),
  place("New Jersey", "ניו ג'רזי", "Нью-Джерси"),
  place("New Mexico", "ניו מקסיקו", "Нью-Мексико"),
  place("New York", "ניו יורק", "Нью-Йорк"),
  place("North Carolina", "צפון קרוליינה", "Северная Каролина"),
  place("North Dakota", "צפון דקוטה", "Северная Дакота"),
  place("Ohio", "אוהיו", "Огайо"),
  place("Oklahoma", "אוקלהומה", "Оклахома"),
  place("Oregon", "אורגון", "Орегон"),
  place("Pennsylvania", "פנסילבניה", "Пенсильвания"),
  place("Rhode Island", "רוד איילנד", "Род-Айленд"),
  place("South Carolina", "דרום קרוליינה", "Южная Каролина"),
  place("South Dakota", "דרום דקוטה", "Южная Дакота"),
  place("Tennessee", "טנסי", "Теннесси"),
  place("Texas", "טקסס", "Техас"),
  place("Utah", "יוטה", "Юта"),
  place("Vermont", "ורמונט", "Вермонт"),
  place("Virginia", "וירג'יניה", "Виргиния"),
  place("Washington", "וושינגטון", "Вашингтон"),
  place("West Virginia", "ווסט וירג'יניה", "Западная Виргиния"),
  place("Wisconsin", "ויסקונסין", "Висконсин"),
  place("Wyoming", "ויומינג", "Вайоминг"),
];

export const europeZone2Destinations: LocalizedPlace[] = [
  place("Albania", "אלבניה", "Албания"),
  place("Belarus", "בלארוס", "Беларусь"),
  place("Bosnia & Herzegovina", "בוסניה והרצגובינה", "Босния и Герцеговина"),
  place("Bulgaria", "בולגריה", "Болгария"),
  place("Croatia", "קרואטיה", "Хорватия"),
  place("Czechia", "צ'כיה", "Чехия"),
  place("Estonia", "אסטוניה", "Эстония"),
  place("Faroe Islands", "איי פארו", "Фарерские острова"),
  place("Hungary", "הונגריה", "Венгрия"),
  place("Iceland", "איסלנד", "Исландия"),
  place("Kosovo", "קוסובו", "Косово"),
  place("Latvia", "לטביה", "Латвия"),
  place("Lithuania", "ליטא", "Литва"),
  place("North Macedonia", "מקדוניה הצפונית", "Северная Македония"),
  place("Moldova", "מולדובה", "Молдова"),
  place("Montenegro", "מונטנגרו", "Черногория"),
  place("Poland", "פולין", "Польша"),
  place("Romania", "רומניה", "Румыния"),
  place("Serbia", "סרביה", "Сербия"),
  place("Slovakia", "סלובקיה", "Словакия"),
  place("Slovenia", "סלובניה", "Словения"),
];

export const europeZone1Destinations: LocalizedPlace[] = [
  place("Andorra", "אנדורה", "Андорра"),
  place("Austria", "אוסטריה", "Австрия"),
  place("Belgium", "בלגיה", "Бельгия"),
  place("Cyprus", "קפריסין", "Кипр"),
  place("Denmark", "דנמרק", "Дания"),
  place("Finland", "פינלנד", "Финляндия"),
  place("Germany", "גרמניה", "Германия"),
  place("France", "צרפת", "Франция"),
  place("Gibraltar", "גיברלטר", "Гибралтар"),
  place("Greece", "יוון", "Греция"),
  place("Guernsey", "גרנזי", "Гернси"),
  place("Ireland", "אירלנד", "Ирландия"),
  place("Italy", "איטליה", "Италия"),
  place("Jersey", "ג'רזי", "Джерси"),
  place("Liechtenstein", "ליכטנשטיין", "Лихтенштейн"),
  place("Luxembourg", "לוקסמבורג", "Люксембург"),
  place("Malta", "מלטה", "Мальта"),
  place("Monaco", "מונקו", "Монако"),
  place("Netherlands", "הולנד", "Нидерланды"),
  place("Norway", "נורווגיה", "Норвегия"),
  place("Portugal", "פורטוגל", "Португалия"),
  place("San Marino", "סן מרינו", "Сан-Марино"),
  place("Spain", "ספרד", "Испания"),
  place("Sweden", "שוודיה", "Швеция"),
  place("Switzerland", "שווייץ", "Швейцария"),
  place("United Kingdom", "הממלכה המאוחדת", "Великобритания"),
];

export function localizedPlaces(places: LocalizedPlace[], locale: Locale) {
  return places.map((entry) => entry[locale]);
}
