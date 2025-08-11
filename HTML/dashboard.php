<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>B&B Dashboard</title>
    <link rel="icon" href="/benjayblancatecnologias/favicon.ico" type="image/x-icon">
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

    <!-- Flatpickr CSS & JS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
</head>

<body class="d-flex flex-column vh-100" style="background-image: url('../media/dark.png'); background-repeat: repeat; background-color: #d1d5db;">

    <!-- Navbar -->
    <?php include 'navbar.html'; ?>
    
    <!-- Main Content Area -->
    <main class="flex-grow container mt-5 p-4 bg-white shadow rounded w-75">
        <h1 id="mainTitle" class="title">Bienvenido</h1>
        <div id="mainContainer">
            <p><--------------- Elija una opción del menú izquierdo para empezar.</p>
        </div>
    </main>

    <!-- Sidebar -->
    <?php include 'leftmenu.html'; ?>

    <!-- Toggle Sidebar Button -->
    <button class="fixed left-4 top-4 bg-blue-700 text-white p-2 rounded"
            onclick="toggleSidebar()">☰</button>

    <!-- Right-Side Panel -->
    <?php include 'rightmenu.html'; ?>

    <!-- Gear Icon to Open Settings Panel -->
    <button class="fixed right-4 top-4 bg-blue-700 text-white p-2 rounded z-50"
            onclick="toggleSettings()"><i class="fa fa-cog"></i></button>

    <!-- Footer -->
    <?php include 'footer.html'; ?>

    <!-- Change password modal -->
    <?php include 'changepassword.html'; ?>

    <!-- Patient ADD & EDIT modal -->
    <?php include 'patientmodal.html'; ?>

    <!-- Agenda modal -->
    <?php include 'agendamodal.html'; ?>

    <!-- End cita modal -->
    <?php include 'endcitamodal.html'; ?>

    <!-- Product ADD & EDIT modal -->
    <?php include 'productmodal.html'; ?>

    <!-- Pedido ADD modal -->
    <?php include 'pedidomodal.html'; ?>

    <!-- Pedido EDIT modal -->
    <?php include 'editpedidomodal.html'; ?>

    <!-- Bootstrap JS Bundle (includes Popper.js) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Your Custom JavaScript -->
    <script src="../JS/places.js"></script>
    <script src="../JS/patient.js"></script>
    <script src="../JS/agenda.js"></script>
    <script src="../JS/dashboard.js"></script>
    <script src="../JS/referrerdoctor.js"></script>
    <script src="../JS/assurance.js"></script>
    <script src="../JS/products.js"></script>
    <script src="../JS/pedidos.js"></script>
    <script src="../JS/mantenimiento.js"></script>
    <script src="../JS/pacienteproducto.js"></script>
</body>
</html>