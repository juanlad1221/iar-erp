#!/usr/bin/env node

/**
 * SCRIPT DE TESTING MANUAL - SISTEMA MASIVO DE NOTIFICACIONES
 * Fase 3: Verificación y Testing Completo
 * 
 * Ejecutar: node test-notificaciones-masivas.js
 */

const http = require('http');
const https = require('https');

// Configuración
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://tu-escuela-production.com' 
    : 'http://localhost:3000';

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`🔍 ${title}`, 'cyan');
    log('='.repeat(60), 'cyan');
}

function logTest(name, expected, actual) {
    const passed = expected === actual;
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    
    log(`${icon} ${name}: ${actual}`, color);
    
    if (!passed) {
        log(`   Expected: ${expected}`, 'yellow');
        log(`   Actual: ${actual}`, 'yellow');
    }
    
    return passed;
}

// Casos de prueba
const testCases = [
    {
        name: 'Envío masivo a tutores',
        formData: {
            titulo: 'Test Masivo Tutores',
            mensaje: 'Mensaje de prueba para todos los tutores - Fase 3 Testing',
            destino: { tipo: 'rol', valor: 'tutores' },
            duracion: 60,
            importancia: 'MEDIA',
            tipo: 'GENERAL'
        },
        expectedStatus: 200,
        expectedMinDestinatarios: 1
    },
    {
        name: 'Envío masivo a docentes',
        formData: {
            titulo: 'Test Masivo Docentes',
            mensaje: 'Mensaje de prueba para todos los docentes - Fase 3 Testing',
            destino: { tipo: 'rol', valor: 'docentes' },
            duracion: 60,
            importancia: 'ALTA',
            tipo: 'ACADEMICO'
        },
        expectedStatus: 200,
        expectedMinDestinatarios: 1
    },
    {
        name: 'Envío masivo a preceptores',
        formData: {
            titulo: 'Test Masivo Preceptores',
            mensaje: 'Mensaje de prueba para todos los preceptores - Fase 3 Testing',
            destino: { tipo: 'rol', valor: 'preceptores' },
            duracion: 60,
            importancia: 'BAJA',
            tipo: 'ADMINISTRATIVO'
        },
        expectedStatus: 200,
        expectedMinDestinatarios: 1
    },
    {
        name: 'Envío a rol sin usuarios (error)',
        formData: {
            titulo: 'Test Error Rol Sin Usuarios',
            mensaje: 'Este debería fallar - rol no existe',
            destino: { tipo: 'rol', valor: 'rol_inexistente' },
            duracion: 60
        },
        expectedStatus: 404
    },
    {
        name: 'Validación de campos requeridos (error)',
        formData: {
            titulo: '',
            mensaje: 'Mensaje sin título',
            destino: { tipo: 'rol', valor: 'tutores' },
            duracion: 60
        },
        expectedStatus: 400
    },
    {
        name: 'Test de performance - envío con duración larga',
        formData: {
            titulo: 'Test Performance Larga Duración',
            mensaje: 'Mensaje de prueba con duración extendida para verificar performance',
            destino: { tipo: 'rol', valor: 'tutores' },
            duracion: 1440, // 24 horas
            importancia: 'URGENTE',
            tipo: 'EVENTO'
        },
        expectedStatus: 200,
        expectedMinDestinatarios: 1
    }
];

