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

        // Delete product relations first
        $stmtRel = $pdo->prepare("DELETE FROM pedido_producto WHERE ID_PEDIDO = ?");
        $stmtRel->execute([$id]);

        // Now delete the pedido itself
        $stmt = $pdo->prepare("DELETE FROM pedido WHERE ID_PEDIDO = ?");
        $stmt->execute([$id]);

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else if ($action === "REMOVEPRODUCTO") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id_producto = $data['id_producto'] ?? null;
        $id_pedido = $data['id_pedido'] ?? null;

        if (!$id_producto || !$id_pedido || !is_numeric($id_producto) || !is_numeric($id_pedido)) {
            throw new Exception("Datos inválidos.");
        }

        $stmt = $pdo->prepare("DELETE FROM pedido_producto WHERE ID_PRODUCTO = ? AND ID_PEDIDO = ?");
        $stmt->execute([$id_producto, $id_pedido]);

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

        // Validate dates
        if (empty($data['fechaPedido'])) {
            throw new Exception("La fecha de pedido es obligatoria.");
        }

        $fechaPedido = $data['fechaPedido'];
        $fechaEntrega = $data['fechaEntrega'] ?? null;
        $productos = $data['productos'] ?? []; // array of product IDs
        $isNewProduct = empty($productos); // true if creating a product inline

        $productId = null;

        if ($isNewProduct) {
            // --- Insert nueva Marca ---
            if (!empty($data['nuevaMarca'])) {
                $stmt = $pdo->prepare("INSERT INTO marca (NOMBRE) VALUES (:nombre)");
                $stmt->execute(['nombre' => $data['nuevaMarca']]);
                $idMarca = $pdo->lastInsertId();
            } elseif (!empty($data['idMarca']) && is_numeric($data['idMarca'])) {
                $idMarca = intval($data['idMarca']);
            } else {
                throw new Exception("Marca no válida.");
            }

            // --- Insert nuevo Proveedor ---
            if (!empty($data['nuevoProveedor'])) {
                $stmt = $pdo->prepare("INSERT INTO proveedor (NOMBRE) VALUES (:nombre)");
                $stmt->execute(['nombre' => $data['nuevoProveedor']]);
                $idProveedor = $pdo->lastInsertId();
            } elseif (!empty($data['idProveedor']) && is_numeric($data['idProveedor'])) {
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
            $productos = [$productId]; // wrap as array

            // --- Insert garantía if present ---
            if (!empty($data['garantia']) && $data['garantia'] === true) {
                $fechaInicio = $data['fechaInicioGarantia'] ?? null;
                $fechaFin = $data['fechaFinGarantia'] ?? null;

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
        }

        // --- Insert pedido ---
        $stmt = $pdo->prepare("
            INSERT INTO pedido (
                USER_CREATE, FECHA_DE_PEDIDO, FECHA_DE_ENTREGA
            ) VALUES (
                :user_create, :fecha_pedido, :fecha_entrega
            )
        ");
        $stmt->execute([
            'user_create' => $userCreate,
            'fecha_pedido' => $fechaPedido,
            'fecha_entrega' => $fechaEntrega
        ]);

        $idPedido = $pdo->lastInsertId();

        // --- Relacionar productos con el pedido ---
        foreach ($productos as $idProd) {
            if (!is_numeric($idProd)) continue;
            $stmt = $pdo->prepare("
                INSERT INTO pedido_producto (ID_PEDIDO, ID_PRODUCTO)
                VALUES (:id_pedido, :id_producto)
            ");
            $stmt->execute([
                'id_pedido' => $idPedido,
                'id_producto' => $idProd
            ]);
        }

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else if ($action === "EDIT") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $idPedido = $data['idPedido'] ?? null;
        $userModify = $_SESSION['user_id'] ?? null;

        if (!$userModify) {
            echo json_encode(["error" => "Usuario no autenticado"]);
            exit;
        }

        if (!$idPedido || !is_numeric($idPedido)) {
            throw new Exception("ID de pedido inválido.");
        }

        if (empty($data['fechaPedido'])) {
            throw new Exception("La fecha de pedido es obligatoria.");
        }

        $fechaPedido = $data['fechaPedido'];
        $fechaEntrega = $data['fechaEntrega'] ?? null;

        if ($fechaEntrega && strtotime($fechaEntrega) < strtotime($fechaPedido)) {
            throw new Exception("La fecha de entrega no puede ser anterior a la fecha de pedido.");
        }

        $stmt = $pdo->prepare("
            UPDATE pedido
            SET 
                FECHA_DE_PEDIDO = :fecha_pedido,
                FECHA_DE_ENTREGA = :fecha_entrega,
                USER_MODIFY = :user_modify,
                MODIFIED = NOW()
            WHERE ID_PEDIDO = :id_pedido
        ");
        $stmt->execute([
            'fecha_pedido' => $fechaPedido,
            'fecha_entrega' => $fechaEntrega,
            'user_modify' => $userModify,
            'id_pedido' => $idPedido
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