// proxy-hls.js
const express = require('express');       // Framework para HTTP
const axios = require('axios');           // Para descargar fragmentos y M3U8
const fs = require('fs');                 // Para cache de archivos
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Carpeta de cache
const CACHE_DIR = path.join(__dirname,'cache');
if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// Endpoint principal: /proxy?url=<URL_CANAL>
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if(!url) return res.status(400).send('No URL');

    const hash = Buffer.from(url).toString('base64').replace(/=/g,'');
    const cacheFile = path.join(CACHE_DIR, hash+'.m3u8');

    try {
        let content;
        // Cache de M3U8: si existe y es reciente (<60s) se usa
        if(fs.existsSync(cacheFile) && (Date.now() - fs.statSync(cacheFile).mtimeMs) < 60000){
            content = fs.readFileSync(cacheFile,'utf8');
        } else {
            // Descarga M3U8 original
            const resp = await axios.get(url);
            content = resp.data;
            fs.writeFileSync(cacheFile, content);
        }

        res.set('Content-Type','application/vnd.apple.mpegurl');
        res.send(content);
    } catch(e){
        res.status(500).send('Error fetching channel');
    }
});

app.listen(PORT, ()=> console.log(`HLS Proxy corriendo en puerto ${PORT}`));
