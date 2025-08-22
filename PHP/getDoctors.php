<?php
session_start();
require_once '../PHP/db_connect.php';

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

try {
    $stmt = $pdo->prepare("
        SELECT P.ID_PERSONA, P.NOMBRE, P.PATERNO, P.MATERNO
        FROM PERSONA P
        WHERE P.ACTIVO = 1
        AND NOT EXISTS (
            SELECT 1 FROM PACIENTE PA WHERE PA.ID_PERSONA = P.ID_PERSONA
        )
        ORDER BY P.PATERNO, P.MATERNO, P.NOMBRE"
        );
    $stmt->execute();
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($doctors);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>