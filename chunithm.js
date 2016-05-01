// CHUNITHM Rate Analyzer (C) zk_phi 2015-
// *FIXME* NO CHARTS CAN BE REMOVED FROM chart_list

var cra_version = 160501;

if(!location.href.match(/^https:\/\/chunithm-net.com/)){
    alert("CHUNITHM NET を開いた状態で実行してください。");
    throw Error();
}

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

// Request CHUNITHM Net API API_NAME with REQ_DATA, and call CALLBACK
// on success. (reference : http://www.ginjake.net/score/readme.php)
function request_api(api_name, req_data, callback /* optional */, errorback /* optional */)
{
    req_data.userId = parseInt(getCookie()["userId"]);
    $.ajax(REQUEST_URL + api_name,
           { type: "post",
             data: JSON.stringify(req_data),
             dataType: "json",
             scriptCharset: "UTF-8",
             timeout: 5000 })
        .done(function(data){ setCookie("userId", data.userId); callback && callback(data); })
        .fail(function(){ errorback && errorback(id); });
}

// Calculate rate from given score and rate_base. (reference :
// http://d.hatena.ne.jp/risette14/20150913/1442160273)
function score_to_rate(rate_base, score)
{
    return score >= 1007500 ? rate_base + 2.0
        :  score >= 1005000 ? rate_base + 1.5 + (score - 1005000) * 10 / 50000
        :  score >= 1000000 ? rate_base + 1.0 + (score - 1000000) *  5 / 50000
        :  score >=  975000 ? rate_base + 0.0 + (score -  975000) *  2 / 50000
        :  score >=  950000 ? rate_base - 1.5 + (score -  950000) *  3 / 50000
        :  score >=  925000 ? rate_base - 3.0 + (score -  925000) *  3 / 50000
        :  score >=  900000 ? rate_base - 5.0 + (score -  900000) *  4 / 50000
        :  0;
}

// Calculate score required to achieve given rate. This function may
// return NaN to indicate that the rate is NOT achievable wrt
// rate_base.
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

// Stringify a floating number to a string of the form `xx.xx'.
function rate_str(rate)
{
    return rate.toString().substring(0, rate >= 10 ? 5 : 4);
}

// Stringify a floating number to a string of the form `[+x.xx]'.
function rate_diff_str(diff)
{
    return diff <= -10.0 ? "[" + diff.toString().substring(0, 6) + "]"
        :  diff <= -0.01 ? "[" + diff.toString().substring(0, 5) + "]"
        :  diff >=  10.0 ? "[+" + diff.toString().substring(0, 5) + "]"
        :  diff >=  0.01 ? "[+" + diff.toString().substring(0, 4) + "]"
        : "";
}

// Stringify a JS object OBJ in the CSS format.
function css(obj)
{
    return Object.keys(obj).reduce(function(acc, x){
        return acc + x + "{" + Object.keys(obj[x]).reduce(function(acc, y){
            return acc + y + ":" + obj[x][y] + ";";
        }, "") + "}";
    }, "")
}

// Stringify TEMPLATE in the HTML format. TEMPLATE can be either a
// string or a JS array of the form [TAG, ATTRS, CHILDREN ...]. TAG is
// the tag name optionally followed by "#<id>". ATTRS is optional and
// if specified, it must be an object whose keys are attribute names
// and values are strings. CHILDREN are templates respectively.
//
// Optional arg PARAMS can be an object, whose values are either
// string or an object of the same form as ATTRS. If TEMPLATE has a
// DOM whose id matches a key in PARAMS, its content or attributes are
// replaced by the value associated to the key.
function dom(template, params)
{
    if(!template) return "";
    else if(typeof template == "string") return template;

    var elem = template[0].split("#"); // [ELEM_TYPE, ID]
    var attrs = typeof template[1] == "object" && !Array.isArray(template[1]) && template[1];
    var contents = template.slice(attrs ? 2 : 1);

    if(params && params[elem[1]]) {
        if(typeof params[elem[1]] == "string")
            contents = [params[elem[1]]];
        else
            Object.keys(params[elem[1]]).map(function(k) { attrs[k] = params[elem[1]][k]; });
    }

    attrs = Object.keys(attrs).reduce(function(acc, k) {
        return acc + " " + k + "='" + attrs[k] + "'";
    }, "");

    contents = contents.reduce(function(acc, c) {
        return acc + dom(c, params);
    }, "");

    return "<" + elem[0] + (elem[1] ? " id='" + elem[1] + "'" : "") + attrs + ">" +
        contents + "</" + elem[0] + ">";
}

// -----------------------------------------------------------------------------
// global vars
// -----------------------------------------------------------------------------

