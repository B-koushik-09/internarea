const sendSms = async (phone, message) => {
    // ----------------------------------------------------------------
    // INSTRUCTIONS FOR REAL SMS:
    // 1. Sign up for an SMS provider (e.g., Twilio, Fast2SMS).
    // 2. Get your API Credentials (Account SID, Auth Token, From Number).
    // 3. Add them to your .env file:
    //    TWILIO_ACCOUNT_SID=your_sid
    //    TWILIO_AUTH_TOKEN=your_token
    //    TWILIO_PHONE_NUMBER=your_twilio_number
    // 4. Uncomment the code below and install 'twilio' (npm install twilio).
    // ----------------------------------------------------------------

    /* 
    // REAL IMPLEMENTATION EXAMPLE (TWILIO):
    try {
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        console.log(`[SMS SENT] To: ${phone}`);
        return true;
    } catch (error) {
        console.error("SMS Failed:", error);
        return false;
    }
    */

    // ----------------------------------------------------------------
    // DEVELOPMENT SIMULATION (Current Fallback)
    // ----------------------------------------------------------------
    console.log("========================================");
    console.log("          SMS GATEWAY SIMULATION        ");
    console.log(` TO: ${phone}`);
    console.log(` MSG: ${message}`);
    console.log("========================================");
    return true; // Return true to simulate success
};

module.exports = { sendSms };
