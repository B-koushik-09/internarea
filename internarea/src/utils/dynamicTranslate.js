import axios from "axios";
 
const MYMEMORY_EMAIL = "mr.koushik341@gmail.com";

// Static translations for common card values that the API may not handle well
const staticTranslations = {
    "Spanish": {
        "Immediate": "Inmediato",
        "immediate": "inmediato",
        "Mumbai": "Bombay",
        "Delhi": "Delhi",
        "Bangalore": "Bangalore",
        "Hyderabad": "Hyderabad",
        "Chennai": "Chennai",
        "Kolkata": "Calcuta",
        "Pune": "Pune",
        "Remote": "Remoto",
        "Work From Home": "Trabajo desde Casa",
        "Part-time": "Medio Tiempo",
        "Full-time": "Tiempo Completo",
        "Pvt. Ltd.": "Pvt. Ltd.",
        "Pvt Ltd": "Pvt Ltd",
        "Solutions": "Soluciones",
        "Technologies": "Tecnologías",
        "0-1 years": "0-1 años",
        "1-2 years": "1-2 años",
        "0-6 months": "0-6 meses",
        "Fresher": "Recién Graduado",
        "LPA": "LPA",
        "/month": "/mes"
    },
    "Hindi": {
        "Immediate": "तुरंत",
        "immediate": "तुरंत",
        "Mumbai": "मुंबई",
        "Delhi": "दिल्ली",
        "Bangalore": "बेंगलुरु",
        "Hyderabad": "हैदराबाद",
        "Chennai": "चेन्नई",
        "Kolkata": "कोलकाता",
        "Pune": "पुणे",
        "Remote": "दूरस्थ",
        "Work From Home": "घर से काम",
        "Part-time": "अंशकालिक",
        "Full-time": "पूर्णकालिक",
        "Pvt. Ltd.": "प्रा. लि.",
        "Pvt Ltd": "प्रा. लि.",
        "Solutions": "समाधान",
        "Technologies": "प्रौद्योगिकी",
        "0-1 years": "0-1 वर्ष",
        "1-2 years": "1-2 वर्ष",
        "0-6 months": "0-6 महीने",
        "Fresher": "नवसिखुआ",
        "LPA": "प्रति वर्ष",
        "/month": "/माह"
    },
    "Portuguese": {
        "Immediate": "Imediato",
        "immediate": "imediato",
        "Mumbai": "Bombaim",
        "Delhi": "Deli",
        "Bangalore": "Bangalore",
        "Hyderabad": "Hyderabad",
        "Chennai": "Chennai",
        "Kolkata": "Calcutá",
        "Pune": "Pune",
        "Remote": "Remoto",
        "Work From Home": "Trabalho de Casa",
        "Part-time": "Meio Período",
        "Full-time": "Período Integral",
        "Pvt. Ltd.": "Pvt. Ltd.",
        "Pvt Ltd": "Pvt Ltd",
        "Solutions": "Soluções",
        "Technologies": "Tecnologias",
        "0-1 years": "0-1 anos",
        "1-2 years": "1-2 anos",
        "0-6 months": "0-6 meses",
        "Fresher": "Recém-formado"
    },
    "Chinese": {
        "Immediate": "立即",
        "immediate": "立即",
        "Mumbai": "孟买",
        "Delhi": "德里",
        "Bangalore": "班加罗尔",
        "Hyderabad": "海得拉巴",
        "Chennai": "金奈",
        "Kolkata": "加尔各答",
        "Pune": "浦那",
        "Remote": "远程",
        "Work From Home": "在家工作",
        "Part-time": "兼职",
        "Full-time": "全职",
        "Pvt. Ltd.": "私人有限公司",
        "Pvt Ltd": "私人有限公司",
        "Solutions": "解决方案",
        "Technologies": "技术",
        "0-1 years": "0-1年",
        "1-2 years": "1-2年",
        "0-6 months": "0-6个月",
        "Fresher": "应届生"
    },
    "French": {
        "Immediate": "Immédiat",
        "immediate": "immédiat",
        "Mumbai": "Bombay",
        "Delhi": "Delhi",
        "Bangalore": "Bangalore",
        "Hyderabad": "Hyderabad",
        "Chennai": "Chennai",
        "Kolkata": "Calcutta",
        "Pune": "Pune",
        "Remote": "À distance",
        "Work From Home": "Télétravail",
        "Part-time": "Temps partiel",
        "Full-time": "Temps plein",
        "Pvt. Ltd.": "SARL",
        "Pvt Ltd": "SARL",
        "Solutions": "Solutions",
        "Technologies": "Technologies",
        "0-1 years": "0-1 ans",
        "1-2 years": "1-2 ans",
        "0-6 months": "0-6 mois",
        "Fresher": "Débutant"
    }
};

