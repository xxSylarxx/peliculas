<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// File to store visit count
$counterFile = 'visits.txt';

// Cookie name and duration (12 hours)
$cookieName = 'pelismanyalo_visited';
$cookieDuration = 12 * 60 * 60; // 12 hours in seconds

// Initialize response
$response = array();

// Check if visits.txt exists, if not create it with 0
if (!file_exists($counterFile)) {
    file_put_contents($counterFile, '0');
}

// Read current count
$currentCount = (int)file_get_contents($counterFile);

// Check if user has visited in the last 12 hours
$hasVisited = isset($_COOKIE[$cookieName]);

if (!$hasVisited) {
    // Increment counter
    $currentCount++;
    
    // Save new count
    file_put_contents($counterFile, $currentCount);
    
    // Set cookie for 12 hours
    setcookie($cookieName, '1', time() + $cookieDuration, '/');
    
    $response['incremented'] = true;
} else {
    $response['incremented'] = false;
}

// Return current count
$response['count'] = $currentCount;

echo json_encode($response);
?>