// list of chart ID vs its rate, leveled 11 or more
// (* DO NOT PREPEND ANY ITEMS TO THIS LIST -- `rate_diff' will be unable to calculate *)
var chart_list = [
     { id: 103, level: 2, rate_base: 11.7, name: "エンドマークに希望と涙を添えて 赤" }
    ,{ id: 68,  level: 3, rate_base: 11.7, name: "乗り切れ受験ウォーズ" }
    ,{ id: 146, level: 3, rate_base: 11.7, name: "夕暮れワンルーム" }
    ,{ id: 69,  level: 2, rate_base: 11.9, name: "The wheel to the right 赤" }
    ,{ id: 63,  level: 2, rate_base: 11.7, name: "Gate of Fate 赤" }
    ,{ id: 76,  level: 2, rate_base: 11.8, name: "luna blu 赤" }
    ,{ id: 140, level: 3, rate_base: 11.9, name: "Guilty" }
    ,{ id: 75,  level: 3, rate_base: 11.7, name: "Counselor" }
    ,{ id: 99,  level: 3, rate_base: 11.7, name: "言ノ葉カルマ" }
    ,{ id: 145, level: 3, rate_base: 11.8, name: "Change Our MIRAI！" }
    ,{ id: 134, level: 2, rate_base: 11.8, name: "HAELEQUIN (Original Remaster) 赤" }
    ,{ id: 3,   level: 3, rate_base: 11.8, name: "B.B.K.K.B.K.K." }
    ,{ id: 149, level: 3, rate_base: 11.7, name: "緋色のDance" }
    ,{ id: 48,  level: 3, rate_base: 11.8, name: "Unlimited Spark!" }
    ,{ id: 96,  level: 3, rate_base: 11.8, name: "チルノのパーフェクトさんすう教室" }
    ,{ id: 94,  level: 3, rate_base: 12.2, name: "セツナトリップ" }
    ,{ id: 47,  level: 3, rate_base: 11.7, name: "六兆年と一夜物語" }
    ,{ id: 152, level: 2, rate_base: 11.7, name: "Gustav Battle 赤" }
    ,{ id: 141, level: 2, rate_base: 11.5, name: "閃鋼のブリューナク 赤" }
    ,{ id: 67,  level: 3, rate_base: 11.2, name: "昵懇レファレンス" }
    ,{ id: 65,  level: 3, rate_base: 11.1, name: "Anemone" }
    ,{ id: 163, level: 3, rate_base: 11.3, name: "幾四音-Ixion-" }
    ,{ id: 148, level: 3, rate_base: 11.0, name: "Theme of SeelischTact" }
    ,{ id: 79,  level: 3, rate_base: 11.0, name: "ＧＯ！ＧＯ！ラブリズム♥" }
    ,{ id: 158, level: 3, rate_base: 11.0, name: "フォルテシモBELL" }
    ,{ id: 130, level: 3, rate_base: 11.7, name: "スカイクラッドの観測者" }
    ,{ id: 129, level: 3, rate_base: 11.2, name: "Hacking to the Gate" }
    ,{ id: 176, level: 3, rate_base: 11.3, name: "Dance!" }
    ,{ id: 207, level: 3, rate_base: 11.7, name: "Your Affection (Daisuke Asakura Remix)" }
    ,{ id: 206, level: 3, rate_base: 11.4, name: "Signs Of Love (“Never More” ver.)" }
    ,{ id: 10,  level: 3, rate_base: 11.7, name: "All I Want" }
    ,{ id: 204, level: 3, rate_base: 11.0, name: "ちくわパフェだよ☆CKP" }
    ,{ id: 203, level: 3, rate_base: 12.0, name: "FLOWER" }
    ,{ id: 91,  level: 3, rate_base: 11.2, name: "Yet Another ”drizzly rain”" }
    ,{ id: 115, level: 3, rate_base: 11.5, name: "Dreaming" }
    ,{ id: 41,  level: 3, rate_base: 11.6, name: "sweet little sister" }
    ,{ id: 98,  level: 3, rate_base: 11.4, name: "魔理沙は大変なものを盗んでいきました" }
    ,{ id: 156, level: 3, rate_base: 11.5, name: "FREELY TOMORROW" }
    ,{ id: 117, level: 3, rate_base: 11.5, name: "M.S.S.Planet" }
    ,{ id: 118, level: 3, rate_base: 12.0, name: "腐れ外道とチョコレゐト" }
    ,{ id: 18,  level: 3, rate_base: 11.2, name: "千本桜" }
    ,{ id: 113, level: 3, rate_base: 11.4, name: "ストリーミングハート" }
    ,{ id: 38,  level: 3, rate_base: 11.0, name: "天ノ弱" }
    ,{ id: 114, level: 3, rate_base: 11.4, name: "Sweet Devil" }
    ,{ id: 111, level: 3, rate_base: 11.3, name: "staple stable" }
    ,{ id: 110, level: 3, rate_base: 11.2, name: "Magia" }
    ,{ id: 5,   level: 3, rate_base: 11.3, name: "Scatman (Ski Ba Bop Ba Dop Bop)" }
    ,{ id: 60,  level: 3, rate_base: 11.3, name: "only my railgun" }
    ,{ id: 17,  level: 3, rate_base: 11.1, name: "空色デイズ" }
    ,{ id: 104, level: 3, rate_base: 12.7, name: "とーきょー全域★アキハバラ？" }
    ,{ id: 178, level: 3, rate_base: 12.7, name: "stella=steLLa" }
    ,{ id: 101, level: 3, rate_base: 12.8, name: "Tango Rouge" }
    ,{ id: 64,  level: 3, rate_base: 12.7, name: "今ぞ♡崇め奉れ☆オマエらよ！！～姫の秘メタル渇望～" }
    ,{ id: 144, level: 3, rate_base: 13.2, name: "Aragami" }
    ,{ id: 142, level: 3, rate_base: 12.6, name: "Altale" }
    ,{ id: 157, level: 3, rate_base: 12.8, name: "ギガンティック O.T.N" }
    ,{ id: 154, level: 3, rate_base: 12.7, name: "SAVIOR OF SONG" }
    ,{ id: 180, level: 2, rate_base: 12.4, name: "怒槌 赤" }
    ,{ id: 70,  level: 3, rate_base: 12.4, name: "STAR" }
    ,{ id: 151, level: 3, rate_base: 12.4, name: "Alma" }
    ,{ id: 82,  level: 3, rate_base: 12.3, name: "Memories of Sun and Moon" }
    ,{ id: 108, level: 3, rate_base: 12.0, name: "The ether" }
    ,{ id: 53,  level: 3, rate_base: 12.3, name: "Teriqma" }
    ,{ id: 95,  level: 3, rate_base: 12.1, name: "砂漠のハンティングガール♡" }
    ,{ id: 51,  level: 3, rate_base: 12.6, name: "My First Phone" }
    ,{ id: 71,  level: 3, rate_base: 12.3, name: "Infantoon Fantasy" }
    ,{ id: 161, level: 3, rate_base: 12.4, name: "私の中の幻想的世界観及びその顕現を想起させたある現実での出来事に関する一考察" }
    ,{ id: 150, level: 3, rate_base: 11.8, name: "brilliant better" }
    ,{ id: 88,  level: 3, rate_base: 12.1, name: "The Concept of Love" }
    ,{ id: 6,   level: 3, rate_base: 12.5, name: "Reach for the Stars" }
    ,{ id: 136, level: 3, rate_base: 12.5, name: "Äventyr" }
    ,{ id: 128, level: 3, rate_base: 12.7, name: "The Formula" }
    ,{ id: 45,  level: 3, rate_base: 12.2, name: "L9" }
    ,{ id: 33,  level: 3, rate_base: 12.7, name: "Blue Noise" }
    ,{ id: 120, level: 3, rate_base: 12.3, name: "四次元跳躍機関" }
    ,{ id: 21,  level: 3, rate_base: 11.9, name: "ナイト・オブ・ナイツ" }
    ,{ id: 132, level: 3, rate_base: 12.2, name: "イカサマライフゲイム" }
    ,{ id: 83,  level: 3, rate_base: 12.2, name: "ロストワンの号哭" }
    ,{ id: 27,  level: 3, rate_base: 12.4, name: "タイガーランペイジ" }
    ,{ id: 23,  level: 3, rate_base: 12.1, name: "一触即発☆禅ガール" }
    ,{ id: 180, level: 3, rate_base: 13.9, name: "怒槌" }
    ,{ id: 103, level: 3, rate_base: 13.7, name: "エンドマークに希望と涙を添えて" }
    ,{ id: 152, level: 3, rate_base: 12.9, name: "Gustav Battle" }
    ,{ id: 69,  level: 3, rate_base: 13.4, name: "The wheel to the right" }
    ,{ id: 63,  level: 3, rate_base: 13.0, name: "Gate of Fate" }
    ,{ id: 141, level: 3, rate_base: 13.1, name: "閃鋼のブリューナク" }
    ,{ id: 76,  level: 3, rate_base: 13.2, name: "luna blu" }
    ,{ id: 107, level: 3, rate_base: 13.0, name: "We Gonna Journey" }
    ,{ id: 138, level: 3, rate_base: 13.0, name: "conflict"}
    ,{ id: 135, level: 3, rate_base: 13.1, name: "Vallista" }
    ,{ id: 134, level: 3, rate_base: 13.7, name: "HAELEQUIN (Original Remaster)" }
    ,{ id: 92,  level: 3, rate_base: 13.0, name: "最終鬼畜妹・一部声" }
    ,{ id: 159, level: 3, rate_base: 13.4, name: "ジングルベル" }
    ,{ id: 165, level: 3, rate_base: 12.9, name: "ぼくらの16bit戦争" }
    ,{ id: 179, level: 3, rate_base: 11.1, name: "すろぉもぉしょん" }
    ,{ id: 166, level: 3, rate_base: 11.8, name: "裏表ラバーズ" }
    ,{ id: 168, level: 3, rate_base: 11.9, name: "ネトゲ廃人シュプレヒコール" }
    ,{ id: 167, level: 3, rate_base: 12.7, name: "脳漿炸裂ガール" }
    ,{ id: 169, level: 3, rate_base: 11.4, name: "elegante" }
    ,{ id: 14,  level: 3, rate_base: 11.0, name: "コネクト" }
    ,{ id: 235, level: 3, rate_base: 12.5, name: "ファッとして桃源郷" }
    ,{ id: 232, level: 3, rate_base: 13.3, name: "Elemental Creation" }
    ,{ id: 205, level: 3, rate_base: 12.7, name: "SNIPE WHOLE" }
    ,{ id: 73,  level: 3, rate_base: 12.5, name: "MUSIC PЯAYER" }
    ,{ id: 52,  level: 3, rate_base: 13.4, name: "Cyberozar" }
    ,{ id: 244, level: 3, rate_base: 12.0, name: "回レ！雪月花" }
    ,{ id: 243, level: 3, rate_base: 12.2, name: "シュガーソングとビターステップ" }
    ,{ id: 171, level: 3, rate_base: 12.1, name: "XL TECHNO" }
    ,{ id: 232, level: 2, rate_base: 11.3, name: "Elemental Creation 赤" }
    ,{ id: 52,  level: 2, rate_base: 11.1, name: "Cyberozar 赤" }
    ,{ id: 209, level: 3, rate_base: 11.7, name: "君色シグナル" }
    ,{ id: 247, level: 3, rate_base: 11.9, name: "絶世スターゲイト" }
    ,{ id: 199, level: 3, rate_base: 12.3, name: "ハート・ビート" }
    ,{ id: 173, level: 3, rate_base: 13.1, name: "Halcyon" }
    ,{ id: 185, level: 3, rate_base: 11.2, name: "楽園の翼" }
    ,{ id: 42,  level: 3, rate_base: 11.6, name: "oath sign" }
    ,{ id: 9,   level: 3, rate_base: 11.3, name: "情熱大陸" }
    ,{ id: 56,  level: 3, rate_base: 11.0, name: "そばかす" }
    ,{ id: 112, level: 3, rate_base: 11.0, name: "マジLOVE100%" }
    ,{ id: 74,  level: 3, rate_base: 11.0, name: "リリーシア" }
    ,{ id: 233, level: 3, rate_base: 12.2, name: "アルストロメリア" }
    ,{ id: 197, level: 3, rate_base: 13.1, name: "Jack-the-Ripper◆" }
    ,{ id: 226, level: 2, rate_base: 12.3, name: "Garakuta Doll Play 赤" }
    ,{ id: 226, level: 3, rate_base: 13.8, name: "Garakuta Doll Play" }
    ,{ id: 62,  level: 3, rate_base: 12.4, name: "名も無い鳥" }
    ,{ id: 90,  level: 2, rate_base: 11.6, name: "L'épisode 赤" }
    ,{ id: 90,  level: 3, rate_base: 13.2, name: "L'épisode" }
    ,{ id: 72,  level: 3, rate_base: 13.0, name: "Genesis" }
    ,{ id: 197, level: 2, rate_base: 11.2, name: "Jack-the-Ripper◆ 赤" }
    ,{ id: 255, level: 3, rate_base: 11.1, name: "激情！ミルキィ大作戦" }
    ,{ id: 214, level: 3, rate_base: 11.9, name: "青春はNon-Stop!" }
    ,{ id: 215, level: 3, rate_base: 12.4, name: "Falling Roses" }
    ,{ id: 200, level: 3, rate_base: 12.1, name: "無敵We are one!!" }
    ,{ id: 202, level: 2, rate_base: 11.2, name: "GEMINI -C- 赤" }
    ,{ id: 202, level: 3, rate_base: 13.1, name: "GEMINI -C-" }
    ,{ id: 222, level: 3, rate_base: 12.9, name: "Mr.Wonderland" }
    ,{ id: 252, level: 3, rate_base: 12.3, name: "愛迷エレジー" }
    ,{ id: 224, level: 3, rate_base: 11.1, name: "恋愛裁判" }
    ,{ id: 228, level: 3, rate_base: 12.0, name: "このふざけた素晴らしき世界は、僕の為にある" }
    ,{ id: 213, level: 3, rate_base: 12.1, name: "星屑ユートピア" }
    ,{ id: 212, level: 3, rate_base: 11.8, name: "いろは唄" }
    ,{ id: 131, level: 3, rate_base: 12.8, name: "チルドレンレコード" }
    ,{ id: 220, level: 3, rate_base: 12.3, name: "如月アテンション" }
    ,{ id: 240, level: 3, rate_base: 12.7, name: "夜咄ディセイブ" }
    ,{ id: 19,  level: 3, rate_base: 13.2, name: "DRAGONLADY" }
];

