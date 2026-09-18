import type { Locale } from "@/lib/i18n/config";

export { ADMIN_LOCALE_COOKIE, defaultAdminLocale, isAdminLocale } from "@/lib/admin/locale";

const en = {
  brand: "Fragrance Admin",
  skipToContent: "Skip to content",
  navAria: "Admin sections",
  logout: "Sign out",
  language: "Language",
  nav: {
    overview: "Overview",
    products: "Products",
    categories: "Categories",
    brands: "Brands",
    orders: "Orders",
    customers: "Customers",
    content: "Content",
    shipping: "Shipping",
    settings: "Settings",
  },
  dashboard: {
    eyebrow: "Data from PostgreSQL",
    title: "Store overview",
    metricsAria: "Metrics",
    products: "Products",
    productsNote: "{count} drafts",
    orders: "Orders",
    ordersNote: "{count} need attention",
    customers: "Customers",
    customersNote: "from the database",
    pages: "Pages",
    pagesNote: "CMS content",
  },
  settings: {
    eyebrow: "Storefront commerce",
    title: "Ordering",
    copy: "Turn checkout on or off without redeploying. When off, customers can browse the catalogue but cannot add to cart or pay.",
    ordersLabel: "Allow customers to place orders",
    ordersOn: "Cart and checkout are available on the storefront.",
    ordersOff: "Browse-only mode — cart and checkout are hidden.",
    save: "Save",
    saving: "Saving…",
    enabledOk: "Ordering is now enabled on the storefront.",
    disabledOk: "Ordering is now disabled. Catalogue remains browse-only.",
    saveFailed: "Could not update ordering setting",
    paymentProvider: "Payment provider",
    demoPaymentsBlocked:
      "Ordering cannot be enabled in production until Grow or Stripe credentials are configured. Demo checkout marks orders as paid without charging.",
  },
  newsletterBlast: {
    eyebrow: "Newsletter",
    title: "New-arrival emails",
    copy: "Email every active subscriber about each unannounced new arrival — one message per product, using the original product photo.",
    pendingProducts: "{count} products ready to announce",
    pendingNone: "No unannounced new arrivals right now.",
    subscribers: "{count} active subscribers",
    smtpOk: "SMTP is configured.",
    smtpMissing: "SMTP is not configured — emails cannot be sent.",
    send: "Send new-arrival emails",
    sending: "Sending…",
    confirm:
      "Email all subscribers about every unannounced new arrival? This cannot be undone for those products.",
    emptyOk: "Nothing to send — no unannounced new arrivals.",
    success:
      "Sent for {products} products to {subscribers} subscribers ({emails} emails). Failed: {failed}.",
    failed: "Could not send the newsletter blast",
  },
  section: {
    eyebrow: "Records from PostgreSQL",
    caption: "{title}: database records",
    empty: "No records yet.",
    editorTitle: "Editor form",
    editorHelp: "Records are saved through a protected API and validated on the server.",
  },
  sections: {
    products: {
      title: "Products",
      columns: ["Name", "SKU", "Price", "Status"],
      fields: {
        name: "Name",
        slug: "Slug",
        description: "Description",
        sku: "SKU",
        price: "Price in agorot (ILS)",
        stock: "Stock",
        imageUrl: "Image URL",
        newArrival: "Mark as new arrival (emails subscribers when published)",
      },
    },
    categories: {
      title: "Categories",
      columns: ["Name", "Slug", "Products", "Status"],
      fields: {
        name: "Name",
        slug: "Slug",
        description: "Description",
      },
    },
    brands: {
      title: "Brands",
      columns: ["Name", "Slug", "Description", "Status"],
      fields: {
        name: "Name",
        slug: "Slug",
        description: "Description",
      },
    },
    orders: {
      title: "Orders",
      columns: ["Number", "Customer", "Total", "Status"],
      fields: {
        number: "Number",
        email: "Email",
        status: "Status",
      },
    },
    customers: {
      title: "Customers",
      columns: ["Name", "Email", "Orders", "Joined"],
      fields: {
        name: "Name",
        email: "Email",
        phone: "Phone",
      },
    },
    content: {
      title: "Content",
      columns: ["Title", "Slug", "Updated", "Status"],
      fields: {
        title: "Title",
        slug: "Slug",
        content: "Body",
      },
    },
    shipping: {
      title: "Shipping",
      columns: ["Name", "Code", "Price", "Status"],
      fields: {
        name: "Name",
        code: "Code",
        description: "Description",
        price: "Price in agorot (ILS)",
      },
    },
  },
  form: {
    save: "Save",
    saving: "Saving…",
    ordersReadonly: "Orders are created at checkout",
    saveFailed: "Could not save the record",
    saveOk: "Record saved. Refresh the list to view it.",
  },
  orders: {
    statusLabel: "Order status {id}",
    updated: "Status updated",
    updateFailed: "Could not update status",
  },
  upload: {
    title: "Image upload",
    help: "JPEG, PNG or WebP up to 5 MB. With S3_* set (MinIO locally), files go to the bucket; otherwise to uploads/ and served from /api/media/....",
    file: "File",
    upload: "Upload",
    uploading: "Uploading…",
    failed: "Could not upload the image",
    ok: "Image saved. Paste the URL into the product form or CSV.",
  },
  csv: {
    title: "CSV import / export",
    help: "Preview the file first. Import is available to the ADMIN role when all rows are valid.",
    export: "Export CSV",
    file: "Products file",
    preview: "Preview",
    confirm: "Confirm import",
    previewFailed: "Could not validate CSV",
    previewOk: "Checked {total} rows. Errors: {errors}.",
    importOk: "Import finished: created {created}, updated {updated}.",
    importFailed: "Import did not complete",
    rowError: "Row {row}: {issues}",
  },
  login: {
    eyebrow: "Fragrance Store",
    title: "Admin",
    copy: "Sign in with credentials configured on the server.",
    loading: "Loading form…",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    failed: "Could not sign in",
  },
};

