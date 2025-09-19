<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Minimal Recordings API Test</h2>";

// Include the actual recordings.php content piece by piece
try {
    require_once 'api/config.php';
    echo "✅ Config loaded<br>";
    
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Database connected<br>";
    
    $method = $_SERVER['REQUEST_METHOD'];
    echo "Method: $method<br>";
    
    if ($method === 'GET') {
        // Exact code from recordings.php
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
        
        $data = array_values($groupedRecordings);
        
        // This is what recordings.php should return
        sendSuccess($data);
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "<br>";
    sendError('Internal server error', 500);
}
?>