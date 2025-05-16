const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Buy a ticket for a trajet - Simplified version
exports.buyTicket = async (req, res) => {
    try {
        const { trajetId } = req.body;
        const clientId = req.userId;

        // Start transaction
        await db.beginTransaction();

        // Get trajet price and client's balance
        const [[trajet]] = await db.execute(
            'SELECT prix FROM Trajet WHERE idTrajet = ?',
            [trajetId]
        );

        const [[client]] = await db.execute(
            'SELECT montant FROM Client WHERE idClient = ?',
            [clientId]
        );

        if (!trajet) {
            await db.rollback();
            return res.status(404).json({ message: 'Trajet not found' });
        }

        if (client.montant < trajet.prix) {
            await db.rollback();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Generate unique ticket code
        const ticketCode = uuidv4();

        // Create ticket
        await db.execute(
            'INSERT INTO Ticket (code, idClient, idTrajet, status, prix) VALUES (?, ?, ?, ?, ?)',
            [ticketCode, clientId, trajetId, 'en_cours', trajet.prix]
        );

        // Deduct amount from client's wallet
        const newBalance = client.montant - trajet.prix;
        await db.execute(
            'UPDATE Client SET montant = ? WHERE idClient = ?',
            [newBalance, clientId]
        );

        await db.commit();

        res.json({
            message: 'Ticket purchased successfully',
            ticketCode,
            newBalance,
            status: 'en_cours'
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error purchasing ticket' });
    }
};

// Validate ticket (by receiver) - Simplified version
exports.validateTicket = async (req, res) => {
    try {
        const { ticketCode } = req.body;
        const receiverId = req.userId;

        // Check if ticket exists and belongs to receiver's trajet
        const [[ticket]] = await db.execute(
            `SELECT t.*, tr.idReceveur 
             FROM Ticket t 
             JOIN Trajet tr ON t.idTrajet = tr.idTrajet 
             WHERE t.code = ?`,
            [ticketCode]
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.status !== 'en_cours') {
            return res.status(400).json({ message: 'Ticket is not valid for validation' });
        }

        // Update ticket status
        await db.execute(
            'UPDATE Ticket SET status = "valide" WHERE code = ?',
            [ticketCode]
        );

        res.json({
            message: 'Ticket validated successfully',
            status: 'valide'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error validating ticket' });
    }
};

// Get ticket status
exports.getTicketStatus = async (req, res) => {
    try {
        const { ticketCode } = req.params;
        const [[ticket]] = await db.execute(
            'SELECT status, prix FROM Ticket WHERE code = ?',
            [ticketCode]
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({
            status: ticket.status,
            price: ticket.prix
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting ticket status' });
    }
};

// Create on-bus ticket (by receiver)
exports.createOnBusTicket = async (req, res) => {
    try {
        const receiverId = req.userId;

        // Get receiver's current trajet
        const [[trajet]] = await db.execute(
            'SELECT * FROM Trajet WHERE idReceveur = ? AND status = "en_cours"',
            [receiverId]
        );

        if (!trajet) {
            return res.status(404).json({ message: 'No active trajet found for receiver' });
        }

        // Generate static QR code for on-bus purchase
        const staticCode = `ON_BUS_${receiverId}_${trajet.idTrajet}`;
        const qrCode = await QRCode.toDataURL(staticCode);

        res.json({
            qrCode,
            trajetInfo: {
                name: trajet.nom,
                price: trajet.prix
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating on-bus ticket QR' });
    }
};

// Process on-bus ticket purchase
exports.processOnBusTicket = async (req, res) => {
    try {
        const { staticCode, clientId } = req.body;
        const [_, receiverId, trajetId] = staticCode.split('_');

        await db.beginTransaction();

        // Get trajet details
        const [[trajet]] = await db.execute(
            'SELECT * FROM Trajet WHERE idTrajet = ? AND status = "en_cours"',
            [trajetId]
        );

        if (!trajet) {
            await db.rollback();
            return res.status(404).json({ message: 'Invalid trajet' });
        }

        // Generate unique ticket code
        const ticketCode = uuidv4();

        // Create ticket with validated status
        await db.execute(
            'INSERT INTO Ticket (code, idClient, idTrajet, status, prix) VALUES (?, ?, ?, ?, ?)',
            [ticketCode, clientId, trajetId, 'valide', trajet.prix]
        );

        await db.commit();

        res.json({
            message: 'On-bus ticket created and validated successfully',
            ticketCode
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error processing on-bus ticket' });
    }
};

// Cancel ticket
exports.cancelTicket = async (req, res) => {
    try {
        const { ticketCode } = req.body;
        const clientId = req.userId;

        await db.beginTransaction();

        // Get ticket details
        const [[ticket]] = await db.execute(
            'SELECT * FROM Ticket WHERE code = ? AND idClient = ?',
            [ticketCode, clientId]
        );

        if (!ticket) {
            await db.rollback();
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.status !== 'en_cours') {
            await db.rollback();
            return res.status(400).json({ message: 'Cannot cancel ticket - invalid status' });
        }

        // Update ticket status
        await db.execute(
            'UPDATE Ticket SET status = "canceled" WHERE code = ?',
            [ticketCode]
        );

        // Refund amount to client's wallet
        await db.execute(
            'UPDATE Client SET montant = montant + ? WHERE idClient = ?',
            [ticket.prix, clientId]
        );

        await db.commit();

        res.json({ message: 'Ticket canceled successfully' });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error canceling ticket' });
    }
}; 