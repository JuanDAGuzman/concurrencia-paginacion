// concurrencia-minima.js - Versión ultra simplificada para demostración
const express = require("express");
const app = express();
app.use(express.json());

// Datos simulados - nuestro "informe" que dos usuarios van a editar
let reportData = {
  id: 1,
  title: "Informe Anual de Emisiones 2023",
  co2_total: 1500.5,
  updated_at: new Date().toISOString(),
};

// Versión del reporte (para control de concurrencia)
let currentVersion = "v1";

// =========================================
// RUTAS SIN CONTROL DE CONCURRENCIA
// =========================================

// Obtener informe (sin control)
app.get("/api/sin-control", (req, res) => {
  res.json(reportData);
});

// Actualizar informe (sin control)
app.post("/api/sin-control", (req, res) => {
  // Actualizar directamente
  if (req.body.co2_total) {
    reportData.co2_total = req.body.co2_total;
    reportData.updated_at = new Date().toISOString();
    reportData.updated_by = req.body.user || "desconocido";
  }

  res.json({
    success: true,
    data: reportData,
  });
});

// =========================================
// RUTAS CON CONTROL DE CONCURRENCIA
// =========================================

// Obtener informe (con control)
app.get("/api/con-control", (req, res) => {
  res.setHeader("ETag", currentVersion);
  res.json(reportData);
});

// Actualizar informe (con control)
app.post("/api/con-control", (req, res) => {
  const clientVersion = req.headers["if-match"];

  // Verificar versión
  if (!clientVersion) {
    return res.status(428).json({
      success: false,
      error: "Se requiere encabezado If-Match",
    });
  }

  if (clientVersion !== currentVersion) {
    return res.status(412).json({
      success: false,
      error: "Conflicto de versiones",
      message: "El recurso ha sido modificado. Obtenga la versión actual.",
    });
  }

  // Actualizar
  if (req.body.co2_total) {
    reportData.co2_total = req.body.co2_total;
    reportData.updated_at = new Date().toISOString();
    reportData.updated_by = req.body.user || "desconocido";

    // Generar nueva versión
    currentVersion = "v" + (parseInt(currentVersion.substring(1)) + 1);
  }

  res.setHeader("ETag", currentVersion);
  res.json({
    success: true,
    data: reportData,
  });
});

// Reiniciar datos
app.post("/api/reset", (req, res) => {
  reportData = {
    id: 1,
    title: "Informe Anual de Emisiones 2023",
    co2_total: 1500.5,
    updated_at: new Date().toISOString(),
  };
  currentVersion = "v1";
  res.json({ success: true });
});

