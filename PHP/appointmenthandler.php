<?php
session_start();
require_once '../PHP/db_connect.php';

ob_start();
header('Content-Type: application/json; charset=utf-8');

// Asegurar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === "ADD") {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar datos requeridos
    if (
        empty($data['id_paciente']) || 
        empty($data['fecha_hora']) || 
        empty($data['motivo'])
    ) {
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO CITAS (ID_PACIENTE, USER_CREATE, FECHA_HORA, MOTIVO_DE_CONSULTA)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['id_paciente'],
            $_SESSION['user_id'],
            $data['fecha_hora'],
            $data['motivo']
        ]);

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al guardar la cita: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>
