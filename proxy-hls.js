const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Carpeta cache para fragmentos HLS
const CACHE_DIR = path.join(__dirname,'cache');
if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

app.get('/proxy', async (req,res)=>{
    let url = req.query.url;

    if(!url) return res.status(400).send('No URL');

    // Asegurar HTTPS
    if(!/^https?:\/\//i.test(url)) url='https://'+url;

    // Hash para cache
    const hash = Buffer.from(url).toString('base64').replace(/=/g,'');
    const cacheFile = path.join(CACHE_DIR, hash+'.m3u8');

    try{
        let content;

        // Leer de cache si existe y es reciente (<60s)
        if(fs.existsSync(cacheFile) && (Date.now()-fs.statSync(cacheFile).mtimeMs)<60000){
            content = fs.readFileSync(cacheFile,'utf8');
        } else {
            // Descargar HLS con headers para URLs restringidas
            const resp = await axios.get(url,{
                headers:{
                    'User-Agent':'Mozilla/5.0',
                    'Accept':'*/*',
                    'Referer':'https://prepublish.f.qaotic.net/',
                    'Origin':'https://prepublish.f.qaotic.net'
                },
                responseType:'text',
                timeout:15000
            });
            content = resp.data;
            fs.writeFileSync(cacheFile,content);
        }

        // Entregar playlist HLS
        res.set('Content-Type','application/vnd.apple.mpegurl');
        res.send(content);

    }catch(e){
        console.error('Error fetching channel:',url,e.message);
        res.status(500).send('Error fetching channel');
    }
});

app.listen(PORT,()=>console.log(`HLS Proxy corriendo en puerto ${PORT}`));
