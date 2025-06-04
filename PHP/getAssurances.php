<?php
session_start();
require_once '../PHP/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $stmt = $pdo->prepare("
        SELECT ID_SEGURO, NOMBRE FROM SEGURO ORDER BY NOMBRE
    ");
    $stmt->execute();
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($doctors);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