// Página principal con instrucciones
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Demo Concurrencia</title>
      <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .panel { border: 1px solid #ccc; padding: 15px; margin: 15px 0; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; }
        button { padding: 8px 12px; margin: 5px; }
      </style>
    </head>
    <body>
      <h1>Demostración de Concurrencia en APIs</h1>
      
      <div class="panel">
        <h2>1. Sin Control de Concurrencia</h2>
        <p>En este escenario, simularemos dos usuarios actualizando el mismo recurso sin ningún control de concurrencia.</p>
        
        <h3>Usuario A</h3>
        <button onclick="getWithoutControl('A')">1. Obtener datos</button>
        <button onclick="updateWithoutControl('A', 1650)">2. Actualizar CO₂ a 1650</button>
        <pre id="userA-nocontrol">Datos no cargados</pre>
        
        <h3>Usuario B</h3>
        <button onclick="getWithoutControl('B')">1. Obtener datos</button>
        <button onclick="updateWithoutControl('B', 1580)">2. Actualizar CO₂ a 1580</button>
        <pre id="userB-nocontrol">Datos no cargados</pre>
        
        <div id="result-nocontrol"></div>
      </div>
      
      <div class="panel">
        <h2>2. Con Control de Concurrencia</h2>
        <p>Aquí veremos cómo el control de concurrencia previene la pérdida de datos.</p>
        
        <h3>Usuario A</h3>
        <button onclick="getWithControl('A')">1. Obtener datos</button>
        <button onclick="updateWithControl('A', 1650)">2. Actualizar CO₂ a 1650</button>
        <pre id="userA-control">Datos no cargados</pre>
        
        <h3>Usuario B</h3>
        <button onclick="getWithControl('B')">1. Obtener datos</button>
        <button onclick="updateWithControl('B', 1580)">2. Actualizar CO₂ a 1580</button>
        <pre id="userB-control">Datos no cargados</pre>
        
        <div id="result-control"></div>
      </div>
      
      <button onclick="resetDemo()">Reiniciar Demostración</button>
      
      <script>
        // Variables para los datos de cada usuario
        const userData = {
          'A-nocontrol': { data: null },
          'B-nocontrol': { data: null },
          'A-control': { data: null, etag: null },
          'B-control': { data: null, etag: null }
        };
        
        // SIN CONTROL DE CONCURRENCIA
        
        async function getWithoutControl(user) {
          try {
            const response = await fetch('/api/sin-control');
            const data = await response.json();
            
            userData[user + '-nocontrol'].data = data;
            document.getElementById('user' + user + '-nocontrol').textContent = 
              JSON.stringify(data, null, 2);
            
            logNoControl('Usuario ' + user + ' obtuvo los datos');
          } catch (error) {
            logNoControl('Error: ' + error.message);
          }
        }
        
        async function updateWithoutControl(user, value) {
          try {
            const response = await fetch('/api/sin-control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                co2_total: value, 
                user: 'Usuario ' + user 
              })
            });
            
            const result = await response.json();
            userData[user + '-nocontrol'].data = result.data;
            
            document.getElementById('user' + user + '-nocontrol').textContent = 
              JSON.stringify(result.data, null, 2);
            
            logNoControl('Usuario ' + user + ' actualizó CO₂ a ' + value);
            
            // Detectar conflicto
            if (user === 'B' && result.data.updated_by === 'Usuario B') {
              const userAData = userData['A-nocontrol'].data;
              if (userAData && userAData.co2_total === 1650) {
                logNoControl('⚠️ PROBLEMA: Los cambios del Usuario A (1650) fueron sobrescritos sin ninguna advertencia!', true);
              }
            }
          } catch (error) {
            logNoControl('Error: ' + error.message);
          }
        }
        
        function logNoControl(message, isError = false) {
          const resultDiv = document.getElementById('result-nocontrol');
          const p = document.createElement('p');
          p.textContent = message;
          
          if (isError) {
            p.style.color = 'red';
            p.style.fontWeight = 'bold';
          }
          
          resultDiv.appendChild(p);
        }
        
        // CON CONTROL DE CONCURRENCIA
        
        async function getWithControl(user) {
          try {
            const response = await fetch('/api/con-control');
            const data = await response.json();
            const etag = response.headers.get('ETag');
            
            userData[user + '-control'].data = data;
            userData[user + '-control'].etag = etag;
            
            document.getElementById('user' + user + '-control').textContent = 
              JSON.stringify({...data, __etag: etag}, null, 2);
            
            logControl('Usuario ' + user + ' obtuvo los datos (ETag: ' + etag + ')');
          } catch (error) {
            logControl('Error: ' + error.message);
          }
        }
        
        async function updateWithControl(user, value) {
          const userData_ = userData[user + '-control'];
          
          if (!userData_.data || !userData_.etag) {
            logControl('Usuario ' + user + ' debe obtener los datos primero');
            return;
          }
          
          try {
            const response = await fetch('/api/con-control', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'If-Match': userData_.etag
              },
              body: JSON.stringify({ 
                co2_total: value, 
                user: 'Usuario ' + user 
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              const newEtag = response.headers.get('ETag');
              
              userData_.data = result.data;
              userData_.etag = newEtag;
              
              document.getElementById('user' + user + '-control').textContent = 
                JSON.stringify({...result.data, __etag: newEtag}, null, 2);
              
              logControl('Usuario ' + user + ' actualizó CO₂ a ' + value + ' (Nuevo ETag: ' + newEtag + ')');
            } else {
              const errorData = await response.json();
              
              if (response.status === 412) {
                logControl('⚠️ PROTECCIÓN: El sistema impidió que Usuario ' + user + 
                  ' sobrescribiera los cambios. El recurso fue modificado por otro usuario.', true);
              } else {
                logControl('Error: ' + errorData.error);
              }
            }
          } catch (error) {
            logControl('Error: ' + error.message);
          }
        }
        
        function logControl(message, isError = false) {
          const resultDiv = document.getElementById('result-control');
          const p = document.createElement('p');
          p.textContent = message;
          
          if (isError) {
            p.style.color = 'red';
            p.style.fontWeight = 'bold';
          }
          
          resultDiv.appendChild(p);
        }
        
        // Reiniciar demostración
        async function resetDemo() {
          // Reiniciar datos en el servidor
          await fetch('/api/reset', { method: 'POST' });
          
          // Reiniciar UI
          document.getElementById('userA-nocontrol').textContent = 'Datos no cargados';
          document.getElementById('userB-nocontrol').textContent = 'Datos no cargados';
          document.getElementById('userA-control').textContent = 'Datos no cargados';
          document.getElementById('userB-control').textContent = 'Datos no cargados';
          
          document.getElementById('result-nocontrol').innerHTML = '';
          document.getElementById('result-control').innerHTML = '';
          
          // Reiniciar variables
          userData['A-nocontrol'].data = null;
          userData['B-nocontrol'].data = null;
          userData['A-control'].data = null;
          userData['A-control'].etag = null;
          userData['B-control'].data = null;
          userData['B-control'].etag = null;
          
          alert('Demostración reiniciada');
        }
      </script>
    </body>
    </html>
  `);
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
