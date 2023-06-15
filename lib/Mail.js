class Mail {
 static getMessages(search) {
    if (typeof search !== "string") return [];
    if (Mail.__srch==null) Mail.__srch = {};
    if (Mail.__srch[search]==null) {
      let isUnread = /\bis:unread\b/.test(search);
      let isRead = /\bis:read\b/.test(search);
      Mail.__srch[search] = [];
      GmailApp.search(search).forEach(t => {
        t.getMessages().forEach(m => {
          if (isUnread && !m.isUnread()) return;
          if (isRead && m.isUnread()) return;
          Mail.__srch[search].push(m);
        })
      });
    }
    return Mail.__srch[search];
  }
  static send(options) {
    let gdel = (k) => {
      let val = options[k];
      delete options[k];
      if (Array.isArray(val)) val = val.join("\n\n");
      return val;
    };
    if (options.attachments && !Array.isArray(options.attachments)) {
      options.attachments = Object.entries(options.attachments).map((kv) => {
        return Mail.create_file(kv[0], kv[1]);
      })
    }
    GmailApp.sendEmail(
      gdel("to"), 
      gdel("subject"), 
      gdel("body"), 
      options
    );
  }
  static create_file(name, obj) {
    if (typeof obj == "object")
      return Utilities.newBlob(JSON.stringify(obj, null, 2), 'application/json', name+".json");
    if (typeof obj == "string")
      return Utilities.newBlob(obj, 'text/plain', name+".txt");
    throw Error((typeof obj)+" no reconocido");
  }
}



