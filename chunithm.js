/* CHUNITHM Rate Analyzer (C) zk_phi 2015- */

var cra_version = 160203;

/* -----------------------------------------------------------------------------
 * utilities
 * ----------------------------------------------------------------------------- */

/* reference : http://www.ginjake.net/score/readme.php */
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

/* calculate rate from given score
 * reference : http://d.hatena.ne.jp/risette14/20150913/1442160273 */
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

/* calculate score required to achieve given rate (return NaN if NOT
 * achievable). */
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

/* stringify floating number to a string of the form `xx.xx' */
function rate_str(rate)
{
    return rate.toString().substring(0, rate >= 10 ? 5 : 4);
}

/* stringify floating number to a string of the form `[+x.xx]' */
function rate_diff_str(diff)
{
    return diff <= -10.0 ? "[" + diff.toString().substring(0, 6) + "]"
        :  diff <= -0.01 ? "[" + diff.toString().substring(0, 5) + "]"
        :  diff >=  10.0 ? "[+" + diff.toString().substring(0, 5) + "]"
        :  diff >=  0.01 ? "[+" + diff.toString().substring(0, 4) + "]"
        : "";
}

/* stringify a JS object in the CSS format */
function object_to_css(obj)
{
    return Object.keys(obj).reduce(function(acc, x){
        return acc + x + "{" + Object.keys(obj[x]).reduce(function(acc, y){
            return acc + y + ":" + obj[x][y] + ";";
        }, "") + "}";
    }, "")
}

/* -----------------------------------------------------------------------------
 * global vars
 * ----------------------------------------------------------------------------- */

