# 🌾 AgTech Vision | Tipificación Inteligente de Legumbres

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=git,react,ts,py,tailwind,postgres,spring" />
  </a>
</p>


<br>

> **Transformando imágenes en decisiones financieras para el agro del NOA en milisegundos.**
> 
> *Proyecto desarrollado para el Hackathon TecnoProductivo Jujuy 2026.*

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
    *   Gestión de históricos de lotes y trazabilidad en **PostgreSQL**.
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
- Python 3.10+
- Java 17+ (Maven)
- PostgreSQL

### 1. Iniciar el Frontend (React)
```bash
cd agtech-dashboard
npm install
npm run dev
```

### 2. Iniciar el Microservicio de Visión (Python)
```bash
cd vision-api
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Iniciar el Backend (Spring Boot)
```bash
cd core-backend
mvn spring-boot:run
```
