import type { Locale } from "@/lib/i18n/config";

export type SupplyChannel = "official" | "parallel";

export type DisclosureLine = {
  productName: string;
  variantName: string;
  quantity: number;
  brand?: string;
  manufacturer?: string;
  originCountry?: string;
  inci?: string;
  supplyChannel?: SupplyChannel;
};

const copy = {
  en: {
    goods: "Goods",
    house: "House",
    manufacturer: "Manufacturer",
    origin: "Country of manufacture",
    ingredients: "Ingredients (INCI)",
    supply: "Supply",
    onPack: "printed on the packaging. Included here when we hold it.",
    inciOnPack: "printed on the packaging.",
    supplyOfficial: "Supplied through an official importer.",
    supplyParallel: "Parallel import. The package may carry the additional labelling required in Israel.",
    supplyUnknown: "Printed on the packaging. Parallel import is named here when it applies.",
    warnings: "Warnings: contains alcohol and is flammable — keep away from heat and flame. Keep out of reach of children. For external use on skin only; stop if irritation occurs.",
    warranty:
      "Warranty: if the goods are defective or not as described, we will repair, replace or refund as required by Israeli law. That right is not limited to the 14-day cancellation window, and no change-of-mind cancellation fee applies.",
    vatIsrael: "Prices include Israeli VAT.",
    vatExport:
      "Delivery is outside Israel. The amount is the Israeli catalogue price and includes Israeli VAT; that VAT is not removed. No foreign sales tax is added. Customs duties in the destination country, if charged, are paid by you.",
  },
  he: {
    goods: "טובין",
    house: "בית הניחוח",
    manufacturer: "יצרן",
    origin: "ארץ ייצור",
    ingredients: "רכיבים (INCI)",
    supply: "אספקה",
    onPack: "מודפס על האריזה. נציין כאן כשהנתון בידינו.",
    inciOnPack: "מודפס על האריזה.",
    supplyOfficial: "אספקה דרך יבואן רשמי.",
    supplyParallel: "יבוא מקביל. על האריזה עשויה להופיע הסימון הנוסף הנדרש בישראל.",
    supplyUnknown: "מודפס על האריזה. יבוא מקביל יצוין כאן כשהוא חל.",
    warnings: "אזהרות: מכיל אלכוהול ודליק — להרחיק מחום ומאש. להרחיק מהישג ידם של ילדים. לשימוש חיצוני על העור בלבד; להפסיק אם מופיע גירוי.",
    warranty:
      "אחריות: אם הטובין פגומים או אינם תואמים את התיאור, נתקן, נחליף או נשיב כספים לפי הדין בישראל. זכות זו אינה מוגבלת לחלון 14 הימים, ולא חלים דמי ביטול של חרטה.",
    vatIsrael: "המחירים כוללים מע״מ ישראלי.",
    vatExport:
      "המשלוח מחוץ לישראל. הסכום הוא מחיר הקטלוג הישראלי וכולל מע״מ ישראלי; המע״מ אינו מנוכה. לא מתווסף מס מכירה זר. מכס במדינת היעד, אם ייגבה, חל על הלקוח.",
  },
  ru: {
    goods: "Товар",
    house: "Дом",
    manufacturer: "Изготовитель",
    origin: "Страна изготовления",
    ingredients: "Состав (INCI)",
    supply: "Поставка",
    onPack: "указано на упаковке. Пишем здесь, когда данные у нас есть.",
    inciOnPack: "указан на упаковке.",
    supplyOfficial: "Поставка через официального импортёра.",
    supplyParallel: "Параллельный импорт. На упаковке может быть дополнительная маркировка, требуемая в Израиле.",
    supplyUnknown: "Указано на упаковке. Параллельный импорт называется здесь, когда он применяется.",
    warnings:
      "Предупреждения: содержит спирт и огнеопасно — держать вдали от тепла и огня. Беречь от детей. Только для наружного нанесения на кожу; прекратить при раздражении.",
    warranty:
      "Гарантия: если товар с дефектом или не соответствует описанию, отремонтируем, заменим или вернём деньги по праву Израиля. Это право не ограничено 14 днями на отказ, и комиссия за отказ «передумал» не удерживается.",
    vatIsrael: "Цены включают израильский НДС.",
    vatExport:
      "Доставка за пределы Израиля. Сумма — израильская цена каталога и включает израильский НДС; НДС не вычитается. Иностранный налог с продажи не добавляется. Таможенные пошлины в стране назначения, если их начислят, оплачивает покупатель.",
  },
} as const;

export function isIsraeliDestination(country?: string | null) {
  const code = country?.trim().toUpperCase();
  return !code || code === "IL" || code === "ISR" || code === "ISRAEL";
}

export function buildOrderDisclosure(locale: Locale, country: string | undefined, lines: DisclosureLine[]) {
  const text = copy[locale] ?? copy.en;
  const blocks = lines.map((line) => {
    const supply =
      line.supplyChannel === "official"
        ? text.supplyOfficial
        : line.supplyChannel === "parallel"
          ? text.supplyParallel
          : text.supplyUnknown;
    return [
      `${text.goods}: ${line.productName} (${line.variantName}) × ${line.quantity}`,
      line.brand ? `${text.house}: ${line.brand}` : null,
      `${text.manufacturer}: ${line.manufacturer?.trim() || text.onPack}`,
      `${text.origin}: ${line.originCountry?.trim() || text.onPack}`,
      `${text.ingredients}: ${line.inci?.trim() || text.inciOnPack}`,
      `${text.supply}: ${supply}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    ...blocks,
    "",
    text.warnings,
    text.warranty,
    isIsraeliDestination(country) ? text.vatIsrael : text.vatExport,
  ].join("\n");
}
