<?php
// Test PHP and Database Connection
echo "<h2>PHP Test</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Current Time: " . date('Y-m-d H:i:s') . "<br><br>";

echo "<h2>Database Connection Test</h2>";
try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=innomatics",
        "root",
        "",
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        )
    );
    
    echo "✅ Database connection successful!<br>";
    
    // Test if tables exist
    $tables = ['admin_users', 'subjects', 'recordings'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists<br>";
        } else {
            echo "❌ Table '$table' does not exist<br>";
        }
    }
    
    // Test admin user
    $stmt = $pdo->query("SELECT * FROM admin_users WHERE email = 'kiran.bjrfx1@gmail.com'");
    $user = $stmt->fetch();
    if ($user) {
        echo "✅ Admin user found: " . $user['full_name'] . "<br>";
    } else {
        echo "❌ Admin user not found<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
}

echo "<h2>API Test</h2>";
echo "Testing auth.php API...<br>";

// Test API endpoint
$url = 'http://localhost/innomatics/api/auth.php';
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-type: application/json'
    ]
]);

$result = @file_get_contents($url, false, $context);
if ($result) {
    echo "✅ API accessible: " . $result . "<br>";
} else {
    echo "❌ API not accessible<br>";
    echo "Error: " . error_get_last()['message'] . "<br>";
}
?>