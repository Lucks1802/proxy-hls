const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('No URL');

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://prepublish.f.qaotic.net/',
                'Origin': 'https://prepublish.f.qaotic.net'
            },
            responseType: 'text', // Solo pedimos texto (el m3u8)
            timeout: 10000
        });

        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.set('Access-Control-Allow-Origin', '*');

        let content = response.data;

        // Si la lista tiene links relativos, los hacemos absolutos pero SIN pasar por el proxy los fragmentos .ts
        // Esto hace que el video cargue mucho más rápido.
        if (url.includes('.m3u8')) {
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            content = content.split('\n').map(line => {
                if (line.startsWith('#') || line.trim() === '') return line;
                if (line.startsWith('http')) return line;
                return baseUrl + line;
            }).join('\n');
        }

        res.send(content);

    } catch (e) {
        console.error('Error:', e.message);
        res.status(500).send('Error de conexion con el canal');
    }
});

app.listen(PORT);
