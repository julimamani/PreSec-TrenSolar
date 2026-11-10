# 🌾AgTech Vision | PURO GRANO | Análisis Inteligente de granos

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=git,react,ts,py,tailwind,spring" />
  </a>
</p>


<br>

> **Transformando imágenes en decisiones financieras para el agro del NOA y de Argentina en milisegundos.**
> 
> *Proyecto desarrollado para el Hackathon Tren Solar Jujuy 2026.*

---

## 🚀 El Problema: Subjetividad y Pérdida de Valor

El Noroeste Argentino es potencia exportadora de legumbres (Poroto Alubia, Negro, Colorado). Sin embargo, en pleno siglo XXI, el control de calidad en acopios medianos sigue siendo **manual, subjetivo y lento**. 

Un error humano en la tipificación del daño (granos manchados, arrugados o quebrados) resulta en penalizaciones internacionales, degradación de la mercadería a descarte y millones de dólares en pérdidas para la cadena productiva local.

## 💡 Nuestra Solución: SaaS B2B con Orquestación de IA

**AgTech Vision** es una plataforma de análisis visual asistida por IA que reemplaza el ojo humano con precisión algorítmica. 

No es solo un escáner; es un orquestador cognitivo. Subiendo una simple fotografía de la muestra desde cualquier dispositivo, nuestro sistema:
1. **Identifica y aísla** cada grano individualmente.
2. **Segmenta los defectos** (color, calibre, roturas).
3. **Cruza los datos biológicos con el mercado FOB** para proyectar instantáneamente el valor económico real del lote.

---

## ⚙️ Arquitectura Tecnológica (El Motor)

Diseñamos una arquitectura basada en microservicios, pensada para escalar desde una cámara de celular hasta cintas transportadoras industriales de alta velocidad.

*   **👁️ Microservicio de Visión (Python + OpenCV / YOLO):** 
    *   Transformación al espacio de color CIELAB para aislar iluminación ambiental.
    *   Algoritmos K-Means para segmentación de contornos y cálculo de *Aspect Ratio*.
    *   Detección de defectos superficiales y mapeo de coordenadas (Bounding Boxes).
*   **🧠 Agentes Cognitivos Orquestados:** Implementación de un flujo donde el Agente de Visión transfiere la data a un Agente Financiero para calcular la rentabilidad proyectada en tiempo real (ARS/USD).
*   **📡 Backend Principal (Java Spring Boot):** 
    *   API REST que actúa como Gateway.
    *   Gestión de históricos de lotes y trazabilidad en **MySQL** por defecto, con **H2** opcional para desarrollo.
    *   Agente de mercado híbrido: Matba Rofex + DolarAPI + spot regional.
*   **💻 Interfaz de Mando (React + TypeScript + Vite):** 
    *   Diseño B2B *Dark Mode* enfocado en entornos industriales.
    *   Integración de **Spline 3D** para visualización isométrica del flujo de acopio.
    *   Simulador de rentabilidad integrado y Data Viz en tiempo real.

---

## 🖥️ Demostración del Flujo de Trabajo

| 1. Interacción 3D (Spline) | 2. Carga y Procesamiento | 3. Análisis y Rentabilidad |
| :---: | :---: | :---: |
| El operario interactúa con la planta virtual isométrica. | La foto se envía al cluster de IA (Python). | Retorno visual del mapeo de calor (Verde/Rojo) y márgenes FOB. |

*(Nota para el equipo: Aquí pueden agregar 3 screenshots de su app real una vez la tengan corriendo)*

---

## 🛠️ Cómo correr el entorno localmente

### Prerrequisitos
- Node.js (>= 18)
- Java 17+ (Maven Wrapper incluido)
- Python 3.10+ solo si ejecutás el microservicio de visión por separado
- MySQL 8.0+ (base de datos por defecto). Si no querés instalarlo, el backend puede usar **H2 en memoria** con el perfil `h2`

### 1. Iniciar el Frontend (React)
```bash
cd agtech-front
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### 2. Iniciar el Microservicio de Visión (Python, opcional)
El backend espera el servicio de visión en `http://localhost:8000`. Si no lo tenés
levantado, la carga de muestras reales devolverá un error 502.

```bash
# Desde el directorio del microservicio de visión, si lo tenés clonado aparte
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Iniciar el Backend (Spring Boot)
```bash
cd agtech-backend
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8081`. Por defecto se conecta a
MySQL en `localhost:3306/presec_trensolar` (usuario `root`, contraseña `root`).
Creá la base antes de arrancar y revisá la sección de configuración de
`agtech-backend/README.md`. Si preferís no instalar MySQL, ejecutá el backend
con el perfil `h2`: `SPRING_PROFILES_ACTIVE=h2 ./mvnw spring-boot:run`.