/* list of chart ID vs its rate, leveled 11 or more
 * (extracted from https://chunithm-net.com/mobile/MusicLevel.html)
 * (* DO NOT PREPEND ANY ITEMS TO THIS LIST -- `rate_diff' will be unable to calculate *) */
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
    ,{ id: 134, level: 2, rate_base: 11.9, name: "HAELEQUIN (Original Remaster) 赤" }
    ,{ id: 3,   level: 3, rate_base: 11.8, name: "B.B.K.K.B.K.K." }
    ,{ id: 149, level: 3, rate_base: 11.7, name: "緋色のDance" }
    ,{ id: 48,  level: 3, rate_base: 11.9, name: "Unlimited Spark!" }
    ,{ id: 96,  level: 3, rate_base: 11.9, name: "チルノのパーフェクトさんすう教室" }
    ,{ id: 94,  level: 3, rate_base: 11.8, name: "セツナトリップ" }
    ,{ id: 47,  level: 3, rate_base: 11.7, name: "六兆年と一夜物語" }
    ,{ id: 152, level: 2, rate_base: 11.5, name: "Gustav Battle 赤" }
    ,{ id: 141, level: 2, rate_base: 11.5, name: "閃鋼のブリューナク 赤" }
    ,{ id: 67,  level: 3, rate_base: 11.0, name: "昵懇レファレンス" }
    ,{ id: 65,  level: 3, rate_base: 11.2, name: "Anemone" }
    ,{ id: 163, level: 3, rate_base: 11.3, name: "幾四音-Ixion-" }
    ,{ id: 148, level: 3, rate_base: 11.0, name: "Theme of SeelischTact" }
    ,{ id: 79,  level: 3, rate_base: 11.0, name: "ＧＯ！ＧＯ！ラブリズム♥" }
    ,{ id: 158, level: 3, rate_base: 11.0, name: "フォルテシモBELL" }
    ,{ id: 130, level: 3, rate_base: 11.4, name: "スカイクラッドの観測者" }
    ,{ id: 129, level: 3, rate_base: 11.2, name: "Hacking to the Gate" }
    ,{ id: 176, level: 3, rate_base: 11.3, name: "Dance!" }
    ,{ id: 207, level: 3, rate_base: 11.5, name: "Your Affection (Daisuke Asakura Remix)" }
    ,{ id: 206, level: 3, rate_base: 11.2, name: "Signs Of Love (“Never More” ver.)" }
    ,{ id: 10,  level: 3, rate_base: 11.1, name: "All I Want" }
    ,{ id: 204, level: 3, rate_base: 11.0, name: "ちくわパフェだよ☆CKP" }
    ,{ id: 203, level: 3, rate_base: 11.6, name: "FLOWER" }
    ,{ id: 91,  level: 3, rate_base: 11.2, name: "Yet Another ”drizzly rain”" }
    ,{ id: 115, level: 3, rate_base: 11.5, name: "Dreaming" }
    ,{ id: 41,  level: 3, rate_base: 11.6, name: "sweet little sister" }
    ,{ id: 98,  level: 3, rate_base: 11.4, name: "魔理沙は大変なものを盗んでいきました" }
    ,{ id: 156, level: 3, rate_base: 11.5, name: "FREELY TOMORROW" }
    ,{ id: 117, level: 3, rate_base: 11.2, name: "M.S.S.Planet" }
    ,{ id: 118, level: 3, rate_base: 11.1, name: "腐れ外道とチョコレゐト" }
    ,{ id: 18,  level: 3, rate_base: 11.2, name: "千本桜" }
    ,{ id: 113, level: 3, rate_base: 11.4, name: "ストリーミングハート" }
    ,{ id: 38,  level: 3, rate_base: 11.0, name: "天ノ弱" }
    ,{ id: 114, level: 3, rate_base: 11.4, name: "Sweet Devil" }
    ,{ id: 111, level: 3, rate_base: 11.3, name: "staple stable" }
    ,{ id: 110, level: 3, rate_base: 11.3, name: "Magia" }
    ,{ id: 5,   level: 3, rate_base: 11.3, name: "Scatman (Ski Ba Bop Ba Dop Bop)" }
    ,{ id: 60,  level: 3, rate_base: 11.3, name: "only my railgun" }
    ,{ id: 17,  level: 3, rate_base: 11.0, name: "空色デイズ" }
    ,{ id: 104, level: 3, rate_base: 12.7, name: "とーきょー全域★アキハバラ？" }
    ,{ id: 178, level: 3, rate_base: 12.7, name: "stella=steLLa" }
    ,{ id: 101, level: 3, rate_base: 12.7, name: "Tango Rouge" }
    ,{ id: 64,  level: 3, rate_base: 12.7, name: "今ぞ♡崇め奉れ☆オマエらよ！！～姫の秘メタル渇望～" }
    ,{ id: 144, level: 3, rate_base: 12.9, name: "Aragami" }
    ,{ id: 142, level: 3, rate_base: 12.7, name: "Altale" }
    ,{ id: 157, level: 3, rate_base: 12.8, name: "ギガンティック O.T.N" }
    ,{ id: 154, level: 3, rate_base: 12.7, name: "SAVIOR OF SONG" }
    ,{ id: 180, level: 2, rate_base: 12.4, name: "怒槌 赤" }
    ,{ id: 70,  level: 3, rate_base: 12.4, name: "STAR" }
    ,{ id: 151, level: 3, rate_base: 12.0, name: "Alma" }
    ,{ id: 82,  level: 3, rate_base: 12.3, name: "Memories of Sun and Moon" }
    ,{ id: 108, level: 3, rate_base: 12.0, name: "The ether" }
    ,{ id: 53,  level: 3, rate_base: 12.3, name: "Teriqma" }
    ,{ id: 95,  level: 3, rate_base: 12.1, name: "砂漠のハンティングガール♡" }
    ,{ id: 51,  level: 3, rate_base: 12.3, name: "My First Phone" }
    ,{ id: 71,  level: 3, rate_base: 12.4, name: "Infantoon Fantasy" }
    ,{ id: 161, level: 3, rate_base: 12.4, name: "私の中の幻想的世界観及びその顕現を想起させたある現実での出来事に関する一考察" }
    ,{ id: 150, level: 3, rate_base: 12.1, name: "brilliant better" }
    ,{ id: 88,  level: 3, rate_base: 12.1, name: "The Concept of Love" }
    ,{ id: 6,   level: 3, rate_base: 12.5, name: "Reach for the Stars" }
    ,{ id: 136, level: 3, rate_base: 12.5, name: "Äventyr" }
    ,{ id: 128, level: 3, rate_base: 12.5, name: "The Formula" }
    ,{ id: 45,  level: 3, rate_base: 12.1, name: "L9" }
    ,{ id: 33,  level: 3, rate_base: 12.4, name: "Blue Noise" }
    ,{ id: 120, level: 3, rate_base: 12.3, name: "四次元跳躍機関" }
    ,{ id: 21,  level: 3, rate_base: 12.0, name: "ナイト・オブ・ナイツ" }
    ,{ id: 132, level: 3, rate_base: 12.4, name: "イカサマライフゲイム" }
    ,{ id: 83,  level: 3, rate_base: 12.2, name: "ロストワンの号哭" }
    ,{ id: 27,  level: 3, rate_base: 12.3, name: "タイガーランペイジ" }
    ,{ id: 23,  level: 3, rate_base: 12.2, name: "一触即発☆禅ガール" }
    ,{ id: 180, level: 3, rate_base: 13.7, name: "怒槌" }
    ,{ id: 103, level: 3, rate_base: 13.5, name: "エンドマークに希望と涙を添えて" }
    ,{ id: 152, level: 3, rate_base: 13.0, name: "Gustav Battle" }
    ,{ id: 69,  level: 3, rate_base: 13.4, name: "The wheel to the right" }
    ,{ id: 63,  level: 3, rate_base: 13.0, name: "Gate of Fate" }
    ,{ id: 141, level: 3, rate_base: 13.1, name: "閃鋼のブリューナク" }
    ,{ id: 76,  level: 3, rate_base: 13.1, name: "luna blu" }
    ,{ id: 107, level: 3, rate_base: 13.0, name: "We Gonna Journey" }
    ,{ id: 138, level: 3, rate_base: 13.0, name: "conflict"}
    ,{ id: 135, level: 3, rate_base: 13.1, name: "Vallista" }
    ,{ id: 134, level: 3, rate_base: 13.4, name: "HAELEQUIN (Original Remaster)" }
    ,{ id: 92,  level: 3, rate_base: 13.0, name: "最終鬼畜妹・一部声" }
    ,{ id: 159, level: 3, rate_base: 13.1, name: "ジングルベル" }
    ,{ id: 165, level: 3, rate_base: 12.9, name: "ぼくらの16bit戦争" }
    ,{ id: 179, level: 3, rate_base: 11.1, name: "すろぉもぉしょん" }
    ,{ id: 166, level: 3, rate_base: 11.8, name: "裏表ラバーズ" }
    ,{ id: 168, level: 3, rate_base: 11.9, name: "ネトゲ廃人シュプレヒコール" }
    ,{ id: 167, level: 3, rate_base: 12.7, name: "脳漿炸裂ガール" }
    ,{ id: 169, level: 3, rate_base: 11.4, name: "elegante" }
];