// Check if text is primarily a currency/number value that shouldn't be translated via API
const isCurrencyOrNumericValue = (text) => {
    // Matches patterns like "₹ 5 LPA", "₹5,000/month", "5 LPA", "₹ 10,000", "$1000", etc.
    return /^[₹$€£]?\s*[\d,]+(\.\d+)?\s*(LPA|lpa|\/month|\/year|K|k|L|l|Cr|cr)?$/i.test(text.trim());
};

// Apply static translations by replacing known words/phrases in text
const applyStaticReplacement = (text, targetLang) => {
    const langMap = staticTranslations[targetLang];
    if (!langMap) return text;
    
    let result = text;
    // Sort by length descending so longer phrases are replaced first
    const entries = Object.entries(langMap).sort((a, b) => b[0].length - a[0].length);
    
    for (const [eng, trans] of entries) {
        if (result.includes(eng)) {
            result = result.replace(new RegExp(eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), trans);
        }
    }
    
    return result;
};

export const translateDynamicText = async (text, targetLang) => {
    if (!text || typeof text !== 'string') return text;
    if (targetLang === "English" || !targetLang) return text;

    const langCodeMap = {
        "Spanish": "es",
        "Hindi": "hi",
        "Portuguese": "pt",
        "Chinese": "zh-CN",
        "French": "fr"
    };

    const code = langCodeMap[targetLang] || "fr";  
    const langMap = staticTranslations[targetLang] || {};
    
    // v2 cache key to clear out potentially bad older cached entries
    const cacheKey = `tr_v2_${code}_${text.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
    } catch (e) {}

    // For currency/numeric values, don't translate - just return as-is
    if (isCurrencyOrNumericValue(text)) {
        return text;
    }

    // NEW LOGIC: For short strings, check exact match in static map
    if (text.length < 30 && langMap[text]) {
        return langMap[text];
    }
    if (text.length < 30 && langMap[text.trim()]) {
        return langMap[text.trim()];
    }

    // Send to API anyway if it's longer than 30 chars or not in exact map
    try {
        const res = await axios.get("https://api.mymemory.translated.net/get", {
            params: {
                q: text,
                langpair: `en|${code}`,
                de: MYMEMORY_EMAIL
            }
        });

        if (res.data && res.data.responseData && res.data.responseData.translatedText) {
            let translated = res.data.responseData.translatedText;
            
            // If API returned ALL CAPS (common MyMemory behavior for untranslated text), use original
            if (translated === text.toUpperCase() && translated !== text) {
                // API didn't actually translate, just uppercased
                translated = text;
            }

            // Post-process the API result with our static map to fix known proper nouns (like TechNova Solutions)
            translated = applyStaticReplacement(translated, targetLang);
             
            try {
                localStorage.setItem(cacheKey, translated);
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    // Optimized cleanup
                    const keys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('translate_') || key.startsWith('tr_v2_'))) keys.push(key);
                    }
                    keys.sort().slice(0, Math.max(10, Math.floor(keys.length / 5))).forEach(k => localStorage.removeItem(k));
                    try { localStorage.setItem(cacheKey, translated); } catch (e2) {}
                }
            }

            return translated;
        }
    } catch (error) {
        console.error("Dynamic Translation API Error:", error);
    }

    // If API fails, try our static word-by-word replacement as a fallback
    return applyStaticReplacement(text, targetLang);
};
