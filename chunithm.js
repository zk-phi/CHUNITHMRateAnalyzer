// CHUNITHM Rate Analyzer (C) zk_phi 2015-

var cra_version = 160503;

if (!location.href.match(/^https:\/\/chunithm-net.com/)) {
    alert("CHUNITHM NET を開いているタブで実行してください。");
    throw Error();
} else if (location.href.match(/\/mobile\/(index\.html)?$/)) {
    alert("CHUNITHM NET にログインした状態で実行してください。");
    throw Error();
} else if (location.href.match(/AimeList\.html$/)) {
    alert("AIME を選択した状態で実行してください。");
    throw Error();
}

// List of dependencies (note that all resources must be provided via
// HTTPS).
var dependencies = {
    js: [
        "https://platform.twitter.com/widgets.js" // Twitter tweet/follow button
    ],
    css: [
    ],
};

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

// ---- API wrappers

// Request CHUNITHM Net API API_NAME with REQ_DATA, and call CALLBACK
// on success when given. (reference : http://www.ginjake.net/score/readme.php)
function request_api(api_name, req_data, callback, errorback)
{
    req_data.userId = parseInt(getCookie()["userId"]);
    $.ajax(REQUEST_URL + api_name, {
        type: "post",
        data: JSON.stringify(req_data),
        dataType: "json",
        scriptCharset: "UTF-8",
        timeout: 5000
    }).done(function(data) {
        if (!data) return errorback && errorback(id);
        setCookie("userId", data.userId);
        callback && callback(data);
    }).fail(function(id) {
        errorback && errorback(id);
    });
}

// ---- Rate <-> Score

// Calculate rate from given SCORE and RATE_BASE. (reference :
// http://d.hatena.ne.jp/risette14/20150913/1442160273)
function score_to_rate(rate_base, score)
{
    var rate = score >= 1007500 ? rate_base + 2.0
        :  score >= 1005000 ? rate_base + 1.5 + (score - 1005000) * 10 / 50000
        :  score >= 1000000 ? rate_base + 1.0 + (score - 1000000) *  5 / 50000
        :  score >=  975000 ? rate_base + 0.0 + (score -  975000) *  2 / 50000
        :  score >=  950000 ? rate_base - 1.5 + (score -  950000) *  3 / 50000
        :  score >=  925000 ? rate_base - 3.0 + (score -  925000) *  3 / 50000
        :  score >=  900000 ? rate_base - 5.0 + (score -  900000) *  4 / 50000
        :  0;
    return Math.floor(rate * 100) / 100;
}

// Calculate score required to achieve given RATE wrt RATE_BASE. This
// function may return NaN to indicate that the rate is NOT achievable
// wrt RATE_BASE.
function rate_to_score(rate_base, target_rate)
{
    var diff = target_rate - rate_base;
    return diff  >  2.0 ? NaN
        :  diff ==  2.0 ? 1007500
        :  diff >=  1.5 ? Math.floor((diff -  1.5) * 50000 / 10) + 1005000
        :  diff >=  1.0 ? Math.floor((diff -  1.0) * 50000 /  5) + 1000000
        :  diff >=  0.0 ? Math.floor((diff -  0.0) * 50000 /  2) +  975000
        :  diff >= -1.5 ? Math.floor((diff - -1.5) * 50000 /  3) +  950000
        :  diff >= -3.0 ? Math.floor((diff - -3.0) * 50000 /  3) +  925000
        :  diff >= -5.0 ? Math.floor((diff - -5.0) * 50000 /  4) +  900000
        :  900000;
}

// ---- Unparsers

// Format a positive floating number NUM to a string of the form
// `xx.xx'.
function rate_str(num)
{
    return num.toString().substring(0, num >= 10 ? 5 : 4);
}

// Stringify an arbitrary floating number NUM to a string of the form
// `[+x.xx]'. Result may be an empty string '' if abs(NUM) < 0.01.
function rate_diff_str(num)
{
    return num <= -10.0 ? "[" + num.toString().substring(0, 6) + "]"
        :  num <= -0.01 ? "[" + num.toString().substring(0, 5) + "]"
        :  num >=  10.0 ? "[+" + num.toString().substring(0, 5) + "]"
        :  num >=  0.01 ? "[+" + num.toString().substring(0, 4) + "]"
        : "";
}

// (unused) Get rank icon suitable for SCORE.
function rank_icon (score)
{
    return score >= 1007500 ? "common/images/icon_sss.png"
        : score >= 1000000 ? "common/images/icon_ss.png"
        : score >=  975000 ? "common/images/icon_s.png"
        : score >=  950000 ? "common/images/icon_aaa.png"
        : score >=  925000 ? "common/images/icon_aa.png"
        : score >=  900000 ? "common/images/icon_a.png"
        : "";
}

// ---- JS Obj -> DOM

// Stringify a js object in the CSS format.
function _css(obj)
{
    return Object.keys(obj).reduce(function(acc, x) {
        return acc + x + "{" + (
            x.charAt(0) == '@' ? _css(obj[x]) : Object.keys(obj[x]).reduce(function(acc, y) {
                return acc + y + ":" + obj[x][y] + ";";
        }, "")) + "}";
    }, "");
}

