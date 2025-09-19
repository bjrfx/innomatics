console.log('Testing video player functions...');

// Test if openVideoPlayer function exists
if (typeof openVideoPlayer === 'function') {
    console.log('✅ openVideoPlayer function exists');
} else {
    console.log('❌ openVideoPlayer function not found');
}

// Test if closeVideoPlayer function exists  
if (typeof closeVideoPlayer === 'function') {
    console.log('✅ closeVideoPlayer function exists');
} else {
    console.log('❌ closeVideoPlayer function not found');
}

// Test opening a video player with sample data
function testVideoPlayer() {
    console.log('Testing video player with sample data...');
    openVideoPlayer('WepSY1rgoys', 'Test Video');
}

// Add a global test function
window.testVideoPlayer = testVideoPlayer;

console.log('Video player test loaded. Call testVideoPlayer() to test the modal.');