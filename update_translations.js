const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'VNRVJIET', 'Projects', 'internshala-clone', 'internarea', 'src', 'utils', 'translations.js');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
    // English
    { from: "10:00 AM and 11:00 AM IST", to: "2:00 PM and 4:00 PM IST" },
    // Spanish
    { from: "entre las 10:00 AM y 11:00 AM IST",   to: "entre las 2:00 PM y 4:00 PM IST" },
    { from: "10:00 AM and 11:00 AM IST.", to: "2:00 PM and 4:00 PM IST." },
    // Hindi
    { from: "सुबह 10:00 बजे से 11:00 बजे IST", to: "दोपहर 2:00 बजे से 4:00 बजे IST" },
    // Portuguese
    { from: "10:00 e 11:00 IST", to: "14:00 e 16:00 IST" },
    // Chinese
    { from: "IST上午10:00至11:00之间", to: "IST下午2:00至4:00之间" },
    // French
    { from: "10h00 et 11h00 IST", to: "14h00 et 16h00 IST" }
];

let changed = false;
for (const r of replacements) {
    if (content.includes(r.from)) {
        content = content.split(r.from).join(r.to);
        changed = true;
    }
}

if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated translations.js');
} else {
    console.log('No matches found to replace.');
}