// Generate a jQuery object from a js object OBJ. OBJ is either a
// string or an array. If OBJ is an array, it must have the form
// [ELEM, ATTRS, CHILDREN ...], where ELEM is a string representing
// elem type (i.e. "div") optionally follwed by its ID and classes
// (i.e. "#hoge.fuga.piyo"), ATTRS is an optional hash ('click' is
// reserved for the click handler), and each CHILDREN is a js object
// (or an array of js objects) recursively.
function _dom(obj) {
    if (typeof obj == "string" || obj instanceof jQuery) return obj;

    var elem     = obj[0].split(/[.#]/)[0];
    var classes  = obj[0].split('#')[0].split('.').slice(1);
    var id       = obj[0].split('#')[1];
    var attrs    = typeof obj[1] == "object" && !Array.isArray(obj[1]) && obj[1];
    var contents = obj.slice(attrs ? 2 : 1);

    var $elem = $("<" + elem + " " +
                  (classes[0] ? "class='" + classes.join(" ") + "'" : "") +
                  (id ? "id='" + id + "'" : "") +
                  (attrs ? Object.keys(attrs).map(function(k) {
                      return k == 'click' ? "" : k + "='" + attrs[k] + "'";
                  }).join('') : "") + ">");

    if (attrs.click) $elem.click(attrs.click);

    contents.forEach(function(x) {
        if (Array.isArray(x[0])) x.forEach(function(y) { $elem.append(_dom(y)); });
        else $elem.append(_dom(x));
    });

    return $elem;
}

// Render COMPONENT in PARENT DOM, where COMPONENT is a hash of the
// form { html: [...], css: {...} } and PARENT is a jQuery query. Note
// that CSS is rendered only if the object has never been rendered
// yet. If APPENDP is a true-value, COMPONENT is appended at the last
// of the PARENT DOM.
function render(component, parent, appendp)
{
    if (component.html) {
        if (appendp) {
            $(parent).append($(_dom(component.html)));
        } else {
            $(parent).html($(_dom(component.html)));
        }
    }
    if (component.css && !component.css._rendered) {
        $("head").append("<style>" + _css(component.css) + "</style>");
        component.css._rendered = true;
    }
}

// -----------------------------------------------------------------------------
// global vars
// -----------------------------------------------------------------------------

// TODO: No items can be removed from this list. We'd better use hash.
//
// List of chart ID vs rate_base, leveled 11 or more
var chart_list = [
     { id: 103, level: 2, rate_base: 11.7, image: "img/3210d321c2700a57.jpg", name: "エンドマークに希望と涙を添えて 赤" }
    ,{ id: 68,  level: 3, rate_base: 11.7, image: "img/145b9b6f4c27d78e.jpg", name: "乗り切れ受験ウォーズ" }
    ,{ id: 146, level: 3, rate_base: 11.7, image: "img/d3b40f7b8e0758ff.jpg", name: "夕暮れワンルーム" }
    ,{ id: 69,  level: 2, rate_base: 11.9, image: "img/c2c4ece2034eb620.jpg", name: "The wheel to the right 赤" }
    ,{ id: 63,  level: 2, rate_base: 11.7, image: "img/2df15f390356067f.jpg", name: "Gate of Fate 赤" }
    ,{ id: 76,  level: 2, rate_base: 11.8, image: "img/93abb77776c70b47.jpg", name: "luna blu 赤" }
    ,{ id: 140, level: 3, rate_base: 11.9, image: "img/0aad2e0ff661e7d1.jpg", name: "Guilty" }
    ,{ id: 75,  level: 3, rate_base: 11.7, image: "img/e1454dc2eeae2030.jpg", name: "Counselor" }
    ,{ id: 99,  level: 3, rate_base: 11.7, image: "img/ee332e6fa86661fd.jpg", name: "言ノ葉カルマ" }
    ,{ id: 145, level: 3, rate_base: 11.8, image: "img/0bb58f15b16703ab.jpg", name: "Change Our MIRAI！" }
    ,{ id: 134, level: 2, rate_base: 11.8, image: "img/08a24ed249ed2eec.jpg", name: "HAELEQUIN (Original Remaster) 赤" }
    ,{ id: 3,   level: 3, rate_base: 11.8, image: "img/d739ba44da6798a0.jpg", name: "B.B.K.K.B.K.K." }
    ,{ id: 149, level: 3, rate_base: 11.7, image: "img/c9c2fa20dcd9a46e.jpg", name: "緋色のDance" }
    ,{ id: 48,  level: 3, rate_base: 11.8, image: "img/b38eba298df2c6db.jpg", name: "Unlimited Spark!" }
    ,{ id: 96,  level: 3, rate_base: 11.9, image: "img/9d2ebc847487e01b.jpg", name: "チルノのパーフェクトさんすう教室" }
    ,{ id: 94,  level: 3, rate_base: 12.3, image: "img/164258c65c714d50.jpg", name: "セツナトリップ" }
    ,{ id: 47,  level: 3, rate_base: 12.0, image: "img/5cb17a59f4b8c133.jpg", name: "六兆年と一夜物語" }
    ,{ id: 152, level: 2, rate_base: 11.7, image: "img/f63fab30a7b6f160.jpg", name: "Gustav Battle 赤" }
    ,{ id: 141, level: 2, rate_base: 11.5, image: "img/2e6c11edba79d997.jpg", name: "閃鋼のブリューナク 赤" }
    ,{ id: 67,  level: 3, rate_base: 11.2, image: "img/11437ebc94947550.jpg", name: "昵懇レファレンス" }
    ,{ id: 65,  level: 3, rate_base: 11.1, image: "img/713d52aa40ed7fc4.jpg", name: "Anemone" }
    ,{ id: 163, level: 3, rate_base: 11.3, image: "img/fd6847e3bb2e3629.jpg", name: "幾四音-Ixion-" }
    ,{ id: 148, level: 3, rate_base: 11.0, image: "img/cd458a75aa049889.jpg", name: "Theme of SeelischTact" }
    ,{ id: 79,  level: 3, rate_base: 11.0, image: "img/281f821a06a7da18.jpg", name: "ＧＯ！ＧＯ！ラブリズム♥" }
    ,{ id: 158, level: 3, rate_base: 11.0, image: "img/e3ce6712e8cddf10.jpg", name: "フォルテシモBELL" }
    ,{ id: 130, level: 3, rate_base: 11.7, image: "img/e4df0d48302ccd26.jpg", name: "スカイクラッドの観測者" }
    ,{ id: 129, level: 3, rate_base: 11.2, image: "img/f56cd36303a3239a.jpg", name: "Hacking to the Gate" }
    ,{ id: 176, level: 3, rate_base: 11.3, image: "img/aa0cefb5a0f00457.jpg", name: "Dance!" }
    ,{ id: 207, level: 3, rate_base: 11.7, image: "img/5151993f923b06a5.jpg", name: "Your Affection (Daisuke Asakura Remix)" }
    ,{ id: 206, level: 3, rate_base: 11.4, image: "img/e10bbd173df15772.jpg", name: "Signs Of Love (“Never More” ver.)" }
    ,{ id: 10,  level: 3, rate_base: 11.7, image: "img/0d7bd146ebed6fba.jpg", name: "All I Want" }
    ,{ id: 204, level: 3, rate_base: 11.0, image: "img/1ea73ffbba6d7ead.jpg", name: "ちくわパフェだよ☆CKP" }
    ,{ id: 203, level: 3, rate_base: 12.0, image: "img/101d4e7b03a5a89e.jpg", name: "FLOWER" }
    ,{ id: 91,  level: 3, rate_base: 11.2, image: "img/cb77a66b62023890.jpg", name: "Yet Another ”drizzly rain”" }
    ,{ id: 115, level: 3, rate_base: 11.5, image: "img/9165ee58223accc0.jpg", name: "Dreaming" }
    ,{ id: 41,  level: 3, rate_base: 11.6, image: "img/7f17441bc2582ec8.jpg", name: "sweet little sister" }
    ,{ id: 98,  level: 3, rate_base: 11.4, image: "img/f7e67efaf6ced6ea.jpg", name: "魔理沙は大変なものを盗んでいきました" }
    ,{ id: 156, level: 3, rate_base: 11.5, image: "img/b33923bd4e6e5609.jpg", name: "FREELY TOMORROW" }
    ,{ id: 117, level: 3, rate_base: 11.5, image: "img/88124d980ac7eca4.jpg", name: "M.S.S.Planet" }
    ,{ id: 118, level: 3, rate_base: 12.0, image: "img/17e485acfe11a67f.jpg", name: "腐れ外道とチョコレゐト" }
    ,{ id: 18,  level: 3, rate_base: 11.2, image: "img/3c2606abe4dded71.jpg", name: "千本桜" }
    ,{ id: 113, level: 3, rate_base: 11.4, image: "img/3f8eb68a4f6089dc.jpg", name: "ストリーミングハート" }
    ,{ id: 38,  level: 3, rate_base: 11.0, image: "img/529d98ad07709ae5.jpg", name: "天ノ弱" }
    ,{ id: 114, level: 3, rate_base: 11.4, image: "img/b02c3912d1524d5c.jpg", name: "Sweet Devil" }
    ,{ id: 111, level: 3, rate_base: 11.3, image: "img/7ad659a57ef26888.jpg", name: "staple stable" }
    ,{ id: 110, level: 3, rate_base: 11.2, image: "img/d42200159ef91521.jpg", name: "Magia" }
    ,{ id: 5,   level: 3, rate_base: 11.3, image: "img/38faf81803b730f3.jpg", name: "Scatman (Ski Ba Bop Ba Dop Bop)" }
    ,{ id: 60,  level: 3, rate_base: 11.3, image: "img/3bee1cce7d794f31.jpg", name: "only my railgun" }
    ,{ id: 17,  level: 3, rate_base: 11.1, image: "img/696d4f956ebb4209.jpg", name: "空色デイズ" }
    ,{ id: 104, level: 3, rate_base: 12.5, image: "img/ff945c9cb9e43e83.jpg", name: "とーきょー全域★アキハバラ？" }
    ,{ id: 178, level: 3, rate_base: 12.7, image: "img/9f281db3bcc9353b.jpg", name: "stella=steLLa" }
    ,{ id: 101, level: 3, rate_base: 12.9, image: "img/81e347d3b96b2ae1.jpg", name: "Tango Rouge" }
    ,{ id: 64,  level: 3, rate_base: 12.7, image: "img/6bf934fede23724d.jpg", name: "今ぞ♡崇め奉れ☆オマエらよ！！～姫の秘メタル渇望～" }
    ,{ id: 144, level: 3, rate_base: 13.3, image: "img/8b04b9ad2d49850c.jpg", name: "Aragami" }
    ,{ id: 142, level: 3, rate_base: 12.6, image: "img/a8d181c5442df7d2.jpg", name: "Altale" }
    ,{ id: 157, level: 3, rate_base: 12.8, image: "img/573109ca9050f55d.jpg", name: "ギガンティック O.T.N" }
    ,{ id: 154, level: 3, rate_base: 12.7, image: "img/2e9fdbbc15ade5cb.jpg", name: "SAVIOR OF SONG" }
    ,{ id: 180, level: 2, rate_base: 12.4, image: "img/a732d43fd2a11e8f.jpg", name: "怒槌 赤" }
    ,{ id: 70,  level: 3, rate_base: 12.4, image: "img/3ccebd87235f591c.jpg", name: "STAR" }
    ,{ id: 151, level: 3, rate_base: 12.5, image: "img/7237488215dbd1d3.jpg", name: "Alma" }
    ,{ id: 82,  level: 3, rate_base: 12.5, image: "img/27ef71f8a76f1e8a.jpg", name: "Memories of Sun and Moon" }
    ,{ id: 108, level: 3, rate_base: 12.0, image: "img/1ec3213366f4ad57.jpg", name: "The ether" }
    ,{ id: 53,  level: 3, rate_base: 12.3, image: "img/73ad66e81061bba3.jpg", name: "Teriqma" }
    ,{ id: 95,  level: 3, rate_base: 12.1, image: "img/db38c119e4d8933e.jpg", name: "砂漠のハンティングガール♡" }
    ,{ id: 51,  level: 3, rate_base: 12.7, image: "img/161f13a787a00032.jpg", name: "My First Phone" }
    ,{ id: 71,  level: 3, rate_base: 12.3, image: "img/2bf02bef3051ecaf.jpg", name: "Infantoon Fantasy" }
    ,{ id: 161, level: 3, rate_base: 12.4, image: "img/4ceb5aed4a4a1c47.jpg", name: "私の中の幻想的世界観及びその顕現を想起させたある現実での出来事に関する一考察" }
    ,{ id: 150, level: 3, rate_base: 11.8, image: "img/2a41ad71b77d12c9.jpg", name: "brilliant better" }
    ,{ id: 88,  level: 3, rate_base: 12.1, image: "img/c4223e68340efa41.jpg", name: "The Concept of Love" }
    ,{ id: 6,   level: 3, rate_base: 12.3, image: "img/90589be457544570.jpg", name: "Reach for the Stars" }
    ,{ id: 136, level: 3, rate_base: 12.5, image: "img/c4f977d264deafb1.jpg", name: "Äventyr" }
    ,{ id: 128, level: 3, rate_base: 12.7, image: "img/7edc6879319accfd.jpg", name: "The Formula" }
    ,{ id: 45,  level: 3, rate_base: 12.2, image: "img/90dca26c66c5d5b7.jpg", name: "L9" }
    ,{ id: 33,  level: 3, rate_base: 13.0, image: "img/fddc37caee47286d.jpg", name: "Blue Noise" }
    ,{ id: 120, level: 3, rate_base: 12.7, image: "img/a84a31e562efd7a0.jpg", name: "四次元跳躍機関" }
    ,{ id: 21,  level: 3, rate_base: 11.9, image: "img/4f69fb126f579c2f.jpg", name: "ナイト・オブ・ナイツ" }
    ,{ id: 132, level: 3, rate_base: 12.2, image: "img/1c508bbd42d335fe.jpg", name: "イカサマライフゲイム" }
    ,{ id: 83,  level: 3, rate_base: 12.2, image: "img/181682bf5b277726.jpg", name: "ロストワンの号哭" }
    ,{ id: 27,  level: 3, rate_base: 12.5, image: "img/fdc3bb451f6403d2.jpg", name: "タイガーランペイジ" }
    ,{ id: 23,  level: 3, rate_base: 12.1, image: "img/b8ab9573859ebe4f.jpg", name: "一触即発☆禅ガール" }
    ,{ id: 180, level: 3, rate_base: 13.9, image: "img/a732d43fd2a11e8f.jpg", name: "怒槌" }
    ,{ id: 103, level: 3, rate_base: 13.7, image: "img/3210d321c2700a57.jpg", name: "エンドマークに希望と涙を添えて" }
    ,{ id: 152, level: 3, rate_base: 13.0, image: "img/f63fab30a7b6f160.jpg", name: "Gustav Battle" }
    ,{ id: 69,  level: 3, rate_base: 13.3, image: "img/c2c4ece2034eb620.jpg", name: "The wheel to the right" }
    ,{ id: 63,  level: 3, rate_base: 13.1, image: "img/2df15f390356067f.jpg", name: "Gate of Fate" }
    ,{ id: 141, level: 3, rate_base: 13.3, image: "img/2e6c11edba79d997.jpg", name: "閃鋼のブリューナク" }
    ,{ id: 76,  level: 3, rate_base: 13.4, image: "img/93abb77776c70b47.jpg", name: "luna blu" }
    ,{ id: 107, level: 3, rate_base: 13.0, image: "img/b43fef626f5b88cd.jpg", name: "We Gonna Journey" }
    ,{ id: 138, level: 3, rate_base: 13.0, image: "img/478e8835e382f740.jpg", name: "conflict" }
    ,{ id: 135, level: 3, rate_base: 13.5, image: "img/e7ee14d9fe63d072.jpg", name: "Vallista" }
    ,{ id: 134, level: 3, rate_base: 13.7, image: "img/08a24ed249ed2eec.jpg", name: "HAELEQUIN (Original Remaster)" }
    ,{ id: 92,  level: 3, rate_base: 12.8, image: "img/17315fb464f265bd.jpg", name: "最終鬼畜妹・一部声" }
    ,{ id: 159, level: 3, rate_base: 13.3, image: "img/d5a47266b4fe0bfe.jpg", name: "ジングルベル" }
    ,{ id: 165, level: 3, rate_base: 12.8, image: "img/1e85c4b6775c84b0.jpg", name: "ぼくらの16bit戦争" }
    ,{ id: 179, level: 3, rate_base: 11.1, image: "img/0e73189a7083e4f4.jpg", name: "すろぉもぉしょん" }
    ,{ id: 166, level: 3, rate_base: 11.8, image: "img/5a0ac8501e3b95ce.jpg", name: "裏表ラバーズ" }
    ,{ id: 168, level: 3, rate_base: 11.9, image: "img/1982767436fc52d8.jpg", name: "ネトゲ廃人シュプレヒコール" }
    ,{ id: 167, level: 3, rate_base: 12.7, image: "img/24611f2e2374e6a8.jpg", name: "脳漿炸裂ガール" }
    ,{ id: 169, level: 3, rate_base: 11.4, image: "img/f092ddd9e1fe088b.jpg", name: "elegante" }
    ,{ id: 14,  level: 3, rate_base: 11.0, image: "img/af78dd039a36a4c7.jpg", name: "コネクト" }
    ,{ id: 235, level: 3, rate_base: 12.5, image: "img/8b84b06033585428.jpg", name: "ファッとして桃源郷" }
    ,{ id: 232, level: 3, rate_base: 13.4, image: "img/a2069fdb9d860d36.jpg", name: "Elemental Creation" }
    ,{ id: 205, level: 3, rate_base: 12.7, image: "img/3d7803669dd3fcb9.jpg", name: "SNIPE WHOLE" }
    ,{ id: 73,  level: 3, rate_base: 12.6, image: "img/0c2791f737ce1ff2.jpg", name: "MUSIC PЯAYER" }
    ,{ id: 52,  level: 3, rate_base: 13.2, image: "img/a62f975edc860e34.jpg", name: "Cyberozar" }
    ,{ id: 244, level: 3, rate_base: 12.3, image: "img/e0a700914896ea4a.jpg", name: "回レ！雪月花" }
    ,{ id: 243, level: 3, rate_base: 12.2, image: "img/8872c759bea3bd9f.jpg", name: "シュガーソングとビターステップ" }
    ,{ id: 171, level: 3, rate_base: 12.3, image: "img/25abef88cb12af3e.jpg", name: "XL TECHNO" }
    ,{ id: 232, level: 2, rate_base: 11.3, image: "img/a2069fdb9d860d36.jpg", name: "Elemental Creation 赤" }
    ,{ id: 52,  level: 2, rate_base: 11.1, image: "img/a62f975edc860e34.jpg", name: "Cyberozar 赤" }
    ,{ id: 209, level: 3, rate_base: 11.7, image: "img/5744f4cf66710a56.jpg", name: "君色シグナル" }
    ,{ id: 247, level: 3, rate_base: 11.7, image: "img/58847f9694837c0b.jpg", name: "絶世スターゲイト" }
    ,{ id: 199, level: 3, rate_base: 12.1, image: "img/d76afb63de1417f8.jpg", name: "ハート・ビート" }
    ,{ id: 173, level: 3, rate_base: 13.1, image: "img/2e95529be9118a11.jpg", name: "Halcyon" }
    ,{ id: 185, level: 3, rate_base: 11.2, image: "img/520c1fef62954ca6.jpg", name: "楽園の翼" }
    ,{ id: 42,  level: 3, rate_base: 11.6, image: "img/4bbc4ec5ee9aa0b6.jpg", name: "oath sign" }
    ,{ id: 9,   level: 3, rate_base: 11.3, image: "img/fce0bad9123dcd76.jpg", name: "情熱大陸" }
    ,{ id: 56,  level: 3, rate_base: 11.0, image: "img/2535487ae13b2fd8.jpg", name: "そばかす" }
    ,{ id: 112, level: 3, rate_base: 11.0, image: "img/3dc05a281c0724f7.jpg", name: "マジLOVE1000%" }
    ,{ id: 74,  level: 3, rate_base: 11.0, image: "img/feef37ed3d91cfbd.jpg", name: "リリーシア" }
    ,{ id: 233, level: 3, rate_base: 12.2, image: "img/5fe5db1d2e40ee7a.jpg", name: "アルストロメリア" }
    ,{ id: 197, level: 3, rate_base: 13.1, image: "img/ae6d3a8806e09613.jpg", name: "Jack-the-Ripper◆" }
    ,{ id: 226, level: 2, rate_base: 12.3, image: "img/993b5cddb9d9badf.jpg", name: "Garakuta Doll Play 赤" }
    ,{ id: 226, level: 3, rate_base: 13.8, image: "img/993b5cddb9d9badf.jpg", name: "Garakuta Doll Play" }
    ,{ id: 62,  level: 3, rate_base: 12.4, image: "img/9386971505bb20b0.jpg", name: "名も無い鳥" }
    ,{ id: 90,  level: 2, rate_base: 11.7, image: "img/19d57f9a7652308a.jpg", name: "L'épisode 赤" }
    ,{ id: 90,  level: 3, rate_base: 13.2, image: "img/19d57f9a7652308a.jpg", name: "L'épisode" }
    ,{ id: 72,  level: 3, rate_base: 13.5, image: "img/ec3a366b4724f8f6.jpg", name: "Genesis" }
    ,{ id: 197, level: 2, rate_base: 11.7, image: "img/ae6d3a8806e09613.jpg", name: "Jack-the-Ripper◆ 赤" }
    ,{ id: 255, level: 3, rate_base: 11.1, image: "img/429d34fef5fddb02.jpg", name: "激情！ミルキィ大作戦" }
    ,{ id: 214, level: 3, rate_base: 11.8, image: "img/f4a2d88c38669f72.jpg", name: "青春はNon-Stop！" }
    ,{ id: 215, level: 3, rate_base: 12.4, image: "img/81cc90c04676f18b.jpg", name: "Falling Roses" }
    ,{ id: 200, level: 3, rate_base: 12.1, image: "img/569e7b07c0696bc7.jpg", name: "無敵We are one!!" }
    ,{ id: 202, level: 2, rate_base: 11.2, image: "img/45112e2818cf80a2.jpg", name: "GEMINI -C- 赤" }
    ,{ id: 202, level: 3, rate_base: 13.1, image: "img/45112e2818cf80a2.jpg", name: "GEMINI -C-" }
    ,{ id: 222, level: 3, rate_base: 12.9, image: "img/ad33a423c865bed1.jpg", name: "Mr. Wonderland" }
    ,{ id: 252, level: 3, rate_base: 12.3, image: "img/bb221e3de960de7d.jpg", name: "愛迷エレジー" }
    ,{ id: 224, level: 3, rate_base: 11.1, image: "img/b9d170f84c1bb5d3.jpg", name: "恋愛裁判" }
    ,{ id: 228, level: 3, rate_base: 12.0, image: "img/882be51fe439614d.jpg", name: "このふざけた素晴らしき世界は、僕の為にある" }
    ,{ id: 213, level: 3, rate_base: 11.9, image: "img/c6d494f528391d1c.jpg", name: "星屑ユートピア" }
    ,{ id: 212, level: 3, rate_base: 12.1, image: "img/1ee29f73ee8f53d0.jpg", name: "いろは唄" }
    ,{ id: 131, level: 3, rate_base: 12.6, image: "img/38d3c5a5a45c6d07.jpg", name: "チルドレンレコード" }
    ,{ id: 220, level: 3, rate_base: 12.3, image: "img/c3041fd82b0a0710.jpg", name: "如月アテンション" }
    ,{ id: 240, level: 3, rate_base: 12.6, image: "img/47397105bad447fb.jpg", name: "夜咄ディセイブ" }
    ,{ id: 19,  level: 3, rate_base: 13.2, image: "img/0b98b8b4e7cfd997.jpg", name: "DRAGONLADY" }
    ,{ id: 106, level: 2, rate_base: 12.2, image: "img/8219519cc94d5524.jpg", name: "宛城、炎上！！ 赤" }
    ,{ id: 246, level: 3, rate_base: 12.7, image: "img/d445e4878a818d8b.jpg", name: "なるとなぎのパーフェクトロックンロール教室" }
    ,{ id: 106, level: 3, rate_base: 13.8, image: "img/8219519cc94d5524.jpg", name: "宛城、炎上！！" }
    ,{ id: 245, level: 3, rate_base: 11.4, image: "img/630ac5b31e8ab816.jpg", name: "Help me, あーりん！" }
    ,{ id: 61,  level: 3, rate_base: 13.5, image: "img/2ccf97477eaf45ad.jpg", name: "GOLDEN RULE" }
    ,{ id: 160, level: 3, rate_base: 11.5, image: "img/809bf2b3f8effa6f.jpg", name: "言ノ葉遊戯" }
    ,{ id: 61,  level: 2, rate_base: 11.0, image: "img/2ccf97477eaf45ad.jpg", name: "GOLDEN RULE 赤" }
    ,{ id: 196, level: 3, rate_base: 13.7, image: "img/ed40032f25177518.jpg", name: "FREEDOM DiVE" }
    ,{ id: 196, level: 2, rate_base: 11.9, image: "img/ed40032f25177518.jpg", name: "FREEDOM DiVE 赤" }
    ,{ id: 121, level: 3, rate_base: 12.5, image: "img/4196f71ce51620a0.jpg", name: "東方妖々夢 ～the maximum moving about～" }
    ,{ id: 93,  level: 3, rate_base: 12.3, image: "img/6b40809324937ec9.jpg", name: "蒼空に舞え、墨染の桜" }
    ,{ id: 122, level: 3, rate_base: 12.5, image: "img/67418ba28151c3ff.jpg", name: "少女幻葬戦慄曲 ～ Necro Fantasia" }
    ,{ id: 177, level: 3, rate_base: 12.6, image: "img/6e7843f9d831b0ac.jpg", name: "Jimang Shot" }
    ,{ id: 36,  level: 3, rate_base: 11.0, image: "img/e273c9d64170b575.jpg", name: "届かない恋 '13" }
    ,{ id: 126, level: 3, rate_base: 11.3, image: "img/547ba5407b6e7fa0.jpg", name: "Heart To Heart" }
    ,{ id: 35,  level: 3, rate_base: 12.4, image: "img/aabf49add818546d.jpg", name: "Lapis" }
    ,{ id: 223, level: 3, rate_base: 13.0, image: "img/8ec9a26e11ec1a40.jpg", name: "カミサマネジマキ" }
    ,{ id: 216, level: 3, rate_base: 12.3, image: "img/3227722a8345a950.jpg", name: "放課後革命" }
    ,{ id: 225, level: 3, rate_base: 12.1, image: "img/6f86e2a47e9a283c.jpg", name: "ウミユリ海底譚" }
    ,{ id: 210, level: 3, rate_base: 12.4, image: "img/040cd43234aed57a.jpg", name: "アスノヨゾラ哨戒班" }
    ,{ id: 211, level: 3, rate_base: 12.2, image: "img/d99079fecaa936ab.jpg", name: "天樂" }
    ,{ id: 251, level: 3, rate_base: 12.5, image: "img/457722c9f3ff5473.jpg", name: "Crazy ∞ nighT" }
    ,{ id: 223, level: 2, rate_base: 11.0, image: "img/8ec9a26e11ec1a40.jpg", name: "カミサマネジマキ 赤" }
    ,{ id: 217, level: 3, rate_base: 11.8, image: "img/2b3c90b1dab1ecff.jpg", name: "楽園ファンファーレ" }
    ,{ id: 227, level: 3, rate_base: 11.5, image: "img/74c77deb2f2e5e07.jpg", name: "洗脳" }
    ,{ id: 208, level: 3, rate_base: 12.7, image: "img/5bab1a38b98d59b5.jpg", name: "SAMBISTA" }
    ,{ id: 201, level: 2, rate_base: 12.4, image: "img/a251c24a3cc4dbf7.jpg", name: "Contrapasso -inferno- 赤" }
    ,{ id: 201, level: 3, rate_base: 13.9, image: "img/a251c24a3cc4dbf7.jpg", name: "Contrapasso -inferno-" }
    ,{ id: 305, level: 3, rate_base: 13.3, image: "img/266bd38219201fa1.jpg", name: "幻想のサテライト" }
    ,{ id: 317, level: 3, rate_base: 13.4, image: "img/db15d5b7aefaa672.jpg", name: "Air" }
    ,{ id: 248, level: 3, rate_base: 13.9, image: "img/a2fdef9e4b278a51.jpg", name: "Schrecklicher Aufstand" }
    ,{ id: 318, level: 3, rate_base: 13.1, image: "img/f803d578eb4047eb.jpg", name: "DataErr0r" }
    ,{ id: 298, level: 3, rate_base: 12.6, image: "img/7c649691aa0c4b3d.jpg", name: "PRIVATE SERVICE" }
    ,{ id: 250, level: 3, rate_base: 13.5, image: "img/989f4458fb34aa9d.jpg", name: "Philosopher" }
    ,{ id: 77,  level: 3, rate_base: 12.8, image: "img/01fc7f761272bfb4.jpg", name: "ケモノガル" }
    ,{ id: 330, level: 3, rate_base: 12.1, image: "img/b3ea0fe012eb7ea2.jpg", name: "ドキドキDREAM!!!" }
    ,{ id: 292, level: 3, rate_base: 12.0, image: "img/b12c25f87b1d036e.jpg", name: "月に叢雲華に風" }
    ,{ id: 306, level: 3, rate_base: 12.2, image: "img/106d9eec68ed84b3.jpg", name: "凛として咲く花の如く" }
    ,{ id: 124, level: 3, rate_base: 12.5, image: "img/74ce2f0a4b4f6fe2.jpg", name: "夏影" }
    ,{ id: 309, level: 3, rate_base: 12.5, image: "img/cee51d69c428f8f5.jpg", name: "Rising Hope" }
    ,{ id: 238, level: 3, rate_base: 11.9, image: "img/4c769ae611f83d21.jpg", name: "フレンズ" }
    ,{ id: 308, level: 3, rate_base: 11.9, image: "img/f8d3f2e57ae2ff24.jpg", name: "fake!fake!" }
    ,{ id: 55,  level: 3, rate_base: 11.2, image: "img/506f053a80e1b28e.jpg", name: "夏祭り" }
    ,{ id: 66,  level: 3, rate_base: 12.3, image: "img/c22702914849a11a.jpg", name: "明るい未来" }
    ,{ id: 261, level: 3, rate_base: 12.3, image: "img/6e917606db3c5a0e.jpg", name: "ロボットプラネットユートピア" }
    ,{ id: 102, level: 3, rate_base: 12.5, image: "img/7fc6ae1b488b88de.jpg", name: "Tuning Rangers" }
    ,{ id: 276, level: 3, rate_base: 12.4, image: "img/82105b37d18450b6.jpg", name: "後夜祭" }
    ,{ id: 263, level: 3, rate_base: 11.7, image: "img/015358a0c0580022.jpg", name: "Hand in Hand" }
    ,{ id: 37,  level: 3, rate_base: 11.3, image: "img/335dbb14cedb70bf.jpg", name: "鳥の詩" }
    ,{ id: 299, level: 3, rate_base: 11.4, image: "img/9bd44690db5375ac.jpg", name: "secret base ～君がくれたもの～ (10 years after Ver.)" }
    ,{ id: 305, level: 2, rate_base: 11.0, image: "img/266bd38219201fa1.jpg", name: "幻想のサテライト 赤" }
    ,{ id: 254, level: 3, rate_base: 11.7, image: "img/2e617d713547fe84.jpg", name: "その群青が愛しかったようだった" }
    ,{ id: 267, level: 3, rate_base: 11.5, image: "img/a0d03551eb3930e9.jpg", name: "心象蜃気楼" }
    ,{ id: 248, level: 2, rate_base: 12.3, image: "img/a2fdef9e4b278a51.jpg", name: "Schrecklicher Aufstand 赤" }
    ,{ id: 7,   level: 3, rate_base: 13.6, image: "img/b602913a68fca621.jpg", name: "初音ミクの消失" }
    ,{ id: 7,   level: 2, rate_base: 12.0, image: "img/b602913a68fca621.jpg", name: "初音ミクの消失 赤" }
    ,{ id: 287, level: 3, rate_base: 11.9, image: "img/5febf5df2b5094f3.jpg", name: "ロミオとシンデレラ" }
    ,{ id: 279, level: 3, rate_base: 11.7, image: "img/84ecaebe6bce2a58.jpg", name: "深海少女" }
    ,{ id: 278, level: 3, rate_base: 11.4, image: "img/5f1d7a520a2735d4.jpg", name: "からくりピエロ" }
    ,{ id: 286, level: 3, rate_base: 11.5, image: "img/afcce0c85c1f8610.jpg", name: "Tell Your World" }
    ,{ id: 316, level: 3, rate_base: 11.5, image: "img/88f9536c08cb4e3f.jpg", name: "みくみくにしてあげる♪【してやんよ】" }
    ,{ id: 288, level: 3, rate_base: 11.6, image: "img/f29f10a963df60cf.jpg", name: "First Twinkle" }
    ,{ id: 273, level: 3, rate_base: 11.8, image: "img/604157e2c49d91d7.jpg", name: "ビバハピ" }
    ,{ id: 250, level: 2, rate_base: 11.8, image: "img/989f4458fb34aa9d.jpg", name: "Philosopher 赤" }
    ,{ id: 336, level: 3, rate_base: 12.0, image: "img/e40fceaa1bb587b7.jpg", name: "シジョウノコエ VOCALO ver." }
    ,{ id: 319, level: 3, rate_base: 12.6, image: "img/e9eeb98572b140bc.jpg", name: "Say A Vengeance" }
    ,{ id: 320, level: 3, rate_base: 12.6, image: "img/6b33d4fa539d5adb.jpg", name: "010" }
    ,{ id: 321, level: 3, rate_base: 12.5, image: "img/40cc7a6a264f88c1.jpg", name: "ERIS -Legend of Gaidelia-" }
    ,{ id: 137, level: 3, rate_base: 13.6, image: "img/13a5a9ca35a9b71b.jpg", name: "Angel dust" }
    ,{ id: 187, level: 3, rate_base: 13.2, image: "img/e6642a96885723c1.jpg", name: "患部で止まってすぐ溶ける～狂気の優曇華院" }
    ,{ id: 322, level: 3, rate_base: 13.6, image: "img/8b145fe4cf0c01bb.jpg", name: "Imperishable Night 2006 (2016 Refine)" }
    ,{ id: 189, level: 3, rate_base: 12.7, image: "img/9310d07b7e02e73a.jpg", name: "ひれ伏せ愚民どもっ！" }
    ,{ id: 300, level: 3, rate_base: 12.2, image: "img/012eb1ed09577836.jpg", name: "No Routine" }
    ,{ id: 190, level: 3, rate_base: 12.6, image: "img/bbaa464731ab96a4.jpg", name: "エテルニタス・ルドロジー" }
    ,{ id: 331, level: 3, rate_base: 12.2, image: "img/ec37e447b91995dd.jpg", name: "猛進ソリストライフ！" }
    ,{ id: 259, level: 3, rate_base: 13.1, image: "img/4d66e5d1669d79a2.jpg", name: "Oshama Scramble! (Cranky Remix)" }
    ,{ id: 230, level: 3, rate_base: 12.4, image: "img/b59d2b2ab877a77d.jpg", name: "Hyperion" }
    ,{ id: 307, level: 3, rate_base: 12.7, image: "img/ff9f70c8c0d9f24e.jpg", name: "Paqqin" }
    ,{ id: 229, level: 3, rate_base: 13.4, image: "img/73f86aec8d6c7c9b.jpg", name: "紅華刑" }
    ,{ id: 262, level: 3, rate_base: 13.6, image: "img/676e59847912f5ca.jpg", name: "Tidal Wave" }
    ,{ id: 323, level: 3, rate_base: 13.5, image: "img/282cb1cacd4c1bb4.jpg", name: "Dreadnought" }
    ,{ id: 324, level: 3, rate_base: 12.6, image: "img/d51d4ffba9f8d45e.jpg", name: "STAGER" }
    ,{ id: 325, level: 3, rate_base: 12.6, image: "img/97eca622afca0f15.jpg", name: "Her Majesty" }
    ,{ id: 259, level: 2, rate_base: 11.3, image: "img/4d66e5d1669d79a2.jpg", name: "Oshama Scramble! (Cranky Remix) 赤" }
    ,{ id: 229, level: 2, rate_base: 11.9, image: "img/73f86aec8d6c7c9b.jpg", name: "紅華刑 赤" }
    ,{ id: 281, level: 3, rate_base: 13.4, image: "img/330e57eeeb0fb2cd.jpg", name: "ラクガキスト" }
    ,{ id: 293, level: 3, rate_base: 13.2, image: "img/c58227eb0d14938c.jpg", name: "インビジブル" }
    ,{ id: 270, level: 3, rate_base: 12.3, image: "img/21dfcd3ae2c5c370.jpg", name: "エンヴィキャットウォーク" }
    ,{ id: 119, level: 3, rate_base: 12.3, image: "img/a7dd6716fcae0cb8.jpg", name: "アウターサイエンス" }
    ,{ id: 313, level: 3, rate_base: 11.4, image: "img/5ac018495d6f01a5.jpg", name: "ひだまりデイズ" }
    ,{ id: 296, level: 3, rate_base: 12.1, image: "img/76535cf4c728f2af.jpg", name: "かくしん的☆めたまるふぉ～ぜっ!" }
    ,{ id: 326, level: 3, rate_base: 12.5, image: "img/fd01fc38e38042e3.jpg", name: "Sakura Fubuki" }
    ,{ id: 327, level: 3, rate_base: 12.7, image: "img/17c363c1fd2fa7d1.jpg", name: "JULIAN" }
    ,{ id: 264, level: 3, rate_base: 12.2, image: "img/f44c6b628889f8ec.jpg", name: "My Dearest Song" }
    ,{ id: 291, level: 3, rate_base: 12.4, image: "img/9c5e71b3588dbc70.jpg", name: "Kronos" }
    ,{ id: 290, level: 3, rate_base: 11.3, image: "img/b1d08379f05c706e.jpg", name: "檄!帝国華撃団"}
    ,{ id: 304, level: 3, rate_base: 11.7, image: "img/16cb8567115a2f2c.jpg", name: "In The Blue Sky ’01"}
    ,{ id: 329, level: 3, rate_base: 12.3, image: "img/e869980ddd2f9c68.jpg", name: "STAIRWAY TO GENERATION"}
    ,{ id: 332, level: 3, rate_base: 12.3, image: "img/41001ddd4214d6b6.jpg", name: "空威張りビヘイビア"}
    ,{ id: 260, level: 3, rate_base: 12.4, image: "img/03f1dafe3b08607e.jpg", name: "D.E.A.D.L.Y."}
    ,{ id: 289, level: 3, rate_base: 12.7, image: "img/0cece587cced4d3f.jpg", name: "ウソラセラ"}
    ,{ id: 257, level: 3, rate_base: 13.0, image: "img/bef9b79c637bf4c9.jpg", name: "BOKUTO"}
    ,{ id: 219, level: 2, rate_base: 12.7, image: "img/246f63902c4b0f89.jpg", name: "玩具狂奏曲 -終焉- 赤"}
    ,{ id: 219, level: 3, rate_base: 13.9, image: "img/246f63902c4b0f89.jpg", name: "玩具狂奏曲 -終焉-"}
    ,{ id: 218, level: 3, rate_base: 12.4, image: "img/20359304f5e0574a.jpg", name: "サウンドプレイヤー"}
    ,{ id: 302, level: 3, rate_base: 13.3, image: "img/13446730e8b99f0e.jpg", name: "Strahv"}
    ,{ id: 328, level: 3, rate_base: 13.7, image: "img/c7cf3ce1e858e3f0.jpg", name: "★LittlE HearTs★"}
    ,{ id: 19,  level: 2, rate_base: 11.0, image: "img/0b98b8b4e7cfd997.jpg", name: "DRAGONLADY 赤" }
    ,{ id: 137, level: 2, rate_base: 11.4, image: "img/13a5a9ca35a9b71b.jpg", name: "Angel dust 赤" }
];

// latest rate
var best_rate   = 0;
var opt_rate    = 0;
var disp_rate   = 0;
var recent_rate = 0;
var worst_chart_rate;

// load the last data from localStorage (if exists)
var last_cra_version = JSON.parse(localStorage.getItem("cra_version"));
var last_chart_list  = JSON.parse(localStorage.getItem("cra_chart_list"));
var last_best_rate   = JSON.parse(localStorage.getItem("cra_best_rate"));
var last_opt_rate    = JSON.parse(localStorage.getItem("cra_opt_rate"));
var last_disp_rate   = JSON.parse(localStorage.getItem("cra_disp_rate"));
var last_recent_rate = JSON.parse(localStorage.getItem("cra_recent_rate"));

// diff between the latest rate and the last rate
var best_rate_diff;
var opt_rate_diff;
var recent_rate_diff;
var disp_rate_diff;

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------

// CSS applied to the HTML
var the_css = {
    "#logo": { "max-width": "100%" },

    "#cra_chart_list": {
        "position": "relative",
        "width": "100%"
    },

    "#cra_footer": { "margin-bottom": "30px" },

    ".cra_sort_button": {
        "display": "inline-block",
        "padding": "8px", "border-radius": "8px", "margin": "5px",
        "background-color": "black", "color": "white"
    },

    ".cra_chart_list_item": {
        "text-align": "center",
    },

    ".cra_button": { "cursor": "pointer" }
}

// --- caution dialog

var css_caution_dialog = {
    "#cra_window_wrapper": {
        "position": "absolute", "top": "0px", "left": "0px",
        "height": "100%", "width": "100%"
    },

    "#cra_window_helper": {
        "display": "inline-block", "vertical-align": "middle",
        "height": "100%"
    },

    "#cra_window_outer": {
        "display": "inline-block", "vertical-align": "middle"
    },

    "#cra_window_inner p": { "margin": "20px" },
    "#cra_window_inner .cra_caution": { "font-size": "25px" }
};

function caution_dialog(content, buttons) {
    return {
        css: css_caution_dialog,
        html:
        ['div#cra_window_wrapper',
         ['div#cra_window_helper'],
         ['div#cra_window_outer.frame01.w460',
          ['div#cra_window_inner.frame01_inside.w450',
           content.map(function(x) { return ['p', x]; }),
           buttons.map(function(x) {
               return ['h2#page_title.cra_button', { click: x.action } x.label]; })]]]
    };
}

// ---- render the initial screen

// load dependencies
dependencies.js.map(function(x) { $("head").append("<script src='" + x + "'>"); });
dependencies.css.map(function(x) { $("head").append("<link rel='stylesheet' href='" + x + "'"); });
$("head").append("<style>" + _css(the_css) + "</style>");

// hide chunithm_net
var $chunithm_net = $("body *");
$chunithm_net.fadeTo(400, 0.75);

function onclick_cra_close () {
    $("html, body").animate({ scrollTop: 0 }, 400);
    $("#cra_wrapper").fadeOut(400, function() { $(this).remove(); });
    $chunithm_net.delay(400).fadeTo(400, 1);
}

function onclick_do_analyze () {
    $("#cra_close_button").hide(400);
    fetch_user_data(function() {
        fetch_score_data(2, function() {
            fetch_score_data(3, function() {
                localStorage.setItem("cra_chart_list", JSON.stringify(chart_list));
                localStorage.setItem("cra_version", JSON.stringify(cra_version));
                $("#cra_close_button").show(400);
                rate_display();
            });
        });
    });
}

function onclick_see_last_analysis () {
    chart_list = last_chart_list;
    disp_rate = last_disp_rate;
    rate_display();
}

var css_initial_screen = {
    "#cra_wrapper": {
        "position": "absolute", "top": "0px", "left": "0px",
        "min-height": "100%", "width": "100%",
        "display": "none", "z-index": "10000",
        "text-align": "center",
    },
    "#cra_close_button": {
        "position": "fixed", "right": "20px", "top": "20px",
        "z-index": "100",
        "font-size": "30px",
    }
};

var initial_screen = {
    css: css_initial_screen,
    html:
    ['div#cra_wrapper',
     ["div#cra_close_button.cra_button", { click: onclick_cra_close }, "x"]
     caution_dialog(
         ['9/13- スコアの取得を高速化。',
          '9/12- 単曲レートの切り捨て位置を修正。',
          'ツールの性質を理解したうえで、各自の判断でご利用ください。',
          'ツールを閉じるには、右上の×ボタンをクリックしてください。'],
         [{ label: 'スコアを解析する', action: onclick_do_analyze },
          { label: '前回のデータを見る', action: onclick_see_last_analysis }]), ]
};

render(initial_screen, 'body', true);
$("html, body").animate({ scrollTop: 0 }, 400);
$("#cra_wrapper").delay(400).fadeIn(400);

// -----------------------------------------------------------------------------
// fetch music / user data
// -----------------------------------------------------------------------------

// use GetUserMusicApi to fetch all scores, and update chart_list
function fetch_score_data(level, callback)
{
    $("#cra_window_inner").html("<p>loading ...</p>");
    request_api("GetUserMusicApi", {
        level: "1990" + level
    }, function(d) {
        var map = {};
        for (var i = 0; i < d.userMusicList.length; i++)
            map[d.userMusicList[i].musicId] = d.userMusicList[i].scoreMax;
        for (var i = 0; i < chart_list.length; i++) {
            if (chart_list[i].level == level) {
                chart_list[i].score = map[chart_list[i].id] || 0;
                chart_list[i].rate  = score_to_rate(chart_list[i].rate_base, chart_list[i].score);
            }
        }
        callback();
    }, function() {
        $("#cra_window_inner").html("<p>CHUNITHM NET との通信に失敗しました。</p>");
    });
}

// fetch user data and update `disp_rate`
function fetch_user_data(callback)
{
    $("#cra_window_inner").html("<p>loading user data ...</p>");
    request_api("GetUserInfoApi", {
        friendCode: 0, fileLevel: 1
    }, function(d) {
        disp_rate = d.userInfo.playerRating / 100.0;
        localStorage.setItem("cra_disp_rate", JSON.stringify(disp_rate));
        callback();
    }, function() {
        $("#cra_window_inner")
            .html("<p>ユーザー情報が取得できませんでした</p>" +
                  "<h2 id='page_title' class='cra_button'>再読み込み</h2>");
        $("#page_title")
            .click(function() { fetch_user_data(callback); });
    });
}

// -----------------------------------------------------------------------------
// calculate rate and render
// -----------------------------------------------------------------------------

var expected_rate = [
    // 13.0
    [12.44, 12.63, 12.62, 12.63, 12.07, 12.16, 12.40, 12.49, 12.34, 12.70, 12.18, 11.96,
     11.80, 12.08, 12.18, 12.20, 12.00, 12.18, 12.05, 11.85, 12.09, 12.33, 11.70, 11.87,
     11.82, 11.62, 12.17, 11.96, 12.09, 11.54, 11.43, 11.76, 11.92, 11.63, 12.13, 12.35,
     12.02, 12.67, 12.36, 12.34, 11.70, 12.20, 11.84, 11.98, 11.96, 12.35, 11.75, 11.89,
     11.82, 13.49, 12.67, 11.65, 12.62, 11.26, 12.89, 11.92, 12.34, 12.55, 12.54, 12.19,
     12.91, 12.53, 12.61, 12.38, 12.64, 12.72, 13.49, 12.53, 12.35, 12.78, 12.44, 11.03,
     11.57, 12.73, 12.17, 12.87, 12.62, 12.45, 12.26, 12.39, 11.11, 10.71, 12.32,  0.00,
     12.56, 11.15, 12.29, 12.36, 11.10, 11.03, 11.02, 13.07, 13.10, 11.95, 11.61, 12.01,
     12.55, 12.28, 12.00, 11.51, 12.81, 11.34,  9.96, 12.01, 12.88, 12.31, 12.80, 12.25,
     12.17,  9.28, 12.64, 12.84, 13.29, 12.92, 12.17, 12.50, 11.41, 11.25, 11.46, 11.74,
     12.28, 11.36, 12.36,  9.45, 12.53, 12.21, 11.81, 11.21, 11.76, 12.33, 12.73, 12.87,
     12.85, 11.91, 11.65, 12.32, 12.75, 12.01, 12.70, 12.85, 12.43, 13.19, 12.84, 12.00, 11.19],
    // 13.1
    [12.39, 12.69, 12.64, 12.66, 12.20, 12.26, 12.47, 12.47, 12.16, 12.57, 11.62, 11.78,
     12.13, 12.23, 12.31, 12.33, 12.19, 12.58, 12.23, 11.97, 11.91, 12.26, 11.54, 11.74,
     11.82, 12.09, 12.09, 11.88, 11.97, 11.81, 11.58, 11.85, 11.49, 11.65, 12.31, 12.43,
     12.03, 12.44, 12.33, 12.56, 11.72, 12.35, 12.06, 12.05, 12.06, 12.34, 11.87, 11.73,
     11.96, 13.65, 12.73, 12.25, 12.99, 12.44, 12.99, 12.60, 12.58, 12.75, 12.74, 12.53,
     13.07, 12.77, 12.73, 12.69, 12.96, 12.47, 13.31, 12.55, 12.50, 12.97, 12.88, 12.00,
     11.50, 12.80, 12.50, 12.95, 12.60, 12.53, 12.57, 12.62, 11.55, 11.10, 12.62, 11.31,
     13.00, 11.87, 12.47, 12.69, 11.86, 12.35,  9.99, 13.12, 13.44, 12.59, 11.34, 12.32,
     12.52, 12.74, 12.14, 11.87, 12.98, 11.37, 12.65, 12.63, 13.44, 12.47, 12.84, 12.48,
     12.27, 12.30, 12.55, 12.73, 13.62, 13.13, 11.97, 12.30, 10.87,  7.15, 11.85, 11.68,
     12.25, 12.86, 12.67, 10.92, 12.92, 11.60, 10.98, 10.30, 11.81, 12.53, 13.03, 12.61,
     13.02, 11.90, 11.46, 12.91, 12.85, 12.02, 12.92, 12.81, 12.68, 13.53, 13.11, 13.39, 12.11],
    // 13.2
    [12.40, 12.62, 12.63, 12.68, 12.38, 12.13, 12.54, 12.49, 12.47, 12.59, 12.35, 11.86,
     12.40, 12.05, 12.13, 12.35, 12.18, 12.46, 12.20, 12.19, 12.00, 12.15, 11.76, 11.85,
     11.87, 12.16, 12.19, 12.06, 12.20, 11.89, 11.57, 11.71, 12.04, 11.81, 12.15, 12.37,
     11.95, 12.76, 12.21, 12.54, 11.71, 12.40, 12.00, 12.13, 11.97, 12.26, 11.73, 11.98,
     11.71, 13.51, 12.79, 12.04, 13.02, 12.45, 12.90, 12.42, 12.19, 12.72, 12.71, 12.40,
     12.97, 12.44, 12.70, 12.66, 12.72, 12.37, 13.72, 12.64, 12.54, 12.98, 12.67, 12.78,
     11.33, 12.72, 12.50, 12.97, 12.68, 12.60, 12.74, 12.70, 11.57, 12.39, 12.37, 11.83,
     12.88, 11.44, 12.29, 12.85, 11.72, 12.52, 10.83, 13.37, 13.41, 12.48, 11.76, 12.34,
     12.64, 12.71, 11.84, 11.95, 13.15, 11.96, 12.76, 12.61, 13.20, 12.67, 12.90, 12.28,
     12.29, 12.63, 12.92, 12.78, 13.27, 13.23, 12.21, 12.64, 11.39, 11.62, 11.87, 11.68,
     12.75, 12.78, 12.81, 10.42, 12.96, 12.46, 10.54, 11.41, 11.67, 12.51, 12.82, 12.84,
     12.92, 12.07, 12.34, 12.96, 12.99, 12.19, 12.80, 13.04, 12.61, 13.53, 13.12, 13.19, 12.35],
    // 13.3
    [12.58, 12.82, 12.97, 12.92, 12.30, 12.32, 12.61, 12.56, 12.43, 12.76, 12.49, 12.10,
     12.25, 12.36, 12.33, 12.65, 12.19, 12.65, 12.29, 12.12, 12.27, 12.20, 11.70, 11.97,
     12.00, 12.42, 12.69, 12.18, 12.27, 11.84, 12.14, 11.85, 12.23, 11.88, 12.32, 12.47,
     12.18, 12.46, 12.35, 12.62, 12.03, 12.39, 12.56, 12.08, 12.21, 12.32, 11.99, 12.03,
     12.01, 13.68, 12.40, 12.32, 13.03, 12.91, 13.05, 12.87, 12.77, 12.93, 12.77, 12.46,
     13.01, 12.69, 12.78, 12.92, 13.03, 12.81, 13.97, 12.64, 12.63, 13.12, 12.77, 12.57,
     12.32, 12.79, 12.69, 12.89, 12.96, 12.54, 12.75, 12.62, 12.16, 11.44, 12.97, 12.79,
     13.24, 12.35, 12.49, 13.14, 12.10, 12.01, 11.80, 13.12, 13.35, 12.86, 11.77, 12.39,
     12.82, 12.72, 12.19, 12.10, 13.15, 12.29, 12.92, 12.80, 13.56, 12.66, 13.06, 12.52,
     12.38, 12.58, 13.00, 12.80, 13.56, 13.25, 12.44, 12.97, 11.87, 11.64, 11.98, 11.91,
     12.74, 13.09, 12.75, 11.03, 12.86, 12.49, 10.98, 11.31, 12.03, 12.65, 13.09, 12.96,
     13.07, 12.24, 12.76, 13.10, 12.97, 12.15, 12.61, 12.90, 12.50, 13.50, 13.26, 13.23, 12.31],
    // 13.4
    [12.44, 13.09, 13.16, 13.08, 12.24, 12.24, 12.48, 12.45, 12.45, 12.84, 12.44, 11.73,
     12.23, 12.43, 12.55, 12.60, 12.22, 12.63, 12.23, 12.18, 12.12, 12.19, 11.59, 11.96,
     12.17, 12.08, 12.45, 12.19, 12.04, 11.87, 11.64, 11.92, 12.23, 11.92, 12.37, 12.62,
     12.10, 12.87, 12.40, 12.66, 11.94, 12.63, 12.36, 12.06, 12.18, 12.17, 11.64, 12.10,
     11.94, 13.86, 13.14, 12.43, 13.11, 12.53, 12.98, 12.93, 12.98, 12.88, 12.84, 12.17,
     13.13, 12.80, 12.79, 12.71, 12.70, 13.01, 13.77, 12.68, 12.24, 13.01, 12.60, 12.47,
     11.79, 12.75, 12.67, 13.22, 13.05, 12.82, 12.77, 12.94, 12.58, 12.05, 12.81, 13.11,
     13.17, 12.03, 12.91, 13.06, 12.83, 12.16, 12.22, 13.51, 13.53, 13.14, 11.97, 12.57,
     13.01, 12.87, 12.19, 11.87, 13.13, 12.74, 13.10, 12.60, 13.45, 12.76, 13.22, 12.37,
     12.63, 12.38, 13.10, 12.88, 13.76, 13.39, 13.03, 13.12, 11.77, 11.27, 11.98, 11.96,
     12.76, 13.28, 12.90, 12.10, 13.00, 12.36, 11.18, 11.51, 12.10, 13.05, 13.36, 13.21,
     13.29, 12.10, 13.17, 13.03, 12.98, 12.66, 12.97, 13.33, 12.64, 13.70, 13.43, 13.32, 12.63],
    // 13.5
    [12.03, 13.05, 12.97, 13.04, 12.25, 12.41, 12.36, 12.36, 12.49, 12.78, 12.48, 12.10,
     12.27, 12.26, 12.49, 12.60, 12.37, 12.43, 12.10, 12.22, 11.98, 12.29, 11.59, 11.87,
     12.14, 12.12, 12.29, 12.19, 12.22, 11.91, 11.85, 11.99, 12.40, 11.92, 12.24, 12.42,
     12.05, 12.71, 12.34, 12.67, 11.84, 12.69, 12.28, 12.11, 12.23, 12.35, 11.99, 11.99,
     11.89, 13.88, 13.17, 12.37, 13.18, 12.70, 13.06, 12.89, 12.91, 12.87, 12.76, 12.27,
     13.00, 12.70, 12.82, 12.87, 12.85, 12.97, 13.45, 12.66, 12.51, 13.10, 12.62, 12.62,
     12.07, 12.50, 12.69, 13.25, 13.14, 12.84, 12.69, 12.75, 12.70, 11.68, 12.97, 12.97,
     13.12, 12.14, 13.06, 13.22, 12.42, 12.52, 12.20, 13.30, 13.59, 13.15, 12.00, 12.55,
     12.89, 12.85, 12.17, 11.93, 13.27, 12.90, 12.48, 12.64, 13.69, 12.81, 13.06, 12.53,
     12.62, 12.52, 13.05, 12.81, 13.72, 13.46, 12.57, 12.84, 10.80, 11.48, 11.78, 11.81,
     12.94, 10.74, 12.85, 11.57, 12.99, 12.38, 11.65, 11.87, 12.13, 12.80, 13.24, 13.15,
     13.28, 12.16, 12.92, 13.31, 13.15, 12.49, 12.82, 13.33, 12.69, 13.91, 13.65, 13.43, 12.13],
    // 13.6
    [12.70, 12.94, 12.96, 13.01, 12.31, 12.35, 12.73, 12.42, 12.53, 12.96, 12.54, 12.28,
     12.47, 12.33, 12.55, 12.75, 12.20, 12.78, 12.23, 12.00, 11.53, 12.28, 11.62, 11.98,
     12.01, 12.40, 12.20, 12.18, 12.29, 12.07, 12.23, 12.16, 12.61, 11.68, 12.23, 12.31,
     12.13, 12.63, 12.22, 12.83, 11.91, 12.61, 12.04, 12.27, 12.29, 12.15, 12.06, 12.28,
     11.85, 13.55, 13.32, 12.82, 13.34, 13.13, 13.11, 13.04, 13.02, 13.05, 12.87, 12.37,
     13.14, 12.63, 12.90, 12.56, 12.85, 12.88, 13.81, 12.65, 12.69, 13.32, 12.98, 12.89,
     12.53, 12.97, 12.85, 13.32, 13.15, 12.83, 12.85, 12.76, 12.79, 12.89, 13.10, 13.81,
     13.35, 12.97, 13.10, 13.30, 13.00, 12.73, 12.68, 13.58, 14.18, 13.33, 12.02, 12.55,
     12.69, 12.99, 12.15, 11.50, 13.41, 13.33, 13.37, 12.90, 13.94, 12.99, 13.33, 12.50,
     13.17, 12.58, 13.24, 12.89, 13.83, 13.55, 12.68, 13.00, 11.70, 11.89, 11.66, 11.54,
     13.07, 13.41, 13.05, 12.58, 13.01, 12.59, 12.64, 12.22, 12.14, 12.62, 12.27, 13.20,
     13.30, 12.14, 13.26, 13.44, 13.26, 12.41, 13.05, 13.36, 12.86, 13.71, 13.67, 13.60, 13.19],
    // 13.7
    [12.74, 13.09, 13.18, 12.48, 12.36, 12.50, 12.84, 12.69, 12.64, 12.93, 12.61, 12.40,
     12.57, 12.57, 12.60, 12.89, 12.37, 12.72, 12.30, 12.24, 12.00, 12.46, 11.93, 11.99,
     12.27, 12.38, 12.59, 12.34, 12.43, 12.14, 12.14, 12.06, 12.75, 11.99, 12.43, 12.51,
     12.24, 12.73, 12.41, 12.91, 12.07, 12.48, 12.14, 12.23, 12.28, 12.40, 12.15, 12.01,
     11.86, 13.98, 13.30, 12.94, 13.38, 13.22, 13.24, 13.12, 13.12, 12.97, 13.04, 12.28,
     13.23, 12.83, 13.00, 12.55, 13.09, 13.10, 13.63, 12.83, 12.80, 13.32, 13.08, 13.21,
     12.59, 13.00, 12.92, 13.37, 13.20, 12.93, 12.92, 12.88, 12.83, 12.79, 13.37, 13.78,
     13.50, 13.17, 13.37, 13.45, 13.12, 12.85, 11.48, 13.64, 13.82, 13.28, 12.00, 12.63,
     13.02, 13.16, 12.29, 12.38, 13.41, 13.36, 13.38, 13.03, 14.00, 12.98, 13.26, 12.80,
     12.78, 12.77, 13.05, 13.00, 13.83, 13.56, 12.62, 12.90, 11.86, 11.93, 12.00, 11.95,
     13.08, 13.45, 13.16, 12.18, 13.11, 12.60, 12.51, 12.06, 12.18, 12.88, 12.87, 13.31,
     13.37, 11.24, 13.32, 13.44, 13.03, 12.48, 12.98, 13.39, 12.78, 13.01, 13.57, 13.69, 13.31],
    // 13.8
    [13.01, 13.17, 13.28, 13.12, 12.52, 12.57, 12.88, 12.96, 12.69, 13.49, 12.66, 12.47,
     12.64, 12.64, 12.69, 12.91, 12.53, 13.01, 12.43, 12.47, 12.49, 12.76, 12.12, 12.31,
     12.70, 12.42, 12.62, 12.61, 12.54, 12.23, 12.34, 12.24, 12.66, 12.18, 12.61, 12.64,
     12.35, 13.07, 12.61, 12.95, 12.17, 12.92, 12.43, 12.31, 12.65, 12.72, 12.23, 12.28,
     12.14, 14.33, 13.41, 13.20, 13.51, 13.32, 13.29, 13.22, 13.18, 13.07, 13.22, 12.87,
     13.32, 13.24, 13.14, 13.21, 12.97, 13.24, 13.86, 13.18, 12.99, 13.38, 13.15, 13.14,
     12.76, 13.17, 12.97, 13.70, 13.36, 13.00, 13.08, 13.06, 13.07, 13.03, 13.41, 13.82,
     13.61, 13.22, 13.46, 13.46, 13.29, 12.95, 12.83, 13.73, 13.93, 13.36, 12.36, 12.86,
     13.24, 13.27, 12.74, 12.49, 13.50, 13.41, 13.56, 13.24, 14.11, 13.01, 13.55, 12.92,
     13.15, 13.03, 13.59, 13.25, 14.13, 13.62, 13.00, 12.01, 11.98, 11.97, 11.98, 12.20,
     13.17, 13.59, 13.26, 12.44, 13.22, 11.93, 13.22, 12.38, 12.35, 13.09, 13.45, 13.36,
     13.55, 12.63, 13.44, 13.57, 13.46, 12.72, 13.23, 13.59, 13.12, 13.94, 13.71, 13.78, 13.38],
    // 13.9
    [12.83, 13.33, 13.18, 13.17, 12.48, 12.57, 12.83, 12.73, 12.81, 13.26, 12.63, 12.48,
     12.57, 12.64, 12.72, 12.89, 12.44, 12.70, 12.37, 12.50, 12.23, 12.63, 11.94, 12.37,
     12.60, 12.53, 12.58, 12.34, 12.48, 12.05, 12.24, 12.15, 12.83, 12.06, 12.47, 12.67,
     12.35, 12.97, 12.61, 12.95, 12.18, 12.84, 12.50, 12.25, 12.51, 12.71, 12.27, 12.21,
     12.10, 14.47, 13.49, 13.17, 13.55, 13.43, 13.35, 13.34, 13.23, 13.12, 13.24, 12.82,
     13.35, 12.97, 13.13, 13.14, 13.28, 13.25, 13.78, 13.15, 12.97, 13.49, 13.20, 13.18,
     12.69, 13.20, 12.97, 13.63, 13.28, 13.03, 13.03, 13.10, 13.46, 13.40, 13.38, 14.06,
     13.70, 13.31, 13.55, 13.64, 13.36, 13.23, 13.19, 13.87, 14.09, 13.45, 12.15, 12.77,
     13.21, 13.36, 12.64, 12.11, 13.60, 13.52, 13.61, 13.19, 14.22, 13.11, 13.51, 12.97,
     13.00, 12.76, 13.34, 13.20, 14.27, 13.73, 13.01, 13.26, 12.05, 11.85, 11.97, 12.17,
     13.29, 13.80, 13.23, 13.04, 13.17, 11.96, 13.20, 12.59, 12.35, 13.10, 13.47, 13.50,
     13.67, 12.33, 13.49, 13.70, 13.52, 12.66, 13.41, 13.59, 13.01, 14.07, 13.72, 13.89, 13.58],
    // 14.0
    [13.06, 13.30, 13.35, 13.18, 12.49, 12.64, 12.89, 12.81, 12.84, 13.36, 12.76, 12.54,
     12.59, 12.76, 12.75, 12.98, 12.43, 12.70, 12.40, 12.35, 12.26, 12.68, 11.97, 12.26,
     12.43, 12.60, 12.61, 12.39, 12.65, 12.22, 12.34, 12.37, 12.92, 12.17, 12.65, 12.73,
     12.43, 12.97, 12.72, 12.96, 12.19, 12.76, 12.73, 12.26, 12.34, 12.50, 12.27, 12.29,
     12.06, 14.61, 13.52, 13.26, 13.61, 13.52, 13.43, 13.42, 13.35, 13.19, 13.30, 12.93,
     13.39, 13.02, 13.24, 13.37, 13.32, 13.29, 14.15, 13.16, 12.93, 13.53, 13.32, 13.42,
     12.91, 13.23, 13.12, 13.80, 13.57, 13.14, 13.17, 13.09, 13.42, 13.41, 13.62, 14.18,
     13.68, 13.38, 13.63, 13.75, 13.55, 13.33, 13.28, 13.95, 14.20, 13.53, 12.26, 12.86,
     13.30, 13.43, 12.76, 12.46, 13.82, 13.60, 13.67, 13.25, 14.31, 13.31, 13.62, 12.98,
     13.09, 13.01, 13.56, 13.31, 14.30, 13.81, 12.96, 13.09, 12.06, 12.00, 11.95, 11.98,
     13.49, 13.82, 13.26, 13.20, 13.25, 12.99, 12.79, 12.70, 12.47, 13.10, 13.61, 13.49,
     13.75, 12.61, 13.67, 13.74, 13.65, 12.81, 13.37, 13.81, 13.00, 14.12, 13.79, 14.09, 13.50],
    // 14.1
    [13.38, 13.30, 13.32, 13.25, 12.59, 12.64, 12.85, 13.04, 12.85, 13.33, 12.87, 12.76,
     12.68, 13.05, 12.75, 13.14, 12.55, 12.84, 12.49, 12.30, 12.44, 12.76, 12.23, 12.43,
     12.92, 12.67, 13.04, 12.85, 12.83, 12.45, 12.59, 12.43, 13.17, 12.35, 12.75, 12.78,
     12.58, 13.27, 11.97, 13.14, 12.42, 13.05, 12.41, 12.54, 12.44, 12.69, 12.54, 12.27,
     12.37, 14.60, 13.65, 13.39, 13.69, 13.80, 13.58, 13.63, 13.59, 13.33, 13.43, 13.09,
     13.44, 13.20, 13.50, 13.47, 13.43, 13.67, 14.40, 13.33, 13.22, 13.86, 13.42, 13.61,
     13.06, 13.40, 13.20, 13.90, 13.61, 13.32, 12.99, 13.39, 13.68, 13.59, 13.81, 14.29,
     13.84, 13.57, 13.82, 13.89, 13.74, 13.55, 13.79, 13.98, 14.17, 13.74, 12.53, 13.06,
     13.69, 13.61, 13.17, 12.21, 13.86, 13.81, 13.87, 13.36, 14.37, 13.42, 14.04, 13.08,
     13.29, 12.87, 13.70, 13.56, 14.30, 13.98, 13.14, 13.40, 12.11, 12.19, 12.17, 12.13,
     13.62, 13.86, 13.40, 13.48, 12.68, 12.97, 13.64, 12.75, 12.42, 13.10, 13.78, 13.74,
     13.87, 12.89, 13.74, 13.79, 13.66, 12.97, 13.57, 13.88, 13.25, 14.20, 13.96, 14.37, 13.72],
    // 14.2
    [13.30, 13.45, 13.55, 13.08, 12.64, 12.68, 12.82, 13.12, 12.71, 13.50, 12.93, 12.85,
     12.91, 13.11, 12.99, 13.21, 12.68, 12.92, 12.43, 12.69, 12.63, 13.14, 12.37, 12.71,
     12.86, 12.93, 12.70, 12.77, 12.67, 12.45, 12.49, 12.47, 13.21, 12.33, 12.83, 13.01,
     12.72, 13.45, 12.72, 13.21, 12.57, 13.21, 12.90, 12.56, 12.91, 13.06, 12.60, 12.61,
     12.59, 14.68, 13.84, 13.56, 13.80, 13.81, 13.64, 13.71, 13.66, 13.33, 13.60, 12.76,
     13.50, 13.29, 13.43, 13.56, 13.48, 13.74, 14.33, 13.72, 13.31, 13.85, 13.50, 13.80,
     13.18, 13.42, 13.28, 13.90, 13.77, 13.48, 13.36, 13.67, 13.75, 13.78, 13.86, 14.52,
     13.90, 13.66, 13.84, 13.89, 13.73, 13.52, 13.74, 14.12, 14.30, 13.83, 12.61, 13.22,
     13.66, 13.64, 13.00, 12.41, 14.08, 13.87, 14.06, 13.46, 14.40, 13.57, 14.05, 13.22,
     13.30, 12.91, 13.70, 13.72, 14.30, 14.00, 13.15, 13.52, 12.10, 12.13, 12.26, 12.20,
     13.92, 13.98, 13.63, 13.82, 13.38, 13.16, 13.61, 13.04, 12.65, 13.10, 13.90, 13.80,
     13.96, 13.02, 13.92, 13.92, 13.81, 12.96, 13.75, 14.10, 12.85, 14.43, 14.07, 14.28, 13.88],
    // 14.3
    [13.31, 13.48, 13.64, 13.14, 12.53, 12.72, 12.90, 13.03, 13.10, 13.55, 12.81, 12.81,
     12.83, 13.16, 12.91, 13.20, 12.66, 12.74, 12.45, 12.50, 12.62, 12.89, 12.39, 12.76,
     12.85, 12.53, 13.01, 12.82, 12.69, 12.36, 12.58, 12.43, 13.16, 12.60, 13.02, 13.08,
     12.76, 13.37, 12.91, 13.36, 12.50, 13.30, 12.83, 12.65, 12.97, 12.75, 12.68, 12.48,
     12.49, 14.70, 13.74, 13.60, 13.83, 13.81, 13.65, 13.75, 13.69, 13.44, 13.63, 13.20,
     13.44, 13.32, 13.58, 13.55, 13.51, 13.64, 14.16, 13.25, 13.20, 13.99, 13.51, 13.72,
     13.12, 13.47, 13.27, 13.90, 14.05, 13.62, 13.47, 13.49, 13.93, 13.99, 13.96, 14.67,
     13.90, 13.77, 13.88, 13.97, 13.87, 13.61, 13.87, 14.09, 14.42, 13.84, 12.95, 13.42,
     13.58, 13.78, 12.87, 12.43, 14.08, 13.96, 14.17, 13.48, 14.65, 13.76, 14.20, 13.23,
     13.30, 13.07, 13.70, 13.71, 14.30, 14.04, 13.20, 13.58, 12.29, 12.15, 12.28, 12.14,
     13.97, 14.04, 13.69, 14.00, 13.44, 13.04, 13.66, 13.14, 12.59, 13.10, 13.90, 13.98,
     14.10, 12.94, 13.97, 14.05, 14.21, 13.10, 13.97, 14.10, 13.58, 14.69, 14.30, 14.62, 13.98],
    // 14.4
    [13.31, 13.69, 13.70, 13.20, 12.60, 12.75, 13.07, 13.24, 13.12, 13.71, 13.02, 12.95,
     12.96, 13.25, 13.18, 13.46, 12.83, 12.56, 12.54, 12.85, 13.10, 13.10, 12.38, 12.96,
     13.00, 12.93, 13.20, 13.01, 13.03, 12.68, 12.83, 12.88, 13.30, 12.60, 13.34, 13.25,
     12.87, 13.50, 13.05, 13.47, 12.73, 13.27, 13.00, 11.79, 12.98, 12.36, 13.02, 12.93,
     12.60, 14.70, 14.00, 13.72, 14.05, 13.95, 13.90, 13.97, 13.98, 13.56, 13.74, 13.37,
     13.70, 13.36, 13.72, 13.60, 13.69, 13.79, 14.40, 13.65, 13.36, 14.10, 13.77, 13.98,
     13.15, 13.57, 13.44, 13.90, 14.20, 13.67, 13.75, 13.66, 14.11, 14.15, 14.24, 14.85,
     14.06, 13.88, 14.10, 14.14, 14.02, 13.75, 14.03, 14.39, 14.56, 14.04, 13.01, 13.65,
     13.69, 13.62, 13.22, 12.56, 14.42, 14.07, 14.49, 13.80, 14.81, 13.72, 14.20, 13.42,
     13.30, 13.10, 13.70, 13.84, 14.30, 14.14, 13.20, 13.60, 12.29, 12.36, 12.70, 12.23,
     14.20, 14.21, 13.75, 14.23, 13.69, 11.32, 13.89, 13.40, 12.87, 13.10, 13.90, 14.17,
     14.10, 13.06, 14.11, 14.32, 14.27, 13.10, 14.00, 14.10, 13.51, 14.70, 14.28, 14.65, 14.03],
    // 14.5
    [13.27, 13.52, 13.63, 13.27, 12.58, 12.75, 13.28, 13.31, 13.12, 13.52, 13.04, 13.07,
     12.99, 13.33, 13.20, 13.57, 12.95, 12.63, 12.50, 12.71, 12.95, 13.19, 12.55, 12.76,
     12.99, 12.94, 13.20, 12.67, 13.01, 12.69, 12.90, 12.88, 13.47, 12.57, 13.16, 13.08,
     12.86, 13.41, 12.99, 13.46, 12.82, 12.99, 13.00, 12.72, 13.12, 12.40, 13.12, 12.65,
     12.58, 14.70, 14.01, 13.86, 14.16, 14.08, 14.03, 14.04, 14.10, 13.60, 13.82, 13.36,
     13.72, 13.49, 13.85, 13.67, 13.59, 13.81, 14.40, 13.65, 13.54, 14.36, 13.72, 14.13,
     13.52, 13.63, 13.52, 13.90, 14.20, 13.86, 13.79, 13.71, 14.23, 14.23, 14.32, 15.20,
     14.16, 13.97, 14.11, 14.25, 14.10, 13.80, 14.23, 14.44, 14.65, 14.12, 13.03, 13.59,
     13.73, 14.04, 13.21, 12.42, 14.43, 14.15, 14.59, 13.82, 14.84, 13.68, 14.20, 13.47,
     13.30, 13.10, 13.70, 13.75, 14.30, 14.29, 13.20, 13.35, 12.30, 12.34, 12.43, 12.30,
     14.20, 14.21, 13.82, 14.27, 13.84, 11.39, 14.00, 13.55, 12.68, 13.10, 13.90, 14.26,
     14.10, 13.10, 14.28, 14.37, 14.20, 11.94, 14.00, 14.10, 13.38, 14.74, 14.26, 14.70, 14.19],
    // 14.6
    [13.48, 13.70, 13.70, 13.29, 12.85, 12.82, 13.35, 13.69, 13.30, 13.80, 13.11, 12.97,
     13.19, 13.55, 13.27, 13.59, 12.90, 12.21, 12.50, 12.71, 12.69, 13.20, 12.63, 12.88,
     13.00, 13.10, 13.20, 13.23, 13.24, 12.83, 13.17, 12.69, 13.78, 12.83, 13.49, 13.60,
     13.10, 13.36, 13.31, 13.40, 12.62, 13.40, 13.00, 13.01, 12.90, 13.19, 13.17, 12.98,
     13.02, 14.70, 14.20, 14.06, 14.48, 14.15, 14.21, 14.29, 14.24, 13.83, 14.04, 13.52,
     13.67, 13.58, 14.12, 13.68, 13.79, 14.22, 14.35, 13.80, 13.58, 14.50, 14.02, 14.47,
     13.64, 13.70, 13.55, 13.90, 14.20, 13.82, 13.80, 14.07, 14.37, 14.37, 14.67, 15.40,
     14.25, 14.06, 14.39, 14.37, 14.36, 13.94, 14.32, 14.73, 14.83, 14.33, 13.10, 13.70,
     13.90, 14.18, 13.40, 12.71, 14.50, 14.31, 14.70, 13.79, 14.95, 13.96, 14.20, 13.56,
     13.30, 13.10, 13.70, 13.90, 14.30, 14.38, 13.20, 13.60, 12.55, 12.40, 12.65, 12.40,
     14.20, 14.46, 14.00, 14.31, 13.85, 13.60, 14.09, 13.63, 12.80, 13.10, 13.90, 14.40,
     14.10, 13.20, 14.33, 14.48, 14.30, 11.84, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 14.50],
    // 14.7
    [13.70, 13.70, 13.70, 12.86, 13.11, 13.03, 13.45, 13.70, 13.35, 13.80, 13.17, 13.31,
     13.19, 13.68, 13.30, 13.85, 13.19, 13.18, 12.69, 13.10, 12.91, 13.30, 13.00, 13.00,
     13.00, 12.67, 13.20, 13.30, 13.47, 13.18, 13.33, 12.96, 13.98, 12.96, 13.34, 13.53,
     13.34, 13.50, 13.32, 13.77, 13.12, 13.40, 13.00, 13.04, 13.13, 13.20, 13.30, 13.12,
     12.95, 14.70, 14.42, 14.23, 14.57, 14.41, 14.40, 14.54, 14.51, 14.01, 14.25, 13.75,
     13.84, 13.81, 14.26, 14.04, 13.94, 14.30, 14.40, 13.80, 14.02, 14.50, 14.10, 14.64,
     13.98, 13.98, 13.76, 13.90, 14.20, 14.15, 14.14, 14.10, 14.45, 14.55, 14.72, 15.40,
     14.41, 14.27, 14.50, 14.66, 14.49, 14.03, 14.53, 14.90, 14.88, 14.59, 13.10, 13.79,
     13.90, 14.29, 13.40, 12.74, 14.50, 14.49, 14.70, 14.04, 15.27, 14.00, 14.20, 13.53,
     13.30, 13.10, 13.70, 13.90, 14.30, 14.55, 13.20, 13.60, 12.82, 12.46, 13.00, 12.60,
     14.20, 14.58, 14.22, 14.41, 14.13, 13.60, 14.37, 13.84, 12.99, 13.10, 13.90, 14.40,
     14.10, 13.20, 14.56, 14.55, 14.30, 13.10, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 14.79],
    // 14.8
    [13.70, 13.70, 13.70, 13.90, 13.58, 13.25, 13.90, 13.70, 13.57, 13.80, 13.79, 13.62,
     13.70, 13.80, 13.80, 14.20, 13.59, 13.70, 12.98, 13.20, 13.10, 13.30, 13.00, 13.00,
     13.00, 13.70, 13.20, 13.30, 13.70, 13.32, 13.52, 13.00, 14.00, 13.20, 13.50, 13.60,
     13.40, 13.50, 13.50, 14.00, 13.20, 13.40, 13.00, 13.40, 13.30, 13.20, 13.30, 13.30,
     13.10, 14.70, 14.69, 14.60, 14.70, 14.50, 14.60, 14.80, 14.60, 14.21, 14.40, 14.06,
     14.05, 13.93, 14.30, 14.10, 14.21, 14.30, 14.40, 13.80, 14.10, 14.50, 14.44, 14.70,
     14.20, 14.04, 14.21, 13.90, 14.20, 14.20, 14.04, 14.10, 14.54, 14.68, 14.90, 15.40,
     14.88, 14.50, 14.66, 14.86, 14.87, 14.24, 14.63, 15.00, 15.13, 14.89, 13.10, 13.80,
     13.90, 14.70, 13.40, 13.00, 14.50, 14.63, 14.70, 14.35, 15.39, 14.00, 14.20, 14.05,
     13.30, 13.10, 13.70, 13.90, 14.30, 14.90, 13.20, 13.60, 13.30, 13.00, 13.00, 12.91,
     14.20, 15.00, 14.30, 14.67, 14.35, 13.60, 14.62, 14.21, 13.20, 13.10, 13.90, 14.40,
     14.10, 13.20, 14.80, 14.90, 14.30, 13.10, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 15.15],
    // 14.9
    [13.70, 13.70, 13.70, 13.73, 13.37, 13.25, 13.90, 13.70, 13.70, 13.80, 13.72, 13.80,
     13.70, 13.80, 13.80, 14.05, 13.70, 13.50, 13.26, 13.20, 13.10, 13.30, 13.00, 13.00,
     13.00, 13.70, 13.20, 13.30, 13.70, 13.40, 13.70, 13.00, 14.00, 13.20, 13.50, 13.60,
     13.40, 13.50, 13.50, 14.00, 13.20, 13.40, 13.00, 13.40, 13.30, 13.20, 13.30, 13.30,
     13.10, 14.70, 14.70, 14.78, 14.70, 14.70, 14.60, 14.80, 14.70, 14.38, 14.40, 14.30,
     14.30, 14.00, 14.30, 14.10, 14.49, 14.30, 14.40, 13.80, 14.10, 14.50, 14.50, 14.70,
     14.20, 14.35, 14.30, 13.90, 14.20, 14.20, 14.40, 14.10, 14.66, 14.94, 14.90, 15.40,
     14.95, 14.73, 14.93, 15.00, 15.00, 14.47, 14.86, 15.00, 15.30, 14.90, 13.10, 13.80,
     13.90, 14.70, 13.40, 13.00, 14.50, 14.87, 14.70, 14.50, 15.40, 14.00, 14.20, 14.10,
     13.30, 13.10, 13.70, 13.90, 14.30, 15.10, 13.20, 13.60, 13.30, 13.00, 13.00, 13.00,
     14.20, 15.09, 14.30, 14.77, 14.40, 13.60, 14.87, 14.39, 13.17, 13.10, 13.90, 14.40,
     14.10, 13.20, 14.95, 14.90, 14.30, 13.10, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 15.20],
    // 15.0
    [12.59, 13.70, 13.70, 13.90, 13.70, 13.80, 13.90, 13.70, 13.70, 13.80, 13.80, 13.80,
     13.70, 13.80, 13.80, 14.20, 13.70, 13.70, 13.36, 13.20, 13.10, 13.30, 13.00, 13.00,
     13.00, 13.70, 13.20, 13.30, 13.70, 13.40, 13.70, 13.00, 14.00, 13.20, 13.50, 13.60,
     13.40, 13.50, 13.50, 14.00, 13.20, 13.40, 13.00, 13.40, 13.30, 13.20, 13.30, 13.30,
     13.10, 14.70, 14.70, 14.80, 14.70, 14.99, 14.60, 14.80, 14.70, 14.40, 14.40, 14.40,
     14.30, 14.00, 14.30, 14.10, 14.56, 14.30, 14.40, 13.80, 14.10, 14.50, 14.50, 14.70,
     14.20, 14.54, 14.30, 13.90, 14.20, 14.20, 14.40, 14.10, 14.77, 15.16, 14.90, 15.40,
     15.00, 15.05, 15.16, 15.00, 15.00, 14.68, 15.10, 15.00, 15.40, 14.90, 13.10, 13.80,
     13.90, 14.70, 13.40, 13.00, 14.50, 15.16, 14.70, 14.50, 15.40, 14.00, 14.20, 14.10,
     13.30, 13.10, 13.70, 13.90, 14.30, 15.10, 13.20, 13.60, 13.30, 13.00, 13.00, 13.00,
     14.20, 15.10, 14.30, 15.01, 14.40, 13.60, 15.09, 14.91, 13.20, 13.10, 13.90, 14.40,
     14.10, 13.20, 15.10, 14.90, 14.30, 13.10, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 15.20],
    // max
    [13.70, 13.70, 13.70, 13.90, 13.70, 13.80, 13.90, 13.70, 13.70, 13.80, 13.80, 13.80,
     13.70, 13.80, 13.80, 14.20, 13.70, 13.70, 13.50, 13.20, 13.10, 13.30, 13.00, 13.00,
     13.00, 13.70, 13.20, 13.30, 13.70, 13.40, 13.70, 13.00, 14.00, 13.20, 13.50, 13.60,
     13.40, 13.50, 13.50, 14.00, 13.20, 13.40, 13.00, 13.40, 13.30, 13.20, 13.30, 13.30,
     13.10, 14.70, 14.70, 14.80, 14.70, 15.20, 14.60, 14.80, 14.70, 14.40, 14.40, 14.40,
     14.30, 14.00, 14.30, 14.10, 14.60, 14.30, 14.40, 13.80, 14.10, 14.50, 14.50, 14.70,
     14.20, 14.70, 14.30, 13.90, 14.20, 14.20, 14.40, 14.10, 15.90, 15.70, 14.90, 15.40,
     15.00, 15.10, 15.20, 15.00, 15.00, 15.10, 15.70, 15.00, 15.40, 14.90, 13.10, 13.80,
     13.90, 14.70, 13.40, 13.00, 14.50, 15.30, 14.70, 14.50, 15.40, 14.00, 14.20, 14.10,
     13.30, 13.10, 13.70, 13.90, 14.30, 15.10, 13.20, 13.60, 13.30, 13.00, 13.00, 13.00,
     14.20, 15.10, 14.30, 15.80, 14.40, 13.60, 15.20, 15.00, 13.20, 13.10, 13.90, 14.40,
     14.10, 13.20, 15.10, 14.90, 14.30, 13.10, 14.00, 14.10, 13.80, 14.80, 14.30, 14.70, 15.20]
];

// Hide window, compute and display the rate from fetched data.
function rate_display()
{
    var i;

    $("#cra_window_inner").html("<p>calculating rate ...</p>");

    // calculate score improvement
    for (i = 0; i < chart_list.length; i++) {
        chart_list[i].rate_diff =
            !last_chart_list ? 0
            : chart_list[i].rate - (last_chart_list[i] && last_chart_list[i].rate || 0);
    }

    // calculate rate and their diff
    chart_list.sort(function(a, b) { return - (a.rate - b.rate); });
    for (i = 0; i < 30; i++) best_rate += chart_list[i].rate;
    opt_rate = ((best_rate + chart_list[0].rate * 10) / 40);
    best_rate = (best_rate / 30);
    recent_rate = disp_rate * 4 - best_rate * 3;
    best_rate_diff = last_best_rate ? best_rate - last_best_rate : 0;
    opt_rate_diff = last_opt_rate ? opt_rate - last_opt_rate : 0;
    disp_rate_diff = last_disp_rate ? disp_rate - last_disp_rate : 0;
    recent_rate_diff = last_recent_rate ? recent_rate - last_recent_rate : 0;

    // save rate to localstorage
    localStorage.setItem("cra_best_rate", JSON.stringify(best_rate));
    localStorage.setItem("cra_opt_rate", JSON.stringify(opt_rate));
    localStorage.setItem("cra_recent_rate", JSON.stringify(recent_rate));

    // calculate required score to improve the rate
    worst_chart_rate = chart_list[29].rate;
    for (i = 0; i < chart_list.length; i++)
    {
        chart_list[i].req_score = rate_to_score(chart_list[i].rate_base, worst_chart_rate);
        chart_list[i].req_diff = Math.max(chart_list[i].req_score - chart_list[i].score, 0);
    }

    // calculate recommendability
    var block_ix = Math.max(0, Math.min(21, Math.ceil(best_rate * 10 - 130)));
    for (i = 0; i < chart_list.length; i++) {
        var rate = expected_rate[block_ix][i];
        chart_list[i].expected_improvement =
              chart_list[i].rate >= rate || rate <= worst_chart_rate ? 0
            : i < 30 ? rate - chart_list[i].rate
            : rate - worst_chart_rate;
    }

    // remove window and show the result
    $("#cra_window_wrapper").fadeOut(300, function() {

        $(this).remove();
        $chunithm_net.fadeTo(400, 0);

        $("#cra_wrapper")
            .append("<img id='logo' src='https://zk-phi.github.io/CHUNITHMRateAnalyzer/logo.png' />" +
                    "<div id='cra_rate'></div>" +
                    "<div id='cra_sort_menu' class='cra_button'></div>" +
                    "<div id='cra_chart_list'></div>" +
                    "<hr>" +
                    "<div id='cra_footer'></div>");

        $("#cra_rate").html(`
<div class="w420 box_player">
  <div class="box07">
    <div class="player_name">
      <span id="UserName">
        RATING: ${rate_str(disp_rate)} (B:${rate_str(best_rate)} + R:${rate_str(recent_rate)})
      <span>
    </div>
    <div class="player_rating">
      レート ${rate_str(opt_rate)} まで到達可能
    </div>
  </div>
  <a id="cra_share_button" class="twitter-share-button"></a>
</div>`);

        $("#cra_share_button")
            .attr("href", "https://twitter.com/share")
            .attr("data-url", " ")
            .attr("data-lang", "ja")
            .attr("data-text",
                  "CHUNITHM レート解析結果 → " +
                  "レート: " + rate_str(disp_rate) + rate_diff_str(disp_rate_diff) + " " +
                  "(B: " + rate_str(best_rate) + rate_diff_str(best_rate_diff) + " + " +
                  "R: " + rate_str(recent_rate) + rate_diff_str(recent_rate_diff) + ") / " +
                  "最大レート: " + rate_str(opt_rate) + rate_diff_str(opt_rate_diff) + " / " +
                  "曲別レートトップ: " + rate_str(chart_list[0].rate) +
                  " (" + chart_list[0].name + ") #CHUNITHMRateAnalyzer")
            .html("Tweet");

        $("#cra_sort_menu")
            .html("<div id='cra_sort_rate' class='cra_sort_button'>レート順</div>" +
                  "<div id='cra_sort_base' class='cra_sort_button'>難易度順</div>" +
                  "<div id='cra_sort_score' class='cra_sort_button'>スコア順</div>" +
                  "<div id='cra_sort_score_req' class='cra_sort_button'>必要スコア順</div>" +
                  "<div id='cra_sort_score_ave' class='cra_sort_button'>おすすめ(β)</div>");

        $("#cra_footer")
            .html("CHUNITHM Rate Analyzer by zk_phi " +
                  "<a id='cra_follow_button' class='twitter-follow-button'></a>");

        $("#cra_follow_button")
            .attr("href", "https://twitter.com/zk_phi")
            .html("Follow");

        $("#cra_sort_rate").click(function() {
            chart_list.sort(function(a, b) { return - (a.rate - b.rate); });
            render_chart_list({ 0: "曲別レート (高い順)", 30: "BEST 枠ここまで" });
        });

        $("#cra_sort_base").click(function() {
            chart_list.sort(function(a, b) { return - (a.rate_base - b.rate_base); });
            var indices = { 0 : "LEVEL 13+" };
            for (i = 0; chart_list[i].rate_base >= 13.7; i++) ;
            indices[i] = "LEVEL 13";
            for (i = 0; chart_list[i].rate_base >= 13; i++) ;
            indices[i] = "LEVEL 12+";
            for (i = 0; chart_list[i].rate_base >= 12.7; i++) ;
            indices[i] = "LEVEL 12";
            for (i = 0; chart_list[i].rate_base >= 12; i++) ;
            indices[i] = "LEVEL 11";
            render_chart_list(indices);
        });

        $("#cra_sort_score").click(function() {
            chart_list.sort(function(a, b) { return - (a.score - b.score) });
            var indices = { 0 : "SSS" };
            for (i = 0; chart_list[i].score >= 1007500; i++) ;
            indices[i] = "SS";
            for (i = 0; chart_list[i].score >= 1000000; i++) ;
            indices[i] = "S";
            for (i = 0; chart_list[i].score >=  975000; i++) ;
            indices[i] = "AAA";
            for (i = 0; chart_list[i].score >=  950000; i++) ;
            indices[i] = "AA";
            for (i = 0; chart_list[i].score >=  925000; i++) ;
            indices[i] = "A";
            for (i = 0; chart_list[i].score >=  900000; i++) ;
            indices[i] = "A未満"
            render_chart_list(indices);
        });

        $("#cra_sort_score_req").click(function() {
            chart_list.sort(function(a, b) {
                return (isNaN(b.req_diff) ? -1 : 0) + (isNaN(b.req_diff) ? 1 : 0)
                    || a.req_diff - b.req_diff
                    || - (a.rate_base - b.rate_base);
            });
            render_chart_list({ 0: "レート上げに必要なスコア順", 30: "BEST 枠ここまで" });
        });

        $("#cra_sort_score_ave").click(function() {
            var indices = { };
            chart_list.sort(function(a, b) {
                    return - (a.expected_improvement - b.expected_improvement)
            });
            for (var i = 0; i < chart_list.length && chart_list[i].expected_improvement > 0; i++) ;
            indices[0] = "おすすめ"
            indices[i] = "おすすめここまで"
            render_chart_list(indices);
        });

        // load twitter buttons
        if (typeof twttr != "undefined") twttr.widgets.load();

        // render chart list
        var indices = {};
        chart_list.sort(function(a, b) {
            return (a.rate_diff ? 0 : 1) + (b.rate_diff ? 0 : -1) || - (a.rate - b.rate);
        });
        for (var i = 0; i < chart_list.length && chart_list[i].rate_diff != 0; i++) ;
        if (i) indices[0] = "最近レートを更新した曲";
        indices[i] = "曲別レート (高い順)";
        for (; i < chart_list.length && chart_list[i].req_diff <= 0; i++) ;
        indices[i] = "BEST 枠ここまで";
        render_chart_list(indices);
    });
}

// refresh the chart list display
function render_chart_list(msgs)
{
    // hide old items
    $("#cra_chart_list *").remove();
    $("#cra_chart_list").css({ display: "none" });

    for (var i = 0; i < chart_list.length; i++)
    {
        if (msgs[i])
            $("#cra_chart_list")
            .append("<hr>")
            .append(_dom(["div.mt_15", ["h2#page_title", msgs[i]]]));

        if (isNaN(chart_list[i].req_diff))
            continue;

        var difficulty_icon = chart_list[i].level == 2 ? "common/images/icon_expert.png"
            : "common/images/icon_master.png";

        var $list_item = $("<div class='frame02 w400 cra_chart_list_item'>")
            .appendTo("#cra_chart_list");

        $list_item
            .html(`
<div class="play_jacket_side">
  <div class="play_jacket_area">
    <div id="Jacket" class="play_jacket_img">
      <img src=${chart_list[i].image}>
    </div>
  </div>
</div>
<div class="play_data_side01">
  <div class="box02 play_track_block">
    <div id="TrackLevel" class="play_track_result">
      <img src="${difficulty_icon}">
    </div>
    <div id="Track" class="play_track_text">
      ${rate_str(chart_list[i].rate_base)}
    </div>
  </div>
  <div class="box02 play_musicdata_block">
    <div id="MusicTitle" class="play_musicdata_title">
      ${chart_list[i].name}
    </div>
    <div class="play_musicdata_score clearfix">
      <div class="play_musicdata_score_text">
        Score：<span id="Score">${chart_list[i].score}</span>
      </div>
      <br>
      <div class="play_musicdata_score_text">
        Rate：
        <span id="Rate">
          ${rate_str(chart_list[i].rate)}${rate_diff_str(chart_list[i].rate_diff)}
        </span>
      </div>
    </div>
  </div>
  <div id="IconBatch" class="play_musicdata_icon clearfix">
    ${chart_list[i].req_diff > 0 ?
      "BEST枠入りまで: " + chart_list[i].req_diff + " (" + chart_list[i].req_score + ")" :
      ""}
  </div>
</div>`);
    }

    $("#cra_chart_list").show();
}
