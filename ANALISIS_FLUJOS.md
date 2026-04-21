# 📊 ANÁLISIS ARQUITECTÓNICO COMPLETO - KardexChio

**Fecha**: 2026-04-21  
**Sistema**: Kardex para Constructora  
**Estado**: En desarrollo - Análisis previo a mejoras

---

## 🏗️ ARQUITECTURA ACTUAL

### Base de Datos (13 Tablas)
```
Gestión de Personas:
├── usuarios (ADMIN, ALMACENERO, SUPERVISOR)
├── personas (PROVEEDOR, TRABAJADOR, TRANSPORTISTA)
└── frentes_trabajo (Obras/locales donde va material)

Catálogo:
├── categorias (Ferretería, Pintura, Eléctrico, etc)
├── unidades_medida (kg, m, pcs, l, etc)
└── medios_transporte (Camión, Moto, A pie, etc)

Inventario:
├── recursos (Materiales: Cemento, Clavo, etc)
└── equipos (Herramientas: Taladro, Grúa, etc)

Movimientos:
├── entradas (Material que ENTRA al almacén)
├── salidas (Material que SALE hacia frentes)
├── salida_equipos (Checkout de herramientas)
├── entrada_equipos (Devolución de herramientas)
└── movimientos (Audit trail de TODOS los movimientos)
```

---

## 🔄 FLUJOS ACTUALES

### FLUJO 1: ENTRADA DE RECURSOS
```
1. ALMACENERO entra a /dashboard/recursos/EntradasTab
   ↓
2. Click "Nueva Entrada" → Modal
   ↓
3. Completa:
   - Fecha (TIMESTAMP)
   - Recurso (dropdown activos)
   - Cantidad (decimal)
   - Num Guía (ej: OC-2026-001)
   - Quién Entrega (dropdown personas PROVEEDOR)
   - Quién Recibe (dropdown personas TRABAJADOR)
   - Medio Transporte (dropdown)
   ↓
4. Valida cantidad > 0 en frontend
   ↓
5. POST /api/entradas
   Backend: Crea registro en tabla 'entradas'
            Crea automáticamente registro en 'movimientos'
   ↓
6. ✓ Recurso ahora aparece en inventario
   ✓ Movimiento registrado para auditoría
```

### FLUJO 2: SALIDA DE RECURSOS
```
1. ALMACENERO entra a /dashboard/recursos/SalidasTab
   ↓
2. Click "Nueva Salida" → Modal
   ↓
3. Completa:
   - Fecha
   - Recurso
   - Cantidad (VALIDA: cantidad <= existencia_actual)
   - Num Registro (ej: S-2026-001)
   - Frente Trabajo (dropdown - a dónde va)
   - Descripción Trabajo (qué se hace)
   - Quién Entrega / Quién Recibe
   ↓
4. POST /api/salidas + validación stock
   Backend: Valida cantidad disponible
            Crea registro en 'salidas'
            Crea automáticamente en 'movimientos'
   ↓
5. ✓ Stock se reduce automáticamente en vista 'inventario'
   ✓ Material vinculado a frente específico
```

### FLUJO 3: EQUIPOS (Checkout System)
```
SALIDA EQUIPO:
1. ALMACENERO → /dashboard/gestion-equipos/SalidaEquiposTab
2. Completa: Equipo, Cantidad, Fecha, Descripción
3. POST /api/salida-equipos
   → Estado equipo: EN_ALMACEN → SALIDA
   → Registro en movimientos

ENTRADA EQUIPO (Devolución):
1. ALMACENERO → /dashboard/gestion-equipos/EntradaEquiposTab
2. Completa: Equipo, Cantidad, Fecha, Descripción
3. POST /api/entrada-equipos
   → Estado equipo: SALIDA → EN_ALMACEN
   → Registro en movimientos
```

### FLUJO 4: AUDITORIA
```
/dashboard/movimientos (Solo lectura)
├── Muestra TODOS los movimientos (ENTRADA, SALIDA, ENTRADA_EQUIPO, SALIDA_EQUIPO)
├── Filtra por: tipo, rango fechas
├── Ordenado: fecha DESC (más reciente primero)
└── Mostra: quien registró (usuario)
```

