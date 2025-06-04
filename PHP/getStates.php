<?php
session_start();
require_once '../PHP/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

try {
    // Query to fetch states
    $stmt = $pdo->prepare("SELECT ID_ESTADO, NOMBRE FROM ESTADO ORDER BY NOMBRE");
    $stmt->execute();
    $states = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($states);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
