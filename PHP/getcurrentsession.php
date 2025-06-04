<?php
session_start();
require_once '../PHP/db_connect.php';

header('Content-Type: application/json');

$date = new DateTime("now", new DateTimeZone("America/Mexico_City"));
$date->modify("-1 hour"); // Subtract 1 hour manually

$formatter = new IntlDateFormatter('es_ES', IntlDateFormatter::FULL, IntlDateFormatter::SHORT, 'America/Mexico_City', IntlDateFormatter::GREGORIAN, "EEEE, d 'de' MMMM 'de' yyyy");

$formattedDate = ucfirst($formatter->format($date));

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "user" => $_SESSION['user_id'],
        "datetime" => $formattedDate
    ]);
} else {
    echo json_encode(["error" => "No user logged in"]);
}
?>
