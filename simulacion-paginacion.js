const express = require("express");
const app = express();

function generateEmissionsData(count) {
  const emissions = [];
  const companies = [
    "EcoTech",
    "GreenEnergy",
    "SustainCorp",
    "BioFutures",
    "EarthFriendly",
  ];
  const sources = [
    "electricity",
    "transportation",
    "manufacturing",
    "heating",
    "waste",
  ];

  const startDate = new Date("2020-01-01");

  for (let i = 1; i <= count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i - 1);

    emissions.push({
      id: i,
      company_id: Math.floor(Math.random() * 5) + 1,
      company_name: companies[Math.floor(Math.random() * companies.length)],
      date: date.toISOString().split("T")[0],
      co2_tons: parseFloat((Math.random() * 200 + 50).toFixed(1)),
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }

  return emissions;
}

// Generar un conjunto grande de datos (10,000 registros)
const allEmissions = generateEmissionsData(10000);

// ===============================
// API ENDPOINTS
// ===============================

// Endpoint sin paginación - MALA PRÁCTICA
app.get("/api/emissions-all", (req, res) => {
  res.json(allEmissions);
});

// Endpoint con paginación - BUENA PRÁCTICA
app.get("/api/emissions", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const safeLimit = Math.min(limit, 100);

  const paginatedData = allEmissions.slice(offset, offset + safeLimit);

  const totalRecords = allEmissions.length;

  const totalPages = Math.ceil(totalRecords / safeLimit);
  const currentPage = Math.floor(offset / safeLimit) + 1;
  const baseUrl = "/api/emissions";

  res.json({
    data: paginatedData,
    pagination: {
      total_records: totalRecords,
      records_per_page: safeLimit,
      current_page: currentPage,
      total_pages: totalPages,
      offset: offset,
      links: {
        self: `${baseUrl}?limit=${safeLimit}&offset=${offset}`,
        first: `${baseUrl}?limit=${safeLimit}&offset=0`,
        last: `${baseUrl}?limit=${safeLimit}&offset=${Math.max(
          0,
          (totalPages - 1) * safeLimit
        )}`,
        next:
          offset + safeLimit < totalRecords
            ? `${baseUrl}?limit=${safeLimit}&offset=${offset + safeLimit}`
            : null,
        prev:
          offset > 0
            ? `${baseUrl}?limit=${safeLimit}&offset=${Math.max(
                0,
                offset - safeLimit
              )}`
            : null,
      },
    },
  });
});


