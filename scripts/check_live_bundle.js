const https = require('https');

https.get('https://xn--12cfj6ce1b3axad7f3ae7cub7e7hud0c4a2g.com/index.html', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        console.log('Live index.html Status:', res.statusCode);
        const scripts = d.match(/<script[^>]+src="([^">]+)"/g) || [];
        console.log('Live scripts in index.html:');
        scripts.forEach(s => console.log('  ', s));
        const css = d.match(/<link[^>]+href="([^">]+)"/g) || [];
        console.log('Live CSS:');
        css.forEach(c => console.log('  ', c));
    });
}).on('error', err => console.error(err));
