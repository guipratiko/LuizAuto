// Servir arquivos estáticos
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.xml')) {
            res.setHeader('Content-Type', 'application/xml');
        }
        if (path.endsWith('.txt')) {
            res.setHeader('Content-Type', 'text/plain');
        }
    }
})); 