// latest rate
var best_rate = 0;
var opt_rate = 0;
var disp_rate = 0;
var recent_rate = 0;
var worst_chart_rate;

// load the last data from localStorage (if exists)
var last_cra_version = JSON.parse(localStorage.getItem("cra_version"));
var last_chart_list = JSON.parse(localStorage.getItem("cra_chart_list"));
var last_best_rate = JSON.parse(localStorage.getItem("cra_best_rate"));
var last_opt_rate = JSON.parse(localStorage.getItem("cra_opt_rate"));
var last_disp_rate = JSON.parse(localStorage.getItem("cra_disp_rate"));
var last_recent_rate = JSON.parse(localStorage.getItem("cra_recent_rate"));

// diff between the latest rate and the last rate
var best_rate_diff;
var opt_rate_diff;
var recent_rate_diff;
var disp_rate_diff;

// hide all that chunithm-net things
var $hidden_items = $("body *").fadeTo(400, 0.75);

// -----------------------------------------------------------------------------
// prepare UI
// -----------------------------------------------------------------------------

// list of resources required to execute this script (note that all
// resources must be provided via HTTPS)
var dependencies = [
    "https://platform.twitter.com/widgets.js" // Twitter tweet/follow button
];

// CSS applied to the HTML
var the_css = {

    "#cra_wrapper": {
        "position": "absolute", "top": "0px", "left": "0px",
        "min-height": "100%", "width": "100%",
        "display": "none", "z-index": "10000",
        "text-align": "center",
    },

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
    "#cra_window_inner .cra_caution": { "font-size": "25px" },

    "#cra_close_button": {
        "position": "fixed", "right": "20px", "top": "20px",
        "z-index": "100",
        "font-size": "30px",
    },

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

    ".cra_thumb": { "float": "left" },
    ".cra_button": { "cursor": "pointer" }
}