// Función para hacer peticiones HTTP
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test principal
async function runTests() {
    logSection('INICIANDO TESTING COMPLETO - SISTEMA MASIVO DE NOTIFICACIONES');
    log(`URL Base: ${BASE_URL}`, 'blue');
    log(`Timestamp: ${new Date().toISOString()}`, 'blue');
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
        log(`\n🧪 Ejecutando: ${testCase.name}`, 'yellow');
        
        const startTime = Date.now();
        
        try {
            const response = await makeRequest(
                `${BASE_URL}/api/notificaciones`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                },
                testCase.formData
            );
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            log(`⏱️  Response Time: ${responseTime}ms`, responseTime < 2000 ? 'green' : 'yellow');
            
            // Test de status code
            const statusTest = logTest(
                'Status Code',
                testCase.expectedStatus,
                response.status
            );
            
            if (statusTest) passedTests++;
            
            // Tests adicionales para respuestas exitosas
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                
                if (testCase.expectedMinDestinatarios) {
                    const destinatariosTest = logTest(
                        'Destinatarios Mínimos',
                        `>= ${testCase.expectedMinDestinatarios}`,
                        data.destinatarios
                    );
                    if (destinatariosTest) passedTests++;
                }
                
                if (data.notificaciones) {
                    const notificacionesTest = logTest(
                        'Notificaciones Creadas',
                        data.destinatarios,
                        data.notificaciones
                    );
                    if (notificacionesTest) passedTests++;
                }
                
                if (data.responseTimeMs) {
                    const apiTimeTest = logTest(
                        'API Response Time < 2000ms',
                        true,
                        data.responseTimeMs < 2000
                    );
                    if (apiTimeTest) passedTests++;
                }
                
                log(`📊 Destinatarios: ${data.destinatarios}`, 'blue');
                log(`📈 Notificaciones: ${data.notificaciones}`, 'blue');
                log(`⚡ API Time: ${data.responseTimeMs}ms`, 'blue');
                
                if (data.usuarios && data.usuarios.length > 0) {
                    log(`👥 Usuarios afectados: ${data.usuarios.length}`, 'blue');
                    data.usuarios.slice(0, 3).forEach((user, i) => {
                        log(`   ${i + 1}. ${user.nombre} ${user.apellido} (ID: ${user.id})`, 'blue');
                    });
                    if (data.usuarios.length > 3) {
                        log(`   ... y ${data.usuarios.length - 3} más`, 'blue');
                    }
                }
            }
            
            // Tests para respuestas de error
            if (response.status >= 400) {
                if (response.data.error) {
                    log(`❌ Error Message: ${response.data.error}`, 'red');
                }
            }
            
        } catch (error) {
            log(`💥 Error en la petición: ${error.message}`, 'red');
            logTest('Sin errores de conexión', false, true);
        }
    }
    
    // Test de conteo de usuarios por rol
    logSection('TEST ADICIONAL - CONTEO DE USUARIOS POR ROL');
    
    try {
        const countResponse = await makeRequest(
            `${BASE_URL}/api/notificaciones/count-por-rol`,
            { method: 'GET' }
        );
        
        if (countResponse.status === 200 && countResponse.data.success) {
            log('✅ API de conteo funcionando', 'green');
            passedTests++;
            
            const counts = countResponse.data.data;
            log('\n📊 Usuarios activos por rol:', 'blue');
            
            Object.entries(counts).forEach(([rol, count]) => {
                log(`   ${rol}: ${count} usuarios`, 'blue');
            });
            
            // Validar que haya usuarios para testear
            const totalUsers = Object.values(counts).reduce((sum, count) => sum + count, 0);
            if (totalUsers > 0) {
                log(`✅ Total de usuarios activos: ${totalUsers}`, 'green');
                passedTests++;
            } else {
                log(`⚠️  No hay usuarios activos en el sistema`, 'yellow');
            }
        } else {
            log('❌ API de conteo fallando', 'red');
        }
    } catch (error) {
        log(`💥 Error en API de conteo: ${error.message}`, 'red');
    }
    
    // Resumen final
    logSection('RESUMEN FINAL DE TESTING');
    
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    log(`📊 Tests ejecutados: ${totalTests}`, 'blue');
    log(`✅ Tests exitosos: ${passedTests}`, 'green');
    log(`❌ Tests fallidos: ${totalTests - passedTests}`, 'red');
    log(`📈 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (successRate >= 80) {
        log('\n🎉 EL SISTEMA MASIVO DE NOTIFICACIONES ESTÁ FUNCIONANDO CORRECTAMENTE', 'green');
        log('✅ Fase 3 completada exitosamente', 'green');
    } else {
        log('\n⚠️  HAY PROBLEMAS QUE DEBEN SER RESUELTOS ANTES DE CONTINUAR', 'yellow');
        log('🔧 Revisar los tests fallidos y corregir los problemas', 'yellow');
    }
    
    log('\n📋 Próximos pasos manuales recomendados:', 'cyan');
    log('1. Verificar que los badges en los portales se actualicen cada 30 segundos', 'cyan');
    log('2. Probar marcar notificaciones como leídas en cada portal', 'cyan');
    log('3. Verificar responsive design en diferentes dispositivos', 'cyan');
    log('4. Probar concurrentemente varios envíos masivos', 'cyan');
    log('5. Verificar que no haya memory leaks en la aplicación', 'cyan');
    
    process.exit(successRate >= 80 ? 0 : 1);
}

// Ejecutar tests
if (require.main === module) {
    runTests().catch(error => {
        log(`💥 Error fatal en los tests: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runTests, testCases };