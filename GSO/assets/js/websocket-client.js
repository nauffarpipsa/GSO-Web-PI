/**
 * Cliente WebSocket para monitoreo de sesiones
 * Conecta con el servidor Socket.IO y gestiona la sesión del usuario
 */

class SessionMonitor {
  constructor(serverUrl = 'http://192.168.10.80:4002') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.sessionId = null;
    this.userId = null;
    this.isConnected = false;
    
    // Callbacks para eventos
    this.onSessionClosed = null;
    this.onNewSession = null;
    this.onSessionUpdate = null;
    this.onAnnouncement = null;
  }

  /**
   * Conecta al servidor WebSocket
   */
  connect(sessionId, userId, userData = {}) {
    if (this.isConnected) {
      console.warn('Ya hay una conexión activa, reconectando...');
      this.disconnect();
    }

    // Importar Socket.IO desde CDN o usar la versión local
    if (typeof io === 'undefined') {
      console.error('Socket.IO no está cargado. Asegúrate de incluir: <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>');
      return;
    }

    // Validación estricta de parámetros
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      console.error('sessionId es requerido y debe ser una cadena válida');
      return;
    }

    if (!userId || userId === 'guest' || userId === null || userId === undefined || userId === '') {
      console.error('userId es requerido y no puede ser guest, null, undefined o vacío. Valor recibido:', userId);
      return;
    }

    // Normalizar userId a string
    const userIdStr = String(userId).trim();
    if (userIdStr === '' || userIdStr === 'guest') {
      console.error('userId inválido después de normalización:', userIdStr);
      return;
    }

    this.sessionId = sessionId.trim();
    this.userId = userIdStr;
    
    // Obtener información del navegador
    const browserInfo = this.getBrowserInfo();

    // Conectar al servidor
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false // Reutilizar conexión si existe
    });

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
      this.isConnected = true;
      
      // Registrar la sesión en el servidor con los valores normalizados
      this.registerSession(this.sessionId, this.userId, {
        ...userData,
        userAgent: browserInfo.userAgent,
        browser: browserInfo.browser
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      this.isConnected = false;
      
      // Si el error contiene información sobre límite de sesiones
      if (error && error.message && error.message.includes('Límite de sesiones')) {
        this.handleSessionRejected({
          reason: 'Límite de sesiones alcanzado',
          message: error.message
        });
      }
    });

    // Manejar rechazo de sesión por límite alcanzado
    this.socket.on('session:rejected', (data) => {
      console.error('Sesión rechazada:', data);
      this.handleSessionRejected(data);
    });

    // Manejar errores del servidor
    this.socket.on('error', (error) => {
      console.error('Error del servidor:', error);
      if (error && error.message && error.message.includes('Límite de sesiones')) {
        this.handleSessionRejected({
          reason: 'Límite de sesiones alcanzado',
          message: error.message
        });
      }
    });

    // Eventos de sesión
    this.socket.on('session:registered', (data) => {
      if (this.onSessionUpdate) {
        this.onSessionUpdate(data);
      }
    });

    this.socket.on('session:force-logout', (data) => {
      console.warn('Sesión cerrada por administrador:', data);
      if (this.onSessionClosed) {
        this.onSessionClosed(data);
      }
      this.disconnect();
      // Redirigir al usuario o mostrar mensaje
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión Cerrada',
          text: 'Tu sesión ha sido cerrada: ' + (data.reason || 'Sesión cerrada por administrador'),
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          window.location.href = '/Corporativo/GSO/Login/Logout.php';
        });
      } else {
        alert('Tu sesión ha sido cerrada: ' + (data.reason || ''));
        window.location.href = '/Corporativo/GSO/Login/Logout.php';
      }
    });

    this.socket.on('session:closed', (data) => {
      if (this.onNewSession && data.sessionId !== this.sessionId) {
        this.onNewSession(data);
      }
    });

    this.socket.on('session:new', (data) => {
      if (this.onNewSession && data.sessionId !== this.sessionId) {
        this.onNewSession(data);
      }
    });

    // Manejar anuncios del servidor
    this.socket.on('announcement', (data) => {
      if (this.onAnnouncement) {
        this.onAnnouncement(data);
      }
    });

    // Mantener conexión activa con ping
    this.socket.on('pong', () => {
      // Conexión activa
    });

    // Ping cada 30 segundos para mantener la conexión activa
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  /**
   * Obtiene información del navegador del usuario
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (ua.indexOf('Edg') > -1) {
      browser = 'Edge';
    } else if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) {
      browser = 'Opera';
    } else if (ua.indexOf('Chrome') > -1) {
      // Brave se basa en Chrome, pero tiene una API especial
      if (navigator.brave !== undefined) {
        browser = 'Brave';
      } else {
        browser = 'Chrome';
      }
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari';
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browser = 'IE';
    }
    
    return {
      userAgent: ua,
      browser: browser
    };
  }

  /**
   * Registra la sesión en el servidor
   */
  registerSession(sessionId, userId, userData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('session:register', {
        sessionId: sessionId,
        userId: userId,
        userData: userData
      });
    }
  }

  /**
   * Cierra la sesión
   */
  logout(reason = 'Logout manual') {
    if (this.socket && this.sessionId) {
      this.socket.emit('session:logout', {
        sessionId: this.sessionId,
        reason: reason
      });
    }
    this.disconnect();
  }

  /**
   * Desconecta del servidor
   */
  disconnect() {
    // Limpiar intervalo de ping
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Obtiene el estado de la conexión
   */
  getStatus() {
    return {
      connected: this.isConnected,
      sessionId: this.sessionId,
      userId: this.userId
    };
  }

  /**
   * Maneja el rechazo de sesión (por ejemplo, cuando se alcanza el límite de 500 sesiones)
   */
  handleSessionRejected(data) {
    const reason = data.reason || 'Conexión rechazada';
    const message = data.message || `El servidor ha rechazado la conexión: ${reason}`;
    const maxSessions = data.maxSessions || 500;
    const currentSessions = data.currentSessions || 0;

    // Desconectar el socket
    this.disconnect();

    // Mostrar mensaje de error al usuario
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Conexión Rechazada',
        html: `<p>${message}</p>` +
          `<p class="text-muted mt-2">Razón: ${reason}<br>` +
          `El servidor ha alcanzado el límite máximo de ${maxSessions} sesiones activas.<br>` +
          `Sesiones actuales: ${currentSessions}</p>` +
          `<p class="mt-2">Por favor, intente más tarde o contacte al administrador del sistema.</p>`,
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    } else {
      const errorMessage = `No se pudo conectar al servidor de sesiones.\n\n` +
        `Razón: ${reason}\n` +
        `El servidor ha alcanzado el límite máximo de ${maxSessions} sesiones activas.\n` +
        `Sesiones actuales: ${currentSessions}\n\n` +
        `Por favor, intente más tarde o contacte al administrador del sistema.`;
      alert(errorMessage);
    }

    // Opcional: redirigir al login después de un tiempo
    // setTimeout(() => {
    //   window.location.href = '/Corporativo/GSO/Login/Logout.php';
    // }, 5000);
  }
}

// Exportar para uso global o como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionMonitor;
}

// Crear alias para retrocompatibilidad
if (typeof window !== 'undefined') {
  window.SessionMonitor = SessionMonitor;
  window.WebSocketSessionMonitor = SessionMonitor; // Alias para código antiguo
}

