// SessionMonitor.js - Monitor de sesión por inactividad
// Estrategia: temporizador local + una sola petición al servidor cuando hace falta (sin polling cada 5 s)

(function() {
    'use strict';

    // Constantes (deben coincidir con el servidor: 20 min = 1200 s)
    var INACTIVITY_TIMEOUT_SEC = 1200;   // 20 minutos
    var INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_SEC * 1000;
    var WARNING_BEFORE_SEC = 15;         // Mostrar advertencia 15 s antes de expirar
    var WARNING_BEFORE_MS = WARNING_BEFORE_SEC * 1000;
    var EXTEND_DEBOUNCE_MS = 60000;      // Enviar "extend" como máximo cada 1 min al haber actividad
    var CHECK_WHEN_TAB_VISIBLE_MS = 60000; // Al volver a la pestaña, comprobar si han pasado > 1 min

    var SessionMonitor = {
        redirectUrl: '/Pipsa/GSO/authentication/layouts/corporate/sign-in.html',
        warningShown: false,
        countdownInterval: null,
        /** Temporizador único: se dispara cuando falta poco para expirar (sin polling). */
        expiryTimeoutId: null,
        /** Timestamp (ms) en que la sesión expirará según el servidor. */
        expiresAt: 0,
        /** Última vez que enviamos "extend" al servidor (para no hacer spam). */
        lastExtendSentAt: 0,
        /** Última actividad del usuario (solo para debounce de extend). */
        lastActivityAt: 0,
        isChecking: false,

        init: function() {
            this.setupActivityDetection();
            this.scheduleSingleCheck();
            document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
        },

        /**
         * Programa una única comprobación en el futuro (en lugar de un setInterval).
         * Se ejecutará cuando falte WARNING_BEFORE_MS para la expiración.
         */
        scheduleSingleCheck: function() {
            var self = this;
            if (this.expiryTimeoutId) {
                clearTimeout(this.expiryTimeoutId);
                this.expiryTimeoutId = null;
            }

            var now = Date.now();
            // Si aún no tenemos expiresAt (primera vez), pedir al servidor
            if (this.expiresAt <= now) {
                this.fetchSessionState(function(data) {
                    if (data.expired) {
                        self.handleSessionExpired();
                        return;
                    }
                    self.expiresAt = now + (data.time_remaining || INACTIVITY_TIMEOUT_SEC) * 1000;
                    self.scheduleSingleCheck();
                });
                return;
            }

            var msUntilWarning = this.expiresAt - now - WARNING_BEFORE_MS;
            if (msUntilWarning <= 0) {
                // Ya estamos en zona de aviso: comprobar con el servidor y mostrar aviso o redirigir
                this.checkAndShowWarningOrExpire();
                return;
            }

            this.expiryTimeoutId = setTimeout(function() {
                self.expiryTimeoutId = null;
                self.checkAndShowWarningOrExpire();
            }, msUntilWarning);
        },

        /**
         * Una sola petición al servidor para obtener estado de sesión.
         * @param {Function} callback - Recibe data con expired, valid, time_remaining, etc.
         */
        fetchSessionState: function(callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'Login/validar_sesion.php', true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                try {
                    var data = JSON.parse(xhr.responseText || '{}');
                    callback(data);
                } catch (e) {
                    callback({ valid: false });
                }
            };
            xhr.send();
        },

        /**
         * Cuando llega el momento de avisar: una petición al servidor, luego mostrar aviso o redirigir.
         */
        checkAndShowWarningOrExpire: function() {
            var self = this;
            if (this.isChecking) return;
            this.isChecking = true;

            this.fetchSessionState(function(data) {
                self.isChecking = false;
                if (data.expired) {
                    self.handleSessionExpired();
                    return;
                }
                var timeRemaining = data.time_remaining || 0;
                if (timeRemaining <= 0) {
                    self.handleSessionExpired();
                    return;
                }
                self.expiresAt = Date.now() + timeRemaining * 1000;
                if (timeRemaining <= WARNING_BEFORE_SEC && !self.warningShown) {
                    self.showWarning(timeRemaining);
                } else if (timeRemaining > WARNING_BEFORE_SEC) {
                    self.warningShown = false;
                    self.scheduleSingleCheck();
                }
            });
        },

        onVisibilityChange: function() {
            if (document.hidden) return;
            var now = Date.now();
            if (now - this.lastActivityAt < CHECK_WHEN_TAB_VISIBLE_MS) return;
            this.lastActivityAt = now;
            this.fetchSessionState(function(data) {
                if (data.expired) {
                    SessionMonitor.handleSessionExpired();
                    return;
                }
                SessionMonitor.expiresAt = now + (data.time_remaining || INACTIVITY_TIMEOUT_SEC) * 1000;
                SessionMonitor.scheduleSingleCheck();
            });
        },

        setupActivityDetection: function() {
            var self = this;
            self.lastActivityAt = Date.now();
            self.lastExtendSentAt = 0;

            var activityEvents = [
                'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click',
                'keydown', 'keyup', 'mouseup', 'touchmove', 'touchend'
            ];

            function onActivity() {
                var now = Date.now();
                self.lastActivityAt = now;
                self.scheduleSingleCheck();

                if (now - self.lastExtendSentAt < EXTEND_DEBOUNCE_MS) return;
                self.lastExtendSentAt = now;
                self.sendExtend();
            }

            activityEvents.forEach(function(ev) {
                document.addEventListener(ev, onActivity, true);
            });

            window.addEventListener('focus', function() {
                onActivity();
            });
        },

        sendExtend: function() {
            var self = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'Login/validar_sesion.php?extend=true', true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                try {
                    var data = JSON.parse(xhr.responseText || '{}');
                    if (data.valid && data.time_remaining) {
                        self.expiresAt = Date.now() + data.time_remaining * 1000;
                        self.scheduleSingleCheck();
                    }
                } catch (e) {}
            };
            xhr.send();
        },

        handleSessionValid: function(data) {
            var timeRemaining = data.time_remaining || 0;
            this.expiresAt = Date.now() + timeRemaining * 1000;
            if (timeRemaining <= WARNING_BEFORE_SEC && timeRemaining > 0 && !this.warningShown) {
                this.showWarning(timeRemaining);
            } else if (timeRemaining > WARNING_BEFORE_SEC) {
                this.warningShown = false;
                this.scheduleSingleCheck();
            }
        },

        handleSessionExpired: function() {
            if (this.expiryTimeoutId) {
                clearTimeout(this.expiryTimeoutId);
                this.expiryTimeoutId = null;
            }
            this.showExpiredMessage();
            var self = this;
            setTimeout(function() {
                window.location.href = self.redirectUrl + '?expirado=1';
            }, 2000);
        },

        handleSessionInvalid: function() {
            if (this.expiryTimeoutId) clearTimeout(this.expiryTimeoutId);
            this.expiryTimeoutId = null;
            window.location.href = this.redirectUrl;
        },

        showWarning: function(timeRemaining) {
            var self = this;
            this.warningShown = true;
            var seconds = Math.max(0, Math.ceil(timeRemaining));

            var modal = document.createElement('div');
            modal.id = 'session-warning-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;';
            modal.innerHTML = '<div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); text-align: center; max-width: 400px; margin: 1rem;"><h3 style="color: #f39c12; margin-bottom: 1rem;">Sesión por expirar</h3><p style="margin-bottom: 1.5rem;">Su sesión expirará en <strong id="countdown-timer" style="color: #e74c3c; font-size: 1.2em;">' + seconds + '</strong> segundos.<br>¿Desea extender su sesión?</p><div style="display: flex; gap: 1rem; justify-content: center;"><button id="extend-session" style="background: #27ae60; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Extender Sesión</button><button id="logout-now" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Cerrar Sesión</button></div></div>';
            document.body.appendChild(modal);

            this.startCountdown(seconds);

            document.getElementById('extend-session').addEventListener('click', function() {
                self.stopCountdown();
                self.extendSession();
            });
            document.getElementById('logout-now').addEventListener('click', function() {
                self.stopCountdown();
                self.logout();
            });
        },

        startCountdown: function(initialSeconds) {
            var self = this;
            var seconds = initialSeconds;
            this.stopCountdown();
            var modal = document.getElementById('session-warning-modal');
            if (!modal) return;
            this.updateCountdownDisplay(seconds);

            this.countdownInterval = setInterval(function() {
                if (!document.getElementById('session-warning-modal')) {
                    self.stopCountdown();
                    return;
                }
                seconds--;
                self.updateCountdownDisplay(seconds);
                if (seconds <= 0) {
                    self.stopCountdown();
                    self.handleSessionExpired();
                }
            }, 1000);
        },

        stopCountdown: function() {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        },

        updateCountdownDisplay: function(seconds) {
            var el = document.getElementById('countdown-timer');
            if (!el) return;
            el.textContent = seconds;
            el.style.color = seconds <= 5 ? '#e74c3c' : (seconds <= 10 ? '#f39c12' : '#e74c3c');
            if (seconds <= 5) el.style.fontWeight = 'bold';
        },

        extendSession: function() {
            this.stopCountdown();
            this.hideWarningModal();
            this.warningShown = false;

            var self = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'Login/validar_sesion.php?extend=true', true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                try {
                    var data = JSON.parse(xhr.responseText || '{}');
                    if (data.valid && data.time_remaining) {
                        self.expiresAt = Date.now() + data.time_remaining * 1000;
                        self.lastExtendSentAt = Date.now();
                    }
                } catch (e) {}
                self.scheduleSingleCheck();
            };
            xhr.send();
        },

        logout: function() {
            this.hideWarningModal();
            window.location.href = 'Login/Logout.php';
        },

        hideWarningModal: function() {
            this.stopCountdown();
            var modal = document.getElementById('session-warning-modal');
            if (modal) modal.remove();
            this.warningShown = false;
        },

        showExpiredMessage: function() {
            var modal = document.createElement('div');
            modal.id = 'session-expired-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;';
            modal.innerHTML = '<div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); text-align: center; max-width: 400px; margin: 1rem;"><h3 style="color: #e74c3c; margin-bottom: 1rem;">Sesión Expirada</h3><p style="margin-bottom: 1.5rem;">Su sesión ha expirado por inactividad.<br>Será redirigido al login en unos segundos...</p><div style="width: 100%; background: #ecf0f1; border-radius: 4px; overflow: hidden;"><div id="progress-bar" style="height: 4px; background: #e74c3c; width: 0%; transition: width 2s ease-in-out;"></div></div></div>';
            document.body.appendChild(modal);
            setTimeout(function() {
                var bar = document.getElementById('progress-bar');
                if (bar) bar.style.width = '100%';
            }, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { SessionMonitor.init(); });
    } else {
        SessionMonitor.init();
    }

    window.SessionMonitor = SessionMonitor;
})();
