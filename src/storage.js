const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "accounts.json");

function loadAccounts() {
    try {
        const data = fs.readFileSync(dataPath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Unable to load account data.");
        return [];
    }
}

function saveAccounts(accounts) {
    try {
        fs.writeFileSync(
            dataPath,
            JSON.stringify(accounts, null, 2),
            "utf-8"
        );

        return true;
    } catch (error) {
        console.error("Unable to save account data.");
        return false;
    }
}

module.exports = {
    loadAccounts,
    saveAccounts
};