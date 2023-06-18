DEF_SEARCH='is:unread AND from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy" OR "Nuevo piso en tu búsqueda" OR "Bajada de precio en tu búsqueda")';
DEF_SRDONE='is:read subject:"[idealista] anuncios" has:attachment from:me'

function run(search, s_done) {
  if (1<Util.HM && Util.HM<7) {
    console.log("Estas no son horas");
    return;
  }
  if (typeof search != "string") search=DEF_SEARCH;
  if (typeof s_done != "string") s_done=DEF_SRDONE;
  let PARSER = new Parser(search, s_done);
  if (PARSER.msg.ko.length) {
    let mids = PARSER.msg.ko.map(m=>m.getId());
    Mail.send({
      to: Util.prop("KO_TO"),
      subject: "[idealista] ERROR",
      body: [search].concat(mids)
    });
    throw new Error("Algunos mensajes han dado error: "+ (mids.join(", ")))
  }

  let ads = PARSER.ads.filter(p => !(
      isKO(p.novedad === false, `${p.id} descartado por recomendación`) ||
      isKO(p.tipo == "Ático",   `${p.id} descartado por ${p.tipo}`) ||
      isKO(p.num_planta<2,      `${p.id} descartado por planta ${p.planta}`) ||
      isKO(p.isAlquiler && p.precio>=1200 && p.mcuad<=70 && p.habit<=2,
                                `${p.id} descartado por caro y pequeño`) ||
      isKO(PARSER.isDone(p.id), `${p.id} descartado por visto`)
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
    to: Util.prop("OK_TO"),
    subject: "[idealista] anuncios",
    cc: Util.prop("OK_CC"),
    bcc: Util.prop("OK_BCC"),
    body: textBody,
    htmlBody: htmlBody,
    attachments: {"pisos": ads}
  });
}

function _debug() {
  //run('in:all AND from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy")')
  //let ads = get_ads('from:noresponder@avisos.idealista.com AND subject:("Nuevos anuncios hoy") AND after:2023/05/27 before:2023/05/29 ');
  //console.log(ads);
}