<?php
session_start();
require_once '../PHP/db_connect.php';

ob_start(); // Prevent unwanted output
header('Content-Type: application/json; charset=utf-8');

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

// Retrieve input data safely
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["error" => "Invalid JSON received"]);
    exit;
}

$currentPassword = $data['currentPassword'] ?? null;
$newPassword = $data['newPassword'] ?? null;

if (!$currentPassword || !$newPassword) {
    echo json_encode(["error" => "Todos los campos son obligatorios"]);
    exit;
}

// Fetch stored password hash from DB
$stmt = $pdo->prepare("SELECT pass FROM usuario WHERE user = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['pass'])) { // Corrected field reference
    echo json_encode(["error" => "La contraseña actual es incorrecta"]);
    exit;
}

// Update password in DB securely
$newHash = password_hash($newPassword, PASSWORD_BCRYPT);
$updateStmt = $pdo->prepare("UPDATE usuario SET pass = ?, modified=now() WHERE user = ?");
$updateStmt->execute([$newHash, $_SESSION['user_id']]);

echo json_encode(["success" => true]);
?>
