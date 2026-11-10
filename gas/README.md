# Configuración de Google Sheets + Apps Script para AgroFinance

Este directorio contiene el backend desacoplado en dos archivos `.gs`:

1. **[`Schema.gs`](file:///c:/Users/eugen/Desktop/Proyectos/AgroFinance/agrofinance/gas/Schema.gs)**: Define de forma declarativa todas las pestañas, columnas, tipos de dato y valores por defecto (`AGROFINANCE_SCHEMA`). Incluye el menú en Google Sheets y la función idempotente `initOrMigrateSchema()` para crear o actualizar columnas sin perder datos.
2. **[`Code.gs`](file:///c:/Users/eugen/Desktop/Proyectos/AgroFinance/agrofinance/gas/Code.gs)**: Implementa los endpoints `doGet` y `doPost` con `LockService` para sincronizar cuentas, movimientos (Negocio/Personal), cheques diferidos, compras en cuotas y flujo de caja proyectado.

---

## Paso a paso para conectar tu Google Sheet

1. Creá una planilla nueva en Google Sheets.
2. Andá a **Extensiones → Apps Script**.
3. Creá dos archivos en el editor de Apps Script:
   - Renombrá o creá `01_Schema.gs` y pegá todo el contenido de `gas/Schema.gs`.
   - Creá `02_Code.gs` y pegá todo el contenido de `gas/Code.gs`.
4. Guardá (`Ctrl + S`) y recargá la planilla de Google Sheets.
5. En el menú superior te aparecerá **AgroFinance**:
   - Hacé clic en **AgroFinance → 1. Inicializar / Actualizar Esquema** (autorizá los permisos la primera vez).
   - Esto crea todas las pestañas (`Config`, `Cuentas`, `Campanas`, `Categorias`, `Movimientos`, `Prestamos`, `Cuotas`, `Cheques`, `Presupuestos`) con sus cabeceras y formatos de texto/fecha.
   - *(Opcional)* Si querés probar con datos de ejemplo de Dani (Maní + Personal), ejecutá **AgroFinance → 3. Cargar Datos Demo**.
6. En Apps Script, hacé clic en **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (o según tu preferencia)
7. Copiá la URL terminada en `/exec` y pegala en el archivo `.env` de la raíz del proyecto:
   ```env
   EXPO_PUBLIC_GAS_URL=https://script.google.com/macros/s/TU_ID/exec
   ```
8. Reiniciá Expo (`npx expo start -c`) para que tome la variable `.env`.

## Cómo agregar columnas nuevas más adelante

1. Agregá el nombre de la nueva columna en `AGROFINANCE_SCHEMA.SHEETS.<Pestaña>.columns` (y su tipo/default en `types`/`defaults`) dentro de `01_Schema.gs`.
2. Guardá y ejecutá **AgroFinance → 1. Inicializar / Actualizar Esquema**.
3. La columna se agregará automáticamente al final de la cabecera y poblará valores por defecto sin romper registros previos.