---

## 🔴 **PROBLEMAS IDENTIFICADOS**

### CRÍTICOS (Afectan operación diaria)

| # | Problema | Impacto | Ejemplo |
|---|----------|--------|---------|
| **P1** | **Dos tablas separadas: ENTRADAS vs SALIDAS** | Lógica duplicada, difícil mantener | Validación existe en 2 servicios |
| **P2** | **Stock NO se actualiza automáticamente en Recursos** | Gerente ve datos desactualizados | Entrada 100 cajas → tabla recursos sigue igual |
| **P3** | **No hay "existencia_actual" en tabla recursos** | Cálculo lento (N queries) | Cada búsqueda suma entradas - salidas |
| **P4** | **Validación de stock SOLO en salida** | ¿Qué pasa si stock = -5? | Sistema permite oversell |
| **P5** | **Personas vs Usuarios confundidas** | BD tiene 2 sistemas de gente | Personas (proveedores) ≠ Usuarios (internos) |
| **P6** | **Equipo estado: solo 3 valores** | No sabe dónde está exactamente | EN_ALMACEN ✓, SALIDA ✓, pero ¿En qué frente? |

### IMPORTANTES (Afectan productividad)

| # | Problema | Impacto |
|----|----------|--------|
| **I1** | Crear entrada requiere seleccionar "quién entrega" + "quién recibe" | UX tedioso, toma 30 segundos por entrada |
| **I2** | No hay "lotes" o "grupos" de entrada | Entrada de 50 items = 50 registros |
| **I3** | No hay "archivos adjuntos" a movimientos | OC/Boleta solo en "num_guia" texto |
| **I4** | Equipos sin historial de ubicación | No sabe dónde estuvo un taladro en abril |
| **I5** | No hay "devolucion parcial" de equipo | Checkea 5 herramientas, devuelve 4 → error |

### DISEÑO (UX/Frontend)

| # | Problema | Impacto |
|---|----------|--------|
| **D1** | Modales gigantes con 8+ campos | Confusión, errores de captura |
| **D2** | No hay confirmación visual antes de guardar | Click accidental = dato duplicado |
| **D3** | Dropdowns de personas muy largos (100+ registros) | Imposible buscar a quien entrega |
| **D4** | No hay busqueda en dropdowns select | Debe scrollear 500 items |
| **D5** | Campos de fecha/hora separados | Complica sincronización |

---

## 📈 **OPORTUNIDADES DE MEJORA ARQUITECTÓNICA**

### REFACTORIZACIÓN DE MOVIMIENTOS (P0 - Arquitectónica)

**Problema**: Tablas separadas `entradas`, `salidas`, `salida_equipos`, `entrada_equipos`

**Solución ideal** - Tabla unificada:
```sql
CREATE TABLE movimientos_v2 (
  id SERIAL PRIMARY KEY,
  tipo ENUM ('ENTRADA', 'SALIDA', 'ENTRADA_EQUIPO', 'SALIDA_EQUIPO'),
  
  -- Referencias
  recurso_id INTEGER REFERENCES recursos(id),
  equipo_id INTEGER REFERENCES equipos(id),
  frente_id INTEGER REFERENCES frentes_trabajo(id),
  
  -- Datos comunes
  fecha TIMESTAMP,
  cantidad DECIMAL,
  quien_entrega_id INTEGER,
  quien_recibe_id INTEGER,
  descripcion TEXT,
  
  -- Específicos de entrada
  num_guia VARCHAR(50),
  medio_transporte_id INTEGER,
  
  -- Auditoría
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP
);
```

**Beneficios**:
- ✅ Una sola tabla para todos los movimientos
- ✅ Lógica centralizada
- ✅ Mejor performance (1 query vs 4)
- ✅ Auditoría unificada

---

### CÁLCULO DE STOCK EN VIVO (P0 - Performance)

**Problema**: Stock se calcula dinámicamente (suma entradas - salidas)

