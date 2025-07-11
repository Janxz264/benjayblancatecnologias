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
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_PRODUCTO, 
                m.NOMBRE AS NOMBRE_MARCA, 
                pr.NOMBRE AS NOMBRE_PROVEEDOR, 
                p.MODELO, 
                p.PRECIO_DISTRIBUIDOR, 
                p.PRECIO_DE_VENTA, 
                p.NUMERO_DE_SERIE
            FROM producto p
            JOIN marca m ON p.ID_MARCA = m.ID_MARCA
            JOIN proveedor pr ON p.ID_PROVEEDOR = pr.ID_PROVEEDOR;
        ");

        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar productos", "details" => $e->getMessage()]);
    }
}


else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>