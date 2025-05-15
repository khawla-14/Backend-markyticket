const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, password, numTel, role, branche } = req.body;

        // Check if email already exists
        const [existingUser] = await db.execute(
            'SELECT * FROM Personne WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into Personne table
        const [result] = await db.execute(
            'INSERT INTO Personne (nom, prenom, email, password, numTel, role) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, prenom, email, hashedPassword, numTel, role]
        );

        const userId = result.insertId;

        // Based on role, insert into respective table
        if (role === 'client') {
            await db.execute(
                'INSERT INTO Client (idClient, montant) VALUES (?, ?)',
                [userId, 0]
            );
        } else if (role === 'receveur') {
            if (!branche) {
                return res.status(400).json({ message: 'Branche is required for receiver registration' });
            }
            await db.execute(
                'INSERT INTO Receveur (idReceveur, branche, status) VALUES (?, ?, ?)',
                [userId, branche, 'available']
            );
        }

        res.status(201).json({
            message: 'User registered successfully',
            userId: userId,
            role: role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Special case for admin
        if (email === 'admin@gmail.com') {
            if (password === 'admin') {
                const token = jwt.sign(
                    { id: 1, role: 'admin' },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '24h' }
                );
                return res.json({
                    id: 1,
                    email: email,
                    role: 'admin',
                    accessToken: token
                });
            }
            return res.status(401).json({ message: 'Invalid Password' });
        }

        // For other users
        const [users] = await db.execute(
            'SELECT * FROM Personne WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid Password' });
        }

        const token = jwt.sign(
            { id: user.idPersonne, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            id: user.idPersonne,
            email: user.email,
            role: user.role,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during login' });
    }
}; 