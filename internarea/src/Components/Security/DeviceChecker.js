export const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";
    let device = "Desktop";

     
    if (userAgent.indexOf("Firefox") > -1) {
        browser = "Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
        browser = "Samsung Browser";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browser = "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
        browser = "Internet Explorer";
    } else if (userAgent.indexOf("Edg") > -1) {
         
        browser = "Edge";
    } else if (userAgent.indexOf("Brave") > -1 || (typeof navigator.brave !== 'undefined')) {
         
        browser = "Brave";
    } else if (userAgent.indexOf("Chrome") > -1) {
         
        browser = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
        browser = "Safari";
    }

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device = "Mobile";
    }

    let os = "Unknown OS";
    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
    if (userAgent.indexOf("X11") !== -1) os = "UNIX";
    if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    if (userAgent.indexOf("Android") !== -1) os = "Android";
    if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

    return { browser, device, os };
};
