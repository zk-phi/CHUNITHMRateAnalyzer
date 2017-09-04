// CHUNITHM Rate Analyzer (C) zk_phi 2015-

// ※ localStorage のデータに互換性がなくなる場合は必ずバージョンを上げる
var CRA_VERSION = 170113;

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

// list of resources required to execute this script (note that all
// resources must be provided via HTTPS)
var DEPENDENCIES = [
    "https://platform.twitter.com/widgets.js", // Twitter tweet/follow button
    "https://max-eipi.github.io/CHUNITHMRateAnalyzer/gaslibs/offer_playlog.js"
];

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

// ---- constants

var LEVEL_ID = { basic: 0, advance: 1, expert: 2, master: 3, worldsend: 4 };

var DIFFICULTY = {
       3: { rate_base: {          3: 11.8 }, image: "img/d739ba44da6798a0.jpg" } // B.B.K.K.B.K.K.
    ,  5: { rate_base: {          3: 11.3 }, image: "img/38faf81803b730f3.jpg" } // Scatman (Ski Ba Bop Ba Dop Bop)
    ,  6: { rate_base: {          3: 12.3 }, image: "img/90589be457544570.jpg" } // Reach for the Stars
    ,  7: { rate_base: { 2: 12.0, 3: 13.4 }, image: "img/b602913a68fca621.jpg" } // 初音ミクの消失
    ,  9: { rate_base: {          3: 12.0 }, image: "img/fce0bad9123dcd76.jpg" } // 情熱大陸
    , 10: { rate_base: {          3: 11.7 }, image: "img/0d7bd146ebed6fba.jpg" } // All I Want
    , 14: { rate_base: {          3: 11.0 }, image: "img/af78dd039a36a4c7.jpg" } // コネクト
    , 17: { rate_base: {          3: 11.2 }, image: "img/696d4f956ebb4209.jpg" } // 空色デイズ
    , 18: { rate_base: {          3: 11.4 }, image: "img/3c2606abe4dded71.jpg" } // 千本桜
    , 19: { rate_base: { 2: 11.0, 3: 13.2 }, image: "img/0b98b8b4e7cfd997.jpg" } // DRAGONLADY
    , 20: { rate_base: {          3: 12.8 }, image: "img/e2a1c87c96de9837.jpg" } // taboo tears you up
    , 21: { rate_base: {          3: 11.9 }, image: "img/4f69fb126f579c2f.jpg" } // ナイト・オブ・ナイツ
    , 23: { rate_base: {          3: 12.1 }, image: "img/b8ab9573859ebe4f.jpg" } // 一触即発☆禅ガール
    , 27: { rate_base: {          3: 12.5 }, image: "img/fdc3bb451f6403d2.jpg" } // タイガーランペイジ
    , 33: { rate_base: {          3: 13.0 }, image: "img/fddc37caee47286d.jpg" } // Blue Noise
    , 35: { rate_base: {          3: 12.4 }, image: "img/aabf49add818546d.jpg" } // Lapis
    , 36: { rate_base: {          3: 11.0 }, image: "img/e273c9d64170b575.jpg" } // 届かない恋 '13
    , 37: { rate_base: {          3: 11.3 }, image: "img/335dbb14cedb70bf.jpg" } // 鳥の詩
    , 38: { rate_base: {          3: 11.1 }, image: "img/529d98ad07709ae5.jpg" } // 天ノ弱
    , 41: { rate_base: {          3: 11.6 }, image: "img/7f17441bc2582ec8.jpg" } // sweet little sister
    , 42: { rate_base: {          3: 11.6 }, image: "img/4bbc4ec5ee9aa0b6.jpg" } // oath sign
    , 45: { rate_base: {          3: 12.2 }, image: "img/90dca26c66c5d5b7.jpg" } // L9
    , 47: { rate_base: {          3: 12.0 }, image: "img/5cb17a59f4b8c133.jpg" } // 六兆年と一夜物語
    , 48: { rate_base: {          3: 11.8 }, image: "img/b38eba298df2c6db.jpg" } // Unlimited Spark!
    , 51: { rate_base: {          3: 12.8 }, image: "img/161f13a787a00032.jpg" } // My First Phone
    , 52: { rate_base: { 2: 11.1, 3: 13.2 }, image: "img/a62f975edc860e34.jpg" } // Cyberozar
    , 53: { rate_base: {          3: 12.3 }, image: "img/73ad66e81061bba3.jpg" } // Teriqma
    , 55: { rate_base: {          3: 11.2 }, image: "img/506f053a80e1b28e.jpg" } // 夏祭り
    , 56: { rate_base: {          3: 11.0 }, image: "img/2535487ae13b2fd8.jpg" } // そばかす
    , 60: { rate_base: {          3: 11.4 }, image: "img/3bee1cce7d794f31.jpg" } // only my railgun
    , 61: { rate_base: { 2: 11.0, 3: 13.6 }, image: "img/2ccf97477eaf45ad.jpg" } // GOLDEN RULE
    , 62: { rate_base: {          3: 12.4 }, image: "img/9386971505bb20b0.jpg" } // 名も無い鳥
    , 63: { rate_base: { 2: 11.7, 3: 13.2 }, image: "img/2df15f390356067f.jpg" } // Gate of Fate
    , 64: { rate_base: {          3: 12.8 }, image: "img/6bf934fede23724d.jpg" } // 今ぞ♡崇め奉れ☆オマエらよ！！～姫の秘メタル渇望～
    , 65: { rate_base: {          3: 11.1 }, image: "img/713d52aa40ed7fc4.jpg" } // Anemone
    , 66: { rate_base: {          3: 12.3 }, image: "img/c22702914849a11a.jpg" } // 明るい未来
    , 67: { rate_base: {          3: 11.2 }, image: "img/11437ebc94947550.jpg" } // 昵懇レファレンス
    , 68: { rate_base: {          3: 11.5 }, image: "img/145b9b6f4c27d78e.jpg" } // 乗り切れ受験ウォーズ
    , 69: { rate_base: { 2: 11.9, 3: 13.3 }, image: "img/c2c4ece2034eb620.jpg" } // The wheel to the right
    , 70: { rate_base: {          3: 12.4 }, image: "img/3ccebd87235f591c.jpg" } // STAR
    , 71: { rate_base: {          3: 12.3 }, image: "img/2bf02bef3051ecaf.jpg" } // Infantoon Fantasy
    , 72: { rate_base: {          3: 13.5 }, image: "img/ec3a366b4724f8f6.jpg" } // Genesis
    , 73: { rate_base: {          3: 12.7 }, image: "img/0c2791f737ce1ff2.jpg" } // MUSIC PЯAYER
    , 74: { rate_base: {          3: 11.0 }, image: "img/feef37ed3d91cfbd.jpg" } // リリーシア
    , 75: { rate_base: {          3: 11.7 }, image: "img/e1454dc2eeae2030.jpg" } // Counselor
    , 76: { rate_base: { 2: 11.8, 3: 13.4 }, image: "img/93abb77776c70b47.jpg" } // luna blu
    , 77: { rate_base: {          3: 12.8 }, image: "img/01fc7f761272bfb4.jpg" } // ケモノガル
    , 79: { rate_base: {          3: 11.1 }, image: "img/281f821a06a7da18.jpg" } // ＧＯ！ＧＯ！ラブリズム♥
    , 82: { rate_base: {          3: 12.5 }, image: "img/27ef71f8a76f1e8a.jpg" } // Memories of Sun and Moon
    , 83: { rate_base: {          3: 12.2 }, image: "img/181682bf5b277726.jpg" } // ロストワンの号哭
    , 88: { rate_base: {          3: 12.1 }, image: "img/c4223e68340efa41.jpg" } // The Concept of Love
    , 89: { rate_base: {          3: 11.0 }, image: "img/a7b85d734fea4749.jpg" } // JET
    , 90: { rate_base: { 2: 11.7, 3: 13.3 }, image: "img/19d57f9a7652308a.jpg" } // L'épisode
    , 91: { rate_base: {          3: 11.2 }, image: "img/cb77a66b62023890.jpg" } // Yet Another ”drizzly rain”
    , 92: { rate_base: {          3: 12.9 }, image: "img/17315fb464f265bd.jpg" } // 最終鬼畜妹・一部声
    , 93: { rate_base: {          3: 12.3 }, image: "img/6b40809324937ec9.jpg" } // 蒼空に舞え、墨染の桜
    , 94: { rate_base: {          3: 12.3 }, image: "img/164258c65c714d50.jpg" } // セツナトリップ
    , 95: { rate_base: {          3: 12.1 }, image: "img/db38c119e4d8933e.jpg" } // 砂漠のハンティングガール♡
    , 96: { rate_base: {          3: 11.9 }, image: "img/9d2ebc847487e01b.jpg" } // チルノのパーフェクトさんすう教室
    , 98: { rate_base: {          3: 11.4 }, image: "img/f7e67efaf6ced6ea.jpg" } // 魔理沙は大変なものを盗んでいきました
    , 99: { rate_base: {          3: 11.7 }, image: "img/ee332e6fa86661fd.jpg" } // 言ノ葉カルマ
    ,101: { rate_base: {          3: 12.9 }, image: "img/81e347d3b96b2ae1.jpg" } // Tango Rouge
    ,102: { rate_base: {          3: 12.5 }, image: "img/7fc6ae1b488b88de.jpg" } // Tuning Rangers
    ,103: { rate_base: { 2: 11.7, 3: 13.7 }, image: "img/3210d321c2700a57.jpg" } // エンドマークに希望と涙を添えて
    ,104: { rate_base: {          3: 12.5 }, image: "img/ff945c9cb9e43e83.jpg" } // とーきょー全域★アキハバラ？
    ,106: { rate_base: { 2: 12.2, 3: 13.8 }, image: "img/8219519cc94d5524.jpg" } // 宛城、炎上！！
    ,107: { rate_base: {          3: 13.0 }, image: "img/b43fef626f5b88cd.jpg" } // We Gonna Journey
    ,108: { rate_base: {          3: 12.0 }, image: "img/1ec3213366f4ad57.jpg" } // The ether
    ,110: { rate_base: {          3: 11.2 }, image: "img/d42200159ef91521.jpg" } // Magia
    ,111: { rate_base: {          3: 11.3 }, image: "img/7ad659a57ef26888.jpg" } // staple stable
    ,112: { rate_base: {          3: 11.0 }, image: "img/3dc05a281c0724f7.jpg" } // マジLOVE1000%
    ,113: { rate_base: {          3: 11.4 }, image: "img/3f8eb68a4f6089dc.jpg" } // ストリーミングハート
    ,114: { rate_base: {          3: 11.4 }, image: "img/b02c3912d1524d5c.jpg" } // Sweet Devil
    ,115: { rate_base: {          3: 11.5 }, image: "img/9165ee58223accc0.jpg" } // Dreaming
    ,117: { rate_base: {          3: 11.5 }, image: "img/88124d980ac7eca4.jpg" } // M.S.S.Planet
    ,118: { rate_base: {          3: 12.0 }, image: "img/17e485acfe11a67f.jpg" } // 腐れ外道とチョコレゐト
    ,119: { rate_base: {          3: 12.3 }, image: "img/a7dd6716fcae0cb8.jpg" } // アウターサイエンス
    ,120: { rate_base: {          3: 12.7 }, image: "img/a84a31e562efd7a0.jpg" } // 四次元跳躍機関
    ,121: { rate_base: {          3: 12.7 }, image: "img/4196f71ce51620a0.jpg" } // 東方妖々夢 ～the maximum moving about～
    ,122: { rate_base: {          3: 12.5 }, image: "img/67418ba28151c3ff.jpg" } // 少女幻葬戦慄曲　～　Necro Fantasia
    ,124: { rate_base: {          3: 12.2 }, image: "img/74ce2f0a4b4f6fe2.jpg" } // 夏影
    ,125: { rate_base: {          3: 11.0 }, image: "img/f75a80f9b86eedab.jpg" } // Little Busters! ～TV animation ver.～
    ,126: { rate_base: {          3: 11.3 }, image: "img/547ba5407b6e7fa0.jpg" } // Heart To Heart
    ,128: { rate_base: {          3: 12.7 }, image: "img/7edc6879319accfd.jpg" } // The Formula
    ,129: { rate_base: {          3: 11.2 }, image: "img/f56cd36303a3239a.jpg" } // Hacking to the Gate
    ,130: { rate_base: {          3: 11.7 }, image: "img/e4df0d48302ccd26.jpg" } // スカイクラッドの観測者
    ,131: { rate_base: {          3: 12.6 }, image: "img/38d3c5a5a45c6d07.jpg" } // チルドレンレコード
    ,132: { rate_base: {          3: 12.2 }, image: "img/1c508bbd42d335fe.jpg" } // イカサマライフゲイム
    ,133: { rate_base: {          3: 11.0 }, image: "img/566d55b9b73112d5.jpg" } // シリョクケンサ
    ,134: { rate_base: { 2: 11.8, 3: 13.8 }, image: "img/08a24ed249ed2eec.jpg" } // HAELEQUIN (Original Remaster)
    ,135: { rate_base: {          3: 13.5 }, image: "img/e7ee14d9fe63d072.jpg" } // Vallista
    ,136: { rate_base: {          3: 12.5 }, image: "img/c4f977d264deafb1.jpg" } // Äventyr
    ,137: { rate_base: { 2: 11.4, 3: 13.6 }, image: "img/13a5a9ca35a9b71b.jpg" } // Angel dust
    ,138: { rate_base: {          3: 13.1 }, image: "img/478e8835e382f740.jpg" } // conflict
    ,140: { rate_base: {          3: 11.9 }, image: "img/0aad2e0ff661e7d1.jpg" } // Guilty
    ,141: { rate_base: { 2: 11.5, 3: 13.4 }, image: "img/2e6c11edba79d997.jpg" } // 閃鋼のブリューナク
    ,142: { rate_base: {          3: 12.6 }, image: "img/a8d181c5442df7d2.jpg" } // Altale
    ,144: { rate_base: {          3: 13.4 }, image: "img/8b04b9ad2d49850c.jpg" } // Aragami
    ,145: { rate_base: {          3: 11.8 }, image: "img/0bb58f15b16703ab.jpg" } // Change Our MIRAI！
    ,146: { rate_base: {          3: 11.7 }, image: "img/d3b40f7b8e0758ff.jpg" } // 夕暮れワンルーム
    ,148: { rate_base: {          3: 11.0 }, image: "img/cd458a75aa049889.jpg" } // Theme of SeelischTact
    ,149: { rate_base: {          3: 11.7 }, image: "img/c9c2fa20dcd9a46e.jpg" } // 緋色のDance
    ,150: { rate_base: {          3: 11.8 }, image: "img/2a41ad71b77d12c9.jpg" } // brilliant better
    ,151: { rate_base: {          3: 12.6 }, image: "img/7237488215dbd1d3.jpg" } // Alma
    ,152: { rate_base: { 2: 11.7, 3: 13.0 }, image: "img/f63fab30a7b6f160.jpg" } // Gustav Battle
    ,154: { rate_base: {          3: 12.8 }, image: "img/2e9fdbbc15ade5cb.jpg" } // SAVIOR OF SONG
    ,156: { rate_base: {          3: 11.4 }, image: "img/b33923bd4e6e5609.jpg" } // FREELY TOMORROW
    ,157: { rate_base: {          3: 12.9 }, image: "img/573109ca9050f55d.jpg" } // ギガンティック O.T.N
    ,158: { rate_base: {          3: 11.0 }, image: "img/e3ce6712e8cddf10.jpg" } // フォルテシモBELL
    ,159: { rate_base: {          3: 13.3 }, image: "img/d5a47266b4fe0bfe.jpg" } // ジングルベル
    ,160: { rate_base: {          3: 11.6 }, image: "img/809bf2b3f8effa6f.jpg" } // 言ノ葉遊戯
    ,161: { rate_base: {          3: 12.5 }, image: "img/4ceb5aed4a4a1c47.jpg" } // 私の中の幻想的世界観及びその顕現を想起させたある現実での出来事に関する一考察
    ,163: { rate_base: {          3: 11.3 }, image: "img/fd6847e3bb2e3629.jpg" } // 幾四音-Ixion-
    ,165: { rate_base: {          3: 12.8 }, image: "img/1e85c4b6775c84b0.jpg" } // ぼくらの16bit戦争
    ,166: { rate_base: {          3: 11.8 }, image: "img/5a0ac8501e3b95ce.jpg" } // 裏表ラバーズ
    ,167: { rate_base: {          3: 12.7 }, image: "img/24611f2e2374e6a8.jpg" } // 脳漿炸裂ガール
    ,168: { rate_base: {          3: 11.9 }, image: "img/1982767436fc52d8.jpg" } // ネトゲ廃人シュプレヒコール
    ,169: { rate_base: {          3: 11.4 }, image: "img/f092ddd9e1fe088b.jpg" } // elegante
    ,170: { rate_base: {          3: 11.2 }, image: "img/de40692ecc47778b.jpg" } // DETARAME ROCK&ROLL THEORY
    ,171: { rate_base: {          3: 12.4 }, image: "img/25abef88cb12af3e.jpg" } // XL TECHNO
    ,173: { rate_base: {          3: 13.1 }, image: "img/2e95529be9118a11.jpg" } // Halcyon
    ,176: { rate_base: {          3: 11.3 }, image: "img/aa0cefb5a0f00457.jpg" } // Dance!
    ,177: { rate_base: {          3: 12.7 }, image: "img/6e7843f9d831b0ac.jpg" } // Jimang Shot
    ,178: { rate_base: {          3: 12.7 }, image: "img/9f281db3bcc9353b.jpg" } // stella=steLLa
    ,179: { rate_base: {          3: 11.3 }, image: "img/0e73189a7083e4f4.jpg" } // すろぉもぉしょん
    ,180: { rate_base: { 2: 12.4, 3: 13.9 }, image: "img/a732d43fd2a11e8f.jpg" } // 怒槌
    ,185: { rate_base: {          3: 11.2 }, image: "img/520c1fef62954ca6.jpg" } // 楽園の翼
    ,186: { rate_base: {          3: 11.9 }, image: "img/e26ef92a66d5d07f.jpg" } // ってゐ！ ～えいえんてゐVer～
    ,187: { rate_base: { 2: 11.2, 3: 13.1 }, image: "img/e6642a96885723c1.jpg" } // 患部で止まってすぐ溶ける～狂気の優曇華院
    ,189: { rate_base: {          3: 12.7 }, image: "img/9310d07b7e02e73a.jpg" } // ひれ伏せ愚民どもっ！
    ,190: { rate_base: {          3: 12.6 }, image: "img/bbaa464731ab96a4.jpg" } // エテルニタス・ルドロジー
    ,191: { rate_base: {          3: 11.7 }, image: "img/53862f1d50a76902.jpg" } // 幽闇に目醒めしは
    ,192: { rate_base: {          3: 12.6 }, image: "img/4ec159d338cfba9e.jpg" } // Starlight Vision
    ,193: { rate_base: {          3: 12.5 }, image: "img/8d15a77198c7b841.jpg" } // Club Ibuki in Break All
    ,194: { rate_base: {          3: 13.0 }, image: "img/d483d1ca2a5e10ff.jpg" } // Phantasm Brigade
    ,195: { rate_base: {          3: 12.3 }, image: "img/8fae9b1861d3f9af.jpg" } // 永遠のメロディ
    ,196: { rate_base: { 2: 11.9, 3: 13.7 }, image: "img/ed40032f25177518.jpg" } // FREEDOM DiVE
    ,197: { rate_base: { 2: 11.7, 3: 13.1 }, image: "img/ae6d3a8806e09613.jpg" } // Jack-the-Ripper◆
    ,199: { rate_base: {          3: 12.1 }, image: "img/d76afb63de1417f8.jpg" } // ハート・ビート
    ,200: { rate_base: {          3: 12.1 }, image: "img/569e7b07c0696bc7.jpg" } // 無敵We are one!!
    ,201: { rate_base: { 2: 12.4, 3: 13.9 }, image: "img/a251c24a3cc4dbf7.jpg" } // Contrapasso -inferno-
    ,202: { rate_base: { 2: 11.2, 3: 13.1 }, image: "img/45112e2818cf80a2.jpg" } // GEMINI -C-
    ,203: { rate_base: {          3: 12.0 }, image: "img/101d4e7b03a5a89e.jpg" } // FLOWER
    ,204: { rate_base: {          3: 11.2 }, image: "img/1ea73ffbba6d7ead.jpg" } // ちくわパフェだよ☆CKP
    ,205: { rate_base: {          3: 12.7 }, image: "img/3d7803669dd3fcb9.jpg" } // SNIPE WHOLE
    ,206: { rate_base: {          3: 11.4 }, image: "img/e10bbd173df15772.jpg" } // Signs Of Love (“Never More” ver.)
    ,207: { rate_base: {          3: 11.7 }, image: "img/5151993f923b06a5.jpg" } // Your Affection (Daisuke Asakura Remix)
    ,208: { rate_base: {          3: 12.7 }, image: "img/5bab1a38b98d59b5.jpg" } // SAMBISTA
    ,209: { rate_base: {          3: 11.7 }, image: "img/5744f4cf66710a56.jpg" } // 君色シグナル
    ,210: { rate_base: {          3: 12.4 }, image: "img/040cd43234aed57a.jpg" } // アスノヨゾラ哨戒班
    ,211: { rate_base: {          3: 12.2 }, image: "img/d99079fecaa936ab.jpg" } // 天樂
    ,212: { rate_base: {          3: 12.1 }, image: "img/1ee29f73ee8f53d0.jpg" } // いろは唄
    ,213: { rate_base: {          3: 11.9 }, image: "img/c6d494f528391d1c.jpg" } // 星屑ユートピア
    ,214: { rate_base: {          3: 11.8 }, image: "img/f4a2d88c38669f72.jpg" } // 青春はNon-Stop!
    ,215: { rate_base: {          3: 12.4 }, image: "img/81cc90c04676f18b.jpg" } // Falling Roses
    ,216: { rate_base: {          3: 12.3 }, image: "img/3227722a8345a950.jpg" } // 放課後革命
    ,217: { rate_base: {          3: 11.8 }, image: "img/2b3c90b1dab1ecff.jpg" } // 楽園ファンファーレ
    ,218: { rate_base: {          3: 12.4 }, image: "img/20359304f5e0574a.jpg" } // サウンドプレイヤー
    ,219: { rate_base: { 2: 12.7, 3: 13.9 }, image: "img/246f63902c4b0f89.jpg" } // 玩具狂奏曲 -終焉-
    ,220: { rate_base: {          3: 12.3 }, image: "img/c3041fd82b0a0710.jpg" } // 如月アテンション
    ,222: { rate_base: {          3: 12.9 }, image: "img/ad33a423c865bed1.jpg" } // Mr. Wonderland
    ,223: { rate_base: { 2: 11.0, 3: 13.0 }, image: "img/8ec9a26e11ec1a40.jpg" } // カミサマネジマキ
    ,224: { rate_base: {          3: 11.1 }, image: "img/b9d170f84c1bb5d3.jpg" } // 恋愛裁判
    ,225: { rate_base: {          3: 12.1 }, image: "img/6f86e2a47e9a283c.jpg" } // ウミユリ海底譚
    ,226: { rate_base: { 2: 12.3, 3: 13.8 }, image: "img/993b5cddb9d9badf.jpg" } // Garakuta Doll Play
    ,227: { rate_base: {          3: 11.5 }, image: "img/74c77deb2f2e5e07.jpg" } // 洗脳
    ,228: { rate_base: {          3: 12.0 }, image: "img/882be51fe439614d.jpg" } // このふざけた素晴らしき世界は、僕の為にある
    ,229: { rate_base: { 2: 11.9, 3: 13.4 }, image: "img/73f86aec8d6c7c9b.jpg" } // 紅華刑
    ,230: { rate_base: {          3: 12.5 }, image: "img/b59d2b2ab877a77d.jpg" } // Hyperion
    ,232: { rate_base: { 2: 11.3, 3: 13.4 }, image: "img/a2069fdb9d860d36.jpg" } // Elemental Creation
    ,233: { rate_base: {          3: 12.2 }, image: "img/5fe5db1d2e40ee7a.jpg" } // アルストロメリア
    ,234: { rate_base: { 2: 12.2, 3: 13.9 }, image: "img/9af4b336821cdcc9.jpg" } // Devastating Blaster
    ,235: { rate_base: {          3: 12.5 }, image: "img/8b84b06033585428.jpg" } // ファッとして桃源郷
    ,238: { rate_base: {          3: 11.9 }, image: "img/4c769ae611f83d21.jpg" } // フレンズ
    ,240: { rate_base: {          3: 12.6 }, image: "img/47397105bad447fb.jpg" } // 夜咄ディセイブ
    ,243: { rate_base: {          3: 12.2 }, image: "img/8872c759bea3bd9f.jpg" } // シュガーソングとビターステップ
    ,244: { rate_base: {          3: 12.3 }, image: "img/e0a700914896ea4a.jpg" } // 回レ！雪月花
    ,245: { rate_base: {          3: 11.4 }, image: "img/630ac5b31e8ab816.jpg" } // Help me, あーりん！
    ,246: { rate_base: {          3: 12.8 }, image: "img/d445e4878a818d8b.jpg" } // なるとなぎのパーフェクトロックンロール教室
    ,247: { rate_base: {          3: 11.7 }, image: "img/58847f9694837c0b.jpg" } // 絶世スターゲイト
    ,248: { rate_base: { 2: 12.3, 3: 13.9 }, image: "img/a2fdef9e4b278a51.jpg" } // Schrecklicher Aufstand
    ,249: { rate_base: {          3: 12.7 }, image: "img/1a532b709f9834b6.jpg" } // ドライヴ・オン・ザ・レインボー
    ,250: { rate_base: { 2: 11.8, 3: 13.4 }, image: "img/989f4458fb34aa9d.jpg" } // Philosopher
    ,251: { rate_base: {          3: 12.5 }, image: "img/457722c9f3ff5473.jpg" } // Crazy ∞ nighT
    ,252: { rate_base: {          3: 12.3 }, image: "img/bb221e3de960de7d.jpg" } // 愛迷エレジー
    ,253: { rate_base: {          3: 13.1 }, image: "img/a2f5cd53acbfc981.jpg" } // Warcry
    ,254: { rate_base: {          3: 11.7 }, image: "img/2e617d713547fe84.jpg" } // その群青が愛しかったようだった
    ,255: { rate_base: {          3: 11.0 }, image: "img/429d34fef5fddb02.jpg" } // 激情！ミルキィ大作戦
    ,256: { rate_base: {          3: 12.7 }, image: "img/755fb1e2b79ba896.jpg" } // 札付きのワル 〜マイケルのうた〜
    ,257: { rate_base: {          3: 13.0 }, image: "img/bef9b79c637bf4c9.jpg" } // BOKUTO
    ,258: { rate_base: { 2: 12.8, 3: 14.0 }, image: "img/f04c37ecd99f1d8c.jpg" } // TiamaT:F minor
    ,259: { rate_base: { 2: 11.3, 3: 13.0 }, image: "img/4d66e5d1669d79a2.jpg" } // Oshama Scramble! (Cranky Remix)
    ,260: { rate_base: {          3: 12.4 }, image: "img/03f1dafe3b08607e.jpg" } // D.E.A.D.L.Y.
    ,261: { rate_base: {          3: 12.3 }, image: "img/6e917606db3c5a0e.jpg" } // ロボットプラネットユートピア
    ,262: { rate_base: {          3: 13.5 }, image: "img/676e59847912f5ca.jpg" } // Tidal Wave
    ,263: { rate_base: {          3: 11.7 }, image: "img/015358a0c0580022.jpg" } // Hand in Hand
    ,264: { rate_base: {          3: 12.2 }, image: "img/f44c6b628889f8ec.jpg" } // My Dearest Song
    ,265: { rate_base: {          3: 12.3 }, image: "img/874f9509a5e5707e.jpg" } // 猫祭り
    ,266: { rate_base: {          3: 12.7 }, image: "img/7e82a95c4bfa983a.jpg" } // ゲシュタルト！テスト期間！！
    ,267: { rate_base: {          3: 11.5 }, image: "img/a0d03551eb3930e9.jpg" } // 心象蜃気楼
    ,268: { rate_base: {          3: 12.8 }, image: "img/e52af2b93636ccea.jpg" } // Bang Babang Bang!!!
    ,269: { rate_base: {          3: 11.1 }, image: "img/23359d965dd6eb4a.jpg" } // 僕らの翼
    ,270: { rate_base: {          3: 12.3 }, image: "img/21dfcd3ae2c5c370.jpg" } // エンヴィキャットウォーク
    ,271: { rate_base: {          3: 12.8 }, image: "img/99b79d4bd74e476c.jpg" } // 鬼KYOKAN
    ,272: { rate_base: {          3: 11.7 }, image: "img/98b02f86db4d3fe2.jpg" } // 有頂天ビバーチェ
    ,273: { rate_base: {          3: 11.9 }, image: "img/604157e2c49d91d7.jpg" } // ビバハピ
    ,275: { rate_base: {          3: 11.5 }, image: "img/169a5a5ffa300cb7.jpg" } // 愛言葉
    ,276: { rate_base: {          3: 12.3 }, image: "img/82105b37d18450b6.jpg" } // 後夜祭
    ,277: { rate_base: {          3: 12.4 }, image: "img/23e754d62862c0c4.jpg" } // TRUST
    ,278: { rate_base: {          3: 11.4 }, image: "img/5f1d7a520a2735d4.jpg" } // からくりピエロ
    ,279: { rate_base: {          3: 11.7 }, image: "img/84ecaebe6bce2a58.jpg" } // 深海少女
    ,280: { rate_base: {          3: 11.8 }, image: "img/f78d1487c34efa6e.jpg" } // リモコン
    ,281: { rate_base: { 2: 11.1, 3: 13.4 }, image: "img/330e57eeeb0fb2cd.jpg" } // ラクガキスト
    ,282: { rate_base: {          3: 11.7 }, image: "img/4a51a3a5dc24c579.jpg" } // アカツキアライヴァル
    ,283: { rate_base: {          3: 12.0 }, image: "img/c658788de6594b15.jpg" } // 神曲
    ,284: { rate_base: {          3: 12.7 }, image: "img/16b25dc6eb7765aa.jpg" } // 幸せになれる隠しコマンドがあるらしい
    ,286: { rate_base: {          3: 11.5 }, image: "img/afcce0c85c1f8610.jpg" } // Tell Your World
    ,287: { rate_base: {          3: 11.9 }, image: "img/5febf5df2b5094f3.jpg" } // ロミオとシンデレラ
    ,288: { rate_base: {          3: 11.6 }, image: "img/f29f10a963df60cf.jpg" } // First Twinkle
    ,289: { rate_base: {          3: 12.7 }, image: "img/0cece587cced4d3f.jpg" } // ウソラセラ
    ,290: { rate_base: {          3: 11.3 }, image: "img/b1d08379f05c706e.jpg" } // 檄!帝国華撃団
    ,291: { rate_base: {          3: 12.4 }, image: "img/9c5e71b3588dbc70.jpg" } // Kronos
    ,292: { rate_base: {          3: 12.1 }, image: "img/b12c25f87b1d036e.jpg" } // 月に叢雲華に風
    ,293: { rate_base: {          3: 13.2 }, image: "img/c58227eb0d14938c.jpg" } // インビジブル
    ,294: { rate_base: {          3: 13.0 }, image: "img/c63005195d15922e.jpg" } // 人生リセットボタン
    ,295: { rate_base: {          3: 12.0 }, image: "img/988d8172dbe8b42b.jpg" } // 響
    ,296: { rate_base: {          3: 12.1 }, image: "img/76535cf4c728f2af.jpg" } // かくしん的☆めたまるふぉ～ぜっ!
    ,297: { rate_base: {          3: 12.3 }, image: "img/8463cebfa120b884.jpg" } // 風仁雷仁
    ,298: { rate_base: {          3: 12.6 }, image: "img/7c649691aa0c4b3d.jpg" } // PRIVATE SERVICE
    ,299: { rate_base: {          3: 11.4 }, image: "img/9bd44690db5375ac.jpg" } // secret base ～君がくれたもの～ (10 years after Ver.)
    ,300: { rate_base: {          3: 12.2 }, image: "img/012eb1ed09577836.jpg" } // No Routine
    ,301: { rate_base: {          3: 12.2 }, image: "img/62941303552504e8.jpg" } // 白い雪のプリンセスは
    ,302: { rate_base: { 2: 11.0, 3: 13.3 }, image: "img/13446730e8b99f0e.jpg" } // Strahv
    ,304: { rate_base: {          3: 11.7 }, image: "img/16cb8567115a2f2c.jpg" } // In The Blue Sky ’01
    ,305: { rate_base: { 2: 11.0, 3: 13.2 }, image: "img/266bd38219201fa1.jpg" } // 幻想のサテライト
    ,306: { rate_base: {          3: 12.2 }, image: "img/106d9eec68ed84b3.jpg" } // 凛として咲く花の如く
    ,307: { rate_base: {          3: 12.7 }, image: "img/ff9f70c8c0d9f24e.jpg" } // Paqqin
    ,308: { rate_base: {          3: 11.9 }, image: "img/f8d3f2e57ae2ff24.jpg" } // fake!fake!
    ,309: { rate_base: {          3: 12.5 }, image: "img/cee51d69c428f8f5.jpg" } // Rising Hope
    ,310: { rate_base: { 2: 11.2, 3: 13.3 }, image: "img/ae93bd84b68781f6.jpg" } // 覚醒楽奏メタフィクション
    ,311: { rate_base: {          3: 11.8 }, image: "img/8f359edeac59a511.jpg" } // Be My Friend
    ,312: { rate_base: { 2: 11.0, 3: 13.3 }, image: "img/81805f2ef1e58db8.jpg" } // ぶいえす!!らいばる!!
    ,313: { rate_base: {          3: 11.4 }, image: "img/5ac018495d6f01a5.jpg" } // ひだまりデイズ
    ,314: { rate_base: {          3: 11.8 }, image: "img/5fb63e847a057938.jpg" } // This game
    ,315: { rate_base: {          3: 11.3 }, image: "img/fa70cc77f963cdba.jpg" } // オラシオン
    ,316: { rate_base: {          3: 11.5 }, image: "img/88f9536c08cb4e3f.jpg" } // みくみくにしてあげる♪【してやんよ】
    ,317: { rate_base: {          3: 13.2 }, image: "img/db15d5b7aefaa672.jpg" } // Air
    ,318: { rate_base: {          3: 13.0 }, image: "img/f803d578eb4047eb.jpg" } // DataErr0r
    ,319: { rate_base: {          3: 12.6 }, image: "img/e9eeb98572b140bc.jpg" } // Say A Vengeance
    ,320: { rate_base: {          3: 12.6 }, image: "img/6b33d4fa539d5adb.jpg" } // 010
    ,321: { rate_base: {          3: 12.5 }, image: "img/40cc7a6a264f88c1.jpg" } // ERIS -Legend of Gaidelia-
    ,322: { rate_base: {          3: 13.6 }, image: "img/8b145fe4cf0c01bb.jpg" } // Imperishable Night 2006 (2016 Refine)
    ,323: { rate_base: {          3: 13.5 }, image: "img/282cb1cacd4c1bb4.jpg" } // Dreadnought
    ,324: { rate_base: {          3: 12.6 }, image: "img/d51d4ffba9f8d45e.jpg" } // STAGER
    ,325: { rate_base: {          3: 12.6 }, image: "img/97eca622afca0f15.jpg" } // Her Majesty
    ,326: { rate_base: {          3: 12.5 }, image: "img/fd01fc38e38042e3.jpg" } // Sakura Fubuki
    ,327: { rate_base: {          3: 12.7 }, image: "img/17c363c1fd2fa7d1.jpg" } // JULIAN
    ,328: { rate_base: { 2: 11.4, 3: 13.7 }, image: "img/c7cf3ce1e858e3f0.jpg" } // ★LittlE HearTs★
    ,329: { rate_base: {          3: 12.3 }, image: "img/e869980ddd2f9c68.jpg" } // STAIRWAY TO GENERATION
    ,330: { rate_base: {          3: 12.1 }, image: "img/b3ea0fe012eb7ea2.jpg" } // ドキドキDREAM!!!
    ,331: { rate_base: {          3: 12.2 }, image: "img/ec37e447b91995dd.jpg" } // 猛進ソリストライフ！
    ,332: { rate_base: {          3: 12.3 }, image: "img/41001ddd4214d6b6.jpg" } // 空威張りビヘイビア
    ,334: { rate_base: {          3: 12.4 }, image: "img/2704dddce9cd4e3c.jpg" } // FLOATED CALM
    ,335: { rate_base: {          3: 13.4 }, image: "img/3c61434b8cb2aadf.jpg" } // Supersonic Generation
    ,336: { rate_base: {          3: 12.2 }, image: "img/e40fceaa1bb587b7.jpg" } // シジョウノコエ VOCALO ver.
    ,338: { rate_base: {          3: 12.3 }, image: "img/379072a1ddcf1fe2.jpg" } // SPICY SWINGY STYLE
    ,339: { rate_base: {          3: 11.7 }, image: "img/65353f99e301c521.jpg" } // Revolution Game
    ,340: { rate_base: {          3: 12.5 }, image: "img/de62556bd83dd21d.jpg" } // Still
    ,341: { rate_base: {          3: 13.1 }, image: "img/fc1cec7d2aeb6ca1.jpg" } // おまかせ！！トラブルメイ娘☆とれびちゃん
    ,342: { rate_base: {          3: 13.5 }, image: "img/6905b5ce0d115340.jpg" } // オススメ☆♂♀☆でぃすとぴあ
    ,343: { rate_base: {          3: 11.6 }, image: "img/e21129db8b503610.jpg" } // Daydream cafe
    ,344: { rate_base: {          3: 11.7 }, image: "img/fa151f477301a676.jpg" } // ノーポイッ！
    ,345: { rate_base: {          3: 11.5 }, image: "img/1c098cdf731eb671.jpg" } // ムーンライト伝説
    ,348: { rate_base: {          3: 11.3 }, image: "img/357a07354e3f2187.jpg" } // Jumping!!
    ,350: { rate_base: {          3: 12.7 }, image: "img/44c1e56a88c144c3.jpg" } // FEEL×ALIVE
    ,351: { rate_base: {          3: 12.9 }, image: "img/fb91e08c99009fd4.jpg" } // ぶぉん！ぶぉん！らいど・おん！
    ,352: { rate_base: {          3: 12.1 }, image: "img/c78c45855db15f7a.jpg" } // Star☆Glitter
    ,354: { rate_base: {          3: 12.3 }, image: "img/81a50239781153fb.jpg" } // ラブリー☆えんじぇる!!
    ,356: { rate_base: {          3: 12.3 }, image: "img/13e6eb56943f6d00.jpg" } // クローバー♣かくめーしょん
    ,357: { rate_base: {          3: 11.7 }, image: "img/a852ba21f22efbc1.jpg" } // ぐーちょきパレード
    ,358: { rate_base: {          3: 11.7 }, image: "img/c12cb5d8f49e8d2b.jpg" } // My Soul,Your Beats!
    ,359: { rate_base: {          3: 11.8 }, image: "img/8b7fcdd825264797.jpg" } // Thuousand Enemies
    ,360: { rate_base: {          3: 11.3 }, image: "img/8ecf57e4db2f6d94.jpg" } // 夢想歌
    ,362: { rate_base: {          3: 12.1 }, image: "img/13f02068575a1ef9.jpg" } // Face of Fact
    ,363: { rate_base: {          3: 11.6 }, image: "img/15625838f8f00963.jpg" } // true my heart -Lovable mix-
    ,367: { rate_base: {          3: 11.7 }, image: "img/0c6288729e80a1df.jpg" } // いーあるふぁんくらぶ
    ,368: { rate_base: {          3: 12.8 }, image: "img/8b14785409866748.jpg" } // おこちゃま戦争
    ,369: { rate_base: {          3: 11.7 }, image: "img/d3a5a61b5eb2b8fb.jpg" } // エイリアンエイリアン
    ,370: { rate_base: {          3: 12.4 }, image: "img/f93fba04ff1c0c54.jpg" } // 虎視眈々
    ,371: { rate_base: {          3: 12.7 }, image: "img/ad2ef043b1bd490f.jpg" } // アンハッピーリフレイン
    ,372: { rate_base: {          3: 12.2 }, image: "img/9c39b668e99ce253.jpg" } // すきなことだけでいいです
    ,373: { rate_base: {          3: 12.4 }, image: "img/4f8e04cdc467480d.jpg" } // デリヘル呼んだら君が来た
    ,374: { rate_base: {          3: 12.5 }, image: "img/189a65f52bd06239.jpg" } // チュルリラ・チュルリラ・ダッダッダ！
    ,375: { rate_base: {          3: 11.5 }, image: "img/ddfafd0206d04707.jpg" } // だんだん早くなる
    ,376: { rate_base: {          3: 12.2 }, image: "img/b1e915b646c9ba08.jpg" } // ECHO
    ,377: { rate_base: {          3: 11.5 }, image: "img/841eecc396c5059a.jpg" } // 泡沫、哀のまほろば
    ,379: { rate_base: {          3: 11.8 }, image: "img/021eef9b80989a2e.jpg" } // 愛き夜道 feat. ランコ、雨天決行
    ,380: { rate_base: {          3: 11.4 }, image: "img/f5f99bf548dab947.jpg" } // Starlight Dance Floor
    ,381: { rate_base: {          3: 12.0 }, image: "img/f489240491c703a5.jpg" } // Witches night
    ,382: { rate_base: {          3: 12.2 }, image: "img/35f4cdddf050d04c.jpg" } // Help me, ERINNNNNN!! -Cranky remix-
    ,383: { rate_base: {          3: 12.6 }, image: "img/fbc64b4167aebad9.jpg" } // 仙酌絶唱のファンタジア
    ,384: { rate_base: {          3: 12.4 }, image: "img/2cf12519a485d471.jpg" } // キュアリアス光吉古牌　－祭－
    ,385: { rate_base: {          3: 13.4 }, image: "img/82c76a871596142c.jpg" } // Evans
    ,386: { rate_base: { 2: 12.5, 3: 13.9 }, image: "img/8205ea9449f1b000.jpg" } // 神威
    ,388: { rate_base: {          3: 13.3 }, image: "img/14edd93cf813cdc2.jpg" } // GOODTEK
    ,389: { rate_base: {          3: 13.5 }, image: "img/f7be4abcf8f3e197.jpg" } // Name of oath
    ,390: { rate_base: {          3: 12.2 }, image: "img/c23488ff88a819b9.jpg" } // Bird Sprite
    ,393: { rate_base: {          3: 13.8 }, image: "img/de02f8c0217d9baa.jpg" } // Dengeki Tube
    ,394: { rate_base: {          3: 11.7 }, image: "img/0a458d03f61196d3.jpg" } // 若い力 -SEGA HARD GIRLS MIX-
    ,395: { rate_base: {          3: 11.9 }, image: "img/90be66e64c2417cb.jpg" } // レッツゴー!陰陽師
    ,396: { rate_base: {          3: 12.1 }, image: "img/d15d3a298dac3df0.jpg" } // あねぺったん
    ,397: { rate_base: {          3: 13.5 }, image: "img/3e545c372b926197.jpg" } // Like the Wind [Reborn]
    ,398: { rate_base: {          3: 11.8 }, image: "img/4e7b81501ccdd198.jpg" } // 天国と地獄 -言ノ葉リンネ-
    ,399: { rate_base: {          3: 12.6 }, image: "img/854cf33a2b30f004.jpg" } // 最愛テトラグラマトン
    ,402: { rate_base: {          3: 12.2 }, image: "img/2b40dbdabb958a34.jpg" } // 悪戯
    ,403: { rate_base: {          3: 11.2 }, image: "img/2c9749de2183879c.jpg" } // りばーぶ
    ,404: { rate_base: {          3: 12.0 }, image: "img/dc67a58e35e06b96.jpg" } // Barbed Eye
    ,405: { rate_base: {          3: 13.2 }, image: "img/b91503d46e39a754.jpg" } // 分からない
    ,407: { rate_base: { 2: 13.0, 3: 14.0 }, image: "img/a9b25545cd935cc9.jpg" } // 混沌を越えし我らが神聖なる調律主を讃えよ
    ,409: { rate_base: {          3: 13.8 }, image: "img/19f776c8daa51095.jpg" } // Finite
    ,410: { rate_base: {          3: 12.7 }, image: "img/cbfb4c6a58342201.jpg" } // MY LIBERATION
    ,411: { rate_base: {          3: 12.3 }, image: "img/dc09ca21d0647779.jpg" } // 地球最後の告白を
    ,414: { rate_base: { 2: 11.3, 3: 13.4 }, image: "img/cd2aebc19c4fa1cd.jpg" } // We Gonna Party -Feline Groove Mix-
    ,416: { rate_base: {          3: 12.4 }, image: "img/d13c5d162e6fa57e.jpg" } // Through The Tower
    ,417: { rate_base: {          3: 12.4 }, image: "img/b739e3b0af173789.jpg" } // Redo
};

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

