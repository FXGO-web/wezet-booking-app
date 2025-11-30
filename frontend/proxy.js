const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
    console.log('---------------------------------------------------');
    console.log('INCOMING REQUEST:', req.method, req.url);
    console.log('HEADERS:', JSON.stringify(req.headers, null, 2));

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight');
        res.setHeader('Content-Length', '0');
        console.log('Response Headers:', res.getHeaders());
        res.statusCode = 204;
        res.end();
        return;
    }

    if (req.method === 'PUT' && req.url.includes('/settings')) {
        console.log('Intercepting PUT /settings - Returning 200 OK');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Settings saved (mock)' }));
        return;
    }

    // Strip /functions/v1 prefix if present, as we might be double-prefixing or not
    // Actually, api.tsx sends /functions/v1/...
    // Supabase expects /functions/v1/...

    const options = {
        hostname: 'aadzzhdouuxkvelxyoyf.supabase.co',
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: 'aadzzhdouuxkvelxyoyf.supabase.co',
        }
    };

    // Strip problematic headers
    delete options.headers.cookie;
    delete options.headers.origin;
    delete options.headers.referer;

    // Force headers to mimic curl
    options.headers['user-agent'] = 'curl/8.7.1';
    options.headers['accept'] = '*/*';

    console.log('Proxying to:', options.hostname + options.path);

    const proxyReq = https.request(options, (proxyRes) => {
        console.log('Response Status:', proxyRes.statusCode);

        // Merge headers, ensuring CORS headers persist and duplicates are removed
        const headers = { ...proxyRes.headers };
        delete headers['access-control-allow-origin'];
        delete headers['access-control-allow-methods'];
        delete headers['access-control-allow-headers'];
        delete headers['access-control-allow-credentials'];
        delete headers['set-cookie']; // Strip cookies to avoid CORS issues with wildcard origin

        headers['access-control-allow-origin'] = '*';
        headers['access-control-allow-private-network'] = 'true';

        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error('Proxy Error:', e);
        if (!res.headersSent) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
            res.setHeader('Access-Control-Allow-Private-Network', 'true');
            res.writeHead(500);
            res.end('Proxy Error: ' + e.message);
        }
    });

    req.pipe(proxyReq);
});

server.listen(3002, '::', () => {
    console.log('Standalone Proxy running on port 3002 (IPv6 ::)');
});
