# Sistema de Diseño: Red Comunitaria de Adopción y Rescate Zulia

## Design Read y Dials
Reading this as: Plataforma cívica de registro veterinario, rescate y adopción animal en el Estado Zulia para adoptantes, rescatistas, médicos veterinarios y administradores, con un lenguaje editorial documental y clínico, dial `ENERGY 2 / RHYTHM 2 / MOTION 1`.

- **ENERGY 2 (Equilibrado)**: Jerarquía editorial marcada con titulares serif (`Newsreader`), cuerpo humanista (`Plus Jakarta Sans`) y códigos clínicos tabulares (`IBM Plex Mono`), sin ornamentos artificiales ni efectos llamativos.
- **RHYTHM 2 (Consistente con quiebres deliberados)**: Acceso en doble columna asimétrica en escritorio, catálogo con cabecera documental y barra integrada de filtros, expediente de mascota en dos columnas (galería + acciones a la izquierda, ficha técnica tabulada a la derecha) y libro operativo en administración.
- **MOTION 1 (Estados de interacción sobrios)**: Solo cambios nítidos en `:hover` y anillos `:focus-visible` para navegación por teclado, sin animaciones decorativas de entrada o rebote.

## Razón Escrita de Cada Decisión Mayor (R-31)

1. **Por qué esta paleta de color**: El verde manglar profundo (`#134E3A` en claro / `#4FD1A5` en oscuro) remite a la vegetación costera del Lago de Maracaibo y a la indumentaria clínica veterinaria; el papel piedra cálido (`#F6F4EE`) reduce la fatiga visual frente al blanco puro; el acento único en terracota horneada (`#A83814` / `#F59E56`) reserva la máxima atención para la acción principal de adopción.
2. **Por qué este modo claro/oscuro**: El uso diurno en operativos de campo y oficinas municipales favorece el papel cálido claro por defecto, mientras que el selector persistente de modo oscuro (`#111513` / `#181E1B`) permite trabajar en guardias veterinarias nocturnas manteniendo contrastes superiores a 6.4:1 en texto y 4.2:1 en bordes de controles.
3. **Por qué esta tipografía**: `Newsreader` aporta carácter editorial humano y calidez a nombres de animales y encabezados; `Plus Jakarta Sans` garantiza legibilidad nítida en formularios densos en español; `IBM Plex Mono` a 12px alinea identificadores de folio (`FICHA #08`), pesos, fechas y matrículas sin desbordar.
4. **Por qué este layout**: Cada vista responde al trabajo real del rol (comparar animales en cuadrícula de 1/2/3 columnas, revisar foto mientras se lee la historia clínica en dos columnas, o auditar métricas en tablas operativas en lugar de cajas pastel idénticas).
5. **Por qué este espaciado y bordes**: Las láminas con borde arquitectónico de `1px` (`#CEC8BC` / `#2E3833`), radios diferenciados (`6px` en contenedores, `4px` en controles de 44px+, `3px` en sellos de estado) y cero sombras flotantes organizan datos reales sin aspecto de plantilla inflada.
6. **Por qué usar fichas y tablas en lugar de tarjetas flotantes**: El catálogo requiere fichas fotográficas comparables en proporción 3:2, mientras que expedientes médicos, rescates, solicitudes y usuarios se leen más rápido como registros documentales tabulados.
7. **Por qué estos iconos**: Se eliminan todos los emojis decorativos y los iconos dentro de inputs; solo se conservan iconos funcionales puntuales (visibilidad de contraseña, selector de tema y navegación móvil compacta) donde ahorran espacio real.