// ---- rate <-> score

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

// ---- unparsers

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

// (unused)
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

// ---- obj -> dom

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

// TODO: Bug fix.
// TODO: Implement on_create hooks, click handlers.
// TODO: It maybe okay to use functions to instantiate vars.
//
// Stringify TEMPLATE in the HTML format. TEMPLATE can be either a
// string or a JS array of the form [TAG, ATTRS, CHILDREN ...]. TAG is
// the tag name optionally followed by "#<id>". ATTRS is optional and
// if specified, it must be an object whose keys are attribute names
// and values are strings. CHILDREN are templates respectively.
//
// Optional arg PARAMS can be an object, whose values are either
// string, or an object of the same form as ATTRS. If TEMPLATE has a
// DOM whose id matches a key in PARAMS, its content or attributes are
// replaced by the value associated to the key.
function dom(template, params)
{
    if (!template) return "";
    else if (typeof template == "string") return template;

    var elem = template[0].split("#"); // [ELEM_TYPE, ID]
    var attrs = typeof template[1] == "object" && !Array.isArray(template[1]) && template[1];
    var contents = template.slice(attrs ? 2 : 1);

    if (params && params[elem[1]]) {
        if (typeof params[elem[1]] == "string")
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

// name vs details map
var music_info = {};

// current values
var disp_rate         = 0;
var best_rate         = 0;
var best_list         = [];
var best_rate_border;
var recent_rate       = 0;
var opt_rate          = 0;
var recent_candidates = JSON.parse(localStorage.getItem("cra_recent_candidates")) || [];

// load the last data from localStorage (if exists)
var last_cra_version = JSON.parse(localStorage.getItem("cra_version"));
var last_disp_rate   = JSON.parse(localStorage.getItem("cra_disp_rate"));
var last_best_rate   = JSON.parse(localStorage.getItem("cra_best_rate"));
var last_best_list   = JSON.parse(localStorage.getItem("cra_best_list"));
var last_recent_rate = JSON.parse(localStorage.getItem("cra_recent_rate"));
var last_opt_rate    = JSON.parse(localStorage.getItem("cra_opt_rate"));

// diff between the current rate and the last rate
var disp_rate_diff;
var best_rate_diff;
var recent_rate_diff;
var opt_rate_diff;

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------

var $chunithm_net = $("body *");

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

    '#cra_offer_playlog': {
        "position": "static", "font-size": "10px",
        "vertical-align": "top", "margin": "0 0 0 5px",
        "padding": "2px 5px", "border-radius": "4px"
    },

    ".cra_chart_list_item": {
        "text-align": "center",
    },

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

DEPENDENCIES.map(function(x) { $("head").append("<script src='" + x + "'>"); });
$chunithm_net.fadeTo(400, 0.75);
$("head").append("<style>" + _css(the_css) + "</style>");

// ---- render the initial screen

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
          "<p>CHUNITHM Net 仕様変更のため一時的に使えません。</p>" +
          "<p>スコア取得の方法を変えて対応の予定です。</p>");

// close button
$("#cra_close_button")
    .click(function() {
        $("html, body").animate({ scrollTop: 0 }, 400);
        $("#cra_wrapper").fadeOut(400, function() { $(this).remove(); });
        $chunithm_net.delay(400).fadeTo(400, 1);
    });

/*
 * // fetch button
 * $("#cra_window_inner")
 *     .append($("<h2 id='page_title' class='cra_button cra_fetch_score'>スコアを解析する</h2>")
 *             .click(function() {
 *                 $("#cra_close_button").hide(400);
 *                 fetch_score_data(2, function() {
 *                     fetch_score_data(3, function() {
 *                         fetch_playlog(function () {
 *                             $("#cra_close_button").show(400);
 *                             rate_display();
 *                         });
 *                     });
 *                 });
 *             }));
 * */

// view button
if(CRA_VERSION == last_cra_version) {
    $("#cra_window_inner")
        .append($("<h2 id='page_title' class='cra_button cra_view_last'>前回のデータを見る</h2>")
               .click(function() {
                   best_list = last_best_list;
                   disp_rate = last_disp_rate;
                   rate_display();
               }));
}

$("html, body").animate({ scrollTop: 0 }, 400);
$("#cra_wrapper").delay(400).fadeIn(400);

// -----------------------------------------------------------------------------
// fetch music / user data
// -----------------------------------------------------------------------------

// Create playlog entity if MUSIC_INFO exists. Otherwise return null.
function playlog(name, level, score, play_date /* optional */) {
    var info = music_info[name];
    var rate_base  = info && info.rate_base[level];
    if (!rate_base) return null;
    return {
        name:      name,
        image:     info.image,
        level:     level,
        score:     score,
        rate:      score_to_rate(rate_base, score),
        play_date: play_date,
        rate_diff: 0,
        rate_base: rate_base
    };
}

function comp_rate(p1, p2) {
    if (p1.rate !== p2.rate) return p2.rate - p1.rate;
    else if (p1.play_date < p2.play_date) return -1;
    else if (p1.play_date > p2.play_date) return 1;
    return 0;
}

function comp_id(p1, p2) {
    return (p1.id - p2.id) || (p1.level - p2.level);
}

// push new playlog to recent_candidates if appropriate.
function push_playlog_to_recent_candidates (log) {
    var len = recent_candidates.length;
    var recent_list = [].concat(recent_candidates).sort(comp_rate).slice(0, 10);
    var min_rate    = len >= 10 ? Math.min.apply(null, recent_list.map(function (p) { return p.rate; })) : 0;
    var min_score   = len >= 10 ? Math.min.apply(null, recent_list.map(function (p) { return p.score; })) : 0;

    if (log.rate > min_rate) {
        if (len < 30) recent_candidates.push(log);
        else {
            for (var k = 0; k < recent_candidates.length; k++) {
                if (recent_candidates[k].rate < log.rate) {
                    recent_candidates.splice(k, 1);
                    recent_candidates.push(log);
                    break;
                }
            }
        }
    }

    else if (log.score < 1007500 && log.score < min_score) {
        if (len >= 30) recent_candidates.shift();
        recent_candidates.push(log);
    }
}

// use GetUserPlaylogApi to fetch playlog, and update
// recent_candidates and recent_list.
function fetch_playlog(callback)
{
    $("#cra_window_inner").html("<p>loading playlog ...</p>");
    request_api("GetUserPlaylogApi", {}, function (d) {
        var last_play_date = recent_candidates[0] && recent_candidates[recent_candidates.length - 1].play_date;
        for (var i = d.userPlaylogList.length - 1; i >= 0; i--) {
            var log = playlog(
                d.userPlaylogList[i].musicName,
                LEVEL_ID[d.userPlaylogList[i].levelName],
                d.userPlaylogList[i].score,
                d.userPlaylogList[i].userPlayDate
            );

            if (!log) {
                log = {
                    name: d.userPlaylogList[i].musicName,
                    image: d.userPlaylogList[i].musicFileName,
                    level: LEVEL_ID[d.userPlaylogList[i].levelName],
                    score: d.userPlaylogList[i].score,
                    rate: 0,
                    play_date: d.userPlaylogList[i].userPlayDate,
                    rate_diff: 0,
                    rate_base: 0,
                }
            }

            if ((log.level != 4) && (!last_play_date || log.play_date > last_play_date))
                push_playlog_to_recent_candidates(log);
        }
        callback();
    }, function () {
        $("#cra_window_inner").html("<p>CHUNITHM NET との通信に失敗しました。</p>");
    });
}

// use GetUserMusicApi to fetch all scores, then update music_info and
// chart_list
function fetch_score_data(level, callback)
{
    $("#cra_window_inner").html("<p>loading ...</p>");
    request_api("GetUserMusicApi", {
        level: "1990" + level
    }, function(d) {
        Object.keys(d.musicNameMap).map(function (id) {
            if (DIFFICULTY[id]) {
                music_info[d.musicNameMap[id]] = DIFFICULTY[id];
            }
        });
        for (var i = 0; i < d.userMusicList.length; i++) {
            var log = playlog(
                d.musicNameMap[d.userMusicList[i].musicId],
                level,
                d.userMusicList[i].scoreMax
            );
            if (log) best_list.push(log);
        }
        callback();
    }, function() {
        $("#cra_window_inner").html("<p>CHUNITHM NET との通信に失敗しました。</p>");
    });
}

// -----------------------------------------------------------------------------
// calculate rate and render
// -----------------------------------------------------------------------------

// Hide window, compute and display the rate from fetched data.
function rate_display()
{
    var i;

    $("#cra_window_inner").html("<p>computing rate ...</p>");

    // save lists to localstorage (before they get sorted)
    localStorage.setItem("cra_version", JSON.stringify(CRA_VERSION));
    localStorage.setItem("cra_best_list", JSON.stringify(best_list));
    localStorage.setItem("cra_recent_candidates", JSON.stringify(recent_candidates));

    // calculate score improvement
    if (last_best_list) {
        best_list      = best_list.sort(comp_id);
        last_best_list = last_best_list.sort(comp_id);
        for (var i = 0, j = 0; i < best_list.length;) {
            if (!last_best_list[j]) break;
            var comp = comp_id(best_list[i], last_best_list[j]);
            if (comp < 0) i++;
            else if (comp > 0) j++;
            else {
                best_list[i].rate_diff = best_list[i].rate - last_best_list[j].rate;
                i++;
                j++;
            }
        }
    }

    // calculate rate and their diff
    var recent_list = [].concat(recent_candidates).sort(comp_rate).slice(0, 10);
    best_list.sort(function(a, b) { return - (a.rate - b.rate); });
    for (var i = 0, best_rate = 0; i < 30 && i < best_list.length; i++)
        best_rate += best_list[i].rate;
    for (var i = 0, recent_rate = 0; i < 10 && i < recent_list.length; i++)
        recent_rate += recent_list[i].rate;
    opt_rate = best_list[0] ? ((best_rate + best_list[0].rate * 10) / 40) : 0;
    best_rate = (best_rate / 30);
    recent_rate = (recent_rate / 10);
    disp_rate = (best_rate * 3 + recent_rate) / 4;
    best_rate_diff = last_best_rate ? best_rate - last_best_rate : 0;
    opt_rate_diff = last_opt_rate ? opt_rate - last_opt_rate : 0;
    disp_rate_diff = last_disp_rate ? disp_rate - last_disp_rate : 0;
    recent_rate_diff = last_recent_rate ? recent_rate - last_recent_rate : 0;

    // save rates to localStorage
    localStorage.setItem("cra_disp_rate", JSON.stringify(disp_rate));
    localStorage.setItem("cra_best_rate", JSON.stringify(best_rate));
    localStorage.setItem("cra_opt_rate", JSON.stringify(opt_rate));
    localStorage.setItem("cra_recent_rate", JSON.stringify(recent_rate));

    // calculate required score to improve the rate
    best_rate_border = best_list[0] ? best_list[Math.min(29, best_list.length - 1)].rate : 0;
    for (i = 0; i < best_list.length; i++)
    {
        best_list[i].req_score = rate_to_score(best_list[i].rate_base, best_rate_border);
        best_list[i].req_diff = Math.max(best_list[i].req_score - best_list[i].score, 0);
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
  <div id='cra_offer_playlog' class="cra_sort_button">データ提供</div>
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
                  "曲別レートトップ: " + rate_str(best_list[0].rate) +
                  " (" + best_list[0].name + ") #CHUNITHMRateAnalyzer")
            .html("Tweet");

        $("#cra_offer_playlog").click(function () {
            if (window.confirm('Recent 枠の解析をされている @max_eipi さんにプレー履歴を提供し、解析に協力することができます。ユーザー名等は送信されません。提供する場合は OK をクリックしてください。')) {
                offer_playlog();
            }
        });

        $("#cra_sort_menu")
            .html("<div id='cra_sort_rate' class='cra_sort_button'>レート順</div>" +
                  "<div id='cra_sort_base' class='cra_sort_button'>難易度順</div>" +
                  "<div id='cra_sort_score' class='cra_sort_button'>スコア順</div>" +
                  "<div id='cra_sort_score_req' class='cra_sort_button'>必要スコア順</div>" +
                  "<div id='cra_recent_list' class='cra_sort_button'>Recent枠(β)</div>");

        $("#cra_footer")
            .html("CHUNITHM Rate Analyzer by zk_phi " +
                  "<a id='cra_follow_button' class='twitter-follow-button'></a>");

        $("#cra_follow_button")
            .attr("href", "https://twitter.com/zk_phi")
            .html("Follow");

        $("#cra_sort_rate").click(function() {
            best_list.sort(comp_rate);
            render_chart_list(best_list, { 0: "曲別レート (高い順)", 30: "BEST 枠ここまで" });
        });

        $("#cra_sort_base").click(function() {
            best_list.sort(function(a, b) { return - (a.rate_base - b.rate_base); });
            var indices = { 0 : "LEVEL 14" };
            for (i = 0; best_list[i].rate_base >= 14; i++) ;
            indices[i] = "LEVEL 13+";
            for (i = 0; best_list[i].rate_base >= 13.7; i++) ;
            indices[i] = "LEVEL 13";
            for (i = 0; best_list[i].rate_base >= 13; i++) ;
            indices[i] = "LEVEL 12+";
            for (i = 0; best_list[i].rate_base >= 12.7; i++) ;
            indices[i] = "LEVEL 12";
            for (i = 0; best_list[i].rate_base >= 12; i++) ;
            indices[i] = "LEVEL 11";
            render_chart_list(best_list, indices);
        });

        $("#cra_sort_score").click(function() {
            best_list.sort(function(a, b) { return - (a.score - b.score) });
            var indices = { 0 : "SSS" };
            for (i = 0; i < best_list.length && best_list[i].score >= 1007500; i++) ;
            indices[i] = "SS";
            for (i = 0; i < best_list.length && best_list[i].score >= 1000000; i++) ;
            indices[i] = "S";
            for (i = 0; i < best_list.length && best_list[i].score >=  975000; i++) ;
            indices[i] = "AAA";
            for (i = 0; i < best_list.length && best_list[i].score >=  950000; i++) ;
            indices[i] = "AA";
            for (i = 0; i < best_list.length && best_list[i].score >=  925000; i++) ;
            indices[i] = "A";
            for (i = 0; i < best_list.length && best_list[i].score >=  900000; i++) ;
            indices[i] = "A未満"
            render_chart_list(best_list, indices);
        });

        $("#cra_sort_score_req").click(function() {
            best_list.sort(function(a, b) {
                return (isNaN(b.req_diff) ? -1 : 0) + (isNaN(b.req_diff) ? 1 : 0)
                    || a.req_diff - b.req_diff
                    || - (a.rate_base - b.rate_base);
            });
            render_chart_list(best_list, { 0: "レート上げに必要なスコア順", 30: "BEST 枠ここまで" });
        });

        $("#cra_recent_list").click(function () {
            recent_candidates.sort(comp_rate);
            render_chart_list(recent_candidates, { 0: 'Recent枠', 10: 'Recent候補枠' });
        });

        // load twitter buttons
        if (typeof twttr != "undefined") twttr.widgets.load();

        // render chart list
        var indices = {};
        best_list.sort(function(a, b) {
            return (a.rate_diff ? 0 : 1) + (b.rate_diff ? 0 : -1) || - (a.rate - b.rate);
        });
        for (var i = 0; i < best_list.length && best_list[i].rate_diff != 0; i++);
        if (i) indices[0] = "最近レートを更新した曲";
        indices[i] = "曲別レート (高い順)";
        for (; i < best_list.length && best_list[i].req_diff <= 0; i++) ;
        indices[i] = "BEST 枠ここまで";
        render_chart_list(best_list, indices);
    });
}

