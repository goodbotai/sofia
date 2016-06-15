from flask import Flask, request
import requests
senders = []
rapidpro_value_key = []
app = Flask(__name__)
VERIFY_TOKEN = "[REPLACE WITH FACEBOOK VERIFY TOKEN]"
ACCESS_TOKEN = "[REPLACE WITH FACEBOOK ACCCESS TOKEN]"
app.config.from_object(__name__)
app.config.from_envvar("HEALTHBOT_SETTINGS", silent=True)
VERIFY_TOKEN = app.config["VERIFY_TOKEN"]
ACCESS_TOKEN = app.config["ACCESS_TOKEN"]


def reply(user_id):
    value = float(rapidpro_value_key[len(rapidpro_value_key)-1])/100
    float_value = "%0.2f" % value
    key = str(float_value)
    path = "https://raw.githubusercontent.com/goodbotai/sofia/162d48b74401336155e99010261156a215a1b49f/"
    url = path + key + ".png"
    data = {
        "recipient": {"id": user_id},
        "message": {"attachment": {"type": "image", "payload": {"url": url}}}
    }
    API_url = "https://graph.facebook.com/v2.6/me/messages?access_token="
    resp = requests.post(API_url + ACCESS_TOKEN, json=data)
    print(resp.content)


@app.route('/rapidpro', methods=['POST'])
def handle_rapidpro_incoming_messages():
    length = len(eval(request.form["values"]))
    val = (eval(request.form["values"])[length-1]["label"])
    rapidpro_value_key.append(val)
    if (len(senders) >= 1):
        reply(senders[len(senders)-1])
    return "ok"


@app.route('/facebook', methods=['GET'])
def handle_facebook_verification():
    if request.args['hub.verify_token'] == VERIFY_TOKEN:
        return request.args['hub.challenge']
    else:
        return "Invalid verification token"


@app.route('/facebook', methods=['POST'])
def handle_facebook_incoming_messages():
    data = request.json
    sender = data['entry'][0]['messaging'][0]['sender']['id']
    senders.append(sender)
    return "ok"


@app.route('/')
def index():
    return "Sofia health bot."


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
    app.logger.debug(VERIFY_TOKEN)