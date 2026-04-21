# 🏗️ ANÁLISIS SENIOR: GESTIÓN DE RECURSOS (Materiales)

**Contexto**: Constructora mediana, 20-50 movimientos/día, modelo híbrido (almacén central + frentes)

---

## 🎯 **PROBLEMAS REALES QUE RESUELVE ESTO**

```
1. PÉRDIDA/ROBO: "Compramos 100 bolsas de cemento hace 2 meses, 
                   ¿dónde quedaron? ¿En Frente A? ¿Se perdieron?"
   
2. OVERSTOCK: "No sabemos que ya tenemos 50 latas de pintura,
               entonces compramos 50 más. Ahora tenemos 100
               paradas en almacén ocupando espacio."

3. PARÁLISIS: "Frente B está parada esperando hierro. Almacenero
               no sabe si hay o no en el depósito."

4. SIN COSTEO: "¿Cuánto gastamos en materiales en Frente A?
                Necesito saber para presupuesto de cliente."
```

---

## 💡 **VISIÓN: Qué DEBERÍA SER Recursos**

### **PÁGINA PRINCIPAL (Dashboard de Recursos)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTADO DEL INVENTARIO - HOY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 MÉTRICAS PRINCIPALES:                                       │
│  ┌──────────────────┬──────────────────┬──────────────────┐    │
│  │ Stock Total      │ Stock Bajo       │ Sin Stock        │    │
│  │ $1,250,000       │ 23 items         │ 5 items          │    │
│  │ (Costo actual)   │ (⚠️ Alerta)      │ (🔴 Crítico)     │    │
│  └──────────────────┴──────────────────┴──────────────────┘    │
│                                                                 │
│  🔴 ALERTAS CRÍTICAS (necesitas AHORA):                        │
│  ├─ Cemento Portland 50kg: 0 bolsas (usaste 200/mes, compra!) │
│  ├─ Hierro Ø 8mm: 12 metros (frente B necesita 50)            │
│  └─ Tuerca 3/4": 50 pcs (stock mínimo es 100)                 │
│                                                                 │
│  📈 CONSUMO POR FRENTE (Esta semana):                          │
│  ├─ Frente A (Casa Peña):    $18,500 en materiales            │
│  ├─ Frente B (Playa Resort): $24,200 en materiales            │
│  └─ Almacén Central:         $2,300 (mantenimiento)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 **TABLA DE RECURSOS: MEJORADA**

### Actual (limitado):
```
Código | Nombre | Categoría | Unidad | Stock Actual | Entradas | Salidas
R-PAP-OFI-001 | Papel A4 | Oficina | Resma | 5 | 10 | 5
```

### PROPUESTA SENIOR (lo que necesitas):
```
┌────────┬──────────────────┬──────────┬───────┬──────┬────────┬─────────────┬──────────┐
│ Código │ Nombre           │ Categoría│ Unidad│Stock│Mínimo  │Último Precio│ En Frentes│
├────────┼──────────────────┼──────────┼───────┼──────┼────────┼─────────────┼──────────┤
│R-CEM   │Cemento Portland  │Ferrretería│Bolsa │  0  │ 100   │   $45.50    │ 0 bolsas │
│        │50kg              │          │      │      │        │             │          │
├────────┼──────────────────┼──────────┼───────┼──────┼────────┼─────────────┼──────────┤
│R-HIE   │Hierro Ø 8mm      │Ferretería│Metro │ 12   │  50    │   $32/m     │ Frente B │
│        │                  │          │      │      │        │             │ (50m)    │
├────────┼──────────────────┼──────────┼───────┼──────┼────────┼─────────────┼──────────┤
│R-TUE   │Tuerca 3/4"       │Ferretería│Pcs   │  50  │ 100    │   $2.50     │ Frente A │
│        │galvanizada       │          │      │      │        │             │ (30 pcs) │
└────────┴──────────────────┴──────────┴───────┴──────┴────────┴─────────────┴──────────┘

COLOR CODING:
🟢 Verde: Stock OK (Stock >= Mínimo)
🟡 Amarillo: Stock BAJO (Stock < Mínimo pero > 0)
🔴 Rojo: CRÍTICO (Stock = 0)
⚫ Gris: Desactivado
```

