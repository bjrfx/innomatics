<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch($method) {
        case 'GET':
            // Get all recordings grouped by subject
            $query = "SELECT * FROM recordings_with_subject ORDER BY subject_name, upload_date DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $recordings = $stmt->fetchAll();
            $groupedRecordings = [];
            
            foreach($recordings as $recording) {
                $subjectName = $recording['subject_name'];
                if (!isset($groupedRecordings[$subjectName])) {
                    $groupedRecordings[$subjectName] = [
                        'subject' => [
                            'id' => $recording['subject_id'],
                            'name' => $recording['subject_name'],
                            'description' => $recording['subject_description'],
                            'color' => $recording['subject_color']
                        ],
                        'recordings' => []
                    ];
                }
                
                $groupedRecordings[$subjectName]['recordings'][] = [
                    'id' => $recording['id'],
                    'title' => $recording['title'],
                    'youtube_url' => $recording['youtube_url'],
                    'youtube_video_id' => $recording['youtube_video_id'],
                    'description' => $recording['description'],
                    'duration' => $recording['duration'],
                    'upload_date' => $recording['upload_date'],
                    'thumbnail_url' => $recording['thumbnail_url'],
                    'view_count' => $recording['view_count']
                ];
            }
            
            sendSuccess(array_values($groupedRecordings));
            break;
            
        case 'POST':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['subject_id']) || !isset($input['title']) || !isset($input['youtube_url'])) {
                sendError('Missing required fields: subject_id, title, youtube_url');
            }
            
            $videoId = extractYouTubeVideoId($input['youtube_url']);
            if (!$videoId) {
                sendError('Invalid YouTube URL');
            }
            
            $youtubeData = getYouTubeVideoData($videoId);
            
            $query = "INSERT INTO recordings (subject_id, title, youtube_url, youtube_video_id, description, duration, upload_date, thumbnail_url) 
                     VALUES (:subject_id, :title, :youtube_url, :youtube_video_id, :description, :duration, :upload_date, :thumbnail_url)";
            
            $stmt = $db->prepare($query);
            
            $success = $stmt->execute([
                ':subject_id' => $input['subject_id'],
                ':title' => $input['title'],
                ':youtube_url' => $input['youtube_url'],
                ':youtube_video_id' => $videoId,
                ':description' => $input['description'] ?? '',
                ':duration' => $input['duration'] ?? null,
                ':upload_date' => $input['upload_date'] ?? date('Y-m-d'),
                ':thumbnail_url' => $youtubeData['thumbnail_url']
            ]);
            
            if ($success) {
                $recordingId = $db->lastInsertId();
                sendSuccess(['id' => $recordingId], 'Recording added successfully');
            } else {
                sendError('Failed to add recording');
            }
            break;
            
        case 'PUT':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                sendError('Recording ID is required');
            }
            
            $updateFields = [];
            $params = [':id' => $input['id']];
            
            $allowedFields = ['subject_id', 'title', 'youtube_url', 'description', 'duration', 'upload_date'];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = :$field";
                    $params[":$field"] = $input[$field];
                }
            }
            
            if (isset($input['youtube_url'])) {
                $videoId = extractYouTubeVideoId($input['youtube_url']);
                if ($videoId) {
                    $youtubeData = getYouTubeVideoData($videoId);
                    $updateFields[] = "youtube_video_id = :youtube_video_id";
                    $updateFields[] = "thumbnail_url = :thumbnail_url";
                    $params[':youtube_video_id'] = $videoId;
                    $params[':thumbnail_url'] = $youtubeData['thumbnail_url'];
                }
            }
            
            if (empty($updateFields)) {
                sendError('No fields to update');
            }
            
            $query = "UPDATE recordings SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                sendSuccess([], 'Recording updated successfully');
            } else {
                sendError('Failed to update recording');
            }
            break;
            
        case 'DELETE':
            requireAdminAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                sendError('Recording ID is required');
            }
            
            $query = "DELETE FROM recordings WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute([':id' => $input['id']])) {
                sendSuccess([], 'Recording deleted successfully');
            } else {
                sendError('Failed to delete recording');
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