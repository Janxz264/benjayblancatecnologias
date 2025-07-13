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
                ma.NOMBRE AS NOMBRE_MARCA,
                pv.NOMBRE AS NOMBRE_PROVEEDOR
            FROM pedido pe
            LEFT JOIN pedido_producto pp ON pe.ID_PEDIDO = pp.ID_PEDIDO
            LEFT JOIN producto pr ON pr.ID_PRODUCTO = pp.ID_PRODUCTO
            LEFT JOIN marca ma ON ma.ID_MARCA = pr.ID_MARCA
            LEFT JOIN proveedor pv ON pv.ID_PROVEEDOR = pr.ID_PROVEEDOR
            ORDER BY pe.ID_PEDIDO
        ");

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $row) {
            $pedidoId = $row['ID_PEDIDO'];

            if (!isset($result[$pedidoId])) {
                $result[$pedidoId] = [
                    'ID_PEDIDO' => $pedidoId,
                    'FECHA_DE_PEDIDO' => $row['FECHA_DE_PEDIDO'],
                    'FECHA_DE_ENTREGA' => $row['FECHA_DE_ENTREGA'],
                    'PRODUCTOS' => []
                ];
            }

            $producto = [
                'ID_PRODUCTO' => $row['ID_PRODUCTO'],
                'MODELO' => $row['MODELO'],
                'PRECIO_DISTRIBUIDOR' => $row['PRECIO_DISTRIBUIDOR'],
                'PRECIO_DE_VENTA' => $row['PRECIO_DE_VENTA'],
                'NUMERO_DE_SERIE' => $row['NUMERO_DE_SERIE'],
                'ID_MARCA' => $row['ID_MARCA'],
                'NOMBRE_MARCA' => $row['NOMBRE_MARCA'],
                'NOMBRE_PROVEEDOR' => $row['NOMBRE_PROVEEDOR']
            ];

            $result[$pedidoId]['PRODUCTOS'][] = $producto;
        }

        echo json_encode(array_values($result));
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

} else if ($action === "ADD") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $userCreate = $_SESSION['user_id'] ?? null;

        if (!$userCreate) {
            echo json_encode(["error" => "Usuario no autenticado"]);
            exit;
        }

        // Validate pedido dates
        if (empty($data['fechaPedido'])) {
            throw new Exception("La fecha de pedido es obligatoria.");
        }

        $fechaPedido = $data['fechaPedido'];
        $fechaEntrega = $data['fechaEntrega'] ?? null;

        // Determine product source
        $isNewProduct = !isset($data['idProducto']);
        $productId = null;

        if ($isNewProduct) {
            // --- Insert nueva Marca ---
            if (!empty($data['nuevaMarca'])) {
                $stmt = $pdo->prepare("INSERT INTO marca (NOMBRE) VALUES (:nombre)");
                $stmt->execute(['nombre' => $data['nuevaMarca']]);
                $idMarca = $pdo->lastInsertId();
            } else if (isset($data['idMarca']) && is_numeric($data['idMarca'])) {
                $idMarca = intval($data['idMarca']);
            } else {
                throw new Exception("Marca no válida.");
            }

            // --- Insert nuevo Proveedor ---
            if (!empty($data['nuevoProveedor'])) {
                $stmt = $pdo->prepare("INSERT INTO proveedor (NOMBRE) VALUES (:nombre)");
                $stmt->execute(['nombre' => $data['nuevoProveedor']]);
                $idProveedor = $pdo->lastInsertId();
            } else if (isset($data['idProveedor']) && is_numeric($data['idProveedor'])) {
                $idProveedor = intval($data['idProveedor']);
            } else {
                throw new Exception("Proveedor no válido.");
            }

            // --- Validate producto fields ---
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

            // --- Insert producto ---
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

            // --- Insert garantía if present ---
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

        } else {
            // --- Use existing producto ---
            $productId = intval($data['idProducto'] ?? 0);
            if (!$productId) {
                throw new Exception("ID de producto inválido.");
            }
        }

        // --- Insert pedido ---
        $stmt = $pdo->prepare("
            INSERT INTO pedido (
                ID_PRODUCTO, USER_CREATE, 
                FECHA_DE_PEDIDO, FECHA_DE_ENTREGA
            ) VALUES (
                :id_producto, :user_create, 
                :fecha_pedido, :fecha_entrega
            )
        ");
        $stmt->execute([
            'id_producto' => $productId,
            'user_create' => $userCreate,
            'fecha_pedido' => $fechaPedido,
            'fecha_entrega' => $fechaEntrega
        ]);

        echo json_encode(["success" => true]);

    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}


else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>