app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demostración de Paginación en APIs</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f7f9fc;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #3498db;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .container {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .panel {
      flex: 1;
      padding: 20px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .bad-practice {
      border-left: 5px solid #e74c3c;
    }
    .good-practice {
      border-left: 5px solid #2ecc71;
    }
    .controls {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #2980b9;
    }
    button:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
    .danger-button {
      background-color: #e74c3c;
    }
    .danger-button:hover {
      background-color: #c0392b;
    }
    .success-button {
      background-color: #2ecc71;
    }
    .success-button:hover {
      background-color: #27ae60;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .data-table th, .data-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .data-table th {
      background-color: #f2f2f2;
    }
    .data-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .data-table tr:hover {
      background-color: #f1f1f1;
    }
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      user-select: none;
    }
    .pagination button {
      margin: 0 5px;
    }
    .page-info {
      margin: 0 15px;
      line-height: 35px;
    }
    .stats {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
    }
    .highlight {
      background-color: #ffffcc;
      padding: 2px 5px;
      border-radius: 3px;
    }
    .error-message {
      color: #e74c3c;
      font-weight: bold;
    }
    .success-message {
      color: #2ecc71;
      font-weight: bold;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #3498db;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    pre {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      overflow: auto;
      font-size: 14px;
      max-height: 300px;
      border: 1px solid #ddd;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .badge {
      display: inline-block;
      padding: 3px 7px;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
      border-radius: 10px;
      color: white;
    }
    .badge-danger {
      background-color: #e74c3c;
    }
    .badge-success {
      background-color: #2ecc71;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background-color: #d6eaf8;
      border-radius: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      font-size: 14px;
      color: #7f8c8d;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Demostración de Paginación en APIs</h1>
    <p>Comparativa visual entre APIs con y sin paginación</p>
  </div>
  
  <div class="container">
    <div class="panel bad-practice">
      <h2>Sin Paginación <span class="badge badge-danger">Mala Práctica</span></h2>
      <p>Esta API devuelve todos los registros a la vez (10,000 en este caso), sobrecargando al servidor y al cliente.</p>
      
      <div class="controls">
        <button id="loadAllButton" onclick="loadAllEmissions()">Cargar Todos los Datos</button>
        <button id="clearAllButton" onclick="clearAllEmissions()">Limpiar</button>
      </div>
      
      <div id="loadingAll" class="spinner" style="display: none;"></div>
      <div id="errorAll" class="error-message" style="display: none;"></div>
      
      <div id="statsAll" class="stats" style="display: none;">
        <p>Total de registros cargados: <span id="recordCountAll" class="highlight">0</span></p>
        <p>Tiempo de carga: <span id="loadTimeAll" class="highlight">0</span> ms</p>
        <p>Tamaño de respuesta: <span id="responseSizeAll" class="highlight">0</span> KB</p>
      </div>
      
      <div id="dataContainerAll" style="display: none;">
        <h3>Muestra de Datos (primeros 10 registros)</h3>
        <table id="dataTableAll" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Fecha</th>
              <th>CO₂ (ton)</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            <!-- Los datos se cargarán aquí -->
          </tbody>
        </table>
        <div id="showMoreAll" style="text-align: center; display: none;">
          <p>... y <span id="remainingCountAll">0</span> registros más que no se muestran</p>
        </div>
      </div>
      
      <div id="responseContainerAll" style="display: none;">
        <h3>Respuesta del Servidor (parcial)</h3>
        <pre id="responseAll"></pre>
      </div>
    </div>
    
    <div class="panel good-practice">
      <h2>Con Paginación <span class="badge badge-success">Buena Práctica</span></h2>
      <p>Esta API devuelve solo un subconjunto de registros a la vez, proporcionando metadatos para navegar entre páginas.</p>
      
      <div class="controls">
        <button id="loadPagedButton" onclick="loadPagedEmissions(0)">Cargar Primera Página</button>
        <button id="clearPagedButton" onclick="clearPagedEmissions()">Limpiar</button>
      </div>
      
      <div id="loadingPaged" class="spinner" style="display: none;"></div>
      <div id="errorPaged" class="error-message" style="display: none;"></div>
      
      <div id="statsPaged" class="stats" style="display: none;">
        <p>Registros por página: <span id="recordsPerPage" class="highlight">0</span></p>
        <p>Página actual: <span id="currentPage" class="highlight">0</span> de <span id="totalPages" class="highlight">0</span></p>
        <p>Total de registros: <span id="totalRecords" class="highlight">0</span></p>
        <p>Tiempo de carga: <span id="loadTimePaged" class="highlight">0</span> ms</p>
        <p>Tamaño de respuesta: <span id="responseSizePaged" class="highlight">0</span> KB</p>
      </div>
      
      <div id="dataContainerPaged" style="display: none;">
        <h3>Datos (página actual)</h3>
        <table id="dataTablePaged" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Fecha</th>
              <th>CO₂ (ton)</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            <!-- Los datos se cargarán aquí -->
          </tbody>
        </table>
        
        <div id="pagination" class="pagination">
          <button id="firstPageBtn" onclick="loadPagedEmissions(0)">&laquo; Primera</button>
          <button id="prevPageBtn" onclick="loadPrevPage()">&lsaquo; Anterior</button>
          <span class="page-info">Página <span id="pageNumber">0</span> de <span id="pageTotalNumber">0</span></span>
          <button id="nextPageBtn" onclick="loadNextPage()">Siguiente &rsaquo;</button>
          <button id="lastPageBtn" onclick="loadLastPage()">Última &raquo;</button>
        </div>
      </div>
      
      <div id="responseContainerPaged" style="display: none;">
        <h3>Respuesta del Servidor (con metadatos de paginación)</h3>
        <pre id="responsePaged"></pre>
      </div>
    </div>
  </div>
  
  <div class="summary">
    <h2>Comparación de Resultados</h2>
    <div id="comparisonResults" style="display: none;">
      <h3>Rendimiento</h3>
      <p><strong>Sin Paginación:</strong> <span id="comparisonTimeAll">0</span> ms para cargar <span id="comparisonCountAll">0</span> registros</p>
      <p><strong>Con Paginación:</strong> <span id="comparisonTimePaged">0</span> ms para cargar <span id="comparisonCountPaged">0</span> registros</p>
      
      <h3>Tamaño de respuesta</h3>
      <p><strong>Sin Paginación:</strong> <span id="comparisonSizeAll">0</span> KB (todos los registros)</p>
      <p><strong>Con Paginación:</strong> <span id="comparisonSizePaged">0</span> KB (solo una página)</p>
      
      <h3>Usabilidad</h3>
      <p><strong>Sin Paginación:</strong> Carga lenta, potencialmente puede bloquear el navegador con grandes conjuntos de datos.</p>
      <p><strong>Con Paginación:</strong> Respuesta rápida, experiencia de usuario fluida, navegación entre páginas.</p>
    </div>
  </div>
  
  <div class="footer">
    <p>Demostración de EcoTrack API - Buenas Prácticas en Diseño de APIs</p>
    <p>Juan Arévalo, Felipe Carrillo, Andrés Arévalo & Yiro Urueña</p>
  </div>

  <script>
    // Variables globales para paginación
    let currentOffset = 0;
    let currentLimit = 20;
    let totalRecords = 0;
    let totalPages = 0;
    
    // Función para cargar todos los datos (sin paginación)
    async function loadAllEmissions() {
      // Mostrar spinner de carga
      document.getElementById('loadingAll').style.display = 'block';
      document.getElementById('errorAll').style.display = 'none';
      document.getElementById('dataContainerAll').style.display = 'none';
      document.getElementById('statsAll').style.display = 'none';
      document.getElementById('responseContainerAll').style.display = 'none';
      
      // Registrar tiempo de inicio
      const startTime = performance.now();
      
      try {
        // Realizar la solicitud
        const response = await fetch('/api/emissions-all');
        const data = await response.json();
        
        // Calcular tiempo de carga
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        
        // Estimar tamaño de respuesta
        const responseSize = Math.round(JSON.stringify(data).length / 1024);
        
        // Actualizar estadísticas
        document.getElementById('recordCountAll').textContent = data.length;
        document.getElementById('loadTimeAll').textContent = loadTime;
        document.getElementById('responseSizeAll').textContent = responseSize;
        document.getElementById('statsAll').style.display = 'block';
        
        // Actualizar comparación
        document.getElementById('comparisonTimeAll').textContent = loadTime;
        document.getElementById('comparisonCountAll').textContent = data.length;
        document.getElementById('comparisonSizeAll').textContent = responseSize;
        document.getElementById('comparisonResults').style.display = 'block';
        
        // Mostrar solo los primeros 10 registros en la tabla
        const table = document.getElementById('dataTableAll').getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        
        const displayLimit = 10;
        
        for (let i = 0; i < Math.min(displayLimit, data.length); i++) {
          const emission = data[i];
          const row = table.insertRow();
          
          row.insertCell(0).textContent = emission.id;
          row.insertCell(1).textContent = emission.company_name;
          row.insertCell(2).textContent = emission.date;
          row.insertCell(3).textContent = emission.co2_tons;
          row.insertCell(4).textContent = emission.source;
        }
        
        // Mostrar cuántos registros adicionales hay
        if (data.length > displayLimit) {
          document.getElementById('remainingCountAll').textContent = data.length - displayLimit;
          document.getElementById('showMoreAll').style.display = 'block';
        } else {
          document.getElementById('showMoreAll').style.display = 'none';
        }
        
        // Mostrar respuesta parcial
        document.getElementById('responseAll').textContent = 
          JSON.stringify(data.slice(0, 3), null, 2) + 
          "\\n...\\n" + 
          "// " + (data.length - 6) + " registros omitidos para brevedad\\n" +
          "...\\n" +
          JSON.stringify(data.slice(data.length - 3), null, 2);
        
        // Mostrar contenedores de datos
        document.getElementById('dataContainerAll').style.display = 'block';
        document.getElementById('responseContainerAll').style.display = 'block';
      } catch (error) {
        // Mostrar error
        document.getElementById('errorAll').textContent = 'Error al cargar datos: ' + error.message;
        document.getElementById('errorAll').style.display = 'block';
      } finally {
        // Ocultar spinner
        document.getElementById('loadingAll').style.display = 'none';
      }
    }
    
    // Función para limpiar todos los datos
    function clearAllEmissions() {
      document.getElementById('dataContainerAll').style.display = 'none';
      document.getElementById('statsAll').style.display = 'none';
      document.getElementById('responseContainerAll').style.display = 'none';
      document.getElementById('errorAll').style.display = 'none';
    }
    
    // Función para cargar datos paginados
    async function loadPagedEmissions(offset) {
      // Actualizar offset actual
      currentOffset = offset;
      
      // Mostrar spinner de carga
      document.getElementById('loadingPaged').style.display = 'block';
      document.getElementById('errorPaged').style.display = 'none';
      document.getElementById('dataContainerPaged').style.display = 'none';
      document.getElementById('statsPaged').style.display = 'none';
      document.getElementById('responseContainerPaged').style.display = 'none';
      
      // Registrar tiempo de inicio
      const startTime = performance.now();
      
      try {
        // Realizar la solicitud
        const response = await fetch('/api/emissions?limit=' + currentLimit + '&offset=' + offset);
        const result = await response.json();
        
        // Calcular tiempo de carga
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        
        // Estimar tamaño de respuesta
        const responseSize = Math.round(JSON.stringify(result).length / 1024);
        
        // Extraer datos y metadatos de paginación
        const data = result.data;
        const pagination = result.pagination;
        
        // Actualizar variables globales
        totalRecords = pagination.total_records;
        totalPages = pagination.total_pages;
        
        // Actualizar estadísticas
        document.getElementById('recordsPerPage').textContent = data.length;
        document.getElementById('currentPage').textContent = pagination.current_page;
        document.getElementById('totalPages').textContent = pagination.total_pages;
        document.getElementById('totalRecords').textContent = pagination.total_records;
        document.getElementById('loadTimePaged').textContent = loadTime;
        document.getElementById('responseSizePaged').textContent = responseSize;
        document.getElementById('statsPaged').style.display = 'block';
        
        // Actualizar información de paginación
        document.getElementById('pageNumber').textContent = pagination.current_page;
        document.getElementById('pageTotalNumber').textContent = pagination.total_pages;
        
        // Actualizar comparación
        document.getElementById('comparisonTimePaged').textContent = loadTime;
        document.getElementById('comparisonCountPaged').textContent = data.length;
        document.getElementById('comparisonSizePaged').textContent = responseSize;
        document.getElementById('comparisonResults').style.display = 'block';
        
        // Habilitar/deshabilitar botones de paginación
        document.getElementById('firstPageBtn').disabled = pagination.current_page === 1;
        document.getElementById('prevPageBtn').disabled = !pagination.links.prev;
        document.getElementById('nextPageBtn').disabled = !pagination.links.next;
        document.getElementById('lastPageBtn').disabled = pagination.current_page === pagination.total_pages;
        
        // Mostrar datos en la tabla
        const table = document.getElementById('dataTablePaged').getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        
        for (let i = 0; i < data.length; i++) {
          const emission = data[i];
          const row = table.insertRow();
          
          row.insertCell(0).textContent = emission.id;
          row.insertCell(1).textContent = emission.company_name;
          row.insertCell(2).textContent = emission.date;
          row.insertCell(3).textContent = emission.co2_tons;
          row.insertCell(4).textContent = emission.source;
        }
        
        // Mostrar respuesta completa con metadatos
        document.getElementById('responsePaged').textContent = JSON.stringify(result, null, 2);
        
        // Mostrar contenedores de datos
        document.getElementById('dataContainerPaged').style.display = 'block';
        document.getElementById('responseContainerPaged').style.display = 'block';
      } catch (error) {
        // Mostrar error
        document.getElementById('errorPaged').textContent = 'Error al cargar datos: ' + error.message;
        document.getElementById('errorPaged').style.display = 'block';
      } finally {
        // Ocultar spinner
        document.getElementById('loadingPaged').style.display = 'none';
      }
    }
    
    // Función para limpiar datos paginados
    function clearPagedEmissions() {
      document.getElementById('dataContainerPaged').style.display = 'none';
      document.getElementById('statsPaged').style.display = 'none';
      document.getElementById('responseContainerPaged').style.display = 'none';
      document.getElementById('errorPaged').style.display = 'none';
    }
    
    // Funciones auxiliares para navegar entre páginas
    function loadPrevPage() {
      loadPagedEmissions(Math.max(0, currentOffset - currentLimit));
    }
    
    function loadNextPage() {
      loadPagedEmissions(currentOffset + currentLimit);
    }
    
    function loadLastPage() {
      const lastPageOffset = Math.max(0, (totalPages - 1) * currentLimit);
      loadPagedEmissions(lastPageOffset);
    }
  </script>
</body>
</html>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`⚡ Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(
    `📊 Abre tu navegador en http://localhost:${PORT} para ver la demostración de paginación`
  );
});
