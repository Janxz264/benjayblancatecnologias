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

if ($action === "VIEWCURRENT") {
    // Fetch appointment data
    $stmt = $pdo->prepare("
SELECT 
    c.ID_CITA, 
    c.ID_PACIENTE, 
    c.FECHA_HORA, 
    c.MOTIVO_DE_CONSULTA,
    CONCAT(p.NOMBRE, ' ', p.PATERNO, ' ', p.MATERNO) AS NOMBRE_COMPLETO
FROM cita c
JOIN paciente pa ON pa.ID_PACIENTE = c.ID_PACIENTE
JOIN persona p ON p.ID_PERSONA = pa.ID_PERSONA
WHERE DATE(c.FECHA_HORA) >= CURDATE()
AND C.OBSERVACIONES IS NULL
AND PA.ACTIVO = 1
ORDER BY c.FECHA_HORA ASC;
    ");
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);
}
elseif ($action === "VIEWPAST") {
    // Fetch appointment data
    $stmt = $pdo->prepare("
    SELECT 
    c.ID_CITA, 
    c.ID_PACIENTE, 
    c.FECHA_HORA, 
    c.MOTIVO_DE_CONSULTA,
    CONCAT(p.NOMBRE, ' ', p.PATERNO, ' ', p.MATERNO) AS NOMBRE_COMPLETO
    FROM cita c
    JOIN paciente pa ON pa.ID_PACIENTE = c.ID_PACIENTE
    JOIN persona p ON p.ID_PERSONA = pa.ID_PERSONA
    WHERE DATE(c.FECHA_HORA) < CURDATE()
    OR (DATE(c.FECHA_HORA) = CURDATE() AND c.OBSERVACIONES IS NOT NULL)
    ORDER BY c.FECHA_HORA DESC;
    ");
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);
}
elseif ($action === "ADD") {
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
            INSERT INTO CITA (ID_PACIENTE, USER_CREATE, FECHA_HORA, MOTIVO_DE_CONSULTA)
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
} elseif ($_GET['action'] === 'ADDFIRSTTIME') {
    $data = json_decode(file_get_contents("php://input"), true);
    $nombre = $data['nombre'];
    $paterno = $data['paterno'];
    $materno = $data['materno'];
    $fechaHora = $data['fecha_hora'];
    $motivo = $data['motivo'];

    try {
        $pdo->beginTransaction();

        // Insertar en PERSONA
        $stmt = $pdo->prepare("INSERT INTO PERSONA (NOMBRE, PATERNO, MATERNO, USER_CREATE) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nombre, $paterno, $materno, $_SESSION['user_id']]);
        $idPersona = $pdo->lastInsertId();

        // Insertar en PACIENTE
        $stmt = $pdo->prepare("INSERT INTO PACIENTE (ID_PERSONA) VALUES (?)");
        $stmt->execute([$idPersona]);
        $idPaciente = $pdo->lastInsertId();

        // Insertar en CITAS
        $stmt = $pdo->prepare("INSERT INTO CITA (ID_PACIENTE, FECHA_HORA, MOTIVO, USER_CREATE) VALUES (?, ?, ?, ?)");
        $stmt->execute([$idPaciente, $fechaHora, $motivo, $_SESSION['user_id']]);

        $pdo->commit();

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

elseif ($action === "REMOVE") {
    parse_str(file_get_contents("php://input"), $_POST);
    if (!isset($_POST['id'])) {
        echo json_encode(["error" => "ID de cita no proporcionado"]);
        exit;
    }

    $idCita = $_POST['id'];

    $stmtCita = $pdo->prepare("DELETE FROM CITA WHERE ID_CITA = ?");
    $stmtCita->execute([$idCita]);

    echo json_encode(["success" => true]);
} 
elseif ($action === "FINISH") {
        $idCita = $_GET['id'];
        $data = json_decode(file_get_contents("php://input"), true);

        $userModify = $_SESSION['user_id'];

        // Actualizar PERSONA con USER_MODIFY y MODIFIED
        $stmt = $pdo->prepare("
            UPDATE CITA 
            SET OBSERVACIONES = ?, USER_MODIFY = ?, MODIFIED = NOW() WHERE ID_CITA = ? 
        ");
        $stmt->execute([
            $data['observaciones'],
            $userModify,
            $idCita
        ]);

        echo json_encode(["success" => true]);
}
elseif ($action === "GET" && isset($_GET['id'])) {
    $idCita = $_GET['id'];

    $stmt = $pdo->prepare("
        SELECT 
            c.ID_CITA, 
            c.ID_PACIENTE, 
            c.FECHA_HORA, 
            c.MOTIVO_DE_CONSULTA,
            CONCAT(p.NOMBRE, ' ', p.PATERNO, ' ', p.MATERNO) AS NOMBRE_COMPLETO,
            e.NOMBRE AS ESTADO,
            m.NOMBRE AS MUNICIPIO,
            pa.TELEFONO,
            c.OBSERVACIONES,
            CASE
                WHEN pa.SEXO = 0 THEN 'Mujer'
                WHEN pa.SEXO = 1 THEN 'Hombre'
                ELSE 'Desconocido'
            END AS SEXO,
            pa.FECHA_NACIMIENTO,
            s.NOMBRE AS SEGURO,
            CASE 
                WHEN d.ID_PERSONA IS NOT NULL 
                THEN CONCAT(d.NOMBRE, ' ', d.PATERNO, ' ', d.MATERNO) 
                ELSE 'No registrado'
            END AS DOCTOR_REFERENTE
        FROM cita c
        JOIN paciente pa ON pa.ID_PACIENTE = c.ID_PACIENTE
        JOIN persona p ON p.ID_PERSONA = pa.ID_PERSONA
        JOIN municipio m ON pa.ID_MUNICIPIO = m.ID_MUNICIPIO
        JOIN estado e ON e.ID_ESTADO = m.ID_ESTADO
        LEFT JOIN seguro s ON s.ID_SEGURO = pa.ID_SEGURO
        LEFT JOIN persona d ON d.ID_PERSONA = pa.ID_DOCTOR_REFERENTE
        WHERE c.ID_CITA = ?
    ");
    $stmt->execute([$idCita]);
    $cita = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($cita ?: ["error" => "Cita no encontrada"]);
}

elseif ($action === "EDIT") {
    $idCita = intval($_GET['id']); // Sanitize ID
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id_paciente'], $data['fecha_hora'], $data['motivo'])) {
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE CITA 
        SET ID_PACIENTE = ?, FECHA_HORA = ?, MOTIVO_DE_CONSULTA = ?, USER_MODIFY = ?, MODIFIED = NOW()
        WHERE ID_CITA = ?
    ");

    if ($stmt->execute([$data['id_paciente'], $data['fecha_hora'], $data['motivo'], $_SESSION['user_id'], $idCita])) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Error al actualizar la cita"]);
    }
}

else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>