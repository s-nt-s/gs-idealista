class GMail {
 static getMessages(search) {
    if (typeof search !== "string") return [];
    if (GMail.__srch==null) GMail.__srch = {};
    if (GMail.__srch[search]==null) {
      let isUnread = /\bis:unread\b/.test(search);
      let isRead = /\bis:read\b/.test(search);
      GMail.__srch[search] = [];
      GmailApp.search(search).forEach(t => {
        t.getMessages().forEach(m => {
          if (isUnread && !m.isUnread()) return;
          if (isRead && m.isUnread()) return;
          GMail.__srch[search].push(m);
        })
      });
    }
    return GMail.__srch[search];
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
        return GMail.create_file(kv[0], kv[1]);
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
  static markRead(mail) {
    new MailWrapper(mail).markRead();
  }
}

class MailWrapper {
  constructor(msg) {
    this.msg = msg;
  }
  markRead() {
    if ((typeof this.msg == "object") && (typeof this.msg.markRead == "function")) {
      this.msg.markRead();
      return;
    }
    if (this.type == null) return;
    let markRead = {
      "message[]": GmailApp.markMessagesRead,
      "thread[]": GmailApp.markThreadsRead
    }[this.type];
    if (markRead==null) throw `El tipo ${this.type} no tiene método markRead`;
    Util.forEachChunk(this.msg, 100, markRead);
  }
  get type() {
    if (this.msg == null) return null;
    if (Array.isArray(this.msg)) {
      if (this.msg.length==0) return null;
      let tp = new MailWrapper(this.msg[0]).type;
      if (tp!=null) return tp+"[]";
      return tp;
    }
    if (typeof this.msg != "object") return null;
    if (typeof this.msg.addLabel == "function") return "thread";
    if (typeof this.msg.getAttachments == "function") return "message";
    throw "Tipo de Mail desconocido";
  }
}

function gm_debug() {
  let msg = GMail.getMessages("is:read label:Borrame");
  console.log(msg.length);
  GMail.markRead(msg);
}



