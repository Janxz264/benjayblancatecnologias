# 🏥 Sistema Web de Agenda Médica, Pedidos y Mantenimientos

Aplicación modular en PHP diseñada para gestionar **agendas médicas**, **órdenes de servicio**, **garantías de productos**, **inventario** y más. Desarrollada con un enfoque en la mantenibilidad, claridad y extensibilidad. Ejecutada localmente sobre WAMP, conectada a una base de datos MariaDB.

---

## 🚀 Funcionalidades

- 📅 Programación y gestión de citas médicas
- 🛠️ Registro de órdenes de mantenimiento
- 📦 Control de pedidos, productos e inventario
- 🧾 Historial de clientes y garantías
- 🔐 Inicio de sesión con validación de campos y manejo de errores
- 💬 Interfaz intuitiva con alertas SweetAlert2
- 📊 Tablas dinámicas con filtros, búsqueda y paginación

---

## 🧰 Tecnologías Utilizadas

| Componente       | Versión        | Descripción                                        |
|------------------|----------------|----------------------------------------------------|
| WAMP Server      | 3.3.7 (64-bit) | Entorno local con Apache, PHP y MariaDB para Windows |
| MariaDB          | 11.5.2         | Sistema de base de datos relacional compatible con MySQL |
| PHP              | 7.x / 8.x      | Backend y lógica del sistema                       |
| JavaScript       | Vanilla + jQuery | Interacción dinámica y validaciones de formularios |
| HTML / CSS       | Frontend básico | Estructura visual del sistema                     |

---

## 📚 Dependencias y Librerías

### Frontend (CDNs y estilos)

- **Bootstrap 5.3.0**  
  `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`

- **TailwindCSS**  
  `https://cdn.tailwindcss.com`

- **FontAwesome 6.0.0**  
  `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

- **SweetAlert2 11**  
  `https://cdn.jsdelivr.net/npm/sweetalert2@11`

- **Flatpickr**  
  `https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css`  
  `https://cdn.jsdelivr.net/npm/flatpickr`

- **DataTables 1.13.6**  
  `https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css`  
  `https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js`

- **jQuery 3.6.0**  
  `https://code.jquery.com/jquery-3.6.0.min.js`

### Scripts personalizados (`/JS/`)

- `places.js` – Ubicaciones y regiones  
- `patient.js` – Gestión de pacientes  
- `agenda.js` – Lógica de citas médicas  
- `dashboard.js` – Contenido principal y navegación  
- `referrerdoctor.js` – Médicos referentes  
- `assurance.js` – Aseguradoras y garantías  
- `products.js` – Productos y stock  
- `pedidos.js` – Pedidos comerciales  
- `mantenimiento.js` – Órdenes de mantenimiento

---

## 📦 Instalación Local

1. Descarga e instala [WAMP Server](https://www.wampserver.com/en/) versión 3.3.7 o superior.
2. Clona o copia el proyecto dentro de la ruta:  
   `C:\wamp64\www\benjayblancatecnologias`
3. Crea la base de datos en MariaDB:
   ```sql
   CREATE DATABASE project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
4. Importa el archivo project_db.sql mediante phpMyAdmin o consola.
5. Edita tus credenciales en PHP/db_connect.php:
- ```$host = "localhost";```
- ```$user = "root";```
- ```$pass = ""; // Agrega tu contraseña si aplica```
- ```$db   = "project_db";```
6. Inicia WAMP Server y abre el navegador en:
http://localhost/benjayblancatecnologias/HTML/login.php