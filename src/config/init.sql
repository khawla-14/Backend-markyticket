-- Drop database if exists and create new one
DROP DATABASE IF EXISTS marky_db;
CREATE DATABASE marky_db;
USE marky_db;

-- Create Personne table
CREATE TABLE Personne (
    idPersonne INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    numTel VARCHAR(20),
    password VARCHAR(100),
    role ENUM('admin', 'client', 'receveur') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bus table
CREATE TABLE Bus (
    matricule VARCHAR(20) PRIMARY KEY,
    annee INT,
    branche VARCHAR(100),
    capacite INT NOT NULL DEFAULT 50,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'
);

-- Create Client table
CREATE TABLE Client (
    idClient INT PRIMARY KEY,
    montant DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (idClient) REFERENCES Personne(idPersonne)
);

-- Create Receveur table
CREATE TABLE Receveur (
    idReceveur INT PRIMARY KEY,
    branche VARCHAR(100) NOT NULL, -- The branch/route they work on
    status ENUM('available', 'on_duty', 'off_duty') DEFAULT 'available',
    FOREIGN KEY (idReceveur) REFERENCES Personne(idPersonne)
);

-- Create Admin table
CREATE TABLE Admin (
    idAdmin INT PRIMARY KEY,
    FOREIGN KEY (idAdmin) REFERENCES Personne(idPersonne)
);

-- Create Trajet table
CREATE TABLE Trajet (
    idTrajet INT AUTO_INCREMENT PRIMARY KEY,
    nom_trajet VARCHAR(100) NOT NULL, -- e.g., "Sidi Ahmed - Center Ville"
    idBus VARCHAR(20),
    idReceveur INT,
    heure_depart TIME,
    duree_estimee INT, -- in minutes
    prix DECIMAL(10, 2),
    status ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    FOREIGN KEY (idBus) REFERENCES Bus(matricule),
    FOREIGN KEY (idReceveur) REFERENCES Receveur(idReceveur)
);

-- Create Ticket table
CREATE TABLE Ticket (
    idTicket INT AUTO_INCREMENT PRIMARY KEY,
    idTrajet INT,
    idClient INT,
    prix DECIMAL(10, 2),
    date_achat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_validation DATETIME,
    qr_code VARCHAR(255),
    statut ENUM('en_attente', 'valide', 'utilise', 'expire', 'annule') DEFAULT 'en_attente',
    FOREIGN KEY (idTrajet) REFERENCES Trajet(idTrajet),
    FOREIGN KEY (idClient) REFERENCES Client(idClient)
);

-- Create Notification table
CREATE TABLE Notification (
    idNotification INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    titre VARCHAR(200),
    contenu TEXT,
    type ENUM('info', 'alert', 'promotion') NOT NULL,
    destination_type ENUM('Client', 'Receveur') NOT NULL,
    destination_id INT NOT NULL,
    idAdmin INT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (idAdmin) REFERENCES Admin(idAdmin)
);

-- Insert default admin
INSERT INTO Personne (nom, prenom, email, password, role) 
VALUES ('Admin', 'System', 'admin@gmail.com', '$2a$10$your-hashed-password', 'admin');

INSERT INTO Admin (idAdmin) 
VALUES (LAST_INSERT_ID()); 