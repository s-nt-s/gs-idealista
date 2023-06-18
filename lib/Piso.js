class Piso {
  constructor(obj) {
    this.id     = obj.id;
    this.link   = obj.link;
    this.tipo   = obj.tipo;
    this.calle  = obj.calle;
    this.planta = obj.planta;
    this.habit  = obj.habit;
    this.precio = obj.precio;
    this.mcuad  = obj.mcuad;
    this.novedad= obj.novedad;
    this.exterior=obj.exterior;
    if (this.calle!=null) {
      this.calle = this.calle.replace(/\s+/, " ");
      this.calle = this.calle.replace(/\s+,/, ",");
    }
    if (this.tipo == "Piso") {
      if (this.planta == "Entresuelo") this.planta = 0.5;
    }
    if (this.exterior!=null) this.exterior = (this.exterior=='exterior');
  }
  get euros() {
    if (this.precio==null) return null;
    if (this.precio<10000) return `${this.precio} €/mes`;
    return `${this.precio} €`;
  }
  get mapa() {
    if (this.calle==null) return null;
    return "https://www.google.es/maps?q=" + this.calle.replace(/\s+/g, "+");
  }
  get direccion() {
    if (this.calle==null) return null;
    let calle = this.calle.slice();
    calle = calle.replace(/^Plaza\b/i, "Pza.");
    calle = calle.replace(/^Ronda\b/i, "Rda.");
    calle = calle.replace(/^Avenida\b/i, "Av.");
    calle = calle.replace(/^paseo de( las|los)?\b/i, "Pº");
    calle = calle.replace(/^Calle( (de las?|de los|del?))?\b/i, "C/");
    calle = calle.replace(/, Madrid$/i, "");
    calle = calle.replace(/,$/i, "");
    return calle;
  }
  get to_str() {
    return `${this.id} ${this.euros} ${this.mcuad}m² ${this.habit}hab ${this.direccion}, ${this.planta}ª`
  }
  get num_planta() {
    if (this.tipo != "Piso") return Infinity;
    if (typeof this.planta !== "number") return Infinity;
    return this.planta;
  }
  get isAlquiler() {
    return (this.precio!=null && this.precio<10000);
  }
  static sort(arr) {
    return arr.sort((a, b) => {
      let ap = a.precio??999999999999999;
      let bp = a.precio??999999999999999;
      if (ap==bp) return a.id-b.id;
      return ap-bp;
    });
  }
}