// var initial_screen =
//     ["div#cra_wrapper",
//      ["div#cra_window_wrapper",
//       ["div#cra_window_helper"],
//       ["div#cra_window_outer", {class: "frame01 w460"},
//        ["div#cra_window_inner",
//         ["p", {class: "cra_caution"},
//          "CAUTION"],
//         ["p",
//          "このツールは CHUNITHM NET の内部で使われている URLに直接アクセス" +
//          "することでスコア情報を収集します。これが「通常想定し得ない方法」" +
//          "による、あるいは「不正な」サービスの利用と解釈された場合、利用規約" +
//          "によってアカウント停止等の処分が行われる可能性があります。"],
//         ["p",
//          "ツールの性質を理解したうえで、各自の判断でご利用ください。" +
//          "このツールを使用したことで起こったトラブルに作者は対応しません。"],
//         ["p",
//          "ツールを閉じるには、右上の×ボタンをクリックしてください。"]]]],
//      ["div#cra_close_button", {class: "cra_button"}, "x"]];

// var main_screen_doms = [
//     ["img#logo", {src: "https://zk-phi.github.io/CHUNITHMRateAnalyzer/logo.png"}],
//     ["h2#cra_rate",
//      ["p#cra_best_rate",
//       "BEST枠平均: ", ["span#rate_best"], " / ", "達成可能: ", ["span#rate_opt"], " ",
//       ["a#cra_share_button", {
//           class: "twitter-share-button",
//           href: "https://twitter.com/share",
//           "data-url": " ",
//           "data-lang": "ja"
//       }]],
//      ["p#cra_disp_rate",
//       "(RECENT枠平均: ", ["span#rate_recent"], "表示レート: ", ["span#rate_disp"], ")"]],
//     ["div#cra_sort_menu", {class: "cra_button"},
//      ["div#cra_sort_rate", {class: "cra_sort_button"}, "レート順"],
//      ["div#cra_sort_base", {class: "cra_sort_button"}, "難易度順"],
//      ["div#cra_sort_score", {class: "cra_sort_button"}, "スコア順"],
//      ["div#cra_sort_score_req", {class: "cra_sort_button"}, "必要スコア順"]],
//     ["div#cra_chart_list"],
//     "<hr>",
//     ["div#cra_footer",
//      "CHUNITHM Rate Analyzer by zk_phi ",
//      ["a#cra_follow_button", {
//          class: "twitter-follow-button",
//          href: "https://twitter.com/zk_phi"
//      }, "follow"]]
// ];

