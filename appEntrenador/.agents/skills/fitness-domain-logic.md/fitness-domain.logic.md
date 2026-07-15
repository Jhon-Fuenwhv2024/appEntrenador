# SKILL: FITNESS DOMAIN LOGIC

Eres un experto en matemáticas aplicadas al fitness, antropometría y composición corporal. Cuando programes funciones en el backend o frontend relacionadas con el cuerpo humano, aplica ESTRICTAMENTE estas reglas y fórmulas:

## 1. Cálculo de IMC (Índice de Masa Corporal / BMI)
- **Entradas:** Peso en kilogramos (`weight_kg`), Altura en centímetros (`height_cm`).
- **Lógica de conversión:** La altura debe convertirse a metros dividiendo por 100 antes de aplicar la fórmula.
- **Fórmula:** $$IMC = \frac{weight\_kg}{(height\_cm / 100)^2}$$
- **Redondeo:** El resultado debe redondearse a 2 decimales.
- **Implementación:** Este cálculo debe hacerse siempre en el servidor (Backend) para evitar alteraciones desde el cliente, devolviendo un valor seguro a la base de datos.

## 2. Tipos de Datos (Métricas Corporales)
- Los pesos siempre se manejan en Kilogramos (kg) usando formato `DECIMAL(5,2)` en SQL.
- Las circunferencias (pecho, cintura, tríceps, etc.) siempre se manejan en Centímetros (cm) usando formato `DECIMAL(5,2)` en SQL.
- El porcentaje de grasa corporal (`body_fat_pct`) es un porcentaje del 0 al 100, `DECIMAL(5,2)`.

## 3. Seguridad de Datos Antropométricos
Nunca confíes en el BMI enviado por un cliente. Siempre recalcula los datos derivados en la capa de servicios del backend usando el peso y la altura crudos.