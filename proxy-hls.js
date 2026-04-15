const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('Falta la URL');

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://prepublish.f.qaotic.net/',
                'Origin': 'https://prepublish.f.qaotic.net'
            },
            responseType: url.includes('.m3u8') ? 'text' : 'arraybuffer',
            timeout: 12000
        });

        // Si es una playlist, reescribimos los links internos
        if (url.includes('.m3u8')) {
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            
            let content = response.data;
            const lines = content.split('\n');
            const newLines = lines.map(line => {
                if (line.startsWith('#') || line.trim() === '') return line;
                
                let fullUrl = line.startsWith('http') ? line : baseUrl + line;
                // Hacemos que cada segmento pase de nuevo por este proxy
                return `https://proxy-hls-gers.onrender.com/proxy?url=${encodeURIComponent(fullUrl)}`;
            });
            
            return res.send(newLines.join('\n'));
        }

        // Si es un segmento de video (.ts), lo enviamos tal cual
        res.set('Content-Type', 'video/mp2t');
        res.send(response.data);

    } catch (e) {
        console.error('Error en el canal:', url, e.message);
        res.status(500).send('Error cargando el segmento');
    }
});

app.listen(PORT, () => console.log(`Proxy activo en puerto ${PORT}`));