// var list_item_template =
//     ["div", {class: "frame02 w400 cra_chart_list_item"},
//      ["div", {class: "play_jacket_side"},
//       ["div", {class: "play_jacket_area"},
//        ["div#Jacket", {class: "play_jacket_img"},
//         ["img#jacket_img"]]]],
//     ["div", {class: "play_data_side01"},
//      ["div", {class: "box02 play_track_block"},
//       ["div#TrackLevel", {class: "play_track_result"},
//        ["img#difficulty_icon"]],
//       ["div#Track", {class: "play_track_text"}]],
//     ["div", {class: "box02 play_musicdata_block"},
//      ["div#MusicTitle", {class: "play_musicdata_title"}],
//      ["div", {class: "play_musicdata_score clearfix"},
//       ["div", {class: "play_musicdata_score_text"},
//        "Score: ", ["span#Score"]],
//       "<br>",
//       ["div", {class: "play_musicdata_score_text"},
//        "Rate: ", ["span#Rate"]]]],
//      ["div#IconBatch", {class: "play_musicdata_icon clearfix"}]]];

// ---- load the dependencies and the CSS

dependencies.map(function(x){ $("head").append("<script src='" + x + "'>")});
$("head").append("<style>" + css(the_css) + "</style>");

// $("body").append(dom(initial_screen));

