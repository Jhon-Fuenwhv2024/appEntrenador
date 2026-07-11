Descripcion: Al presionar el botón de generar link deberia aparecer debajo o el alguna otra parte el link y que este se pueda copiar.

* Verificar porque no se aparece el link de invitacion
* Mirar la posibilidad si es mejor que el link de invitación se copie automáticamente
* Hacer visible este link de invitación y que se pueda copiar.
* Que este link desaparezca cuando automáticamente. sugerir cual seria la mejor opción, si al actualizar la pagina o otras opciones.

## Resolución

- El link se muestra debajo del botón "Generar Link" con estilo destacado y botón Copiar.
- Al generar, se copia automáticamente al portapapeles.
- Se oculta solo a los 60 segundos (también se limpia al recargar: el estado vive solo en memoria).
- El link se arma con `window.location.origin` + token para coincidir con el host/puerto actual.
