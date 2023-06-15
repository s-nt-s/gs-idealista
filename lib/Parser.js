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
    
    Mail.getMessages(this.search).forEach(m => {
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
    if (/.*Nuevo piso en tu b.*/.test(subject)) return this.read_mail_item(m);
    if (/.*Bajada de precio en tu b.*/.test(subject)) return this.read_mail_item(m);
    return null;
  }

  read_mail_list(m) {
    let bdy, ads;

    bdy = m.getPlainBody();
    bdy = bdy.replace(/.*?\n\s*(Novedad|Recomendación)\s*\n/s, "$1\n\n");
    bdy = bdy.replace(/Sobre\s+los\s+anuncios\s+en\s+este\s+correo.*/, "");
    bdy = bdy.split(/\s*\n\s*/).map(s=>s.trim()).filter(s=>s.length>0).join("\n");

    ads = bdy.split(/\n\[image: /).slice(1).map(l=>"[image: "+l);

    // Construir anuncios
    ads = ads.map(build_ad_from_list);

    // Categorizar anuncio (novedad o recomendación)
    ads.forEach(ad => {
      let chunk = bdy.split(ad.link)[0].split(/\s*\n\s*/);
      let noved = chunk.lastIndexOf("Novedad");
      let recom = chunk.lastIndexOf("Recomendación");
      if (noved == -1 && recom == -1) return;
      if (noved == -1) return (ad.novedad = false);
      if (recom == -1) return (ad.novedad = true);
      ad.novedad = (noved>recom);
    })

    return ads;
  }

  read_mail_item(m) {
    let str = m.getPlainBody().trim();
    let ln = str.split(/\s*\n\s*/).map(l=>l.trim());
    let obj = {
      id:      _find(str, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/),
      link:    _find(str, /https?:\/\/www.idealista.com\/inmueble\/\d+/),
      tipo:    _find(ln[1],/^(\S+)\s+en\s+/),
      calle:   _find(ln[1],/^\S+\s+en\s+([^\]]+)\s+[\d\.]+(,\d+)?\s+€/),
      planta:  _find(str, /\s+(\d+)ª\s+planta/),
      precio:  _find(str, /([\d\.]+)(,\d+)?\s+€/),
      mcuad:   _find(str, /([\d\.]+)(,\d+)?\s+m²/),
      habit:   _find(str, /([\d\.]+)\s+hab\./),
      exterior:_find(str, /planta\s+(exterior|interior)/),
      novedad: true
    };
    if (obj.calle == null) obj.calle = _find(ln[1],/^\S+\s+en\s+([^\]]+)/);
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
      Mail.getMessages(this.srdone).forEach(m => {
        let msg = m.getPlainBody();
        _find_all(msg, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/g).forEach(s => {
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
    id:      _find(str, /https?:\/\/www.idealista.com\/inmueble\/(\d+)/),
    link:    _find(str, /https?:\/\/www.idealista.com\/inmueble\/\d+/),
    tipo:    _find(str, /\[image:\s+(\S+)\s+en\s+/),
    calle:   _find(str, /\[image:\s+\S+\s+en\s+([^\]]+)/),
    planta:  _find(str, /\s+(\d+)ª\s+planta/),
    precio:  _find(str, /([\d\.]+)(,\d+)?\s+€/),
    mcuad:   _find(str, /([\d\.]+)(,\d+)?\s+m²/),
    habit:   _find(str, /([\d\.]+)\s+hab\./),
    exterior:_find(str, /planta\s+(exterior|interior)/)
  };
  return new Piso(obj);
}

function _find(str, regexp, index) {
  if (str==null) return null;
  let m = str.match(regexp);
  if (m == null) return null;
  let v, n;
  if (index == undefined) {
    index = Math.min(1, m.length-1)-1;
  }
  v = m[index+1];
  v = v.replace(/\s+/g, " ").trim();
  n = Number(v.replace(".", ""));
  if (!isNaN(n)) return n;
  return v;
}

function _find_all(str, regexp, index) {
  if (!regexp.global) throw "Debe regexp ser /.../g (global)"
  let m, v, n;
  let arr=[];
  do {
      m = regexp.exec(str);
      if (!m) return arr;
      if (index == undefined) {
        index = Math.min(1, m.length-1)-1;
      }
      v = m[1];
      v = v.replace(/\s+/g, " ").trim();
      n = Number(v.replace(".", ""));
      if (!isNaN(n)) v=n;
      if (!arr.includes(v)) arr.push(v);
  } while (true);
}

function debug() {
  let search;
  search = 'from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy") AND after:2023/05/27 before:2023/05/29';
  search = 'from:noresponder@avisos.idealista.com AND subject:("Bajada de precio en tu búsqueda")';
  search = 'from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy" OR "Nuevo piso en tu búsqueda" OR "Bajada de precio en tu búsqueda")';
  let p = new Parser(search);
  console.log(p.ads);
  //p.ads.forEach(p=>console.log(p.calle+'\n'+p.direccion));
}
