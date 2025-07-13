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
                p.NUMERO_DE_SERIE,
                m.ID_MARCA,
                pr.ID_PROVEEDOR,
                g.ID_GARANTIA,
                g.FECHA_INICIO,
                g.FECHA_FIN,
                ma.FECHA AS 'FECHA_MANTTO',
                ma.HECHO
            FROM producto p
            JOIN marca m ON p.ID_MARCA = m.ID_MARCA
            JOIN proveedor pr ON p.ID_PROVEEDOR = pr.ID_PROVEEDOR
            LEFT JOIN garantia g ON p.ID_PRODUCTO=g.ID_PRODUCTO
            LEFT JOIN mantenimiento ma ON ma.ID_PRODUCTO=p.ID_PRODUCTO
        ");

        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar productos", "details" => $e->getMessage()]);
    }
} else if ($action === "ADD") {
    try {
        // Decode JSON payload
        $data = json_decode(file_get_contents('php://input'), true);

        $userCreate = $_SESSION['user_id'] ?? null;
        if (!$userCreate) {
            echo json_encode(["error" => "Usuario no autenticado"]);
            exit;
        }

        // Basic validation
        if (empty($data['modelo']) || !is_string($data['modelo'])) {
            throw new Exception("Modelo es obligatorio y debe ser texto.");
        }
        if (!isset($data['precioDistribuidor']) || !is_numeric($data['precioDistribuidor'])) {
            throw new Exception("Precio de distribuidor inválido.");
        }
        if (!isset($data['precioVenta']) || !is_numeric($data['precioVenta'])) {
            throw new Exception("Precio de venta inválido.");
        }
        if (empty($data['numeroSerie']) || !is_string($data['numeroSerie'])) {
            throw new Exception("Número de serie es obligatorio.");
        }

        // Insert nueva Marca si aplica
        if (!empty($data['nuevaMarca'])) {
            $stmt = $pdo->prepare("INSERT INTO marca (NOMBRE) VALUES (:nombre)");
            $stmt->execute(['nombre' => $data['nuevaMarca']]);
            $idMarca = $pdo->lastInsertId();
        } else if (isset($data['idMarca']) && is_numeric($data['idMarca'])) {
            $idMarca = intval($data['idMarca']);
        } else {
            throw new Exception("Marca no válida.");
        }

        // Insert nuevo Proveedor si aplica
        if (!empty($data['nuevoProveedor'])) {
            $stmt = $pdo->prepare("INSERT INTO proveedor (NOMBRE) VALUES (:nombre)");
            $stmt->execute(['nombre' => $data['nuevoProveedor']]);
            $idProveedor = $pdo->lastInsertId();
        } else if (isset($data['idProveedor']) && is_numeric($data['idProveedor'])) {
            $idProveedor = intval($data['idProveedor']);
        } else {
            throw new Exception("Proveedor no válido.");
        }

        // Insert Producto
        $stmt = $pdo->prepare("
            INSERT INTO producto (
                ID_MARCA, ID_PROVEEDOR, MODELO, 
                PRECIO_DISTRIBUIDOR, PRECIO_DE_VENTA, 
                NUMERO_DE_SERIE, USER_CREATE
            ) VALUES (
                :id_marca, :id_proveedor, :modelo,
                :precio_distribuidor, :precio_venta,
                :numero_serie, :user_create
            )
        ");

        $stmt->execute([
            'id_marca' => $idMarca,
            'id_proveedor' => $idProveedor,
            'modelo' => $data['modelo'],
            'precio_distribuidor' => $data['precioDistribuidor'],
            'precio_venta' => $data['precioVenta'],
            'numero_serie' => $data['numeroSerie'],
            'user_create' => $userCreate
        ]);
        
        $productId = $pdo->lastInsertId();

        $hasWarranty = isset($data['garantia']) && $data['garantia'] === true;
        $fechaInicio = $hasWarranty ? ($data['fechaInicioGarantia'] ?? null) : null;
        $fechaFin = $hasWarranty ? ($data['fechaFinGarantia'] ?? null) : null;

        if ($hasWarranty) {
            if (!$fechaInicio || !$fechaFin) {
                throw new Exception("Fechas de garantía requeridas.");
            }

            if (strtotime($fechaFin) < strtotime($fechaInicio)) {
                throw new Exception("La fecha de fin no puede ser anterior a la fecha de inicio.");
            }

            $stmt = $pdo->prepare("
                INSERT INTO garantia (
                    ID_PRODUCTO, USER_CREATE, FECHA_INICIO, FECHA_FIN
                ) VALUES (
                    :id_producto, :user_create, :fecha_inicio, :fecha_fin
                )
            ");
            $stmt->execute([
                'id_producto' => $productId,
                'user_create' => $userCreate,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin
            ]);
        }
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else if ($action === "RETRIEVEBRANDS") {
    try {
        $stmt = $pdo->query("SELECT ID_MARCA, NOMBRE FROM marca ORDER BY NOMBRE ASC");
        $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($brands);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar marcas", "details" => $e->getMessage()]);
    }
} else if ($action === "RETRIEVEPROVIDERS") {
    try {
        $stmt = $pdo->query("SELECT ID_PROVEEDOR, NOMBRE FROM proveedor ORDER BY NOMBRE ASC");
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($providers);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al recuperar proveedores", "details" => $e->getMessage()]);
    }
} else if ($action === "REMOVE") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;

        if (!$id || !is_numeric($id)) {
            throw new Exception("ID inválido.");
        }

        // Delete warranty first (to avoid orphan constraint issues, if any)
        $stmt = $pdo->prepare("DELETE FROM garantia WHERE ID_PRODUCTO = ?");
        $stmt->execute([$id]);

        // Delete from pedido_producto where this product is linked
        $stmt = $pdo->prepare("DELETE FROM pedido_producto WHERE ID_PRODUCTO = ?");
        $stmt->execute([$id]);

        // Then delete product itself
        $stmt = $pdo->prepare("DELETE FROM producto WHERE ID_PRODUCTO = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }

} else if ($action === "EDIT") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $productId = $data['id'] ?? null;
        $hasWarranty = isset($data['garantia']) && $data['garantia'] === true;
        $fechaInicio = $hasWarranty ? ($data['fechaInicioGarantia'] ?? null) : null;
        $fechaFin = $hasWarranty ? ($data['fechaFinGarantia'] ?? null) : null;

        if (!$productId || !is_numeric($productId)) {
            throw new Exception("ID de producto inválido.");
        }

        // Marca
        if (!empty($data['nuevaMarca'])) {
            $stmt = $pdo->prepare("INSERT INTO marca (NOMBRE) VALUES (:nombre)");
            $stmt->execute(['nombre' => $data['nuevaMarca']]);
            $idMarca = $pdo->lastInsertId();
        } else if (isset($data['idMarca']) && is_numeric($data['idMarca'])) {
            $idMarca = intval($data['idMarca']);
        } else {
            throw new Exception("Marca no válida.");
        }

        // Proveedor
        if (!empty($data['nuevoProveedor'])) {
            $stmt = $pdo->prepare("INSERT INTO proveedor (NOMBRE) VALUES (:nombre)");
            $stmt->execute(['nombre' => $data['nuevoProveedor']]);
            $idProveedor = $pdo->lastInsertId();
        } else if (isset($data['idProveedor']) && is_numeric($data['idProveedor'])) {
            $idProveedor = intval($data['idProveedor']);
        } else {
            throw new Exception("Proveedor no válido.");
        }

        $userModify = $_SESSION['user_id'] ?? null;

        $stmt = $pdo->prepare("
            UPDATE producto SET
                ID_MARCA = :id_marca,
                ID_PROVEEDOR = :id_proveedor,
                MODELO = :modelo,
                PRECIO_DISTRIBUIDOR = :precio_distribuidor,
                PRECIO_DE_VENTA = :precio_venta,
                NUMERO_DE_SERIE = :numero_serie,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_PRODUCTO = :id_producto
        ");

        $stmt->execute([
            'id_marca' => $idMarca,
            'id_proveedor' => $idProveedor,
            'modelo' => $data['modelo'],
            'precio_distribuidor' => $data['precioDistribuidor'],
            'precio_venta' => $data['precioVenta'],
            'numero_serie' => $data['numeroSerie'],
            'user_modify' => $userModify,
            'id_producto' => $productId
        ]);

        if ($hasWarranty) {
        if (!$fechaInicio || !$fechaFin) {
            throw new Exception("Fechas de garantía requeridas.");
        }
        if (strtotime($fechaFin) < strtotime($fechaInicio)) {
            throw new Exception("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        // Check if a garantia record exists
        $stmt = $pdo->prepare("SELECT ID_GARANTIA FROM garantia WHERE ID_PRODUCTO = ?");
        $stmt->execute([$productId]);
        $existingGarantia = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingGarantia) {
            // UPDATE existing garantia
            $stmt = $pdo->prepare("
                UPDATE garantia SET
                    FECHA_INICIO = :inicio,
                    FECHA_FIN = :fin,
                    USER_MODIFY = :user,
                    MODIFIED = NOW()
                WHERE ID_PRODUCTO = :id_producto
            ");
            $stmt->execute([
                'inicio' => $fechaInicio,
                'fin' => $fechaFin,
                'user' => $userModify,
                'id_producto' => $productId
            ]);
        } else {
            // INSERT new garantia
            $stmt = $pdo->prepare("
                INSERT INTO garantia (
                    ID_PRODUCTO, USER_CREATE, FECHA_INICIO, FECHA_FIN
                ) VALUES (
                    :id_producto, :user_create, :fecha_inicio, :fecha_fin
                )
            ");
            $stmt->execute([
                'id_producto' => $productId,
                'user_create' => $userModify,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin
            ]);
        }
    } else {
        // Delete garantía if user unchecked it
        $stmt = $pdo->prepare("
            UPDATE garantia SET USER_MODIFY = :user, MODIFIED = NOW()
            WHERE ID_PRODUCTO = :id_producto
        ");
        $stmt->execute(['user' => $userModify, 'id_producto' => $productId]);

        $stmt = $pdo->prepare("DELETE FROM garantia WHERE ID_PRODUCTO = ?");
        $stmt->execute([$productId]);
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