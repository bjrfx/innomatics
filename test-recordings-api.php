<?php
// Test recordings API
echo "<h2>Testing Recordings API</h2>";

// Test GET request
echo "<h3>Testing GET /api/recordings.php</h3>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/innomatics/api/recordings.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<strong>HTTP Code:</strong> $httpCode<br>";
echo "<strong>Response:</strong><br>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// Test database connection and tables
echo "<h3>Testing Database Tables</h3>";
try {
    require_once 'api/config.php';
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if recordings table exists
    $query = "SHOW TABLES LIKE 'recordings'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $recordingsTable = $stmt->fetch();
    
    echo "<strong>recordings table exists:</strong> " . ($recordingsTable ? "Yes" : "No") . "<br>";
    
    // Check if recordings_with_subject view exists
    $query = "SHOW TABLES LIKE 'recordings_with_subject'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $viewExists = $stmt->fetch();
    
    echo "<strong>recordings_with_subject view exists:</strong> " . ($viewExists ? "Yes" : "No") . "<br>";
    
    if (!$viewExists) {
        // Check if subjects table exists
        $query = "SHOW TABLES LIKE 'subjects'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $subjectsTable = $stmt->fetch();
        
        echo "<strong>subjects table exists:</strong> " . ($subjectsTable ? "Yes" : "No") . "<br>";
        
        if ($recordingsTable && $subjectsTable) {
            echo "<p style='color: orange;'>Tables exist but view is missing. This might be the issue.</p>";
        }
    }
    
    // Try to count recordings
    if ($recordingsTable) {
        $query = "SELECT COUNT(*) as count FROM recordings";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $count = $stmt->fetch();
        echo "<strong>Total recordings in database:</strong> " . $count['count'] . "<br>";
    }
    
} catch (Exception $e) {
    echo "<strong>Database Error:</strong> " . $e->getMessage() . "<br>";
}
?>