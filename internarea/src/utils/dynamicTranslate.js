import axios from "axios";
 
const MYMEMORY_EMAIL = "mr.koushik341@gmail.com";

 
export const translateDynamicText = async (text, targetLang) => {
    if (!text || typeof text !== 'string') return text;
    if (targetLang === "English" || !targetLang) return text;

    const langCodeMap = {
        "Spanish": "es",
        "Hindi": "hi",
        "Portuguese": "pt",
        "Chinese": "zh",
        "French": "fr"
    };

    const code = langCodeMap[targetLang] || "fr";  
    const today = new Date().toDateString();
    
    const cacheKey = `translate_${code}_${text.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
    } catch (e) {}
 
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
             
            try {
                localStorage.setItem(cacheKey, translated);
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    // Optimized cleanup: remove oldest translation keys
                    const keys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('translate_')) keys.push(key);
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

    return text;
};
