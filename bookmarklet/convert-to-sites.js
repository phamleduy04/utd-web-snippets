// Converts a <department>.utdallas.edu URL to sites.utdallas.edu for web editing
javascript: (function () {
    // Check if the current website is utdallas.edu
    if (!window.location.hostname.endsWith('utdallas.edu')) {
        alert('Error: This bookmarklet only works on utdallas.edu websites.');
        return;
    }

    // Get the current URL
    var currentUrl = window.location.href;

    // Create a URL object
    var url = new URL(currentUrl);

    // Check if we're already on sites.utdallas.edu
    if (url.hostname === 'sites.utdallas.edu') {
        alert("You're already on sites.utdallas.edu!");
        return;
    }

    // Split the hostname into parts
    var hostParts = url.hostname.split('.');

    // Check if there's a subdomain before 'utdallas.edu'
    if (hostParts.length > 2) {
        var subdomain = hostParts[0];

        // Change the hostname to 'sites.utdallas.edu'
        url.hostname = 'sites.utdallas.edu';

        // Move the subdomain to the beginning of the pathname
        url.pathname = '/' + subdomain + url.pathname;

        // Update the browser's address bar and navigate to the new URL
        window.location.href = url.toString();
    } else {
        alert('This URL does not have a department subdomain and cannot be converted.');
    }
})();