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
        man.ID_MANTENIMIENTO AS mantenimiento_id,
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
        WHERE
        (man.HECHO != 1 OR man.HECHO IS NULL)
        AND (man.FECHA IS NULL OR man.FECHA >= CURDATE())
        ");

        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar productos", "details" => $e->getMessage()]);
    }
} else if ($action === "VIEWPAST"){
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
        man.ID_MANTENIMIENTO AS mantenimiento_id,
        man.USER_CREATE AS mantenimiento_user_create,
        man.USER_MODIFY AS mantenimiento_user_modify,
        man.FECHA AS mantenimiento_fecha,
        man.HECHO AS mantenimiento_hecho,
        man.CREATED AS mantenimiento_created,
        man.MODIFIED AS mantenimiento_modified,

        EXISTS (
            SELECT 1
            FROM mantenimiento m2
            WHERE m2.ID_PRODUCTO = prod.ID_PRODUCTO
            AND m2.FECHA >= CURDATE()
            AND m2.HECHO = 0
        ) AS has_upcoming_mantto

        FROM producto prod
        LEFT JOIN marca mar ON prod.ID_MARCA = mar.ID_MARCA
        LEFT JOIN proveedor prov ON prod.ID_PROVEEDOR = prov.ID_PROVEEDOR
        LEFT JOIN garantia gar ON prod.ID_PRODUCTO = gar.ID_PRODUCTO
        LEFT JOIN mantenimiento man ON prod.ID_PRODUCTO = man.ID_PRODUCTO
        WHERE
        (
            man.FECHA < CURDATE()
            OR (man.FECHA = CURDATE() AND man.HECHO = 1)
        )
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
        $idMantto = $data['idMantto'] ?? null;
        $userModify = $_SESSION['user_id'] ?? null;

        if (!$userModify || !$idMantto || !is_numeric($idMantto)) {
            throw new Exception("Datos inválidos para finalizar mantenimiento.");
        }

        $stmt = $pdo->prepare("
            UPDATE mantenimiento
            SET 
                HECHO = 1,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_MANTENIMIENTO = :id_mantto
              AND HECHO = 0
        ");
        $stmt->execute([
            'user_modify' => $userModify,
            'id_mantto' => $idMantto
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("No se encontró mantenimiento pendiente con ese ID.");
        }

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else if ($action === "ADDFECHA") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $idProducto = $data['idProducto'] ?? null;
        $fecha = $data['fecha'] ?? null;
        $userCreate = $_SESSION['user_id'] ?? null;

        if (!$userCreate || !$idProducto || !$fecha || !is_numeric($idProducto)) {
            throw new Exception("Datos inválidos para agregar fecha.");
        }

        $stmt = $pdo->prepare("
            INSERT INTO mantenimiento (
                ID_PRODUCTO, USER_CREATE, FECHA, HECHO
            ) VALUES (
                :id_producto, :user_create, :fecha, 0
            )
        ");
        $stmt->execute([
            'id_producto' => $idProducto,
            'user_create' => $userCreate,
            'fecha' => $fecha
        ]);

        $newId = $pdo->lastInsertId();

        echo json_encode([
            "success" => true,
            "idMantto" => $newId
        ]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else if ($action === "EDITFECHA") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $idMantto = $data['idMantto'] ?? null;
        $fecha = $data['fecha'] ?? null;
        $userModify = $_SESSION['user_id'] ?? null;

        if (!$userModify || !$idMantto || !$fecha || !is_numeric($idMantto)) {
            throw new Exception("Datos inválidos para editar fecha.");
        }

        $stmt = $pdo->prepare("
            UPDATE mantenimiento
            SET 
                FECHA = :fecha,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_MANTENIMIENTO = :id_mantto
        ");
        $stmt->execute([
            'fecha' => $fecha,
            'user_modify' => $userModify,
            'id_mantto' => $idMantto
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("No se encontró mantenimiento para editar.");
        }

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}  else if ($action === "TERMINARMANTTO") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $idMantto = $data['idMantto'] ?? null;
        $userModify = $_SESSION['user_id'] ?? null;

        if (!$userModify || !$idMantto || !is_numeric($idMantto)) {
            throw new Exception("Datos inválidos para marcar mantenimiento como realizado.");
        }

        $stmt = $pdo->prepare("
            UPDATE mantenimiento
            SET 
                HECHO = 1,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_MANTENIMIENTO = :id_mantto
        ");
        $stmt->execute([
            'user_modify' => $userModify,
            'id_mantto' => $idMantto
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("No se encontró registro de mantenimiento.");
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