const he: typeof en = {
  brand: "Fragrance Admin",
  skipToContent: "דלגו לתוכן",
  navAria: "מדורי ניהול",
  logout: "יציאה",
  language: "שפה",
  nav: {
    overview: "סקירה",
    products: "מוצרים",
    categories: "קטגוריות",
    brands: "מותגים",
    orders: "הזמנות",
    customers: "לקוחות",
    content: "תוכן",
    shipping: "משלוחים",
    settings: "הגדרות",
  },
  dashboard: {
    eyebrow: "נתונים מ־PostgreSQL",
    title: "סקירת החנות",
    metricsAria: "מדדים",
    products: "מוצרים",
    productsNote: "{count} טיוטות",
    orders: "הזמנות",
    ordersNote: "{count} דורשות תשומת לב",
    customers: "לקוחות",
    customersNote: "ממסד הנתונים",
    pages: "עמודים",
    pagesNote: "תוכן CMS",
  },
  settings: {
    eyebrow: "מסחר בחנות",
    title: "הזמנות",
    copy: "הפעילו או כבו את התשלום בלי לפרוס מחדש. כשהאפשרות כבויה, לקוחות יכולים לצפות בקטלוג אך לא להוסיף לסל או לשלם.",
    ordersLabel: "אפשרו ללקוחות לבצע הזמנות",
    ordersOn: "סל הקניות והתשלום זמינים בחנות.",
    ordersOff: "מצב צפייה בלבד — סל ותשלום מוסתרים.",
    save: "שמירה",
    saving: "שומר…",
    enabledOk: "ההזמנות מופעלות כעת בחנות.",
    disabledOk: "ההזמנות כבויות. הקטלוג נשאר לצפייה בלבד.",
    saveFailed: "לא ניתן לעדכן את הגדרת ההזמנות",
    paymentProvider: "ספק תשלום",
    demoPaymentsBlocked:
      "לא ניתן להפעיל הזמנות בפרודקשן לפני הגדרת Grow או Stripe. מצב הדגמה מסמן הזמנות כשולמו בלי חיוב אמיתי.",
  },
  newsletterBlast: {
    eyebrow: "ניוזלטר",
    title: "מיילים על חדשים",
    copy: "שולחים לכל המנויים הפעילים על כל חידוש שטרם הוכרז — מייל נפרד לכל מוצר, עם צילום המוצר המקורי.",
    pendingProducts: "{count} מוצרים מוכנים להכרזה",
    pendingNone: "אין כרגע חידושים שטרם הוכרזו.",
    subscribers: "{count} מנויים פעילים",
    smtpOk: "SMTP מוגדר.",
    smtpMissing: "SMTP אינו מוגדר — לא ניתן לשלוח מיילים.",
    send: "שליחת מיילים על חדשים",
    sending: "שולח…",
    confirm: "לשלוח לכל המנויים על כל החידושים שטרם הוכרזו? לא ניתן לבטל עבור מוצרים אלה.",
    emptyOk: "אין מה לשלוח — אין חידושים שטרם הוכרזו.",
    success:
      "נשלח עבור {products} מוצרים ל־{subscribers} מנויים ({emails} מיילים). נכשלו: {failed}.",
    failed: "לא ניתן לשלוח את דיוור החידושים",
  },
  section: {
    eyebrow: "רשומות מ־PostgreSQL",
    caption: "{title}: רשומות ממסד הנתונים",
    empty: "אין עדיין רשומות.",
    editorTitle: "טופס עריכה",
    editorHelp: "הרשומות נשמרות דרך API מוגן ונבדקות בשרת.",
  },
  sections: {
    products: {
      title: "מוצרים",
      columns: ["שם", "SKU", "מחיר", "סטטוס"],
      fields: {
        name: "שם",
        slug: "Slug",
        description: "תיאור",
        sku: "SKU",
        price: "מחיר באגורות (ILS)",
        stock: "מלאי",
        imageUrl: "כתובת תמונה",
        newArrival: "סמנו כחדש באתר (שולח מייל למנויים כשמפורסם)",
      },
    },
    categories: {
      title: "קטגוריות",
      columns: ["שם", "Slug", "מוצרים", "סטטוס"],
      fields: {
        name: "שם",
        slug: "Slug",
        description: "תיאור",
      },
    },
    brands: {
      title: "מותגים",
      columns: ["שם", "Slug", "תיאור", "סטטוס"],
      fields: {
        name: "שם",
        slug: "Slug",
        description: "תיאור",
      },
    },
    orders: {
      title: "הזמנות",
      columns: ["מספר", "לקוח", "סכום", "סטטוס"],
      fields: {
        number: "מספר",
        email: "אימייל",
        status: "סטטוס",
      },
    },
    customers: {
      title: "לקוחות",
      columns: ["שם", "אימייל", "הזמנות", "הצטרפות"],
      fields: {
        name: "שם",
        email: "אימייל",
        phone: "טלפון",
      },
    },
    content: {
      title: "תוכן",
      columns: ["כותרת", "Slug", "עודכן", "סטטוס"],
      fields: {
        title: "כותרת",
        slug: "Slug",
        content: "תוכן",
      },
    },
    shipping: {
      title: "משלוחים",
      columns: ["שם", "קוד", "מחיר", "סטטוס"],
      fields: {
        name: "שם",
        code: "קוד",
        description: "תיאור",
        price: "מחיר באגורות (ILS)",
      },
    },
  },
  form: {
    save: "שמירה",
    saving: "שומר…",
    ordersReadonly: "הזמנות נוצרות בתשלום",
    saveFailed: "לא ניתן לשמור את הרשומה",
    saveOk: "הרשומה נשמרה. רעננו את הרשימה לצפייה.",
  },
  orders: {
    statusLabel: "סטטוס הזמנה {id}",
    updated: "הסטטוס עודכן",
    updateFailed: "לא ניתן לעדכן סטטוס",
  },
  upload: {
    title: "העלאת תמונות",
    help: "JPEG, PNG או WebP עד 5 MB. עם S3_* (MinIO מקומית) הקובץ נשמר בדלי; אחרת ב־uploads/ ומוגש מ־/api/media/....",
    file: "קובץ",
    upload: "העלאה",
    uploading: "מעלה…",
    failed: "לא ניתן להעלות את התמונה",
    ok: "התמונה נשמרה. אפשר להדביק את הכתובת בטופס המוצר או ב־CSV.",
  },
  csv: {
    title: "ייבוא / ייצוא CSV",
    help: "בדקו את הקובץ קודם. ייבוא זמין לתפקיד ADMIN כשכל השורות תקינות.",
    export: "ייצוא CSV",
    file: "קובץ מוצרים",
    preview: "בדיקה",
    confirm: "אישור ייבוא",
    previewFailed: "לא ניתן לבדוק את ה־CSV",
    previewOk: "נבדקו {total} שורות. שגיאות: {errors}.",
    importOk: "הייבוא הושלם: נוצרו {created}, עודכנו {updated}.",
    importFailed: "הייבוא לא הושלם",
    rowError: "שורה {row}: {issues}",
  },
  login: {
    eyebrow: "Fragrance Store",
    title: "ניהול",
    copy: "התחברו עם פרטי הגישה שהוגדרו בשרת.",
    loading: "טוען טופס…",
    password: "סיסמה",
    submit: "התחברות",
    submitting: "מתחבר…",
    failed: "לא ניתן להתחבר",
  },
};

export const adminDictionaries = { en, he } as const;

export type AdminDictionary = typeof en;
export type AdminLocale = keyof typeof adminDictionaries;

export function getAdminDictionary(locale: Locale): AdminDictionary {
  return locale === "he" ? adminDictionaries.he : adminDictionaries.en;
}

export function formatAdminMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
