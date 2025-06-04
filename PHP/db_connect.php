<?php
ob_start(); // Prevent unexpected output

define('DB_HOST', 'localhost');
define('DB_PORT', '3307');
define('DB_NAME', 'benjayblancatecnologias');
define('DB_USER', 'root');
define('DB_PASS', 'rootroot');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    throw new Exception("Database connection failed: " . $e->getMessage());
}
?>
