<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch($method) {
        case 'GET':
            // Get all subjects
            $query = "SELECT * FROM subjects ORDER BY name ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $subjects = $stmt->fetchAll();
            sendSuccess($subjects);
            break;
            
        case 'POST':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name'])) {
                sendError('Subject name is required');
            }
            
            $query = "INSERT INTO subjects (name, description, color) VALUES (:name, :description, :color)";
            $stmt = $db->prepare($query);
            
            $success = $stmt->execute([
                ':name' => $input['name'],
                ':description' => $input['description'] ?? '',
                ':color' => $input['color'] ?? '#6366f1'
            ]);
            
            if ($success) {
                $subjectId = $db->lastInsertId();
                sendSuccess(['id' => $subjectId], 'Subject created successfully');
            } else {
                sendError('Failed to create subject');
            }
            break;
            
        case 'PUT':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id']) || !isset($input['name'])) {
                sendError('Subject ID and name are required');
            }
            
            $query = "UPDATE subjects SET name = :name, description = :description, color = :color, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmt = $db->prepare($query);
            
            $success = $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':description' => $input['description'] ?? '',
                ':color' => $input['color'] ?? '#6366f1'
            ]);
            
            if ($success) {
                sendSuccess([], 'Subject updated successfully');
            } else {
                sendError('Failed to update subject');
            }
            break;
            
        case 'DELETE':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                sendError('Subject ID is required');
            }
            
            // Check if subject has recordings
            $checkQuery = "SELECT COUNT(*) as count FROM recordings WHERE subject_id = :id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->execute([':id' => $input['id']]);
            $count = $checkStmt->fetch()['count'];
            
            if ($count > 0) {
                sendError('Cannot delete subject with existing recordings');
            }
            
            $query = "DELETE FROM subjects WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute([':id' => $input['id']])) {
                sendSuccess([], 'Subject deleted successfully');
            } else {
                sendError('Failed to delete subject');
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
            break;
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError('Internal server error', 500);
}
?>