const http = require('http');
const fs = require('fs');
const path = require('path');

const PEDIDOS_FILE = 'pedidos.json';

// Cargar pedidos guardados
function cargarPedidos() {
  if (fs.existsSync(PEDIDOS_FILE)) {
    return JSON.parse(fs.readFileSync(PEDIDOS_FILE, 'utf8'));
  }
  return [];
}

// Guardar pedidos en archivo
function guardarPedidos(pedidos) {
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
}

const server = http.createServer((req, res) => {
  // Cabeceras CORS para permitir conexión desde la app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir el archivo HTML de la app
  if (req.method === 'GET' && req.url === '/') {
    const htmlPath = path.join(__dirname, 'app.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('app.html no encontrado');
    }
    return;
  }

  // Obtener todos los pedidos
  if (req.method === 'GET' && req.url === '/pedidos') {
    const pedidos = cargarPedidos();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pedidos));
    return;
  }

  // Crear nuevo pedido
  if (req.method === 'POST' && req.url === '/pedido') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const nuevoPedido = JSON.parse(body);
        const pedidos = cargarPedidos();
        nuevoPedido.id = Date.now();
        nuevoPedido.fecha = new Date().toLocaleString('es-PE');
        nuevoPedido.estado = 'Pendiente';
        pedidos.push(nuevoPedido);
        guardarPedidos(pedidos);
        console.log(`\n✅ Nuevo pedido #${nuevoPedido.id} de ${nuevoPedido.cliente}`);
        console.log(`   Total: S/ ${nuevoPedido.total.toFixed(2)}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id: nuevoPedido.id }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: 'Pedido inválido' }));
      }
    });
    return;
  }

  // Actualizar estado de pedido
  if (req.method === 'POST' && req.url.startsWith('/estado/')) {
    const id = parseInt(req.url.split('/')[2]);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { estado } = JSON.parse(body);
      const pedidos = cargarPedidos();
      const pedido = pedidos.find(p => p.id === id);
      if (pedido) {
        pedido.estado = estado;
        guardarPedidos(pedidos);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(404); 
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Ruta no encontrada');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🫔 ================================');
  console.log('   EL TAMAL DE CHIMBOTE');
  console.log('   Servidor corriendo en:');
  console.log(`   http://localhost:${PORT}`);
  console.log('🫔 ================================');
  console.log('Esperando pedidos...\n');
});