---

## 🔑 **5 CAMBIOS ARQUITECTÓNICOS CLAVE**

### **1️⃣ STOCK MÍNIMO (CRÍTICO PARA COMPRAS)**

**Problema actual**: No existe. Compramos sin saber cuándo.

**Solución**:
```typescript
// Tabla recursos - agregar:
interface Recurso {
  id: number;
  codigo: string;
  nombre: string;
  categoria_id: number;
  unidad_medida_id: number;
  
  // NUEVO: Control de inventario
  stock_minimo: number;  // ¿Cuándo comprar?
  stock_maximo?: number; // ¿Cuándo dejar de comprar?
  
  // Precios
  precio_unitario: number;
  proveedor_id?: number;
  
  // Estado
  activo: boolean;
}

// Ejemplo:
{
  nombre: "Cemento Portland 50kg",
  stock_minimo: 100,  // Si llega a 100, ¡COMPRA!
  stock_maximo: 300,  // No compres si tienes 300+
  precio_unitario: 45.50,
  proveedor_id: 5
}
```

**Impacto**: 
- ✅ Nunca más "se acabó el cemento"
- ✅ No compras de más (evita overstock)
- ✅ Sistema alerta automáticamente

---

### **2️⃣ COSTO TOTAL POR RECURSO (VITAL PARA PRESUPUESTOS)**

**Problema actual**: No existe. No saben cuánto gastaron en materiales.

**Solución**:
```typescript
// Vista materializada: costo_actual
interface RecursoConCosto {
  id: number;
  codigo: string;
  nombre: string;
  stock_actual: number;
  precio_unitario: number;
  costo_total: number;  // stock_actual * precio_unitario
  
  // Por frente:
  costo_en_frentes: {
    frente_id: number;
    frente_nombre: string;
    stock_en_frente: number;
    costo_en_frente: number;  // stock * precio
  }[]
}

// Ejemplo:
{
  nombre: "Hierro Ø 8mm",
  stock_actual: 120,
  precio_unitario: 32,
  costo_total: 3840,  // 120 * 32
  
  costo_en_frentes: [
    { frente: "Casa Peña", stock: 50, costo: 1600 },
    { frente: "Playa Resort", stock: 70, costo: 2240 }
  ]
}
```

**Impacto**:
- ✅ Gerente sabe: "Invertí $12,400 en materiales esta semana"
- ✅ Cliente pregunta: "¿Cuánto gastaste en Frente A?" → Respuesta inmediata
- ✅ Presupuesto actualizado en tiempo real

---

### **3️⃣ DISTRIBUCIÓN EN FRENTES (PREVENCIÓN DE PÉRDIDAS)**

**Problema actual**: No saben dónde está el material.
"¿100 bolsas de cemento? ¿Están en Frente A? ¿Se perdieron? ¿Las comió el gato?"

**Solución**:
```typescript
// Nueva tabla: distribucion_frentes
interface DistribucionFrente {
  id: number;
  recurso_id: number;
  frente_trabajo_id: number;
  cantidad: number;
  responsable_id: UUID;  // ¡QUIÉN es responsable!
  fecha_desde: timestamp;
  fecha_hasta?: timestamp;
  observaciones: string;
}

// Ejemplo:
{
  recurso: "Cemento Portland 50kg",
  frente: "Casa Peña",
  cantidad: 50,
  responsable: "Juan García (documento: 12345678)",  // ← RESPONSABLE
  desde: "2026-04-20",
  observaciones: "Entregado a maestro de obra"
}

// API: GET /recursos/:id/ubicacion-actual
// Retorna: "50 bolsas en Frente A, responsable Juan García"
```

**Impacto**:
- ✅ Control: "¿Dónde está? En Frente A con Juan"
- ✅ Auditoría: Si se pierde, SABEMOS quién es responsable
- ✅ Prevención: "Juan, tienes 50 bolsas hace 30 días, ¿las usaste?"

