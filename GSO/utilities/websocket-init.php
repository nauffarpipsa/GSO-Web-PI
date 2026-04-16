<!-- Socket.IO para WebSocket -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<!-- Cliente WebSocket -->
<script src="assets/js/websocket-client.js"></script>
<script>
    // Variable global para el contador de mantenimiento (definir antes de las funciones)
    let maintenanceCountdownInterval = null;
    let maintenanceCountdownTimeLeft = 0;
    let maintenanceAnnouncementId = null;
    let maintenanceStartTime = null;
    let maintenanceTotalSeconds = 0; // Tiempo total original en segundos
    
    // Función para guardar el estado del contador en localStorage
    function guardarEstadoContador() {
        if (maintenanceCountdownTimeLeft > 0 && maintenanceStartTime) {
            const estado = {
                timeLeft: maintenanceCountdownTimeLeft,
                totalSeconds: maintenanceTotalSeconds, // Guardar tiempo total original
                startTime: maintenanceStartTime,
                announcementId: maintenanceAnnouncementId
            };
            localStorage.setItem('maintenanceCountdown', JSON.stringify(estado));
        } else {
            localStorage.removeItem('maintenanceCountdown');
        }
    }
    
    // Función para recuperar el estado del contador desde localStorage
    function recuperarEstadoContador() {
        try {
            const estadoStr = localStorage.getItem('maintenanceCountdown');
            if (estadoStr) {
                const estado = JSON.parse(estadoStr);
                const elapsed = Math.floor((Date.now() - estado.startTime) / 1000);
                // Calcular tiempo restante basado en el tiempo total original y el tiempo transcurrido
                const totalSeconds = estado.totalSeconds || estado.timeLeft; // Compatibilidad con versiones anteriores
                const timeLeft = Math.max(0, totalSeconds - elapsed);
                
                if (timeLeft > 0) {
                    maintenanceCountdownTimeLeft = timeLeft;
                    maintenanceTotalSeconds = totalSeconds; // Guardar tiempo total original
                    maintenanceStartTime = estado.startTime; // Mantener el tiempo de inicio original
                    maintenanceAnnouncementId = estado.announcementId;
                    return true;
                } else {
                    // El contador ya expiró, limpiar
                    localStorage.removeItem('maintenanceCountdown');
                }
            }
        } catch (e) {
            console.error('Error al recuperar estado del contador:', e);
            localStorage.removeItem('maintenanceCountdown');
        }
        return false;
    }
    
    // Función para actualizar el texto del contador
    function actualizarContadorMantenimiento(countdownText) {
        if (!countdownText) return;
        
        const minutes = Math.floor(maintenanceCountdownTimeLeft / 60);
        const seconds = maintenanceCountdownTimeLeft % 60;
        
        // Formato MM:SS
        countdownText.textContent = 
            (minutes < 10 ? '0' : '') + minutes + ':' + 
            (seconds < 10 ? '0' : '') + seconds;
        
        // Cambiar color cuando quedan menos de 2 minutos
        const badge = document.getElementById('maintenance-countdown-badge');
        if (badge) {
            if (maintenanceCountdownTimeLeft <= 120) { // 2 minutos
                badge.classList.remove('badge-danger');
                badge.classList.add('badge-warning');
            } else {
                badge.classList.remove('badge-warning');
                badge.classList.add('badge-danger');
            }
        }
    }
    
    // Función para iniciar el contador en el header
    function iniciarContadorMantenimiento(gracePeriodMinutes, announcementId) {
        // Primero, intentar recuperar el estado desde localStorage
        const estadoGuardado = recuperarEstadoContador();
        
        // Si ya hay un contador activo con el mismo anuncio, no reiniciar
        if (estadoGuardado && maintenanceAnnouncementId === announcementId && maintenanceCountdownTimeLeft > 0) {
            // Solo asegurarse de que el badge esté visible y el intervalo esté corriendo
            const badge = document.getElementById('maintenance-countdown-badge');
            const countdownText = document.getElementById('maintenance-countdown-text');
            
            if (badge && countdownText) {
                badge.classList.remove('d-none');
                actualizarContadorMantenimiento(countdownText);
                
                // Reiniciar el intervalo si no está corriendo
                if (!maintenanceCountdownInterval) {
                    maintenanceCountdownInterval = setInterval(function() {
                        // Recalcular el tiempo restante basado en el tiempo de inicio original
                        const elapsed = Math.floor((Date.now() - maintenanceStartTime) / 1000);
                        maintenanceCountdownTimeLeft = Math.max(0, maintenanceTotalSeconds - elapsed);
                        
                        actualizarContadorMantenimiento(countdownText);
                        guardarEstadoContador();
                        
                        if (maintenanceCountdownTimeLeft <= 0) {
                            clearInterval(maintenanceCountdownInterval);
                            maintenanceCountdownInterval = null;
                            localStorage.removeItem('maintenanceCountdown');
                            
                            // Cerrar sesión automáticamente (fallback)
                            console.warn('Tiempo de mantenimiento completado, cerrando sesión...');
                            ocultarContadorMantenimiento();
                            
                            if (typeof Swal !== 'undefined') {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Mantenimiento',
                                    text: 'El tiempo de gracia ha terminado. Tu sesión será cerrada.',
                                    confirmButtonText: 'Entendido',
                                    allowOutsideClick: false,
                                    allowEscapeKey: false
                                }).then(() => {
                                    window.location.href = '/Pipsa/GSO/Login/Logout.php';
                                });
                            } else {
                                if (typeof Swal !== 'undefined') {
                                    Swal.fire({
                                        icon: 'warning',
                                        title: 'Mantenimiento',
                                        text: 'El tiempo de gracia ha terminado. Tu sesión será cerrada.',
                                        confirmButtonText: 'Entendido',
                                        allowOutsideClick: false,
                                        allowEscapeKey: false
                                    }).then(() => {
                                        window.location.href = '/Pipsa/GSO/Login/Logout.php';
                                    });
                                } else {
                                    alert('El tiempo de gracia ha terminado. Tu sesión será cerrada.');
                                    window.location.href = '/Pipsa/GSO/Login/Logout.php';
                                }
                            }
                        }
                    }, 1000);
                }
            }
            return; // Usar el estado existente, no reiniciar
        }
        
        // Si hay un contador activo con un anuncio diferente, limpiarlo primero
        if (maintenanceCountdownInterval) {
            clearInterval(maintenanceCountdownInterval);
            maintenanceCountdownInterval = null;
        }
        
        // Si no hay estado guardado o es un anuncio diferente, iniciar nuevo contador
        // Convertir minutos a segundos
        maintenanceTotalSeconds = gracePeriodMinutes * 60;
        maintenanceCountdownTimeLeft = maintenanceTotalSeconds;
        maintenanceStartTime = Date.now();
        maintenanceAnnouncementId = announcementId;
        
        // Guardar estado en localStorage
        guardarEstadoContador();
        
        // Mostrar el badge
        const badge = document.getElementById('maintenance-countdown-badge');
        const countdownText = document.getElementById('maintenance-countdown-text');
        
        if (badge && countdownText) {
            badge.classList.remove('d-none');
            
            // Actualizar inmediatamente
            actualizarContadorMantenimiento(countdownText);
            
            // Iniciar intervalo de actualización cada segundo
            maintenanceCountdownInterval = setInterval(function() {
                // Recalcular el tiempo restante basado en el tiempo de inicio original
                const elapsed = Math.floor((Date.now() - maintenanceStartTime) / 1000);
                maintenanceCountdownTimeLeft = Math.max(0, maintenanceTotalSeconds - elapsed);
                
                actualizarContadorMantenimiento(countdownText);
                guardarEstadoContador(); // Guardar estado actualizado
                
                // Si llegó a 0, cerrar sesión automáticamente (fallback si el servidor no lo hace)
                if (maintenanceCountdownTimeLeft <= 0) {
                    clearInterval(maintenanceCountdownInterval);
                    maintenanceCountdownInterval = null;
                    localStorage.removeItem('maintenanceCountdown');
                    
                    // Cerrar sesión automáticamente
                    console.warn('Tiempo de mantenimiento completado, cerrando sesión...');
                    ocultarContadorMantenimiento();
                    
                    // Mostrar mensaje y redirigir
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Mantenimiento',
                            text: 'El tiempo de gracia ha terminado. Tu sesión será cerrada.',
                            confirmButtonText: 'Entendido',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        }).then(() => {
                            window.location.href = '/Pipsa/GSO/Login/Logout.php';
                        });
                    } else {
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Mantenimiento',
                                text: 'El tiempo de gracia ha terminado. Tu sesión será cerrada.',
                                confirmButtonText: 'Entendido',
                                allowOutsideClick: false,
                                allowEscapeKey: false
                            }).then(() => {
                                window.location.href = '/Pipsa/GSO/Login/Logout.php';
                            });
                        } else {
                            alert('El tiempo de gracia ha terminado. Tu sesión será cerrada.');
                            window.location.href = '/Pipsa/GSO/Login/Logout.php';
                        }
                    }
                }
            }, 1000);
        }
    }
    
    // Función para ocultar el contador
    function ocultarContadorMantenimiento() {
        if (maintenanceCountdownInterval) {
            clearInterval(maintenanceCountdownInterval);
            maintenanceCountdownInterval = null;
        }
        maintenanceCountdownTimeLeft = 0;
        maintenanceTotalSeconds = 0;
        maintenanceStartTime = null;
        maintenanceAnnouncementId = null;
        localStorage.removeItem('maintenanceCountdown');
        
        const badge = document.getElementById('maintenance-countdown-badge');
        if (badge) {
            badge.classList.add('d-none');
        }
    }
    
    // Inicializar WebSocket Monitor
    document.addEventListener('DOMContentLoaded', function() {
        // Recuperar estado del contador de mantenimiento si existe
        if (recuperarEstadoContador()) {
            const badge = document.getElementById('maintenance-countdown-badge');
            const countdownText = document.getElementById('maintenance-countdown-text');
            if (badge && countdownText) {
                badge.classList.remove('d-none');
                actualizarContadorMantenimiento(countdownText);
                
                // Reiniciar el intervalo
                maintenanceCountdownInterval = setInterval(function() {
                    // Recalcular el tiempo restante basado en el tiempo de inicio original
                    const elapsed = Math.floor((Date.now() - maintenanceStartTime) / 1000);
                    maintenanceCountdownTimeLeft = Math.max(0, maintenanceTotalSeconds - elapsed);
                    
                    actualizarContadorMantenimiento(countdownText);
                    guardarEstadoContador();
                    
                    if (maintenanceCountdownTimeLeft <= 0) {
                        clearInterval(maintenanceCountdownInterval);
                        maintenanceCountdownInterval = null;
                        localStorage.removeItem('maintenanceCountdown');
                    }
                }, 1000);
            }
        }
        
        const sessionId = '<?php echo session_id(); ?>';
        const userId = '<?php echo $_SESSION['employeeCode'] ?? ''; ?>';
        const username = '<?php echo htmlspecialchars($_SESSION['userName'] ?? 'Usuario', ENT_QUOTES); ?>';
        const employeeCode = '<?php echo $_SESSION['employeeCode'] ?? ''; ?>';
        const email = '<?php echo htmlspecialchars($_SESSION['email'] ?? '', ENT_QUOTES); ?>';
        const department = '<?php echo htmlspecialchars($_SESSION['department'] ?? '', ENT_QUOTES); ?>';
        
        if (sessionId && userId) {
            const wsMonitor = new SessionMonitor('http://192.168.10.81:4002');
            wsMonitor.connect(sessionId, userId, {
                username: username,
                employeeCode: employeeCode,
                email: email,
                department: department,
                page: window.location.pathname,
                pageName: document.title || window.location.pathname.split('/').pop(),
                company: '<?php echo $_SESSION['company'] ?? ''; ?>',
                country: '<?php echo $_SESSION['country'] ?? ''; ?>',
                timestamp: new Date().toISOString()
            });
            
            // Manejar cierre de sesión remoto
            wsMonitor.onSessionClosed = function(data) {
                console.warn('Sesión cerrada remotamente');
                // Limpiar contador de mantenimiento
                ocultarContadorMantenimiento();
                window.location.href = '/Pipsa/GSO/Login/Logout.php';
            };
            
            // Manejar anuncios del servidor
            wsMonitor.onAnnouncement = function(announcement) {
                mostrarAnuncio(announcement);
            };
            
            // Limpiar contador al desconectar (después de que el socket esté conectado)
            setTimeout(function() {
                if (wsMonitor.socket) {
                    wsMonitor.socket.on('disconnect', function() {
                        ocultarContadorMantenimiento();
                    });
                }
            }, 1000);
            
            // Hacer disponible globalmente
            window.wsMonitor = wsMonitor;
        }
        
        // Limpiar contador al cerrar la página
        window.addEventListener('beforeunload', function() {
            if (maintenanceCountdownInterval) {
                clearInterval(maintenanceCountdownInterval);
            }
        });
        
        // Función para verificar si un anuncio ya se ha mostrado
        function anuncioYaMostrado(announcementId) {
            try {
                const anunciosMostrados = JSON.parse(localStorage.getItem('announcementsShown') || '[]');
                return anunciosMostrados.includes(announcementId);
            } catch (e) {
                return false;
            }
        }
        
        // Función para marcar un anuncio como mostrado
        function marcarAnuncioComoMostrado(announcementId) {
            try {
                const anunciosMostrados = JSON.parse(localStorage.getItem('announcementsShown') || '[]');
                if (!anunciosMostrados.includes(announcementId)) {
                    anunciosMostrados.push(announcementId);
                    localStorage.setItem('announcementsShown', JSON.stringify(anunciosMostrados));
                }
            } catch (e) {
                console.error('Error al marcar anuncio como mostrado:', e);
            }
        }
        
        // Función para mostrar anuncios al usuario
        function mostrarAnuncio(announcement) {
            const announcementId = announcement.id;
            const type = announcement.type || 'info';
            const title = announcement.title || 'Anuncio';
            const message = announcement.message || '';
            const gracePeriod = announcement.gracePeriod;
            // Verificar closeSessionsAfter de diferentes formas (puede venir como boolean, string, o número)
            const closeSessionsAfter = announcement.closeSessionsAfter === true || 
                                      announcement.closeSessionsAfter === 'true' || 
                                      announcement.closeSessionsAfter === 1 || 
                                      announcement.closeSessionsAfter === '1';
            
            // Si es un anuncio de mantenimiento con cierre automático, iniciar contador en header
            // (Esto se hace siempre, incluso si ya se mostró el alert)
            if (type === 'maintenance' && closeSessionsAfter === true && gracePeriod && gracePeriod > 0) {
                iniciarContadorMantenimiento(gracePeriod, announcementId);
            }
            
            // Verificar si el anuncio ya se ha mostrado antes
            if (anuncioYaMostrado(announcementId)) {
                return; // No mostrar el alert si ya se mostró antes
            }
            
            // Determinar icono y color según el tipo
            let icon = 'info';
            let color = 'primary';
            
            switch(type) {
                case 'success':
                    icon = 'check-circle';
                    color = 'success';
                    break;
                case 'warning':
                    icon = 'information-5';
                    color = 'warning';
                    break;
                case 'error':
                    icon = 'cross-circle';
                    color = 'danger';
                    break;
                case 'maintenance':
                    icon = 'setting-2';
                    color = 'warning';
                    break;
                default:
                    icon = 'information-5';
                    color = 'info';
            }
            
            // Si tiene tiempo de gracia, mostrar countdown en el modal también
            let messageHtml = message;
            if (gracePeriod && gracePeriod > 0) {
                const minutes = gracePeriod;
                messageHtml += '<br><small class="text-muted mt-2">Tiempo de gracia: <strong id="announcement-countdown-' + announcementId + '">' + minutes + ' minutos</strong></small>';
            }
            
            // Usar SweetAlert2 si está disponible, sino usar alert nativo
            if (typeof Swal !== 'undefined') {
                // SweetAlert2 no soporta 'maintenance', usar 'warning' en su lugar
                let swalIcon = type;
                if (type === 'maintenance') {
                    swalIcon = 'warning';
                }
                
                Swal.fire({
                    icon: swalIcon,
                    title: title,
                    html: messageHtml,
                    confirmButtonText: 'Entendido',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    customClass: {
                        popup: 'swal2-popup-' + color
                    },
                    didOpen: () => {
                        // Iniciar countdown en el modal si hay tiempo de gracia
                        if (gracePeriod && gracePeriod > 0) {
                            let timeLeft = gracePeriod * 60; // Convertir a segundos
                            const countdownElement = document.getElementById('announcement-countdown-' + announcementId);
                            
                            const countdownInterval = setInterval(() => {
                                timeLeft--;
                                const minutes = Math.floor(timeLeft / 60);
                                const seconds = timeLeft % 60;
                                
                                if (countdownElement) {
                                    countdownElement.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                                }
                                
                                if (timeLeft <= 0) {
                                    clearInterval(countdownInterval);
                                }
                            }, 1000);
                        }
                    }
                }).then(() => {
                    // Marcar el anuncio como mostrado después de cerrar el alert
                    marcarAnuncioComoMostrado(announcementId);
                });
            } else {
                // Fallback a SweetAlert2 o alert nativo
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: iconType,
                        title: title,
                        html: message + (gracePeriod ? '<br><br><strong>Tiempo de gracia:</strong> ' + gracePeriod + ' minutos' : ''),
                        confirmButtonText: 'Entendido',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then(() => {
                        marcarAnuncioComoMostrado(announcementId);
                    });
                } else {
                    alert(title + '\n\n' + message + (gracePeriod ? '\n\nTiempo de gracia: ' + gracePeriod + ' minutos' : ''));
                    marcarAnuncioComoMostrado(announcementId);
                }
            }
        }
    });
</script>