/* latest rate */
var best_rate = 0;
var opt_rate = 0;
var disp_rate = 0;
var recent_rate = 0;
var worst_chart_rate;

/* load the last data from localStorage (if exists) */
var last_cra_version = JSON.parse(localStorage.getItem("cra_version"));
var last_chart_list = JSON.parse(localStorage.getItem("cra_chart_list"));
var last_best_rate = JSON.parse(localStorage.getItem("cra_best_rate"));
var last_opt_rate = JSON.parse(localStorage.getItem("cra_opt_rate"));
var last_disp_rate = JSON.parse(localStorage.getItem("cra_disp_rate"));
var last_recent_rate = JSON.parse(localStorage.getItem("cra_recent_rate"));

/* diff between the latest rate and the last rate */
var best_rate_diff;
var opt_rate_diff;
var recent_rate_diff;
var disp_rate_diff;

/* hide all that chunithm-net things */
var $hidden_items = $("body *").fadeTo(400, 0.75);

/* -----------------------------------------------------------------------------
 * prepare UI
 * ----------------------------------------------------------------------------- */

/* list of resources required to execute this script (note that all
 * resources must be provided via HTTPS) */
var dependencies = [
    "https://platform.twitter.com/widgets.js" /* Twitter tweet/follow button */
];

/* CSS applied to the HTML */
var the_css = {

    "#cra_wrapper" : {
        "position" : "absolute",
        "top" : "0px",
        "left" : "0px",
        "min-height" : "100%",
        "width" : "100%",
        "z-index" : "10000",
        "text-align" : "center",
        "display" : "none"
    },

    "#cra_window_wrapper" : {
        "position" : "absolute",
        "top" : "0px",
        "left" : "0px",
        "height" : "100%",
        "width" : "100%"
    },

    "#cra_window_helper" : {
        "display" : "inline-block",
        "height" : "100%",
        "vertical-align" : "middle"
    },

    "#cra_window_outer" : {
        "display" : "inline-block",
        "vertical-align" : "middle"
    },

    "#cra_window_inner p" : { "margin" : "20px" },
    "#cra_window_inner .cra_caution" : { "font-size" : "25px" },

    "#cra_close_button" : {
        "position" : "fixed",
        "right" : "20px",
        "top" : "20px",
        "font-size" : "30px",
        "z-index" : "100"
    },

    "#cra_title" : {
        "position" : "relative",
        "margin-top" : "30px",
        "width" : "100%",
        "font-size" : "30px",
        "text-align": "center"
    },

    "#cra_chart_list" : {
        "position" : "relative",
        "width" : "100%"
    },

    "#cra_footer" : { "margin-bottom" : "30px" },

    ".cra_sort_button" : {
        "margin" : "0px 10px",
        "text-align" : "center",
        "padding" : "initial",
        "width" : "120px",
        "cursor" : "pointer"
    },

    ".cra_chart_list_item" : {
        "text-align" : "center",
        "margin" : "20px auto"
    },

    ".cra_thumb" : { "float" : "left" },
    ".cra_button" : { "cursor" : "pointer" }
}

