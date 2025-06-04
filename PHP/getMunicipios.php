<?php
session_start();
require_once '../PHP/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

// Retrieve the state ID from the request
$idEstado = $_GET['stateId'] ?? null;

if (!$idEstado) {
    echo json_encode(["error" => "ID de estado no proporcionado"]);
    exit;
}

try {
    // Query to fetch municipalities for the given state
    $stmt = $pdo->prepare("SELECT ID_MUNICIPIO, NOMBRE FROM MUNICIPIO WHERE ID_ESTADO = ?");
    $stmt->execute([$idEstado]);
    $municipios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($municipios);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
