# Análisis y Estructura - Excel de Importación

**Archivo generado:** `Kardex_Importacion_Template_2026.xlsx`  
**Fecha:** 2026-04-12  
**Tamaño:** 250 KB

---

## 📊 MAPEO DE CATEGORÍAS (IMPORTANTE)

Se realizó mapeo de 15 categorías del Excel original a 12 categorías del sistema:

| Excel Original | Sistema | # Recursos |
|---|---|---|
| Ferreteria | Ferretería | 742 |
| Electrico | Eléctrico | 31 |
| Equipo | Equipos | 27 |
| Herramientas | Herramientas | 121 |
| Seguridad | Seguridad | 131 |
| Maderas | Maderas | 15 |
| Limpieza | Limpieza | 6 |
| Oficina | Oficina | 81 |
| Pintura | Pintura | 6 |
| Combustibles | Combustibles | 12 |
| **Agua** | **Alimentos y Bebidas** | 15 |
| **Galletas** | **Alimentos y Bebidas** | 1 |
| **Gaseosas** | **Alimentos y Bebidas** | 1 |
| **Ladrillos** | **Materiales de Construcción** | 2 |
| **Microcemento** | **Materiales de Construcción** | 5 |

**Total Recursos:** 1,196 (activos/válidos)

---

## 📑 ESTRUCTURA DE LAS 4 HOJAS

### **Hoja 1: RECURSOS**

**Propósito:** Importar todos los recursos (inventario) con su stock inicial.

**Columnas:**
```
Código | Nombre | Categoría | Unidad | Stock Inicial
```

**Ejemplo:**
```
Fer0001 | Cemento (apu) Bolsa x 42.5 Kg | Ferretería | Bolsa | 0
Fer0002 | Anillo de cera para inodoro | Ferretería | Unidad | 1
```

**Total registros:** 1,196  
**Notas:**
- Código: extraído del Excel (Fer0001, Her0050, etc.)
- Stock Inicial: tomado de EXISTENCIA ACTUAL del Kardex original
- Categoría: mapeada según tabla anterior
- Eliminadas filas vacías o sin código

---

### **Hoja 2: ENTRADAS_RECURSOS**

**Propósito:** Importar todos los movimientos de ENTRADA de recursos (compras, ingresos, devoluciones).

**Columnas:**
```
Fecha | Nº Guía | Código | Recurso | Cantidad | 
Quién Entrega (Nombre) | Quién Recibe (Nombre) | Medio Transporte
```

**Ejemplo:**
```
2024-09-05 | F003-014288 | Fer0001 | Cemento (apu)... | 20.0 | 
Wilder | Bladimir | Camion lusac
```

**Total registros:** 2,999 (limitados a primeras 3,000 para performance)  
**Notas:**
- Fecha: importada tal cual (formato datetime)
- Nº Guía: número de guía de compra (puede estar vacío)
- Código: referencia al Recurso
- Quién Entrega/Recibe: NOMBRES (string), NO IDs de usuarios (por ahora)
  - **IMPORTANTE:** Estos nombres deberán ser validados/creados en BD luego
- Medio Transporte: nombre del transporte (Camión, etc.)

---

### **Hoja 3: EQUIPOS**

**Propósito:** Importar equipos base que se prestan/devuelven.

**Columnas:**
```
Código | Nombre | Categoría | Unidad | Cantidad Inicial | Estado Inicial
```

**Ejemplo:**
```
ROTOMARTILLOGRANDE | ROTOMARTILLO GRANDE | Equipos | Unidad | 1 | EN_ALMACEN
ROTOMARTILLOMEDIAN | ROTOMARTILLO MEDIANO BOS | Equipos | Unidad | 1 | EN_ALMACEN
```

**Total registros:** 2  
**Notas:**
- **Código:** derivado del nombre (sin espacios, primeros 20 caracteres)
  - ej: "ROTOMARTILLO GRANDE" → "ROTOMARTILLOGRANDE"
- **Nombre:** nombre del equipo tal cual aparece en Excel
- **Categoría:** siempre "Equipos" (todos los equipos van en esta categoría)
- **Unidad:** siempre "Unidad" (los equipos se cuentan por unidad)
- **Cantidad Inicial:** 1 (cantidad de ese equipo disponible)
- **Estado Inicial:** EN_ALMACEN (estado por defecto, puede cambiar con salidas/entradas)

---

### **Hoja 4: SALIDA_EQUIPOS**

**Propósito:** Importar movimientos de SALIDA/ENTRADA de equipos (préstamos y devoluciones).

**Columnas:**
```
Fecha | Código Equipo | Nombre Equipo | Cantidad | 
Tipo (SALIDA/INGRESO) | Frente Trabajo | Descripción | 
Quién Entrega (Nombre) | Quién Recibe (Nombre)
```