$("body")
    .append("<div id='cra_wrapper'></div>");
$("#cra_wrapper")
    .html("<div id='cra_window_wrapper'></div>" +
          "<div id='cra_close_button' class='cra_button'>x</div>");
$("#cra_window_wrapper")
    .html("<div id='cra_window_helper'></div>" +
          "<div id='cra_window_outer' class='frame01 w460'></div>");
$("#cra_window_outer")
    .html("<div id='cra_window_inner' class='frame01_inside w450'></div>");
$("#cra_window_inner")
    .html("<p class='cra_caution'>CAUTION</p>" +
          "<p>(05/01 スマホ対応のデザインに変更しました)</p>" +
          "<p>ツールの性質を理解したうえで、<br>各自の判断でご利用ください。</p>" +
          "<p>ツールを閉じるには、<br>右上の×ボタンをクリックしてください。</p>");

// close button
$("#cra_close_button")
    .click(function(){
        $("html, body").animate({ scrollTop: 0 }, 400);
        $("#cra_wrapper").fadeOut(400, function(){ $(this).remove(); });
        $hidden_items.delay(400).fadeTo(400, 1);
    });

// fetch button
$("#cra_window_inner")
    .append($("<h2 id='page_title' class='cra_button cra_fetch_score'>スコアを解析する</h2>")
            .click(function(){
                $("#cra_close_button").hide(400);
                fetch_score_data(0, function(){
                    fetch_user_data(function(){
                        localStorage.setItem("cra_version", JSON.stringify(cra_version));
                        $("#cra_close_button").show(400);
                        rate_display();
                    });
               });
           }));

// view button
if(cra_version == last_cra_version) {
    $("#cra_window_inner")
        .append($("<h2 id='page_title' class='cra_button cra_view_last'>前回のデータを見る</h2>")
               .click(function(){
                   chart_list = last_chart_list;
                   disp_rate = last_disp_rate;
                   rate_display();
               }));
}

$("html, body").animate({ scrollTop: 0 }, 400);
$("#cra_wrapper").delay(400).fadeIn(400);

// -----------------------------------------------------------------------------
// fetch music / user data
// -----------------------------------------------------------------------------

// internal vars for AJAX reconnection
var failure_count = 0;

