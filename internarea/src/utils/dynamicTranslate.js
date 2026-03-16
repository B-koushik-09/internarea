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
    
    const cacheKey = `translate_${code}_${today}_${text.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`;

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
                console.warn("Translation cache write error (localStorage full?):", e);
                if (e.name === 'QuotaExceededError') {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('translate_') && !key.includes(today)) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            }

            return translated;
        }
    } catch (error) {
        console.error("Dynamic Translation API Error:", error);
    }

    return text;
};
