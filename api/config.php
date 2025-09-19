<?php
// Database configuration
class Database {
    private $host = 'localhost';
    private $db_name = 'bdotsoft_innomatics';
    private $username = 'bdotsoft_kiran';
    private $password = 'K143iran';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
                )
            );
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }
        
        return $this->conn;
    }
}

// CORS headers for API access
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Response helper function
function sendResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data);
    exit();
}

// Error handler
function sendError($message, $status_code = 400) {
    sendResponse(['error' => $message, 'success' => false], $status_code);
}

// Success handler
function sendSuccess($data = [], $message = 'Success') {
    sendResponse(['data' => $data, 'message' => $message, 'success' => true]);
}

// YouTube API helper functions
function extractYouTubeVideoId($url) {
    $pattern = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/';
    preg_match($pattern, $url, $matches);
    return isset($matches[1]) ? $matches[1] : null;
}

function getYouTubeVideoData($videoId) {
    // Note: In production, you should use YouTube Data API v3 with API key
    // For now, we'll extract basic info from the URL structure
    return [
        'thumbnail_url' => "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg",
        'video_id' => $videoId
    ];
}

// Session management
function startSecureSession() {
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
}

function isAdminLoggedIn() {
    startSecureSession();
    return isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);
}

function requireAdminAuth() {
    if (!isAdminLoggedIn()) {
        sendError('Authentication required', 401);
    }
}
?>