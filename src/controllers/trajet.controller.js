const db = require('../config/database');

// Create a new trajet
exports.create = async (req, res) => {
    try {
        const { nom_trajet, idBus, idReceveur, heure_depart, duree_estimee, prix } = req.body;

        // Check if bus exists and is active
        const [bus] = await db.execute(
            'SELECT * FROM Bus WHERE matricule = ? AND status = "active"',
            [idBus]
        );

        if (bus.length === 0) {
            return res.status(400).json({ message: 'Bus not found or not active' });
        }

        // Check if receiver exists and is available
        const [receveur] = await db.execute(
            'SELECT * FROM Receveur WHERE idReceveur = ? AND status = "available"',
            [idReceveur]
        );

        if (receveur.length === 0) {
            return res.status(400).json({ message: 'Receiver not found or not available' });
        }

        // Insert new trajet
        const [result] = await db.execute(
            'INSERT INTO Trajet (nom_trajet, idBus, idReceveur, heure_depart, duree_estimee, prix) VALUES (?, ?, ?, ?, ?, ?)',
            [nom_trajet, idBus, idReceveur, heure_depart, duree_estimee, prix]
        );

        // Update receiver status
        await db.execute(
            'UPDATE Receveur SET status = "on_duty" WHERE idReceveur = ?',
            [idReceveur]
        );

        res.status(201).json({
            message: 'Trajet created successfully',
            trajetId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating trajet' });
    }
};

// Get all trajets
exports.findAll = async (req, res) => {
    try {
        const [trajets] = await db.execute(`
            SELECT t.*, 
                   b.matricule as bus_matricule, 
                   b.status as bus_status,
                   CONCAT(p.nom, ' ', p.prenom) as receveur_name
            FROM Trajet t
            LEFT JOIN Bus b ON t.idBus = b.matricule
            LEFT JOIN Receveur r ON t.idReceveur = r.idReceveur
            LEFT JOIN Personne p ON r.idReceveur = p.idPersonne
        `);
        res.json(trajets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving trajets' });
    }
};

// Get a single trajet
exports.findOne = async (req, res) => {
    try {
        const [trajet] = await db.execute(`
            SELECT t.*, 
                   b.matricule as bus_matricule, 
                   b.status as bus_status,
                   CONCAT(p.nom, ' ', p.prenom) as receveur_name
            FROM Trajet t
            LEFT JOIN Bus b ON t.idBus = b.matricule
            LEFT JOIN Receveur r ON t.idReceveur = r.idReceveur
            LEFT JOIN Personne p ON r.idReceveur = p.idPersonne
            WHERE t.idTrajet = ?
        `, [req.params.id]);

        if (trajet.length === 0) {
            return res.status(404).json({ message: 'Trajet not found' });
        }

        res.json(trajet[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving trajet' });
    }
};

// Update trajet status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const idTrajet = req.params.id;

        // Check if trajet exists
        const [trajet] = await db.execute(
            'SELECT * FROM Trajet WHERE idTrajet = ?',
            [idTrajet]
        );

        if (trajet.length === 0) {
            return res.status(404).json({ message: 'Trajet not found' });
        }

        // Update trajet status
        await db.execute(
            'UPDATE Trajet SET status = ? WHERE idTrajet = ?',
            [status, idTrajet]
        );

        // If trajet is finished or cancelled, update receiver status
        if (status === 'termine' || status === 'annule') {
            await db.execute(
                'UPDATE Receveur SET status = "available" WHERE idReceveur = ?',
                [trajet[0].idReceveur]
            );
        }

        res.json({ message: 'Trajet status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating trajet status' });
    }
};

// Delete trajet
exports.delete = async (req, res) => {
    try {
        const idTrajet = req.params.id;

        // Check if trajet exists
        const [trajet] = await db.execute(
            'SELECT * FROM Trajet WHERE idTrajet = ?',
            [idTrajet]
        );

        if (trajet.length === 0) {
            return res.status(404).json({ message: 'Trajet not found' });
        }

        // Check if trajet has any tickets
        const [tickets] = await db.execute(
            'SELECT * FROM Ticket WHERE idTrajet = ?',
            [idTrajet]
        );

        if (tickets.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete trajet as it has tickets associated with it'
            });
        }

        // Update receiver status
        await db.execute(
            'UPDATE Receveur SET status = "available" WHERE idReceveur = ?',
            [trajet[0].idReceveur]
        );

        // Delete trajet
        await db.execute(
            'DELETE FROM Trajet WHERE idTrajet = ?',
            [idTrajet]
        );

        res.json({ message: 'Trajet deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting trajet' });
    }
}; 