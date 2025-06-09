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
    // Fetch patient data
    $stmt = $pdo->prepare("
        SELECT PA.ID_PACIENTE, P.NOMBRE, P.PATERNO, P.MATERNO, PA.TELEFONO, 
        DATE_FORMAT(PA.FECHA_NACIMIENTO, '%d/%m/%Y') AS FECHA_NACIMIENTO,
        M.NOMBRE AS NOMBRE_MUNICIPIO, E.NOMBRE AS NOMBRE_ESTADO
        FROM PERSONA AS P
        JOIN PACIENTE AS PA ON P.ID_PERSONA = PA.ID_PERSONA
        JOIN MUNICIPIO AS M ON PA.ID_MUNICIPIO = M.ID_MUNICIPIO
        JOIN ESTADO AS E ON M.ID_ESTADO = E.ID_ESTADO
        WHERE PA.ACTIVO = 1;
    ");
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);
} elseif ($action === "REMOVE") {
    parse_str(file_get_contents("php://input"), $_POST);

    if (!isset($_POST['id'])) {
        echo json_encode(["error" => "ID de persona no proporcionado"]);
        exit;
    }

    $idPersona = $_POST['id'];

    try {
        // Update ACTIVO to 0 in PERSONA and PACIENTE tables
        $stmtPersona = $pdo->prepare("
            UPDATE PERSONA SET ACTIVO = 0 WHERE ID_PERSONA = ?
        ");
        $stmtPaciente = $pdo->prepare("
            UPDATE PACIENTE SET ACTIVO = 0 WHERE ID_PERSONA = ?
        ");

        $stmtPersona->execute([$idPersona]);
        $stmtPaciente->execute([$idPersona]);

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error al desactivar la persona: " . $e->getMessage()]);
    }
}
 elseif ($action === "GET" && isset($_GET['id'])) {
    $idPaciente = $_GET['id'];

    $stmt = $pdo->prepare("
        SELECT PA.ID_PACIENTE, P.NOMBRE, P.PATERNO, P.MATERNO, PA.TELEFONO, PA.FECHA_NACIMIENTO, 
               M.ID_MUNICIPIO, M.NOMBRE AS NOMBRE_MUNICIPIO, 
               E.ID_ESTADO, E.NOMBRE AS NOMBRE_ESTADO
        FROM PERSONA AS P
        JOIN PACIENTE AS PA ON P.ID_PERSONA = PA.ID_PERSONA
        JOIN MUNICIPIO AS M ON PA.ID_MUNICIPIO = M.ID_MUNICIPIO
        JOIN ESTADO AS E ON M.ID_ESTADO = E.ID_ESTADO
        WHERE PA.ACTIVO = 1
        AND PA.ID_PACIENTE = ?
    ");
    $stmt->execute([$idPaciente]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($patient) {
        echo json_encode($patient);
    } else {
        echo json_encode(["error" => "Paciente no encontrado"]);
    }
} elseif ($action === "ADD") {
    $data = json_decode(file_get_contents("php://input"), true);

    // Verifica que el campo user_id esté en la sesión
    $userCreate = $_SESSION['user_id'];

    // Insertar en PERSONA con USER_CREATE
    $stmt = $pdo->prepare("
        INSERT INTO PERSONA (NOMBRE, PATERNO, MATERNO, USER_CREATE) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$data['nombre'], $data['paterno'], $data['materno'], $userCreate]);

    // Obtener el ID generado
    $idPersona = $pdo->lastInsertId();

    // Insertar en PACIENTE
    $stmtPaciente = $pdo->prepare("
        INSERT INTO PACIENTE (ID_PERSONA, TELEFONO, FECHA_NACIMIENTO, ID_MUNICIPIO) 
        VALUES (?, ?, ?, ?)
    ");
    $stmtPaciente->execute([$idPersona, $data['telefono'], $data['fecha_nacimiento'], $data['id_municipio']]);

    echo json_encode(["success" => true]);
    
} elseif ($action === "EDIT") {
    $idPaciente = $_GET['id'];
    $data = json_decode(file_get_contents("php://input"), true);

    $userModify = $_SESSION['user_id'];

    // Actualizar PERSONA con USER_MODIFY y MODIFIED
    $stmt = $pdo->prepare("
        UPDATE PERSONA 
        SET NOMBRE = ?, PATERNO = ?, MATERNO = ?, USER_MODIFY = ?, MODIFIED = NOW()
        WHERE ID_PERSONA = (SELECT ID_PERSONA FROM PACIENTE WHERE ID_PACIENTE = ?)
    ");
    $stmt->execute([
        $data['nombre'],
        $data['paterno'],
        $data['materno'],
        $userModify,
        $idPaciente
    ]);

    // Actualizar PACIENTE
    $stmtPaciente = $pdo->prepare("
        UPDATE PACIENTE 
        SET TELEFONO = ?, FECHA_NACIMIENTO = ?, ID_MUNICIPIO = ? 
        WHERE ID_PACIENTE = ?
    ");
    $stmtPaciente->execute([
        $data['telefono'],
        $data['fecha_nacimiento'],
        $data['id_municipio'],
        $idPaciente
    ]);

    echo json_encode(["success" => true]);
}


else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>
