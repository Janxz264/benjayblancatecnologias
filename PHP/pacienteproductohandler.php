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
            m.NOMBRE AS NOMBRE_MARCA,
            prov.NOMBRE AS NOMBRE_PROVEEDOR
        FROM PACIENTE p
        LEFT JOIN PERSONA per ON p.ID_PERSONA = per.ID_PERSONA
        LEFT JOIN PRODUCTO pr ON pr.ID_PACIENTE = p.ID_PACIENTE
        LEFT JOIN MARCA m ON pr.ID_MARCA = m.ID_MARCA
        LEFT JOIN PROVEEDOR prov ON pr.ID_PROVEEDOR = prov.ID_PROVEEDOR
        ORDER BY p.ID_PACIENTE, pr.ID_PRODUCTO;
    ");

    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);
} else if ($action === "VIEWAVAILABLEPRODUCTS") {
    $stmt = $pdo->prepare("
        SELECT 
            pr.ID_PRODUCTO,
            pr.MODELO,
            pr.NUMERO_DE_SERIE,
            pr.PRECIO_DE_VENTA,
            m.NOMBRE AS NOMBRE_MARCA,
            prov.NOMBRE AS NOMBRE_PROVEEDOR
        FROM PRODUCTO pr
        LEFT JOIN MARCA m ON pr.ID_MARCA = m.ID_MARCA
        LEFT JOIN PROVEEDOR prov ON pr.ID_PROVEEDOR = prov.ID_PROVEEDOR
        WHERE pr.ID_PACIENTE IS NULL
        ORDER BY pr.MODELO ASC;
    ");
    $stmt->execute();
    $availableProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($availableProducts);
} else if ($action === "ADD") {
    // Ensure required POST parameters are present
    $idProducto = isset($_POST['idProducto']) ? intval($_POST['idProducto']) : null;
    $idPaciente = isset($_POST['idPaciente']) ? intval($_POST['idPaciente']) : null;
    $userModify = $_SESSION['user_id'] ?? 'system';

    if (!$idProducto || !$idPaciente) {
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    // Update PRODUCTO to assign it to the patient
    $stmt = $pdo->prepare("
        UPDATE PRODUCTO
        SET ID_PACIENTE = :idPaciente,
            USER_MODIFY = :userModify,
            MODIFIED = NOW()
        WHERE ID_PRODUCTO = :idProducto
    ");

    $stmt->bindValue(':idPaciente', $idPaciente, PDO::PARAM_INT);
    $stmt->bindValue(':userModify', $userModify, PDO::PARAM_STR);
    $stmt->bindValue(':idProducto', $idProducto, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Producto asignado correctamente"]);
    } else {
        echo json_encode(["error" => "Error al asignar producto"]);
    }
}
