<?php
session_start();
require_once '../PHP/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Retrieve only persons who are NOT patients (i.e., doctors)
    $stmt = $pdo->prepare("
        SELECT P.ID_PERSONA, P.NOMBRES, P.PATERNO, P.MATERNO
        FROM PERSONA P
        LEFT JOIN PACIENTE PA ON P.ID_PERSONA = PA.ID_PERSONA
        WHERE PA.ID_PERSONA IS NULL
    ");
    $stmt->execute();
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($doctors);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
