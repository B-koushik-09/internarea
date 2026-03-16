import axios from "axios";

// Using the user's verified email from previous contexts
const MYMEMORY_EMAIL = "mr.koushik341@gmail.com";

/**
 * Dynamically translates text using the MyMemory API with date-based caching
 * @param {string} text - The English text to translate
 * @param {string} targetLang - The target language (e.g., "French", "es")
 * @returns {Promise<string>} - The translated text
 */
export const translateDynamicText = async (text, targetLang) => {
    if (!text || typeof text !== 'string') return text;
    if (targetLang === "English" || !targetLang) return text;

    // Map the system language names to language codes for the API
    const langCodeMap = {
        "Spanish": "es",
        "Hindi": "hi",
        "Portuguese": "pt",
        "Chinese": "zh",
        "French": "fr"
    };

    const code = langCodeMap[targetLang] || "fr"; // Default to French if code not mapped
    const today = new Date().toDateString();
    
    // Create a unique cache key for the text snippet and today's date
    const cacheKey = `translate_${code}_${today}_${text.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 1. Check LocalStorage Cache
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
    } catch (e) {
        console.warn("Translation cache read error:", e);
    }

    // 2. Fetch from MyMemory API
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
            
            // MyMemory sometimes returns an exact match of the query if it fails/flags it, 
            // but usually it works fine. Just save the result.
            
            // 3. Save to Cache
            try {
                localStorage.setItem(cacheKey, translated);
            } catch (e) {
                console.warn("Translation cache write error (localStorage full?):", e);
                // Simple cleanup strategy if full: clear old translations
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

    // 4. Fallback to original text if API fails
    return text;
};
