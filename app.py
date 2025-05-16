import sys
import os
import random
from flask import Flask, render_template, jsonify, send_from_directory
from models import db, Verse
from flask_compress import Compress

# src フォルダへのパスを取得して sys.path に追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

app = Flask(__name__)
app.config['COMPRESS_REGISTER'] = True  # 自動登録を明示
app.config['COMPRESS_MIMETYPES'] = [  # 圧縮対象MIMEタイプ
    'text/html',
    'text/css',
    'text/xml',
    'application/json',
    'application/javascript'
]
app.config['COMPRESS_MIN_SIZE'] = 500  # 圧縮する最小サイズ(バイト)
app.config['COMPRESS_LEVEL'] = 6  # 圧縮レベル(1-9) ※修正点
app.config['COMPRESS_ALGORITHM'] = 'gzip'  # デフォルトアルゴリズム

Compress(app)

# SQLite データベースの設定
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///verses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

#　データベースの初期化
with app.app_context():
    db.create_all()
    if not Verse.query.first():  # 初回のみ登録
        verse = Verse(category="hope", text="希望を抱いて喜びなさい。（ローマ12:12）")
        db.session.add(verse)
        db.session.commit()

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

# 新しいAPIエンドポイントを追加
@app.route('/api/random-verse')
def random_verse():
    verses = [
        "恐れるな。わたしはあなたとともにいる。(イザヤ41:10）",
        "主に信頼せよ。そうすれば道をまっすぐにしてくださる。(箴言3:5-6）",
        "希望を抱いて喜びなさい。（ローマ12:12）",
        "すべてを感謝しなさい。（テサロニケ第一5:18）",
        "あなたの道を主に委ねよ。そうすれば、主はあなたの計画を成し遂げてくださる。(詩編37:5)",
        "主は私の羊飼い。私は乏しいことがありません。(詩編23:1)",
        "あなたの心を尽くして主に信頼せよ。自分の知識に頼ってはならない。(箴言3:5)",
        "主は私の力、私の盾。私の心は主に信頼し、私は助けられた。(詩編28:7)",
        "主は私の光、私の救い。誰を恐れようか。(詩編27:1)",
        "いつも喜びなさい。絶えず祈りなさい。すべてのことに感謝しなさい。(テサロニケ第一5:16-18)",
        "神は私たちを愛してくださる。私たちも互いに愛し合おう。(ヨハネ第一4:7)",
        "感謝の心をもって主に近づこう。(詩編100:4)",
        "少しのことでも、主に感謝しなさい。(コロサイ3:17)",
        "今の苦しみは、後に来る栄光に比べて、何の意味もない。(ローマ8:18)",
        "神は私たちを愛してくださる。私たちも互いに愛し合おう。(ヨハネ第一4:7)",
        "今もって、私たちのために執り成してくださる。(ローマ8:34)",
        "喜ぶ者と共に喜び、泣くものと共に泣きなさい。(ローマ12:15)",
        "知識は人を高ぶらせるが、愛は人を築く。(コリント第一8:1)",
        "おりにかなって、主の言葉を語る者は幸いである。(箴言15:23)",
        "見よ、主の目は、主を恐れる者、主の恵みを待ち望む者の上にある。(詩編33:18)",
        "主を恐れる事は、知恵の初めである。(箴言1:7)",
        "知恵を得ることは、金を得ることよりも良い。(箴言16:16)",
        "明日のことを思い煩うな。明日のことは明日が思い煩う。(マタイ6:34)",
        "愛はすべてを包み、すべてを信じ、すべてを望み、すべてを耐え忍ぶ。(コリント第一13:7)",
        "いっさいのことを感謝しなさい。これが神の御心です。(テサロニケ第一5:18)",
        "受けるよりは与える方が幸いである。(使徒20:35)",
        "光の子として歩みなさい。(エペソ5:8)",
        "わたしはあなたを見捨てず、あなたを離れない。(へブル13:5)",
        "小さなことに忠実な者は、大きなことにも忠実である。(ルカ16:10)",
        "ねむりから覚めよ。キリストがあなたを照らしてくださる。(エペソ5:14)",
        "急いで行きなさい。主はあなたを待っておられる。(ルカ15:20)",
        "事を始める前に、主に祈りなさい。(箴言16:3)",
        "忍耐は、試練を生じさせ、試練は忍耐を生じさせる。(ヤコブ1:2-3)",
        "あなたに与えられた力を用いて、他の人を助けなさい。(ペテロ第一4:10)",
        "時間を惜しんで、主のために働きなさい。(エペソ5:16)",
        "光の子として歩みなさい。(エペソ5:8)",
        "神の国は、食物や飲み物ではなく、義と平和と喜びである。(ローマ14:17)",
        "人は、パンだけで生きるのではなく、神の口から出るすべての言葉によって生きる。(マタイ4:4)",
        "喜びなさい。主に喜びなさい。主をほめたたえなさい。(詩編37:4)",
        "全地は主をほめたたえよ。主の名をほめたたえよ。(詩編113:1)",
        "主が私たちを造られた。私たちは主の民、主の羊。(詩編100:3)",
        "強くなれ。主に強くあれ。主のために強くあれ。(エペソ6:10)",
        "平安を求める者は、主に信頼する。(詩編37:4)",
        "重荷を負う者は、主に寄り頼む。(詩編55:22)",
    ]
    return jsonify({"verse": random.choice(verses)})


@app.route("/")
def home():
    all_verses = Verse.query.all()
    chosen = random.choice(all_verses).text if all_verses else "まだみ言葉が登録されていません"
    return render_template("home.html", scripture=chosen)

@app.route("/game")
def game():
    return render_template("game.html")

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/about')
def about():
    return render_template('about.html')  # 自己紹介ページ

@app.route('/donation')
def donation():
    return render_template('donation.html')  # 献金

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/thank-you')
def thank_you():
    return render_template('thank_you.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)