<?php
require_once '../PHP/db_connect.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Validate request type
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

// Retrieve POST parameters
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

error_log("Debugging Login: Incoming username = " . $username);

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Both fields are required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT user, pass FROM usuario WHERE user = :username");
    $stmt->execute(["username" => $username]);
    $user = $stmt->fetch();

    error_log("Fetched user data: " . print_r($user, true)); // Debugging

    // Ensure query result is valid before using keys
    if ($user && isset($user['user']) && isset($user['pass']) && password_verify($password, $user['pass'])) {
        session_start();
        $_SESSION['user_id'] = $user['user'];

        echo json_encode(["success" => true, "message" => "Login successful"]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid username or password"]);
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
