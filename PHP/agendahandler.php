<?php
session_start();
require_once '../PHP/db_connect.php';

ob_start();
header('Content-Type: application/json; charset=utf-8');

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

// Get the action parameter
$action = $_GET['action'] ?? '';

if ($action === "VIEWCURRENT") {
    // Fetch appointment data
    $stmt = $pdo->prepare("
SELECT 
    c.ID_CITA, 
    c.ID_PACIENTE, 
    c.FECHA_HORA, 
    c.MOTIVO_DE_CONSULTA,
    CONCAT(p.NOMBRE, ' ', p.PATERNO, ' ', p.MATERNO) AS NOMBRE_COMPLETO
FROM cita c
JOIN paciente pa ON pa.ID_PACIENTE = c.ID_PACIENTE
JOIN persona p ON p.ID_PERSONA = pa.ID_PERSONA
WHERE DATE(c.FECHA_HORA) >= CURDATE()
ORDER BY c.FECHA_HORA DESC;
    ");
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);
}
elseif ($action === "VIEWPAST") {
    // Fetch appointment data
    $stmt = $pdo->prepare("
SELECT 
    c.ID_CITA, 
    c.ID_PACIENTE, 
    c.FECHA_HORA, 
    c.MOTIVO_DE_CONSULTA,
    CONCAT(p.NOMBRE, ' ', p.PATERNO, ' ', p.MATERNO) AS NOMBRE_COMPLETO
FROM cita c
JOIN paciente pa ON pa.ID_PACIENTE = c.ID_PACIENTE
JOIN persona p ON p.ID_PERSONA = pa.ID_PERSONA
WHERE DATE(c.FECHA_HORA) < CURDATE()
ORDER BY c.FECHA_HORA DESC;
    ");
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);
}

else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>