class Parser {
  constructor(search, srdone) {
    this.search = search;
    this.srdone = srdone;
    this.__done = null;
    this.msg = {
      ok:[],
      ko:[]
    };
    this.ads = this._get_ads_();
  }

  _get_ads_() {
    let ids = [], ads = [];
    
    GMail.getMessages(this.search).forEach(m => {
      let arr=this.read_mail(m) || [];
      if (this.isBadAd(arr)) this.msg.ko.push(m);
      else this.msg.ok.push(m);
      ads = ads.concat(arr);
    })

    // Eliminar duplicados y ordenar
    ids = ads.map(p => p.id);
    ads = ads.filter((p, index) => (p.id != null) && (ids.indexOf(p.id) === index));
    ads = Piso.sort(ads);

    return ads;
  }

  read_mail(m) {
    let subject = m.getSubject().replace(/\s+/, " ").trim();
    if (/.*Nuevos anuncios hoy.*/.test(subject)) return this.read_mail_list(m);
    if (/.*Nuevo (piso|duplex|[aá]tico) en tu b.*/.test(subject)) return this.read_mail_item(m);
    if (/.*Bajada de precio en tu b.*/.test(subject)) return this.read_mail_item(m);
    return null;
  }

  read_mail_list(m) {
    let bdy, ads;

    bdy = m.getPlainBody();
    //bdy = bdy.replace(/.*?\n\s*(Novedad|Recomendación)\s*\n/s, "$1\n\n");
    bdy = bdy.replace(/Sobre\s+los\s+anuncios\s+en\s+este\s+correo.*/, "");
    bdy = bdy.split(/\s*\n\s*/).map(s=>s.trim()).filter(s=>s.length>0).join("\n");

    ads = bdy.split(/\n\[image: /).slice(1).map(l=>"[image: "+l);

    // Construir anuncios
    ads = ads.map(build_ad_from_list);

    return ads;
  }

  read_mail_item(m) {
    let str = m.getPlainBody().trim();
    let lns = str.split(/\s*\n\s*/).map(l=>l.trim());
    let ln1 = lns[1];
    let obj = {
      id:      Util.find(str, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/),
      link:    Util.find(str, /https?:\/\/www.idealista.com\/inmueble\/\d+/),
      tipo:    Util.find(ln1, /^(\S+)\s+en\s+/),
      calle:   Util.find(ln1, /^\S+\s+en\s+([^\]]+)\s+[\d\.]+(,\d+)?\s+€/),
      planta:  Util.find(str, /\s+(\d+)ª\s+planta/),
      precio:  Util.find(str, /([\d\.]+)(,\d+)?\s+€/),
      mcuad:   Util.find(str, /([\d\.]+)(,\d+)?\s+m²/),
      habit:   Util.find(str, /([\d\.]+)\s+hab\./),
      exterior:Util.find(str, /planta\s+(exterior|interior)/),
      novedad: true
    };
    if (obj.calle == null) obj.calle = Util.find(ln1, /^\S+\s+en\s+([^\]]+)/);
    return [new Piso(obj)];
  }
  isBadAd(ads) {
    if (ads==null || ads.length==0) return true;
    return ads.map(p=>p.id).includes(null);
  }
  isDone(id) {
    return this.done.includes(id);
  }
  get done() {
    if (this.__done == null) {
      let ids = new Set();
      GMail.getMessages(this.srdone).forEach(m => {
        let msg = m.getPlainBody();
        Util.findall(msg, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/).forEach(s => {
          ids.add(s);
        })
      })
      this.__done = Array.from(ids).sort((a, b) => a-b);
    }
    return this.__done;
  }
}

function build_ad_from_list(str) {
  let obj = {
    id:      Util.find(str, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/),
    link:    Util.find(str, /https?:\/\/www.idealista.com\/inmueble\/\d+/),
    tipo:    Util.find(str, /\[image:\s+(\S+)\s+en\s+/),
    calle:   Util.find(str, /\[image:\s+\S+\s+en\s+([^\]]+)/),
    planta:  Util.find(str, /\s+(\d+)ª\s+planta/),
    precio:  Util.find(str, /([\d\.]+)(,\d+)?\s+€/),
    mcuad:   Util.find(str, /([\d\.]+)(,\d+)?\s+m²/),
    habit:   Util.find(str, /([\d\.]+)\s+hab\./),
    exterior:Util.find(str, /planta\s+(exterior|interior)/),
    novedad: Util.find(str, /\n(Novedad)\n/) == "Novedad"
  };
  return new Piso(obj);
}

function debug() {
  let search;
  search = 'from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy") AND after:2023/05/27 before:2023/05/29';
  search = 'from:noresponder@avisos.idealista.com AND subject:("Bajada de precio en tu búsqueda")';
  search = 'from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy" OR "Nuevo piso en tu búsqueda" OR "Bajada de precio en tu búsqueda")';
  search = 'from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy") after:2023/08/02';
  let p = new Parser(search);
  console.log(p.ads);
  //p.ads.forEach(p=>console.log(p.calle+'\n'+p.direccion));
}
