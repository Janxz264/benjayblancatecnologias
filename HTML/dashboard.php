<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>B&B Dashboard</title>

    <!-- Styles & Frameworks -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="../CSS/styles.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
    <!-- jQuery (required for DataTables) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

    <!-- JavaScript Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body class="d-flex flex-column vh-100 bg-gray">

    <!-- Navbar -->
    <nav class="w-full bg-gray-800 text-white text-center p-4">
        <h2 id="welcomeMessage">Cargando...</h2>
    </nav>
    
    <!-- Main Content Area -->
    <main class="flex-grow container mt-5 p-4 bg-white shadow rounded w-75">
        <h1 id="mainTitle" class="title">Bienvenido</h1>
        <div id="patientsContainer">
            <p>Elija una opción del menú para empezar.</p>
        </div>
    </main>

    <!-- Sidebar -->
    <div class="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white transform -translate-x-full transition-transform duration-300 ease-in-out z-50"
         id="sidebar">
        <button class="absolute top-2 right-2 text-white" onclick="toggleSidebar()">✖</button>
        <ul class="mt-10 space-y-4 p-4">
            <li><a href="#" class="flex items-center gap-2"><i class="fa fa-calendar"></i> Agenda</a></li>
            <li><a href="#" id="patientsLink" class="flex items-center gap-2"><i class="fa fa-user"></i> Pacientes</a></li>
            <li><a href="#" class="flex items-center gap-2"><i class="fa fa-box"></i> Productos</a></li>
        </ul>
    </div>

    <!-- Toggle Sidebar Button -->
    <button class="fixed left-4 top-4 bg-gray-800 text-white p-2 rounded"
            onclick="toggleSidebar()">☰</button>

    <!-- Right-Side Panel -->
    <div class="fixed right-0 top-0 h-full w-64 bg-gray-900 text-white transform translate-x-full transition-transform duration-300 ease-in-out z-50"
         id="settingsPanel">
        <button class="absolute top-2 left-2 text-white" onclick="toggleSettings()">✖</button>
        <ul class="mt-10 space-y-4 p-4">
            <li><a href="#" id="changePasswordLink" class="flex items-center gap-2"><i class="fa fa-key"></i> Cambiar contraseña</a></li>
            <li><a href="#" id="logoutButton" class="flex items-center gap-2"><i class="fa fa-sign-out-alt"></i> Cerrar sesión</a></li>
        </ul>
    </div>

    <!-- Gear Icon to Open Settings Panel -->
    <button class="fixed right-4 top-4 bg-gray-900 text-white p-2 rounded z-50"
            onclick="toggleSettings()"><i class="fa fa-cog"></i></button>

    <!-- Footer -->
    <?php include 'footer.html'; ?>

    <!-- Change Password Modal -->
    <?php include 'changepassword.html'; ?>

    <!-- Patient ADD & EDIT modal -->
    <?php include 'patientmodal.html'; ?>

    <!-- Bootstrap JS Bundle (includes Popper.js) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Your Custom JavaScript -->
    <script src="../JS/dashboard.js"></script>
</body>
</html>