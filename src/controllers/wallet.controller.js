const db = require('../config/database');

// Recharge wallet
exports.recharge = async (req, res) => {
    try {
        const { montant } = req.body;
        const userId = req.userId; // From auth middleware

        // Get current balance
        const [client] = await db.execute(
            'SELECT montant FROM Client WHERE idClient = ?',
            [userId]
        );

        if (client.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const newMontant = parseFloat(client[0].montant) + parseFloat(montant);

        // Update balance
        await db.execute(
            'UPDATE Client SET montant = ? WHERE idClient = ?',
            [newMontant, userId]
        );

        res.json({
            message: 'Wallet recharged successfully',
            newBalance: newMontant
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recharging wallet' });
    }
};

// Get wallet balance
exports.getBalance = async (req, res) => {
    try {
        const userId = req.userId;

        const [client] = await db.execute(
            'SELECT montant FROM Client WHERE idClient = ?',
            [userId]
        );

        if (client.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json({
            balance: client[0].montant
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting balance' });
    }
}; 