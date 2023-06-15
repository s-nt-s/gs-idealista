let HM = gHM();
DEF_SEARCH='is:unread AND from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy" OR "Nuevo piso en tu búsqueda" OR "Bajada de precio en tu búsqueda")';
DEF_SRDONE='is:read subject:"[idealista] anuncios" has:attachment from:me'

function run(search, s_done) {
  if (1<HM && HM<7) {
    console.log("Estas no son horas");
    return;
  }
  GmailApp.get
  if (typeof search != "string") search=DEF_SEARCH;
  if (typeof s_done != "string") s_done=DEF_SRDONE;
  let PARSER = new Parser(search, s_done);
  if (PARSER.msg.ko.length) {
    let mids = PARSER.msg.ko.map(m=>m.getId());
    Mail.send({
      to: ENV("KO_TO"),
      subject: "[idealista] ERROR",
      body: [search].concat(mids)
    });
    throw new Error("Algunos mensajes han dado error: "+ (mids.join(", ")))
  }

  let ads = PARSER.ads.filter(p => !(
      isKO(p.novedad !== true, `${p.id} Descartado por recomendación`) ||
      isKO(p.tipo == "Ático",  `${p.id} Descartado por ${p.tipo}`) ||
      isKO(p.num_planta<2,     `${p.id} Descartado por planta ${p.planta}`) ||
      isKO(PARSER.isDone(p.id),`${p.id} Descartado por visto`)
    )
  );
  sendAds(ads);
  GmailApp.markMessagesRead(PARSER.msg.ok);
}

function isKO(ko, msg) {
  if (ko) console.log(msg);
  return ko;
}

function sendAds(ads) {
  if (ads.length==0) return;
  ads.forEach(a => console.log(a.to_str));
  let htmlBody = ads.map(p => `
    <p>
    ${p.euros} <a href="${p.mapa}">${p.direccion}</a><br/>
    <a href="${p.link}">${p.link}</a><br/>
    ${p.habit} hab, ${p.mcuad} m²
    ${p.planta}ª planta (${p.tipo})
    </p>
  `).join("\n");
  let textBody = ads.map(p => `
    ${p.euros} ${p.direccion}
    ${p.link}
    ${p.habit} hab, ${p.mcuad} m²
    ${p.planta}ª planta (${p.tipo})
  `).join("\n");
  Mail.send({
    to: ENV("OK_TO"),
    subject: "[idealista] anuncios",
    cc: ENV("OK_CC"),
    bcc: ENV("OK_BCC"),
    body: textBody,
    htmlBody: htmlBody,
    attachments: {"pisos": ads}
  });
}

function gHM() {
  let d = new Date();
  return d.getHours()+(d.getMinutes()/100);
}

function ENV(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function _debug() {
  //run('in:all AND from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy")')
  //let ads = get_ads('from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy") AND after:2023/05/27 before:2023/05/29 ');
  //console.log(ads);
}