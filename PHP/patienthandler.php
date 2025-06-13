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
        M.NOMBRE AS NOMBRE_MUNICIPIO, E.NOMBRE AS NOMBRE_ESTADO,
        CASE
        WHEN PA.SEXO = 0 THEN 'Mujer'
        WHEN PA.SEXO = 1 THEN 'Hombre'
        ELSE 'Desconocido'
        END AS SEXO
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
        SELECT 
            PA.ID_PACIENTE, 
            P.NOMBRE, P.PATERNO, P.MATERNO, 
            PA.TELEFONO, PA.FECHA_NACIMIENTO, 
            M.ID_MUNICIPIO, M.NOMBRE AS NOMBRE_MUNICIPIO, 
            E.ID_ESTADO, E.NOMBRE AS NOMBRE_ESTADO,
            CASE
                WHEN PA.SEXO = 0 THEN 'Mujer'
                WHEN PA.SEXO = 1 THEN 'Hombre'
                ELSE 'Desconocido'
            END AS SEXO,
            PA.ID_SEGURO,
            S.NOMBRE AS NOMBRE_SEGURO,
            PA.ID_DOCTOR_REFERENTE,
            DR.NOMBRE AS NOMBRE_DOCTOR,
            DR.PATERNO AS PATERNO_DOCTOR,
            DR.MATERNO AS MATERNO_DOCTOR
        FROM PERSONA AS P
        JOIN PACIENTE AS PA ON P.ID_PERSONA = PA.ID_PERSONA
        JOIN MUNICIPIO AS M ON PA.ID_MUNICIPIO = M.ID_MUNICIPIO
        JOIN ESTADO AS E ON M.ID_ESTADO = E.ID_ESTADO
        LEFT JOIN SEGURO AS S ON PA.ID_SEGURO = S.ID_SEGURO
        LEFT JOIN PERSONA AS DR ON PA.ID_DOCTOR_REFERENTE = DR.ID_PERSONA
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
}
 elseif ($action === "ADD") {
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
        INSERT INTO PACIENTE (ID_PERSONA, TELEFONO, FECHA_NACIMIENTO, ID_MUNICIPIO, SEXO) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmtPaciente->execute([$idPersona, $data['telefono'], $data['fecha_nacimiento'], $data['id_municipio'], $data['sexo']]);

    // Al final del bloque ADD, justo después de insertar en PACIENTE
    $idPaciente = $pdo->lastInsertId();

    // Asociar o crear SEGURO
    if (isset($data['id_seguro'])) {
        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_SEGURO = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$data['id_seguro'], $idPaciente]);
    } elseif (isset($data['new_seguro'])) {
        $stmt = $pdo->prepare("INSERT INTO SEGURO (NOMBRE) VALUES (?)");
        $stmt->execute([$data['new_seguro']]);
        $newSeguroId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_SEGURO = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$newSeguroId, $idPaciente]);
    }

    // Asociar o crear MÉDICO REFERENTE
    if (isset($data['id_doctor_referente'])) {
        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_DOCTOR_REFERENTE = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$data['id_doctor_referente'], $idPaciente]);
    } elseif (isset($data['new_doctor'])) {
        $doctor = $data['new_doctor'];

        // Insertar persona
        $stmt = $pdo->prepare("INSERT INTO PERSONA (NOMBRE, PATERNO, MATERNO, USER_CREATE) VALUES (?, ?, ?, ?)");
        $stmt->execute([$doctor['nombre'], $doctor['paterno'], $doctor['materno'], $userCreate]);
        $idPersonaDoctor = $pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_DOCTOR_REFERENTE = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$idPersonaDoctor, $idPaciente]);
    }

    echo json_encode(["success" => true]);
    
} elseif ($action === "EDIT") {
    $idPaciente = $_GET['id'];
    $data = json_decode(file_get_contents("php://input"), true);
    $userModify = $_SESSION['user_id'];

    // Actualizar PERSONA
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

    // Actualizar PACIENTE (básico)
    $stmtPaciente = $pdo->prepare("
        UPDATE PACIENTE 
        SET TELEFONO = ?, FECHA_NACIMIENTO = ?, ID_MUNICIPIO = ?, SEXO = ?
        WHERE ID_PACIENTE = ?
    ");
    $stmtPaciente->execute([
        $data['telefono'],
        $data['fecha_nacimiento'],
        $data['id_municipio'],
        $data['sexo'],
        $idPaciente
    ]);

    //  SEGURO
    if (array_key_exists('id_seguro', $data)) {
        if ($data['id_seguro'] === null) {
            // Quitar seguro
            $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_SEGURO = NULL WHERE ID_PACIENTE = ?");
            $stmt->execute([$idPaciente]);
        } else {
            // Asignar seguro existente
            $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_SEGURO = ? WHERE ID_PACIENTE = ?");
            $stmt->execute([$data['id_seguro'], $idPaciente]);
        }
    } elseif (isset($data['new_seguro'])) {
        // Crear y asignar nuevo seguro
        $stmt = $pdo->prepare("INSERT INTO SEGURO (NOMBRE) VALUES (?)");
        $stmt->execute([$data['new_seguro']]);
        $newSeguroId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_SEGURO = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$newSeguroId, $idPaciente]);
    }

    //  MÉDICO REFERENTE
    if (array_key_exists('id_doctor_referente', $data)) {
        if ($data['id_doctor_referente'] === null) {
            // Quitar médico
            $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_DOCTOR_REFERENTE = NULL WHERE ID_PACIENTE = ?");
            $stmt->execute([$idPaciente]);
        } else {
            // Asignar médico existente
            $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_DOCTOR_REFERENTE = ? WHERE ID_PACIENTE = ?");
            $stmt->execute([$data['id_doctor_referente'], $idPaciente]);
        }
    } elseif (isset($data['new_doctor'])) {
        // Crear nuevo doctor
        $doctor = $data['new_doctor'];
        $stmt = $pdo->prepare("INSERT INTO PERSONA (NOMBRE, PATERNO, MATERNO, USER_CREATE) VALUES (?, ?, ?, ?)");
        $stmt->execute([$doctor['nombre'], $doctor['paterno'], $doctor['materno'], $userModify]);
        $idPersonaDoctor = $pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO DOCTOR_REFERENTE (ID_PERSONA) VALUES (?)");
        $stmt->execute([$idPersonaDoctor]);
        $idDoctorReferente = $pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE PACIENTE SET ID_DOCTOR_REFERENTE = ? WHERE ID_PACIENTE = ?");
        $stmt->execute([$idDoctorReferente, $idPaciente]);
    }

    echo json_encode(["success" => true]);
}

elseif ($action === "GET_ASSURANCES") {
    $stmt = $pdo->prepare("SELECT ID_SEGURO, NOMBRE FROM SEGURO ORDER BY NOMBRE");
    $stmt->execute();
    $seguros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($seguros);
}
elseif ($action === "GET_DOCTORS") {
    $stmt = $pdo->prepare("
        SELECT P.ID_PERSONA, P.NOMBRE, P.PATERNO, P.MATERNO
        FROM PERSONA P
        WHERE P.ID_PERSONA NOT IN (
            SELECT ID_PERSONA FROM PACIENTE WHERE ACTIVO = 1
        )
        ORDER BY P.NOMBRE, P.PATERNO, P.MATERNO
    ");
    $stmt->execute();
    $doctores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($doctores);
}

else {
    echo json_encode(["error" => "Acción no válida"]);
}
?>
