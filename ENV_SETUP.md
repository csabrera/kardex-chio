# 🔧 Configuración de Variables de Entorno

## Descripción General

KardexChio requiere configurar variables de entorno para el desarrollo local y producción. Se proporcionan archivos `.env.example` como plantilla.

---

## 📋 Pasos para Configurar en Nueva PC

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/kardex-chio.git
cd kardex-chio
```

### 2️⃣ Crear archivos .env a partir de los ejemplos

**Raíz del proyecto** (para Docker Compose):
```bash
cp .env.example .env
```

**Backend**:
```bash
cp backend/.env.example backend/.env
```

**Frontend**:
```bash
cp frontend/.env.local.example frontend/.env.local
```

### 3️⃣ Editar valores según tu entorno

#### **Para Docker Compose** (`.env`)
- ✅ Mantener los valores por defecto (están configurados para contenedores)
- 🔐 En producción: cambiar `JWT_SECRET` a algo más seguro

#### **Para Backend Local** (`backend/.env`)
- `POSTGRES_HOST`: `localhost` (por defecto)
- `POSTGRES_PORT`: `5433` (ajusta si usas otro puerto)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`: mismos valores de tu BD
- `JWT_SECRET`: cambiar para producción

#### **Para Frontend Local** (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: 
  - Dev local: `http://localhost:3001/api`
  - Producción: URL real de tu backend

---

## 🚀 Ejecución

### Con Docker Compose (Recomendado)
```bash
docker-compose up -d
```
Usa `.env` de la raíz.

### Desarrollo Local
1. **Backend** (terminal 1):
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
   Usa `backend/.env`

2. **Frontend** (terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Usa `frontend/.env.local`

---

## 🔐 Seguridad en Producción

Cambiar estas variables en `/.env` (Docker):
```env
POSTGRES_PASSWORD=contraseña_super_segura_aqui_123456
JWT_SECRET=clave_jwt_aleatoria_minimo_32_caracteres_muy_segura
```

Generar JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📍 Ubicación de los archivos

```
kardex-chio/
├── .env                          ← Docker Compose
├── .env.example                  ← Plantilla (commiteado)
├── backend/
│   ├── .env                      ← Backend local
│   └── .env.example              ← Plantilla (commiteado)
├── frontend/
│   ├── .env.local                ← Frontend local
│   └── .env.local.example        ← Plantilla (commiteado)
```

---

## ✅ Verificación

Después de configurar:
- Backend inicia sin errores de conexión BD
- Frontend conecta a API correctamente
- Login funciona (credenciales: 00000000 / 00000000)

---

## 🆘 Solución de Problemas

**"Cannot connect to database"**
- Verificar `POSTGRES_HOST` y `POSTGRES_PORT`
- Si es Docker, usar `postgres` como host
- Si es local, usar `localhost:5433`

**"API call failed"**
- Verificar `NEXT_PUBLIC_API_URL` en `frontend/.env.local`
- Backend debe estar corriendo en puerto 3001

**"Invalid token"**
- Asegurar que `JWT_SECRET` sea igual en backend y peticiones
