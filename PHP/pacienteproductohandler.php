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

if ($action === "VIEW") {
    // Fetch patient data
    $stmt = $pdo->prepare("
        SELECT 
        p.ID_PACIENTE,
        CONCAT_WS(' ', per.NOMBRE, per.PATERNO, per.MATERNO) AS NOMBRE_COMPLETO,
        pr.ID_PRODUCTO,
        pr.MODELO,
        pr.NUMERO_DE_SERIE,
        pr.PRECIO_DE_VENTA,
        m.NOMBRE AS 'NOMBRE_MARCA',
        prov.NOMBRE AS 'NOMBRE_PROVEEDOR'
        FROM PRODUCTO pr
        JOIN PACIENTE p ON pr.ID_PACIENTE = p.ID_PACIENTE
        LEFT JOIN PERSONA per ON p.ID_PERSONA = per.ID_PERSONA
        LEFT JOIN MARCA m ON pr.ID_MARCA = m.ID_MARCA
        LEFT JOIN PROVEEDOR prov ON pr.ID_PROVEEDOR = prov.ID_PROVEEDOR
        ORDER BY p.ID_PACIENTE, pr.ID_PRODUCTO;
    ");
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);
}