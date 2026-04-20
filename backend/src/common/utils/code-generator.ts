export class CodeGenerator {
  static generateCodePreview(nombre: string, categoriaNombre: string): string {
    if (!nombre || !categoriaNombre) return '';

    const nombrePart = this.getFirstLetters(nombre);
    const categoriaPart = this.getFirstLetters(categoriaNombre);

    if (nombrePart.length === 0 || categoriaPart.length === 0) {
      return '';
    }

    return `${nombrePart}-${categoriaPart}`;
  }

  static getFirstLetters(text: string): string {
    const cleaned = text
      .toUpperCase()
      .trim()
      .replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')
      .replace(/\s+/g, '');

    return cleaned.substring(0, 3);
  }
}