---

### **4️⃣ HISTORIAL Y PROVENANCE (TRAZABILIDAD TOTAL)**

**Problema actual**: No se sabe qué pasó con un material.

**Solución**:
```typescript
// Mejorar la tabla de movimientos:
interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA_FRENTE' | 'DEVOLUCION';
  recurso_id: number;
  cantidad: number;
  
  // NUEVO: Trazabilidad completa
  desde_frente_id?: number;     // ¿De dónde vino?
  hacia_frente_id?: number;     // ¿A dónde va?
  desde_proveedor_id?: number;  // ¿De quién la compramos?
  
  num_guia?: string;            // Documento
  fecha: timestamp;
  
  responsable_id: UUID;         // ¿Quién lo movió?
  observaciones: string;
}

// Ejemplo completo (histórico de 1 bolsa de cemento):
[
  { tipo: 'ENTRADA', cantidad: 100, proveedor: 'La Paz S.A.', num_guia: 'OC-2026-045' },
  { tipo: 'SALIDA', cantidad: 50, hacia_frente: 'Casa Peña', responsable: 'Juan' },
  { tipo: 'DEVOLUCION', cantidad: 10, desde_frente: 'Casa Peña' },
  { tipo: 'SALIDA', cantidad: 35, hacia_frente: 'Playa Resort', responsable: 'María' },
  { tipo: 'TRANSFERENCIA_FRENTE', cantidad: 5, desde_frente: 'Playa Resort', hacia_frente: 'Casa Peña' }
]
```

**Impacto**:
- ✅ Auditoría perfecta: "De 100 bolsas, usaste 85, devolviste 10, transfirieron 5"
- ✅ Responsabilidad: Cada movimiento tiene quién y cuándo
- ✅ Investigación: Si faltan 2 bolsas, sabes exactamente dónde se perdieron

---

### **5️⃣ ALERTAS INTELIGENTES (EL MOTOR DE DECISIONES)**

**Problema actual**: Gerente no sabe cuándo comprar, hasta que llega el caos.

**Solución**:
```typescript
interface AlertaRecurso {
  tipo: 'STOCK_BAJO' | 'STOCK_CERO' | 'OVERSTOCK' | 'VENCIMIENTO' | 'PERDIDA_SOSPECHOSA';
  recurso_id: number;
  severidad: 'BAJO' | 'MEDIO' | 'CRÍTICO';
  mensaje: string;
  accion_sugerida: string;
}

// Ejemplos:
[
  {
    tipo: 'STOCK_BAJO',
    recurso: 'Cemento Portland',
    severidad: 'CRÍTICO',
    mensaje: 'Stock: 5 bolsas (mínimo: 100). Cero en 3 días al ritmo actual.',
    accion_sugerida: 'COMPRA URGENTE 200 bolsas'
  },
  {
    tipo: 'OVERSTOCK',
    recurso: 'Pintura Blanca',
    severidad: 'MEDIO',
    mensaje: 'Stock: 120 latas (máximo: 80). Gasto semanal: 5 latas.',
    accion_sugerida: 'Frena compras, usa lo que tienes'
  },
  {
    tipo: 'PERDIDA_SOSPECHOSA',
    recurso: 'Tuerca 3/4"',
    severidad: 'CRÍTICO',
    mensaje: '100 pcs en Frente A hace 45 días. Esperado: 0 (se usan 2/día). ¿Dónde están 10?',
    accion_sugerida: 'AUDITAR FRENTE A'
  }
]
```

---

## 🎨 **REDISEÑO DE LA UI/UX**

### **Página Principal (Dashboard)**