/* ---- load the dependencies and the CSS */

dependencies.map(function(x){ $("head").append("<script src='" + x + "'>")});
$("head").append("<style>" + object_to_css(the_css) + "</style>");

/* ---- generate DOM elements */

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
          "<p>このツールには自動アップデート機能がないので、手動でなるべく" +
          "最新版に更新して、ご利用ください。</p>" +
          "<p>このツールは CHUNITHM NET が内部で使用している、一般公開" +
          "されていない URL からスコア情報を取得します。そのため、内部仕様" +
          "の変更で突然動かなくなったり、あるいは運営が悪質だと判断した場合、" +
          "不正行為とみなされる恐れがあります。ツールの性質を理解したうえで、" +
          "自己責任でご利用ください。</p>" +
          "<p>ツールを閉じるには、右上の×ボタンをクリックしてください。</p>");

if(cra_version == last_cra_version){
    $("#cra_window_inner")
        .append("<h2 id='page_title' class='cra_button cra_view_last'>前回のデータを見る</h2>");
}

$("#cra_window_inner")
    .append("<h2 id='page_title' class='cra_button cra_fetch_score'>スコアを解析する</h2>");

/* ---- assign handlers */

$(".cra_view_last").click(function(){
    chart_list = last_chart_list;
    disp_rate = last_disp_rate;
    rate_display();
});

$(".cra_fetch_score").click(function(){
    $("#cra_close_button").hide(400);
    fetch_score_data(0, function(){
        fetch_user_data(function(){
            localStorage.setItem("cra_version", JSON.stringify(cra_version));
            $("#cra_close_button").show(400);
            rate_display();
        });
    });
});

$("#cra_close_button").click(function(){
    $("html, body").animate({ scrollTop: 0 }, 400);
    $("#cra_wrapper").fadeOut(400, function(){ $(this).remove(); });
    $hidden_items.delay(400).fadeTo(400, 1);
});

/* ---- and finally make the content visible */

$("html, body").animate({ scrollTop: 0 }, 400);
$("#cra_wrapper").delay(400).fadeIn(400);

/* -----------------------------------------------------------------------------
 * fetch music / user data
 * ----------------------------------------------------------------------------- */

/* internal vars for AJAX reconnection */
var failure_count = 0;

/* fetch all score data with ID >= i and update `chart_list[i]` */
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
                        /* wait 180ms to (slightly) reduce server load */
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

/* fetch user data and update `disp_rate` */
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

/* -----------------------------------------------------------------------------
 * calculate rate and render
 * ----------------------------------------------------------------------------- */