// refresh the chart list display
function render_chart_list(list, msgs, show_all)
{
    // hide old items
    $("#cra_chart_list *").remove();
    $("#cra_chart_list").css({ display: "none" });

    for (var i = 0; i < list.length; i++)
    {
        if (msgs[i])
            $("#cra_chart_list")
            .append("<hr>")
            .append(dom(["div", {class: "mt_15"}, ["h2#page_title", msgs[i]]]));

        // 満点出しても BEST 枠を改善できない譜面を出さない（Recent 枠
        // の場合は req_diff = undefined なので影響しない）
        if (!show_all && list[i].req_diff != undefined && isNaN(list[i].req_diff)) continue;

        var difficulty_icon = list[i].level == 2 ? "common/images/icon_expert.png"
            : "common/images/icon_master.png";

        var $list_item = $("<div class='frame02 w400 cra_chart_list_item'>")
            .appendTo("#cra_chart_list");

        $list_item
            .html(`
<div class="play_jacket_side">
  <div class="play_jacket_area">
    <div id="Jacket" class="play_jacket_img">
      <img src=${list[i].image}>
    </div>
  </div>
</div>
<div class="play_data_side01">
  <div class="box02 play_track_block">
    <div id="TrackLevel" class="play_track_result">
      <img src="${difficulty_icon}">
    </div>
    <div id="Track" class="play_track_text">
      ${rate_str(list[i].rate_base)}
    </div>
  </div>
  <div class="box02 play_musicdata_block">
    <div id="MusicTitle" class="play_musicdata_title">
      ${list[i].name}
    </div>
    <div class="play_musicdata_score clearfix">
      <div class="play_musicdata_score_text">
        Score：<span id="Score">${list[i].score}</span>
      </div>
      <br>
      <div class="play_musicdata_score_text">
        Rate：
        <span id="Rate">
          ${rate_str(list[i].rate)}${rate_diff_str(list[i].rate_diff)}
        </span>
      </div>
    </div>
  </div>
  <div id="IconBatch" class="play_musicdata_icon clearfix">
    ${list[i].req_diff && list[i].req_diff > 0 ?
      "BEST枠入りまで: " + list[i].req_diff + " (" + list[i].req_score + ")" :
      ""}
  </div>
</div>`);

        // $("#cra_chart_list").append(dom(list_item_template, {
        //     jacket_img: {src: chart_list[i].image},
        //     difficulty_icon: difficulty_icon,
        //     Track: rate_str(chart_list[i].rate_base),
        //     MusicTitle: chart_list[i].name,
        //     Score: chart_list[i].score,
        //     Rate: rate_str(chart_list[i].rate) + rate_diff_str(chart_list[i].rate_diff),
        //     IconBatch: chart_list[i].req_diff ? "BEST枠入りまで：" + chart_list[i].req_diff : ""
        // }));
    }

    // $("#cra_chart_list").show(400);
    $("#cra_chart_list").show();
}

// debug
function render_all_chart_list () {
    render_chart_list(best_list, { 0: "全曲リスト" }, true);
}