// fetch all score data with ID >= i and update `chart_list[i]`
function fetch_score_data(i, callback)
{
    if(i < chart_list.length) {
        $("#cra_window_inner").html("<p>loading '" + chart_list[i].name + "' ...</p>");
        request_api("GetUserMusicDetailApi", { musicId: chart_list[i].id },
                    function(d){
                        chart_list[i].image = d.musicFileName;
                        chart_list[i].score = 0;
                        for(j = 0; j < d.length; j++)
                            if(d.userMusicList[j].level == chart_list[i].level)
                                chart_list[i].score = d.userMusicList[j].scoreMax;
                        chart_list[i].rate =
                            score_to_rate(chart_list[i].rate_base, chart_list[i].score);
                        // wait 180ms to (slightly) reduce server load
                        setTimeout(function(){ fetch_score_data(i + 1, callback); }, 180);
                    },
                    function(id){ failure_count++; });
    }

    else if(failure_count > 0) {
        $("#cra_window_inner")
            .html("<p>取得に失敗したスコアがあります</p>" +
                  "<h2 id='page_title' class='cra_button'>再読み込み</h2>");
        $("#page_title")
            .click(function(){ fetch_score_data(0, callback); });
    }

    else {
        localStorage.setItem("cra_chart_list", JSON.stringify(chart_list));
        callback();
    }
}

// fetch user data and update `disp_rate`
function fetch_user_data(callback)
{
    $("#cra_window_inner").html("<p>loading user data ...</p>");
    request_api("GetUserInfoApi", { friendCode: 0, fileLevel: 1 },
                function(d){
                    disp_rate = d.userInfo.playerRating / 100.0;
                    localStorage.setItem("cra_disp_rate", JSON.stringify(disp_rate));
                    callback();
                },
                function(){
                    $("#cra_window_inner")
                        .html("<p>ユーザー情報が取得できませんでした</p>" +
                              "<h2 id='page_title' class='cra_button'>再読み込み</h2>");
                    $("#page_title")
                        .click(function(){ fetch_user_data(callback); });
                });
}

// -----------------------------------------------------------------------------
// calculate rate and render
// -----------------------------------------------------------------------------

