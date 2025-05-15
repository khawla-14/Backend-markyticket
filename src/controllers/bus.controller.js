const db = require('../config/database');

// Create a new bus
exports.create = async (req, res) => {
    try {
        const { matricule, annee, branche, capacite } = req.body;

        // Check if bus already exists
        const [existingBus] = await db.execute(
            'SELECT * FROM Bus WHERE matricule = ?',
            [matricule]
        );

        if (existingBus.length > 0) {
            return res.status(400).json({ message: 'Bus with this matricule already exists' });
        }

        // Insert new bus
        await db.execute(
            'INSERT INTO Bus (matricule, annee, branche, capacite) VALUES (?, ?, ?, ?)',
            [matricule, annee, branche, capacite || 50]
        );

        res.status(201).json({
            message: 'Bus created successfully',
            bus: { matricule, annee, branche, capacite }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating bus' });
    }
};

// Get all buses with their current trajet if assigned
exports.findAll = async (req, res) => {
    try {
        const [buses] = await db.execute(`
            SELECT b.*, 
                   t.idTrajet, 
                   t.nom_trajet, 
                   t.heure_depart,
                   t.status as trajet_status
            FROM Bus b
            LEFT JOIN Trajet t ON b.matricule = t.idBus AND t.status = 'en_cours'
        `);
        res.json(buses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving buses' });
    }
};

// Get a single bus with its current trajet if assigned
exports.findOne = async (req, res) => {
    try {
        const [bus] = await db.execute(`
            SELECT b.*, 
                   t.idTrajet, 
                   t.nom_trajet, 
                   t.heure_depart,
                   t.status as trajet_status
            FROM Bus b
            LEFT JOIN Trajet t ON b.matricule = t.idBus AND t.status = 'en_cours'
            WHERE b.matricule = ?
        `, [req.params.matricule]);

        if (bus.length === 0) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json(bus[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving bus' });
    }
};

// Update a bus
exports.update = async (req, res) => {
    try {
        const { annee, branche, capacite, status } = req.body;
        const matricule = req.params.matricule;

        // Check if bus exists
        const [bus] = await db.execute(
            'SELECT * FROM Bus WHERE matricule = ?',
            [matricule]
        );

        if (bus.length === 0) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // If bus is being set to maintenance or inactive, check if it's currently in a trajet
        if (status && status !== 'active') {
            const [activeTrajet] = await db.execute(
                'SELECT * FROM Trajet WHERE idBus = ? AND status = "en_cours"',
                [matricule]
            );

            if (activeTrajet.length > 0) {
                return res.status(400).json({
                    message: 'Cannot change bus status while it is assigned to an active trajet'
                });
            }
        }

        // Update bus
        await db.execute(
            'UPDATE Bus SET annee = ?, branche = ?, capacite = ?, status = ? WHERE matricule = ?',
            [annee, branche, capacite, status, matricule]
        );

        res.json({ message: 'Bus updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating bus' });
    }
};

// Delete a bus
exports.delete = async (req, res) => {
    try {
        const matricule = req.params.matricule;

        // Check if bus exists
        const [bus] = await db.execute(
            'SELECT * FROM Bus WHERE matricule = ?',
            [matricule]
        );

        if (bus.length === 0) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Check if bus is assigned to any trajet
        const [trajets] = await db.execute(
            'SELECT * FROM Trajet WHERE idBus = ?',
            [matricule]
        );

        if (trajets.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete bus as it is assigned to trajets'
            });
        }

        // Delete bus
        await db.execute(
            'DELETE FROM Bus WHERE matricule = ?',
            [matricule]
        );

        res.json({ message: 'Bus deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting bus' });
    }
};

// Change bus status
exports.changeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const matricule = req.params.matricule;

        // Check if bus exists
        const [bus] = await db.execute(
            'SELECT * FROM Bus WHERE matricule = ?',
            [matricule]
        );

        if (bus.length === 0) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // If bus is being set to maintenance or inactive, check if it's currently in a trajet
        if (status !== 'active') {
            const [activeTrajet] = await db.execute(
                'SELECT * FROM Trajet WHERE idBus = ? AND status = "en_cours"',
                [matricule]
            );

            if (activeTrajet.length > 0) {
                return res.status(400).json({
                    message: 'Cannot change bus status while it is assigned to an active trajet'
                });
            }
        }

        // Update status
        await db.execute(
            'UPDATE Bus SET status = ? WHERE matricule = ?',
            [status, matricule]
        );

        res.json({ message: 'Bus status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating bus status' });
    }
}; 