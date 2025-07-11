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
            pe.ID_PEDIDO,
            DATE_FORMAT(pe.FECHA_DE_PEDIDO, '%d/%m/%Y') AS FECHA_DE_PEDIDO,
            DATE_FORMAT(pe.FECHA_DE_ENTREGA, '%d/%m/%Y') AS FECHA_DE_ENTREGA,
            pr.ID_PRODUCTO,
            pr.MODELO,
            pr.PRECIO_DISTRIBUIDOR,
            pr.PRECIO_DE_VENTA,
            pr.NUMERO_DE_SERIE,
            ma.ID_MARCA,
            ma.NOMBRE AS 'NOMBRE_MARCA',
            pv.NOMBRE AS 'NOMBRE_PROVEEDOR'
            FROM
            pedido pe
            LEFT JOIN producto pr ON pr.ID_PRODUCTO=pe.ID_PRODUCTO
            LEFT JOIN marca ma ON ma.ID_MARCA=pr.ID_MARCA
            LEFT JOIN proveedor pv ON pv.ID_PROVEEDOR=pr.ID_PROVEEDOR
        ");

        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar productos", "details" => $e->getMessage()]);
    }
} else if ($action === "REMOVE") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;

        if (!$id || !is_numeric($id)) {
            throw new Exception("ID inválido.");
        }

        $stmt = $pdo->prepare("DELETE FROM pedido WHERE ID_PEDIDO = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }

}

else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>