**Solución**:
```sql
-- Vista materializada cada 5 minutos
CREATE MATERIALIZED VIEW vista_stock AS
SELECT 
  r.id,
  r.codigo,
  COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE 0 END), 0) as total_entrada,
  COALESCE(SUM(CASE WHEN m.tipo = 'SALIDA' THEN m.cantidad ELSE 0 END), 0) as total_salida,
  -- Cálculo en BD, no en app
  (COALESCE(SUM(...), 0) - COALESCE(SUM(...), 0)) as stock_actual
FROM recursos r
LEFT JOIN movimientos m ON (r.id = m.recurso_id OR ...)
GROUP BY r.id;
```

**Beneficios**:
- ✅ Stock sempre actualizado (pre-calculado)
- ✅ Queries instantáneas
- ✅ No hay oversell posible

---

### HISTORIAL DE EQUIPOS (P1 - Trazabilidad)

**Problema**: Equipo solo tiene estado actual (EN_ALMACEN/SALIDA)

**Solución**:
```sql
CREATE TABLE equipo_ubicaciones (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id),
  frente_id INTEGER REFERENCES frentes_trabajo(id),
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  quien_lo_llevo UUID REFERENCES usuarios(id),
  razon VARCHAR(255)
);
```

**Beneficios**:
- ✅ Saber dónde estuvo cada equipo cada día
- ✅ Auditar si se "perdió" en algún frente
- ✅ Reportes: "Taladro estuvo en Obra A 15 días"

---

### ENTRADA MASIVA (P2 - Usabilidad)

**Problema**: Crear entrada requiere 8 clicks, 30 segundos por item

**Solución**:
```
1. Upload CSV: codigo, cantidad, num_guia
2. Preview con validación
3. Guardar en lote (1 click)
→ 50 items en 10 segundos
```

---

## 🎯 **PLAN DE REFACTORIZACIÓN RECOMENDADO**

### FASE 1: Arquitectura (1-2 sesiones)
- [ ] Unificar tablas de movimientos
- [ ] Crear vista materializada de stock
- [ ] Migrar datos históricos

### FASE 2: Mejoras Core (1-2 sesiones)
- [ ] Historial de equipos
- [ ] Validación de stock en transacción
- [ ] Campos de fecha/hora combinados

### FASE 3: UX (1 sesión)
- [ ] Modales más pequeños
- [ ] Confirmaciónantes de guardar
- [ ] Busqueda en dropdowns (react-select con filter)
- [ ] Entrada masiva con CSV

### FASE 4: Reportes (1 sesión)
- [ ] Reporte stock por fecha
- [ ] Reporte equipos por ubicación
- [ ] Reporte de persona (cuánto entregó/recibió)

---

## 💬 **PREGUNTAS PARA DISCUSIÓN**

1. **¿Qué tan crítico es unificar movimientos?**  
   - ¿Prefiere refactorizar ahora o después?
   - ¿Tiene datos históricos que perder?

2. **¿Cuál es el principal pain point hoy?**  
   - Lentitud en búsqueda?
   - UX confusa?
   - Falta de reportes?

3. **¿Equipos: necesita historial de ubicación?**  
   - ¿Necesita saber dónde estuvo una herramienta en abril?

4. **Entrada de datos:**  
   - ¿Cuántas entradas/salidas por día? (10? 100?)
   - ¿Vale la pena entrada masiva (CSV)?

5. **Validación de stock:**  
   - ¿Qué pasa si alguien intenta sacar -5 bolsas de cemento?
   - ¿Sistema debe rechazar o permitir?

---

## 📌 **CONCLUSIÓN**

**El sistema actual funciona**, pero tiene deuda técnica:

- **DB**: Tablas separadas duplican lógica
- **Stock**: Se calcula en app (lento)
- **Equipos**: Sin trazabilidad (no sabe dónde está)
- **UX**: Modales complejos ralentizan entrada

**La refactorización arquitectónica es INVERSIÓN**, no gasto:
- Hoy: 8 campos × 30 segundos = tedioso
- Después: CSV upload = masivo en minutos

**¿Avanzamos con los cambios propuestos o hay otros problemas que preocupen más?**
