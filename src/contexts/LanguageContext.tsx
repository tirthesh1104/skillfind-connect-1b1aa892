import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "hi" | "mr";

type Dict = Record<string, string>;

const TRANSLATIONS: Record<Language, Dict> = {
  en: {
    "nav.login": "Login",
    "nav.getStarted": "Get Started",
    "nav.whyUs": "Why us",
    "nav.how": "How it works",
    "nav.stories": "Stories",
    "hero.title": "Labour Connect — India's Workforce Platform",
    "hero.sub": "Contractors get workers. Workers get jobs. Payments, attendance, compliance — all in one place.",
    "hero.bullet.contractor": "🏗️ Contractors — Post jobs, hire workers, manage payments",
    "hero.bullet.worker": "👷 Workers — Find jobs, track attendance, get paid on time",
    "hero.bullet.admin": "🛡️ Admin — Oversee compliance, resolve disputes, manage platform",
    "hero.cta.contractor": "Register as Contractor",
    "hero.cta.worker": "Register as Worker",
    "auth.role.client": "Client (Hire Labour)",
    "auth.role.contractor": "Contractor (Thekedar)",
    "auth.role.labour": "Labour (Majdoor)",
    "auth.role.admin": "Admin",
    "client.welcome": "Welcome, Client",
    "client.searchWorkers": "Search Workers",
    "client.searchContractors": "Search Contractors",
    "client.myRequests": "My Requests",
    "client.contactAdmin": "Contact Admin",
    "client.profile": "My Profile",
    "common.contact": "Contact",
    "common.send": "Send",
    "common.cancel": "Cancel",
    "common.search": "Search",
    "common.skill": "Skill",
    "common.location": "Location",
    "common.experience": "Experience",
    "common.rating": "Rating",
  },
  hi: {
    "nav.login": "लॉगिन",
    "nav.getStarted": "शुरू करें",
    "nav.whyUs": "क्यों हम",
    "nav.how": "कैसे काम करता है",
    "nav.stories": "कहानियाँ",
    "hero.title": "Labour Connect — भारत का कार्यबल मंच",
    "hero.sub": "ठेकेदारों को मजदूर मिलें। मजदूरों को काम मिले। भुगतान, हाजिरी, अनुपालन — एक ही जगह।",
    "hero.bullet.contractor": "🏗️ ठेकेदार — नौकरी पोस्ट करें, मजदूर हायर करें, भुगतान करें",
    "hero.bullet.worker": "👷 मजदूर — काम पाएं, हाजिरी देखें, समय पर पैसा पाएं",
    "hero.bullet.admin": "🛡️ एडमिन — अनुपालन देखें, विवाद हल करें",
    "hero.cta.contractor": "ठेकेदार के रूप में पंजीकरण करें",
    "hero.cta.worker": "मजदूर के रूप में पंजीकरण करें",
    "auth.role.client": "क्लाइंट (मजदूर हायर करें)",
    "auth.role.contractor": "ठेकेदार",
    "auth.role.labour": "मजदूर",
    "auth.role.admin": "एडमिन",
    "client.welcome": "स्वागत है, क्लाइंट",
    "client.searchWorkers": "मजदूर खोजें",
    "client.searchContractors": "ठेकेदार खोजें",
    "client.myRequests": "मेरे संदेश",
    "client.contactAdmin": "एडमिन से संपर्क",
    "client.profile": "मेरी प्रोफाइल",
    "common.contact": "संपर्क",
    "common.send": "भेजें",
    "common.cancel": "रद्द करें",
    "common.search": "खोजें",
    "common.skill": "कौशल",
    "common.location": "स्थान",
    "common.experience": "अनुभव",
    "common.rating": "रेटिंग",
  },
  mr: {
    "nav.login": "लॉगिन",
    "nav.getStarted": "सुरू करा",
    "nav.whyUs": "का आम्ही",
    "nav.how": "कसे चालते",
    "nav.stories": "कहाण्या",
    "hero.title": "Labour Connect — भारताचे कार्यबल व्यासपीठ",
    "hero.sub": "कंत्राटदार ला Workers मिळवा. Workers ला काम मिळवा. Payments, Attendance, Compliance — सगळं एकाच जागी.",
    "hero.bullet.contractor": "🏗️ कंत्राटदार — Jobs पोस्ट करा, workers hire करा, payments manage करा",
    "hero.bullet.worker": "👷 Workers — काम मिळवा, हजेरी ट्रॅक करा, वेळेवर पैसे मिळवा",
    "hero.bullet.admin": "🛡️ Admin — Compliance बघा, disputes सोडवा",
    "hero.cta.contractor": "Contractor म्हणून नोंदणी करा",
    "hero.cta.worker": "Worker म्हणून नोंदणी करा",
    "auth.role.client": "क्लायंट (मजूर hire करा)",
    "auth.role.contractor": "कंत्राटदार",
    "auth.role.labour": "मजूर",
    "auth.role.admin": "अॅडमिन",
    "client.welcome": "स्वागत आहे, क्लायंट",
    "client.searchWorkers": "मजूर शोधा",
    "client.searchContractors": "कंत्राटदार शोधा",
    "client.myRequests": "माझे संदेश",
    "client.contactAdmin": "Admin शी संपर्क",
    "client.profile": "माझी प्रोफाइल",
    "common.contact": "संपर्क",
    "common.send": "पाठवा",
    "common.cancel": "रद्द करा",
    "common.search": "शोधा",
    "common.skill": "कौशल्य",
    "common.location": "ठिकाण",
    "common.experience": "अनुभव",
    "common.rating": "रेटिंग",
  },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "mr";
    return (localStorage.getItem("site_language") as Language) || "mr";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("site_language", l);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (key: string) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