// hide window, compute and display the rate from fetched data
function rate_display()
{
    var i;

    $("#cra_window_inner").html("<p>calculating rate ...</p>");

    // calculate score improvement
    for(i = 0; i < chart_list.length; i++){
        chart_list[i].rate_diff =
            !last_chart_list ? 0
            : chart_list[i].rate - (last_chart_list[i] && last_chart_list[i].rate || 0);
    }

    // calculate and save rate
    chart_list.sort(function(a, b){ return - (a.rate - b.rate); });
    for(i = 0; i < 30; i++) best_rate += chart_list[i].rate;
    opt_rate = ((best_rate + chart_list[0].rate * 10) / 40);
    best_rate = (best_rate / 30);
    recent_rate = disp_rate * 4 - best_rate * 3;
    localStorage.setItem("cra_best_rate", JSON.stringify(best_rate));
    localStorage.setItem("cra_opt_rate", JSON.stringify(opt_rate));
    localStorage.setItem("cra_recent_rate", JSON.stringify(recent_rate));

    // calculate rate improvement
    best_rate_diff = last_best_rate ? best_rate - last_best_rate : 0;
    opt_rate_diff = last_opt_rate ? opt_rate - last_opt_rate : 0;
    disp_rate_diff = last_disp_rate ? disp_rate - last_disp_rate : 0;
    recent_rate_diff = last_recent_rate ? recent_rate - last_recent_rate : 0;

    // calculate required score to improve the rate
    worst_chart_rate = chart_list[29].rate;
    for(i = 0; i < chart_list.length; i++)
    {
        var req_score = rate_to_score(chart_list[i].rate_base, worst_chart_rate);
        chart_list[i].req_diff = Math.max(req_score - chart_list[i].score, 0);
    }

    // remove window and show the result
    $("#cra_window_wrapper").fadeOut(300, function(){

        $(this).remove();
        $hidden_items.fadeTo(400, 0);

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

        // $("#cra_rate")
        //     .html("<h2><p id='cra_best_rate'>" +
        //           "<a id='cra_share_button' class='twitter-share-button'></a></p>" +
        //           "<p id='cra_disp_rate'></p></h2>");

        // $("#cra_best_rate")
        //     .prepend("BEST枠平均: " + rate_str(best_rate) + rate_diff_str(best_rate_diff) + " / " +
        //              "最大レート: " + rate_str(opt_rate) + rate_diff_str(opt_rate_diff) + " ");
        //
        // $("#cra_disp_rate")
        //     .html("(RECENT枠平均: " + rate_str(recent_rate) + rate_diff_str(recent_rate_diff) + " / " +
        //           "表示レート: " + rate_str(disp_rate) +  rate_diff_str(disp_rate_diff) + ")");

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
                  "<div id='cra_sort_score_req' class='cra_sort_button'>必要スコア順</div>");

        $("#cra_footer")
            .html("CHUNITHM Rate Analyzer by zk_phi " +
                  "<a id='cra_follow_button' class='twitter-follow-button'></a>");

        $("#cra_follow_button")
            .attr("href", "https://twitter.com/zk_phi")
            .html("Follow");

        $("#cra_sort_rate").click(function(){
            chart_list.sort(function(a, b){ return - (a.rate - b.rate); });
            render_chart_list({ 0: "曲別レート (高い順)", 30: "BEST 枠ここまで" });
        });

        $("#cra_sort_base").click(function(){
            chart_list.sort(function(a, b){ return - (a.rate_base - b.rate_base); });
            var indices = { 0 : "LEVEL 13+" };
            for(i = 0; chart_list[i].rate_base >= 13.7; i++);
            indices[i] = "LEVEL 13";
            for(i = 0; chart_list[i].rate_base >= 13; i++);
            indices[i] = "LEVEL 12+";
            for(i = 0; chart_list[i].rate_base >= 12.7; i++);
            indices[i] = "LEVEL 12";
            for(i = 0; chart_list[i].rate_base >= 12; i++);
            indices[i] = "LEVEL 11";
            render_chart_list(indices);
        });

        $("#cra_sort_score").click(function(){
            chart_list.sort(function(a, b){ return - (a.score - b.score) });
            var indices = { 0 : "SSS" };
            for(i = 0; chart_list[i].score >= 1007500; i++);
            indices[i] = "SS";
            for(i = 0; chart_list[i].score >= 1000000; i++);
            indices[i] = "S";
            for(i = 0; chart_list[i].score >=  975000; i++);
            indices[i] = "AAA";
            for(i = 0; chart_list[i].score >=  950000; i++);
            indices[i] = "AA";
            for(i = 0; chart_list[i].score >=  925000; i++);
            indices[i] = "A";
            for(i = 0; chart_list[i].score >=  900000; i++);
            indices[i] = "A未満"
            render_chart_list(indices);
        });

        $("#cra_sort_score_req").click(function(){
            chart_list.sort(function(a, b){
                return (isNaN(b.req_diff) ? -1 : 0) + (isNaN(b.req_diff) ? 1 : 0)
                    || a.req_diff - b.req_diff
                    || - (a.rate_base - b.rate_base);
            });
            render_chart_list({ 0: "レート上げに必要なスコア順", 30: "BEST 枠ここまで" });
        });

        // load twitter buttons
        if(typeof twttr != "undefined") twttr.widgets.load();

        // render chart list
        var indices = {};
        chart_list.sort(function(a, b){
            return (a.rate_diff ? 0 : 1) + (b.rate_diff ? 0 : -1) || - (a.rate - b.rate);
        });
        for(var i = 0; i < chart_list.length && chart_list[i].rate_diff != 0; i++);
        if(i) indices[0] = "最近レートを更新した曲";
        indices[i] = "曲別レート (高い順)";
        for(; i < chart_list.length && chart_list[i].req_diff <= 0; i++);
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

    for(var i = 0; i < chart_list.length; i++)
    {
        if(msgs[i])
            $("#cra_chart_list")
            .append("<hr>")
            .append(dom(["div", {class: "mt_15"}, ["h2#page_title", msgs[i]]]));

        if(isNaN(chart_list[i].req_diff))
            continue;

        // var rank_icon = chart_list[i].score >= 1007500 ? "common/images/icon_sss.png"
        //     : chart_list[i].score >= 1000000 ? "common/images/icon_ss.png"
        //     : chart_list[i].score >=  975000 ? "common/images/icon_s.png"
        //     : chart_list[i].score >=  950000 ? "common/images/icon_aaa.png"
        //     : chart_list[i].score >=  925000 ? "common/images/icon_aa.png"
        //     : chart_list[i].score >=  900000 ? "common/images/icon_a.png"
        //     : "";

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
    ${chart_list[i].req_diff > 0 ? "BEST枠入りまで: " + chart_list[i].req_diff : ""}
  </div>
</div>`);

        // $("#cra_chart_list").append(list_item_template, {
        //     jacket_img: {src: chart_list[i].image},
        //     difficulty_icon: difficulty_icon,
        //     Track: rate_str(chart_list[i].rate_base),
        //     MusicTitle: chart_list[i].name,
        //     Score: chart_list[i].score,
        //     Rate: rate_str(chart_list[i].rate) + rate_diff_str(chart_list[i].rate_diff),
        //     IconBatch: chart_list[i].req_diff ? "BEST枠入りまで：" + chart_list[i].req_diff : ""
        // });
    }

    // $("#cra_chart_list").show(400);
    $("#cra_chart_list").show();
}