```
┌─────────────────────────────────────────────────────────────────┐
│  RECURSOS - Panel de Control                       [Filtros ↓] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 ALERTAS CRÍTICAS (4):                                      │
│  ├─ Cemento: Stock CERO, necesitas HOY                        │
│  ├─ Hierro: Stock bajo (12m), compra 50m                      │
│  └─ Tuerca: Pérdida sospechosa en Frente A (auditar)          │
│                                                                 │
│  📊 TABLA INTERACTIVA:                                         │
│  ┌───────┬──────────────┬────────┬────────────┬─────────────┐  │
│  │Código │Nombre        │Stock   │Costo Total │ En Frentes  │  │
│  ├───────┼──────────────┼────────┼────────────┼─────────────┤  │
│  │R-CEM  │Cemento 50kg  │0 (🔴) │$0          │ -           │  │
│  │R-HIE  │Hierro Ø8mm   │12 (🟡) │$384        │ Frente B(50)│  │
│  │R-PIN  │Pintura Blanca│120(🔴) │$1,200      │ Frente A(40)│  │
│  └───────┴──────────────┴────────┴────────────┴─────────────┘  │
│                                                                 │
│  💰 RESUMEN FINANCIERO:                                        │
│  ├─ Costo Total Almacén: $18,500                              │
│  ├─ Costo en Frentes: $42,800                                 │
│  └─ Inversión Total: $61,300                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Modal: Editar Recurso (Completo)**

```
┌──────────────────────────────────────────────────────────────┐
│  EDITAR: Cemento Portland 50kg                        [X]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INFORMACIÓN BÁSICA:                                         │
│  Código: R-CEM-FER-001 (auto-generado, readonly)            │
│  Nombre: Cemento Portland 50kg                              │
│  Categoría: Ferretería  [dropdown]                          │
│  Unidad: Bolsa          [dropdown]                          │
│                                                              │
│  CONTROL DE INVENTARIO:                                      │
│  Stock Mínimo: [100]  ← IMPORTANTE: cuándo comprar         │
│  Stock Máximo: [300]  ← No compres si tienes esto          │
│                                                              │
│  PRECIOS:                                                   │
│  Precio Unitario: [$45.50]                                  │
│  Proveedor Preferido: [La Paz S.A.] [dropdown]              │
│                                                              │
│  STOCK ACTUAL: 0 bolsas  [Ver Historial ↓]                 │
│                                                              │
│  DISTRIBUCIÓN EN FRENTES:                                   │
│  ┌─────────────────┬──────────┬───────────────┐             │
│  │ Frente          │ Cantidad │ Responsable   │             │
│  ├─────────────────┼──────────┼───────────────┤             │
│  │ Casa Peña       │ 0        │ Juan García   │             │
│  │ Playa Resort    │ 0        │ María López   │             │
│  └─────────────────┴──────────┴───────────────┘             │
│                                                              │
│  [Cancelar] ......................... [Guardar Cambios]     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 **REPORTES NUEVOS (LO QUE EL GERENTE NECESITA)**

### **Reporte 1: Compras Sugeridas**
```
MATERIALES QUE DEBES COMPRAR HOY (2026-04-21)

Ítem | Recurso          | Stock Actual | Mínimo | Comprar | Costo Est.
-----|------------------|--------------|--------|---------|----------
 1   | Cemento 50kg     | 0            | 100    | 150     | $6,825
 2   | Hierro Ø 8mm     | 12m          | 50m    | 70m     | $2,240
 3   | Tuerca 3/4"      | 50 pcs       | 100    | 100     | $250

TOTAL A INVERTIR: $9,315
```

### **Reporte 2: Consumo por Frente**
```
CONSUMO DE MATERIALES - Última Semana

Frente: Casa Peña
├─ Cemento: 50 bolsas (50 × $45.50) = $2,275
├─ Hierro: 30m (30 × $32) = $960
├─ Pintura: 10 latas (10 × $50) = $500
└─ TOTAL: $3,735

Frente: Playa Resort
├─ Cemento: 80 bolsas (80 × $45.50) = $3,640
├─ Tuerca: 200 pcs (200 × $2.50) = $500
└─ TOTAL: $4,140

CONSUMO TOTAL ESTA SEMANA: $7,875
PROMEDIO DIARIO: $1,125 en materiales
```

