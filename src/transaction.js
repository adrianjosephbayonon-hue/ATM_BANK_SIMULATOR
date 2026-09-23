function generateTransactionId() {
    const timestamp = Date.now();
    const randomPart = Math.floor(
        Math.random() * 100000
    );

    return `TXN-${timestamp}-${randomPart}`;
}

function createTransaction(
    type,
    amount,
    description,
    balanceAfter,
    relatedAccount = null
) {
    return {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        type,
        amount,
        description,
        balanceAfter,
        relatedAccount
    };
}

module.exports = {
    createTransaction
};