**Ejemplo:**
```
2024-09-18 | Fer0103 | Barra de construcción 1/2" x 9m | 30.0 | 
SALIDA | Ferreria | Estrivos 82x82 | NaN | NaN
```

**Total registros:** 1,732 (limitados a primeras 2,000 para performance)  
**Notas:**
- **Fecha:** importada tal cual
- **Código Equipo:** código del equipo (aunque está usando códigos de recursos en el Excel)
  - ⚠️ **REVISAR CON CLIENTE:** Los datos dicen "Fer0103" (recurso) pero deberían ser equipos
- **Nombre Equipo:** nombre descriptivo
- **Cantidad:** unidades prestadas
- **Tipo:** SALIDA (préstamo) o INGRESO (devolución)
  - Actualmente **todos están marcados como SALIDA** (por defecto del Kardex)
  - ⚠️ **IMPORTANTE:** Revisar si hay devoluciones y marcarlas como INGRESO
- **Quién Entrega/Recibe:** NOMBRES (string), NO IDs de usuarios
- **Frente Trabajo:** nombre del frente de trabajo donde se presta el equipo

---

## 🎯 DECISIONES TÉCNICAS TOMADAS

### 1. **Código para Equipos**
- **Decisión:** Usar nombre como código (sin espacios)
- **Razón:** Los equipos en el Excel "Hoja1" no tenían código, solo nombres
- **Ejemplo:** "ROTOMARTILLO GRANDE" → "ROTOMARTILLOGRANDE"

### 2. **Usuarios (Quién Entrega/Recibe)**
- **Decisión:** Almacenar como STRING (nombre), no FK a usuarios
- **Razón:** El Excel tiene nombres como "Wilder", "Bladimir" pero sin documentos
- **Siguiente paso:** 
  1. Crear columnas en BD: `quien_entrega_nombre`, `quien_recibe_nombre`
  2. En importación: validar/crear usuarios si no existen
  3. Luego: vincular con FK a `usuarios.id`

### 3. **Stock Inicial de Recursos**
- **Decisión:** Usar EXISTENCIA ACTUAL del Kardex como stock inicial
- **Ventaja:** El sistema calcula automáticamente (entradas - salidas)
- **Nota:** No necesita stock_minimo (fue eliminado del sistema)

### 4. **Categorías Mapeadas**
- **Decisión:** Usar las 12 categorías del sistema, agrupar 15 del Excel
- **Validación:** Todas las categorías ya existen en BD

### 5. **Limites de Registros**
- ENTRADAS: 2,999 (de ~3,049)
- SALIDA_EQUIPOS: 1,732 (de ~1,742)
- **Razón:** Performance al importar. Puede aumentarse si es necesario.

### 6. **Tipo de Movimiento (SALIDA/INGRESO)**
- **Decisión:** Todos marcados como SALIDA (préstamo)
- **Razón:** El Kardex original no distinguía devoluciones
- ⚠️ **ACTION ITEM:** Revisar con cliente si hay devoluciones y marcar como INGRESO

---

## ❓ PREGUNTAS PARA VALIDAR CON CLIENTE

Antes de la importación a BD, confirmar:

1. **Equipos:** ¿Los datos en SALIDA_EQUIPOS corresponden realmente a equipos? (actualmente tiene códigos de recursos tipo "Fer0103")

2. **Devoluciones:** ¿Todos los movimientos de equipos son SALIDA (préstamo) o hay INGRESO (devoluciones)?

3. **Stock Inicial:** ¿Es correcto usar EXISTENCIA ACTUAL como stock inicial de recursos?

4. **Usuarios:** Nombres como "Wilder", "Bladimir" — ¿existen en el sistema? ¿Crear automáticamente o validar?

5. **Frentes de Trabajo:** ¿Los frentes de trabajo ya existen en BD o necesitan crearse?

---

## 📋 SIGUIENTE PASO

1. ✓ Excel template creado y listo para analizar
2. **PENDIENTE:** Validar con cliente (nombres, categorías, equipos, devoluciones)
3. **PENDIENTE:** Crear migration script SQL (agregar columnas quien_entrega_nombre, quien_recibe_nombre)
4. **PENDIENTE:** Crear endpoint POST `/api/import` para procesar el Excel

---

## 🔧 UBICACIÓN DEL ARCHIVO

```
D:\claude\kardex-chio\Kardex_Importacion_Template_2026.xlsx
```

**Tamaño:** 250 KB  
**Hojas:** 4 (RECURSOS, ENTRADAS_RECURSOS, EQUIPOS, SALIDA_EQUIPOS)  
**Total registros:** 6,729
