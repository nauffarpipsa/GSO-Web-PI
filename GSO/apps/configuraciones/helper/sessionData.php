<?php
session_start();

$response = [
    "userId"    => $_SESSION['employeeCode'] ?? null,
    "userName"  => $_SESSION['userName']  ?? null,
    "email"     => $_SESSION['email']     ?? null,
    "roleId"    => $_SESSION['roleId']    ?? null,
    "isLogged"  => isset($_SESSION['employeeCode'])
];

header('Content-Type: application/json');
echo json_encode($response);
