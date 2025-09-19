<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug Recordings API</h2>";

echo "<h3>1. Testing config.php</h3>";
try {
    require_once 'api/config.php';
    echo "✅ config.php loaded successfully<br>";
} catch (Exception $e) {
    echo "❌ config.php error: " . $e->getMessage() . "<br>";
    exit;
}

echo "<h3>2. Testing Database Connection</h3>";
try {
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Database connection successful<br>";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
    exit;
}

echo "<h3>3. Testing recordings.php step by step</h3>";

try {
    // Simulate what recordings.php does
    $method = 'GET';
    echo "Request method: $method<br>";
    
    if ($method === 'GET') {
        echo "Executing GET request logic...<br>";
        
        // Test the exact query from recordings.php
        $query = "SELECT * FROM recordings_with_subject ORDER BY subject_name, upload_date DESC";
        echo "Query: $query<br>";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo "✅ Query executed successfully<br>";
        
        $recordings = $stmt->fetchAll();
        echo "✅ Fetched " . count($recordings) . " recordings<br>";
        
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
        echo "✅ Data grouped successfully<br>";
        echo "Found " . count($data) . " subject groups<br>";
        
        // Test JSON encoding
        $json = json_encode($data);
        if ($json === false) {
            echo "❌ JSON encoding failed: " . json_last_error_msg() . "<br>";
        } else {
            echo "✅ JSON encoding successful<br>";
        }
        
        echo "<h3>4. Sample Output</h3>";
        echo "<pre>" . htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT)) . "</pre>";
    }
    
} catch (Exception $e) {
    echo "❌ Error during processing: " . $e->getMessage() . "<br>";
    echo "Stack trace: " . $e->getTraceAsString() . "<br>";
}
?>