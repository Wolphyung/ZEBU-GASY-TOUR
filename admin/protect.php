<?php
$admin_user = 'admin';
$admin_pass = 'admin123';

if (!isset($_SERVER['PHP_AUTH_USER']) || 
    $_SERVER['PHP_AUTH_USER'] != $admin_user || 
    $_SERVER['PHP_AUTH_PW'] != $admin_pass) {
    header('WWW-Authenticate: Basic realm="Admin ZGT"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Accès refusé';
    exit;
}
?>