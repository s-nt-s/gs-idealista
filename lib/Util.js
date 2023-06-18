class Util {
  static get HM() {
    if (Util._hm == null) {
      let d = new Date();
      Util._hm = d.getHours()+(d.getMinutes()/100);
    }
    return Util._hm;
  }
  static prop(key) {
    return PropertiesService.getScriptProperties().getProperty(key);
  }
  static find(str, regexp, index) {
    if (str==null) return null;
    let m = str.match(regexp);
    if (m == null) return null;
    let v;
    v = Util._get_group(m, index);
    v = Util.toNum(v)??v;
    return v;
  }
  static findall(str, regexp, index) {
    if (str==null) return [];
    if (!regexp.global) {
      regexp = new RegExp(regexp.source, regexp.flags + "g");
      //throw "Debe regexp ser /.../g (global)";
    }
    let m, v;
    let arr=[];
    do {
        m = regexp.exec(str);
        if (!m) return arr;
        v = Util._get_group(m, index);
        v = Util.toNum(v)??v;
        if (!arr.includes(v)) arr.push(v);
    } while (true);
  }
  static toNum(v) {
    if (typeof v !== "string") return null;
    v = v.replace(/\s+/g, " ").trim();
    v = Number(v.replace(".", ""));
    if (isNaN(v)) return null;
    return v;
  }
  static _get_group(m, index) {
    if (typeof index === "string") return m.groups[index];
    if (index == undefined) {
      index = Math.min(1, m.length-1);
    }
    if (index < 0) return m;
    let v = m[index];
    return v;
  }
}
function u_debug() {
  console.log(Util.find("abcde", /a(b)c(?<a>de)/, -1))
}