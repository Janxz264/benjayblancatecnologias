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
        -- Producto
        prod.ID_PRODUCTO AS producto_id,
        prod.ID_MARCA AS producto_id_marca,
        prod.ID_PROVEEDOR AS producto_id_proveedor,
        prod.USER_CREATE AS producto_user_create,
        prod.USER_MODIFY AS producto_user_modify,
        prod.MODELO AS producto_modelo,
        prod.PRECIO_DISTRIBUIDOR AS producto_precio_distribuidor,
        prod.PRECIO_DE_VENTA AS producto_precio_venta,
        prod.NUMERO_DE_SERIE AS producto_numero_serie,
        prod.CREATED AS producto_created,
        prod.MODIFIED AS producto_modified,

        -- Marca
        mar.ID_MARCA AS marca_id,
        mar.NOMBRE AS marca_nombre,

        -- Proveedor
        prov.ID_PROVEEDOR AS proveedor_id,
        prov.NOMBRE AS proveedor_nombre,

        -- Garantía
        gar.ID_GARANTIA AS garantia_id,
        gar.USER_CREATE AS garantia_user_create,
        gar.USER_MODIFY AS garantia_user_modify,
        gar.FECHA_INICIO AS garantia_fecha_inicio,
        gar.FECHA_FIN AS garantia_fecha_fin,
        gar.CREATED AS garantia_created,
        gar.MODIFIED AS garantia_modified,

        -- Mantenimiento
        man.USER_CREATE AS mantenimiento_user_create,
        man.USER_MODIFY AS mantenimiento_user_modify,
        man.FECHA AS mantenimiento_fecha,
        man.HECHO AS mantenimiento_hecho,
        man.CREATED AS mantenimiento_created,
        man.MODIFIED AS mantenimiento_modified

        FROM producto prod
        LEFT JOIN marca mar ON prod.ID_MARCA = mar.ID_MARCA
        LEFT JOIN proveedor prov ON prod.ID_PROVEEDOR = prov.ID_PROVEEDOR
        LEFT JOIN garantia gar ON prod.ID_PRODUCTO = gar.ID_PRODUCTO
        LEFT JOIN mantenimiento man ON prod.ID_PRODUCTO = man.ID_PRODUCTO
        ");

        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar productos", "details" => $e->getMessage()]);
    }
} else if ($action === "FINISHMANTTO") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $idProducto = $data['idProducto'] ?? null;
        $userModify = $_SESSION['user_id'] ?? null;

        if (!$userModify) {
            echo json_encode(["error" => "Usuario no autenticado"]);
            exit;
        }

        if (!$idProducto || !is_numeric($idProducto)) {
            throw new Exception("ID de producto inválido.");
        }

        $stmt = $pdo->prepare("
            UPDATE mantenimiento
            SET 
                HECHO = 1,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_PRODUCTO = :id_producto
              AND FECHA = CURDATE()
        ");
        $stmt->execute([
            'user_modify' => $userModify,
            'id_producto' => $idProducto
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("No se encontró mantenimiento para hoy o ya fue marcado.");
        }

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}

else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>