### **Reporte 3: Auditoría (Pérdidas)**
```
DISCREPANCIAS EN INVENTARIO

Frente: Casa Peña
├─ Tuerca 3/4": Esperado 0 (usado 2/día × 45 días = 90)
│                Registrado: 100 (entrados) - 85 (salidas) = 15
│                ¿PERDIERON?: 25 unidades ⚠️
│                Responsable: Juan García
│                Acción: AUDITAR FÍSICAMENTE
```

---

## 🔧 **CAMBIOS TÉCNICOS REQUERIDOS**

### Backend (NestJS)
```typescript
// 1. Recurso entity: agregar stock_minimo, stock_maximo, precio
// 2. Nueva tabla: distribucion_frentes (trazabilidad)
// 3. Nueva vista: vista_recursos_con_costo
// 4. Nueva tabla: alertas_recursos (auto-generadas)
// 5. Nuevos endpoints:
//    GET /recursos/:id/ubicacion-actual
//    GET /recursos/:id/historial-completo
//    GET /recursos/alertas (críticas)
//    POST /recursos/:id/auditar-frente
```

### Frontend (React)
```typescript
// 1. Dashboard de Recursos (nueva página principal)
// 2. Tabla mejorada con colores (status)
// 3. Modal de edición expandido (stock min/max, precios)
// 4. Panel de alertas (colapsible, filtrable)
// 5. Reportes: Compras Sugeridas, Consumo por Frente, Auditoría
// 6. Gráficos: Consumo semanal, costeo por frente
```

---

## 📈 **BENEFICIOS POR PROBLEMA RESUELTO**

| Problema | Solución en Recursos | Resultado |
|----------|----------------------|-----------|
| **Pérdida/Robo** | Distribucion en frentes + responsables | Sabe exactamente dónde está, quién es responsable |
| **Overstock** | Stock máximo + alertas | Nunca compra de más |
| **Compras Improvisadas** | Stock mínimo + alertas | Compra anticipadamente, nunca se queda sin |
| **Sin Costeo** | Precio unitario + costo total | Presupuesto actualizado en tiempo real |
| **Caos de Auditoría** | Historial completo + movimientos | Sabe EXACTAMENTE qué pasó con cada material |

---

## 🎯 **PLAN DE IMPLEMENTACIÓN (4 FASES)**

### **FASE 1: Base (Esta sesión)**
- [ ] Agregar stock_minimo, stock_maximo a tabla recursos
- [ ] Agregar precio_unitario a recursos
- [ ] Crear tabla distribucion_frentes

### **FASE 2: Lógica (Próxima sesión)**
- [ ] Crear vista vista_recursos_con_costo
- [ ] Crear tabla alertas_recursos
- [ ] Endpoints de ubicación y historial

### **FASE 3: UI (Siguiente)**
- [ ] Dashboard de Recursos (alertas + resumen)
- [ ] Modal mejorado con stock min/max/precio
- [ ] Tabla con color coding (status)

### **FASE 4: Reportes (Última)**
- [ ] Reporte: Compras Sugeridas
- [ ] Reporte: Consumo por Frente
- [ ] Reporte: Auditoría de Pérdidas

---

## 💬 **PREGUNTAS FINALES**

Antes de implementar, necesito entender:

1. **Proveedores**: ¿Un recurso tiene UN proveedor preferido o VARIOS?
   - Ejemplo: "Cemento" lo compras a "La Paz S.A." siempre? 
   - O a veces a "Holcim" también?

2. **Devoluciones**: ¿Devuelven material a proveedor?
   - Si es defectuoso, ¿afecta el stock?

3. **Vencimiento**: ¿Algunos materiales vencen?
   - Pintura, adhesivos, etc. pueden vencer
   - ¿Necesitas rastrear fecha de vencimiento?

4. **Movimientos entre frentes**: ¿Se transfieren materiales?
   - "Necesito 20m de hierro de Frente A para Frente B"
   - ¿Registran esto o es informal?

5. **Presupuesto de obra**: ¿Tienen presupuesto de materiales POR FRENTE?
   - Si sí, ¿necesitas alertas si se excede presupuesto?

Responde estas y partimos a refactorizar RECURSOS 🚀
