const readline = require("readline");
const Account = require("./account");
const {
    loadAccounts,
    saveAccounts
} = require("./storage");

class ATM {
    constructor() {
        this.accounts = loadAccounts().map(
            accountData => new Account(accountData)
        );

        this.currentAccount = null;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    ask(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer.trim());
            });
        });
    }

    findAccount(accountNumber) {
        return this.accounts.find(
            account =>
                account.accountNumber === accountNumber
        );
    }

    saveData() {
        const accountData = this.accounts.map(
            account => account.toJSON()
        );

        return saveAccounts(accountData);
    }

    async login() {
        console.clear();

        console.log("================================");
        console.log("        ATM SIMULATOR");
        console.log("================================");
        console.log();

        const accountNumber = await this.ask(
            "Account Number: "
        );

        const account = this.findAccount(accountNumber);

        if (!account) {
            console.log("\nAccount not found.");
            return false;
        }

        for (let attempt = 1; attempt <= 3; attempt++) {
            const pin = await this.ask("PIN: ");

            if (account.checkPin(pin)) {
                this.currentAccount = account;

                console.log("\nLogin successful!");
                console.log(
                    `Welcome, ${account.name}!`
                );

                return true;
            }

            const remaining = 3 - attempt;

            if (remaining > 0) {
                console.log(
                    `Incorrect PIN. Attempts remaining: ${remaining}`
                );
            }
        }

        console.log(
            "\nToo many incorrect attempts."
        );

        console.log(
            "Account access denied."
        );

        return false;
    }

    displayAccountInformation() {
        console.log("\n================================");
        console.log("      ACCOUNT INFORMATION");
        console.log("================================");

        console.log(
            `Account Number : ${this.currentAccount.accountNumber}`
        );

        console.log(
            `Account Holder : ${this.currentAccount.name}`
        );

        console.log(
            `Account Type   : ${this.currentAccount.accountType}`
        );

        console.log(
            `Balance        : ₱${this.currentAccount.balance.toFixed(2)}`
        );
    }

    async showBalance() {
        console.log("\n================================");
        console.log("         ACCOUNT BALANCE");
        console.log("================================");

        console.log(
            `Available Balance: ₱${this.currentAccount.balance.toFixed(2)}`
        );
    }

    async deposit() {
        console.log("\n================================");
        console.log("            DEPOSIT");
        console.log("================================");

        const input = await this.ask(
            "Enter deposit amount: ₱"
        );

        const amount = Number(input);

        if (!Number.isFinite(amount)) {
            console.log("\nInvalid amount.");
            return;
        }

        try {
            this.currentAccount.deposit(amount);

            this.saveData();

            console.log("\nDeposit successful!");

            console.log(
                `Amount Deposited: ₱${amount.toFixed(2)}`
            );

            console.log(
                `New Balance: ₱${this.currentAccount.balance.toFixed(2)}`
            );

            const transaction =
                this.currentAccount.transactions[
                    this.currentAccount.transactions.length - 1
                ];

            this.displayReceipt(transaction);
        } catch (error) {
            console.log(`\n${error.message}`);
        }
    }

    async withdraw() {
        console.log("\n================================");
        console.log("           WITHDRAW");
        console.log("================================");

        const input = await this.ask(
            "Enter withdrawal amount: ₱"
        );

        const amount = Number(input);

        if (!Number.isFinite(amount)) {
            console.log("\nInvalid amount.");
            return;
        }

        try {
            this.currentAccount.withdraw(amount);

            this.saveData();

            console.log("\nWithdrawal successful!");

            console.log(
                `Amount Withdrawn: ₱${amount.toFixed(2)}`
            );

            console.log("Please take your cash.");

            console.log(
                `Remaining Balance: ₱${this.currentAccount.balance.toFixed(2)}`
            );

            const todayWithdrawals =
                this.currentAccount.getTodayWithdrawals();

            const remainingLimit =
                20000 - todayWithdrawals;

            console.log(
                `Remaining Daily Withdrawal Limit: ₱${remainingLimit.toFixed(2)}`
            );

            const transaction =
                this.currentAccount.transactions[
                    this.currentAccount.transactions.length - 1
                ];

            this.displayReceipt(transaction);
        } catch (error) {
            console.log(`\n${error.message}`);
        }
    }

    async transfer() {
        console.log("\n================================");
        console.log("           TRANSFER");
        console.log("================================");

        const recipientNumber = await this.ask(
            "Recipient Account Number: "
        );

        const recipient =
            this.findAccount(recipientNumber);

        if (!recipient) {
            console.log(
                "\nRecipient account not found."
            );

            return;
        }

        if (
            recipient.accountNumber ===
            this.currentAccount.accountNumber
        ) {
            console.log(
                "\nYou cannot transfer money to your own account."
            );

            return;
        }

        console.log(
            `\nRecipient: ${recipient.name}`
        );

        console.log(
            `Account: ${recipient.accountNumber}`
        );

        const confirmation = await this.ask(
            "Confirm recipient? (Y/N): "
        );

        if (confirmation.toLowerCase() !== "y") {
            console.log(
                "\nTransfer cancelled."
            );

            return;
        }

        const input = await this.ask(
            "Enter transfer amount: ₱"
        );

        const amount = Number(input);

        if (!Number.isFinite(amount)) {
            console.log("\nInvalid amount.");
            return;
        }

        try {
            this.currentAccount.transferTo(
                recipient,
                amount
            );

            this.saveData();

            console.log(
                "\n================================"
            );

            console.log(
                "       TRANSFER SUCCESSFUL"
            );

            console.log(
                "================================"
            );

            console.log(
                `Recipient      : ${recipient.name}`
            );

            console.log(
                `Amount         : ₱${amount.toFixed(2)}`
            );

            console.log(
                `Remaining Balance: ₱${this.currentAccount.balance.toFixed(2)}`
            );

            const transaction =
                this.currentAccount.transactions[
                    this.currentAccount.transactions.length - 1
                ];

            this.displayReceipt(transaction);
        } catch (error) {
            console.log(`\n${error.message}`);
        }
    }

    async changePin() {
        console.log("\n================================");
        console.log("           CHANGE PIN");
        console.log("================================");

        const currentPin = await this.ask(
            "Current PIN: "
        );

        if (!this.currentAccount.checkPin(currentPin)) {
            console.log(
                "\nIncorrect current PIN."
            );

            return;
        }

        const newPin = await this.ask(
            "New PIN: "
        );

        const confirmPin = await this.ask(
            "Confirm New PIN: "
        );

        if (newPin !== confirmPin) {
            console.log(
                "\nPINs do not match."
            );

            return;
        }

        try {
            this.currentAccount.changePin(
                newPin
            );

            this.saveData();

            console.log(
                "\nPIN successfully changed."
            );
        } catch (error) {
            console.log(`\n${error.message}`);
        }
    }

    displayReceipt(transaction) {
        console.log("\n================================");
        console.log("        TRANSACTION RECEIPT");
        console.log("================================");

        console.log(
            `Transaction ID : ${transaction.id}`
        );

        console.log(
            `Date           : ${transaction.date}`
        );

        console.log(
            `Type           : ${transaction.type}`
        );

        console.log(
            `Amount         : ₱${transaction.amount.toFixed(2)}`
        );

        console.log(
            `Description    : ${transaction.description}`
        );

        if (transaction.relatedAccount) {
            console.log(
                `Related Account: ${transaction.relatedAccount}`
            );
        }

        console.log(
            `Balance After  : ₱${transaction.balanceAfter.toFixed(2)}`
        );

        console.log("================================");
    }

    async showTransactions() {
        console.log("\n================================");
        console.log("       TRANSACTION HISTORY");
        console.log("================================");

        const transactions =
            this.currentAccount.transactions;

        if (transactions.length === 0) {
            console.log(
                "\nNo transactions found."
            );

            return;
        }

        transactions.forEach(
            (transaction, index) => {
                console.log(
                    "\n--------------------------------"
                );

                console.log(
                    `Transaction #${index + 1}`
                );

                console.log(
                    "--------------------------------"
                );

                console.log(
                    `Transaction ID : ${transaction.id}`
                );

                console.log(
                    `Type           : ${transaction.type}`
                );

                console.log(
                    `Amount         : ₱${transaction.amount.toFixed(2)}`
                );

                console.log(
                    `Description    : ${transaction.description}`
                );

                if (transaction.relatedAccount) {
                    console.log(
                        `Related Account: ${transaction.relatedAccount}`
                    );
                }

                console.log(
                    `Date           : ${transaction.date}`
                );

                console.log(
                    `Balance After  : ₱${transaction.balanceAfter.toFixed(2)}`
                );
            }
        );
    }

    async showMenu() {
        while (this.currentAccount) {
            console.log("\n================================");
            console.log("          ATM MAIN MENU");
            console.log("================================");

            console.log("1. Check Balance");
            console.log("2. Deposit");
            console.log("3. Withdraw");
            console.log("4. Transfer");
            console.log("5. Transaction History");
            console.log("6. Account Information");
            console.log("7. Change PIN");
            console.log("8. Logout");

            const choice = await this.ask(
                "\nSelect an option: "
            );

            switch (choice) {
                case "1":
                    await this.showBalance();
                    break;

                case "2":
                    await this.deposit();
                    break;

                case "3":
                    await this.withdraw();
                    break;

                case "4":
                    await this.transfer();
                    break;

                case "5":
                    await this.showTransactions();
                    break;

                case "6":
                    this.displayAccountInformation();
                    break;

                case "7":
                    await this.changePin();
                    break;

                case "8":
                    this.currentAccount = null;

                    console.log(
                        "\nYou have been logged out."
                    );

                    break;

                default:
                    console.log(
                        "\nInvalid option."
                    );
            }
        }
    }

    async start() {
        let running = true;

        while (running) {
            const loggedIn = await this.login();

            if (loggedIn) {
                await this.showMenu();
            }

            const answer = await this.ask(
                "\nDo you want to use the ATM again? (Y/N): "
            );

            if (
                answer.toLowerCase() !== "y"
            ) {
                running = false;
            }
        }

        this.rl.close();

        console.log(
            "\nThank you for using the ATM Simulator."
        );
    }
}

module.exports = ATM;