/* hide window, compute and display the rate from fetched data */
function rate_display()
{
    var i;

    $("#cra_window_inner").html("<p>calculating rate ...</p>");

    /* calculate score improvement */
    for(i = 0; i < chart_list.length; i++){
        chart_list[i].rate_diff =
            !last_chart_list ? 0
            : chart_list[i].rate - (last_chart_list[i] && last_chart_list[i].rate || 0);
    }

    /* calculate and save rate */
    chart_list.sort(function(a, b){ return - (a.rate - b.rate); });
    for(i = 0; i < 30; i++) best_rate += chart_list[i].rate;
    opt_rate = ((best_rate + chart_list[0].rate * 10) / 40);
    best_rate = (best_rate / 30);
    recent_rate = disp_rate * 4 - best_rate * 3;
    localStorage.setItem("cra_best_rate", JSON.stringify(best_rate));
    localStorage.setItem("cra_opt_rate", JSON.stringify(opt_rate));
    localStorage.setItem("cra_recent_rate", JSON.stringify(recent_rate));

    /* calculate rate improvement */
    best_rate_diff = last_best_rate ? best_rate - last_best_rate : 0;
    opt_rate_diff = last_opt_rate ? opt_rate - last_opt_rate : 0;
    disp_rate_diff = last_disp_rate ? disp_rate - last_disp_rate : 0;
    recent_rate_diff = last_recent_rate ? recent_rate - last_recent_rate : 0;

    /* calculate required score to improve the rate */
    worst_chart_rate = chart_list[29].rate;
    for(i = 0; i < chart_list.length; i++)
    {
        chart_list[i].req_score = rate_to_score(chart_list[i].rate_base, worst_chart_rate);
        chart_list[i].req_diff = Math.max(chart_list[i].req_score - chart_list[i].score, 0);
    }

    /* remove window and show the result */
    $("#cra_window_wrapper").fadeOut(300, function(){

        $(this).remove();
        $hidden_items.fadeTo(400, 0);

        $("#cra_wrapper")
            .append("<div id='cra_title'>CHUNITHM Rate Analyzer</div>" +
                    "<h3 id='cra_version'>version " + cra_version + "</h3>" +
                    "<h2 id='cra_rate'></h2>" +
                    "<div id='cra_sort_menu' class='cra_button'></div>" +
                    "<div id='cra_chart_list'></div>" +
                    "<hr>" +
                    "<div id='cra_footer'></div>");

        $("#cra_rate")
            .html("<p id='cra_best_rate'>" +
                  "<a id='cra_share_button' class='twitter-share-button'></a></p>" +
                  "<p id='cra_disp_rate'></p>");

        $("#cra_best_rate")
            .prepend("BEST枠平均: " + rate_str(best_rate) + rate_diff_str(best_rate_diff) + " / " +
                     "最大レート: " + rate_str(opt_rate) + rate_diff_str(opt_rate_diff) + " ");

        $("#cra_disp_rate")
            .html("(RECENT枠平均: " + rate_str(recent_rate) + rate_diff_str(recent_rate_diff) + " / " +
                  "表示レート: " + rate_str(disp_rate) +  rate_diff_str(disp_rate_diff) + ")");

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
            .html("<div id='cra_sort_rate' class='ticket_hold cra_sort_button'>レート順</div>" +
                  "<div id='cra_sort_base' class='ticket_hold cra_sort_button'>難易度順</div>" +
                  "<div id='cra_sort_score' class='ticket_hold cra_sort_button'>必要スコア順</div>");

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
            chart_list.sort(function(a, b){
                return (isNaN(b.req_diff) ? -1 : 0) + (isNaN(b.req_diff) ? 1 : 0)
                    || a.req_diff - b.req_diff
                    || - (a.rate_base - b.rate_base);
            });
            render_chart_list({ 0: "レート上げに必要なスコア (少ない順)", 30: "BEST 枠ここまで" });
        });

        /* load twitter buttons */
        if(typeof twttr != "undefined") twttr.widgets.load();

        /* render chart list */
        var indices = {};
        chart_list.sort(function(a, b){ return - (a.rate_diff - b.rate_diff || a.rate - b.rate); });
        for(var i = 0; i < chart_list.length && chart_list[i].rate_diff != 0; i++);
        if(i) indices[0] = "最近レートを更新した曲";
        indices[i] = "曲別レート (高い順)";
        for(; i < chart_list.length && chart_list[i].req_diff <= 0; i++);
        indices[i] = "BEST 枠ここまで";
        render_chart_list(indices);
    });
}

/* refresh the chart list display */
function render_chart_list(msgs)
{
    /* hide old items */
    $("#cra_chart_list *").remove();
    $("#cra_chart_list").css({ display: "none" });

    for(var i = 0; i < chart_list.length; i++)
    {
        if(msgs[i])
            $("#cra_chart_list").append("<hr><h2>" + msgs[i] + "</h2>");

        if(isNaN(chart_list[i].req_diff))
            continue;

        var rank_icon = chart_list[i].score >= 1007500 ? "common/images/icon_sss.png"
            : chart_list[i].score >= 1000000 ? "common/images/icon_ss.png"
            : chart_list[i].score >=  975000 ? "common/images/icon_s.png"
            : chart_list[i].score >=  950000 ? "common/images/icon_aaa.png"
            : chart_list[i].score >=  925000 ? "common/images/icon_aa.png"
            : chart_list[i].score >=  900000 ? "common/images/icon_a.png"
            : "";

        var $list_item = $("<div class='w460 cra_chart_list_item'>").appendTo("#cra_chart_list");

        $list_item
            .addClass(chart_list[i].level == 2 ? "musiclist_expart" : "musiclist_master")
            .attr("chart_id", i)
            .html("<img class='cra_thumb' src='" + chart_list[i].image + "'>" +
                  "<h3>" + chart_list[i].rate_base + " " + chart_list[i].name + "</h3>" +
                  "<p>" + "レート: " + rate_str(chart_list[i].rate) +
                  rate_diff_str(chart_list[i].rate_diff) + " / " +
                  chart_list[i].score + " <img src='" + rank_icon + "'>" + "</p>");

        if(chart_list[i].req_diff != 0){
            $list_item
                .append("<p>BEST 枠入りまで: " + chart_list[i].req_diff + " " +
                        "(" + chart_list[i].req_score + "～)</p>");
        }
    }

    $("#cra_chart_list").show(400);
}
