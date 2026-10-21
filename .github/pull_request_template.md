New-Item -ItemType Directory -Force .github | Out-Null
$txt = @'
## ¿Qué prueba este PR?

## Capas

- **Capa del autor esta semana**:
- **Capa del revisor esta semana**:

## Checklist

- Los tests siguen el patrón AAA (Arrange, Act, Assert)
- Los nombres de los tests describen el comportamiento esperado
- Hice fallar cada test al menos una vez para comprobar que detecta el error
- Los tests pasan en local
- No hay credenciales ni datos reales en los tests

## ¿Cómo lo ejecuto?