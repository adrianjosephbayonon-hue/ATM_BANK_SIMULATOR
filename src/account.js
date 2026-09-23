const { createTransaction } = require("./transaction");

class Account {
    constructor(accountData) {
        this.accountNumber = accountData.accountNumber;
        this.name = accountData.name;
        this.pin = accountData.pin;
        this.accountType = accountData.accountType;
        this.balance = accountData.balance;
        this.transactions = accountData.transactions || [];
    }

    checkPin(pin) {
        return this.pin === pin;
    }

    getBalance() {
        return this.balance;
    }

    deposit(amount) {
        if (!Number.isFinite(amount)) {
            throw new Error("Invalid deposit amount.");
        }

        if (amount <= 0) {
            throw new Error(
                "Deposit amount must be greater than zero."
            );
        }

        if (amount % 100 !== 0) {
            throw new Error(
                "Deposit amount must be a multiple of ₱100."
            );
        }

        this.balance += amount;

        this.transactions.push(
            createTransaction(
                "DEPOSIT",
                amount,
                "Cash deposit",
                this.balance
            )
        );
    }

    withdraw(amount) {
        if (!Number.isFinite(amount)) {
            throw new Error("Invalid withdrawal amount.");
        }

        if (amount <= 0) {
            throw new Error(
                "Withdrawal amount must be greater than zero."
            );
        }

        if (amount % 100 !== 0) {
            throw new Error(
                "Withdrawal amount must be a multiple of ₱100."
            );
        }

        if (amount > this.balance) {
            throw new Error("Insufficient funds.");
        }

        const dailyLimit = 20000;
        const todayWithdrawals = this.getTodayWithdrawals();

        if (todayWithdrawals + amount > dailyLimit) {
            const remainingLimit =
                dailyLimit - todayWithdrawals;

            throw new Error(
                `Daily withdrawal limit exceeded. Remaining limit: ₱${remainingLimit.toFixed(2)}`
            );
        }

        this.balance -= amount;

        this.transactions.push(
            createTransaction(
                "WITHDRAWAL",
                amount,
                "Cash withdrawal",
                this.balance
            )
        );
    }

    transferTo(recipient, amount) {
        if (!recipient) {
            throw new Error("Recipient account not found.");
        }

        if (recipient.accountNumber === this.accountNumber) {
            throw new Error(
                "You cannot transfer money to your own account."
            );
        }

        if (!Number.isFinite(amount)) {
            throw new Error("Invalid transfer amount.");
        }

        if (amount <= 0) {
            throw new Error(
                "Transfer amount must be greater than zero."
            );
        }

        if (amount % 100 !== 0) {
            throw new Error(
                "Transfer amount must be a multiple of ₱100."
            );
        }

        if (amount > this.balance) {
            throw new Error("Insufficient funds.");
        }

        this.balance -= amount;
        recipient.balance += amount;

        this.transactions.push(
            createTransaction(
                "TRANSFER_OUT",
                amount,
                `Transfer to ${recipient.name}`,
                this.balance,
                recipient.accountNumber
            )
        );

        recipient.transactions.push(
            createTransaction(
                "TRANSFER_IN",
                amount,
                `Transfer from ${this.name}`,
                recipient.balance,
                this.accountNumber
            )
        );
    }

    getTodayWithdrawals() {
        const today = new Date()
            .toISOString()
            .split("T")[0];

        return this.transactions
            .filter(transaction => {
                return (
                    transaction.type === "WITHDRAWAL" &&
                    transaction.date.startsWith(today)
                );
            })
            .reduce((total, transaction) => {
                return total + transaction.amount;
            }, 0);
    }

    changePin(newPin) {
    if (!/^\d{4}$/.test(newPin)) {
        throw new Error(
            "PIN must contain exactly 4 digits."
        );
    }

    const weakPins = [
        "0000",
        "1111",
        "2222",
        "3333",
        "4444",
        "5555",
        "6666",
        "7777",
        "8888",
        "9999",
        "1234",
        "4321"
    ];

    if (weakPins.includes(newPin)) {
        throw new Error(
            "This PIN is too easy to guess. Please choose a stronger PIN."
        );
    }

    if (newPin === this.pin) {
        throw new Error(
            "New PIN must be different from your current PIN."
        );
    }

    this.pin = newPin;
}

    toJSON() {
        return {
            accountNumber: this.accountNumber,
            name: this.name,
            pin: this.pin,
            accountType: this.accountType,
            balance: this.balance,
            transactions: this.transactions
        };
    }
}

module.exports = Account;