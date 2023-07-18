// Remote Example1 - controller
import { RelayServer } from "https://chirimen.org/remote-connection/js/beta/RelayServer.js";
/*windowはDOM(HTMLとかXMLのAPI)のこと?*/
window.getData = getData;
/*気圧を入れておく配列*/
var hipress = new Array();
/*最大気圧(hp)*/
var Maxpress = 0;
/*最小気圧(hp)*/
var minpress = 10000;
/*高さ(%)*/
var high;

var i;
var messageDiv = document.getElementById("messageDiv");
var temTd = document.getElementById("temTd");
var humTd = document.getElementById("humTd");
var preTd = document.getElementById("preTd");
var highTd = document.getElementById("highTd");
var updownTd = document.getElementById("updownTd");

/*テキストを一時敵に代入するための変数*/
var highText;
var updownText;

var channel;
window.onload = async function () {
  // webSocketリレーの初期化
  var relay = RelayServer("chirimentest", "chirimenSocket");
  channel = await relay.subscribe("chirimenBMEdteam8");
  messageDiv.innerText = "web socketリレーサービスに接続しました";
  /*onmessageはメッセージを受信したときに起きるイベント*/
  /*main_remote_bme280の計測データを受け取り, 関数getMessageを起動(2'番main_remote_bme280.jsから受け取り)*/
  channel.onmessage = getMessage;
};

/*計測されたデータを受け取って, htmlへ表示するためのもの(htmlに向けてidにテキスト代入)*/
function getMessage(msg) {
  // メッセージを受信したときに起動する関数
  /*mdataに受け取った計測データを代入*/
  var mdata = msg.data;
  /*messageDivというhtmlのidにデータをテキスト形式で入れる*/
  messageDiv.innerText = JSON.stringify(mdata);
  console.log("mdata:", mdata);
  hipress.push(mdata.pressure);

  /*それぞれ対応しているhtmlのidに温度湿度気圧をテキスト形式で代入*/
  temTd.innerText = mdata.temperature;
  humTd.innerText = mdata.humidity;
  preTd.innerText = mdata.pressure;
  /*higher配列に10秒ごとの気圧をプッシュ*/
  hipress.push(mdata.pressure);
  /*データの個数によって表示方法と計算方法を変える*/

  /*0回目から180回目までは計測中とする*/
  if (hipress.length < 180) {
    highText = "データ集計中です";
    updownText = "--";
  } else if (hipress.length >= 180) {
    /*180回以降は, 直近180回の計測データを最大最小の比較対象とする*/
    /*上のif文のとは比較範囲が変わっただけ*/
    /*気圧の最大最小をいったん初期化*/
    Maxpress = 0;
    minpress = 10000;
    for (i = hipress.length - 180; i < hipress.length; i++) {
      if (hipress[i] > Maxpress) {
        /*最大値更新*/
        Maxpress = hipress[i];
      }
      if (hipress[i] < minpress) {
        /*最小値更新*/
        minpress = hipress[i];
      }
    }
    /*最大最小がわかると高さの計算ができる*/
    high = ((Maxpress - mdata.pressure) / (Maxpress - minpress)) * 100;
    /*高さを表示*/
    highText = high;
    /*上り, 下り, 最上部付近, 最下部付近の表示*/
    if (high >= 90) {
      /*高さ90%以上のとき*/
      updownText = "最上部付近";
    } else if (high <= 10) {
      /*高さ10%以下のとき*/
      updownText = "最下部付近";
    } else if (
      hipress[hipress.length - 1] <= hipress[hipress.length - 2] &&
      hipress[hipress.length - 2] <= hipress[hipress.length - 3]
    ) {
      /*直近3つの気圧が減り続けているとき*/
      updownText = "上り";
      /*「何が見えるか」については, ここにhighを使って*/
      /*分岐させるとよい*/
    } else if (
      hipress[hipress.length - 1] >= hipress[hipress.length - 2] &&
      hipress[hipress.length - 2] >= hipress[hipress.length - 3]
    ) {
      /*直近5つの気圧が増え続けているとき*/
      updownText = "下り";
      /*「何が見えるか」については, ここにhighを使って*/
      /*分岐させるとよい*/
    } else {
      /*どれにも当てはまらないエラーの時*/
      updownText = "--";
    }
  }
  updownTd.innerText = updownText;
  highTd.innerText = highText;
}
/*共通のチャンネルにGET SENSOR DATAを送信する*/
function getData() {
  // get microbit's internal sensor data
  /*"GET SENSOR DATA"というテキストを送信(1番main_remote_bme280.jsへ)*/
  channel.send("GET SENSOR DATA");
}
