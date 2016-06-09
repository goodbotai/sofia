from flask import Flask, request
from urlparse import urlparse
import urllib
import requests
import json
import urlparse
count =0
hi = "I am a robot"
senders = []
rapidpro_value_key = []
app = Flask(__name__)
VERIFY_TOKEN = "Mek"
ACCESS_TOKEN = "EAARFFY1xwc0BAG0I5EBZCQWB6frwKMCbz1XmZBduz0z5DwXKUZB0F2JE5rGt0b98SCuzBhC1cdjWBU4FKtqpqmY4PMBwNSKIZBv8VDxFpg3Wj7zxNRysVVTxSxZC4V9QG1GjQVjQOpZAs7YbaDGHXFyTAmYThBqBkz4uOrliCSDwZDZD"

def reply(user_id):
    
    value = float(rapidpro_value_key[len(rapidpro_value_key)-1])/100
    float_value = "%0.2f" % value
    key = str(float_value)
    urll = "http://www.ethioscholarship.com/wp-content/uploads/2016/06/"+ key +".png"
    data = {
        "recipient": {"id": user_id},
            "message": {"attachment":{"type":"image", "payload":{"url":urll}}}
    
    }
    resp = requests.post("https://graph.facebook.com/v2.6/me/messages?access_token=" + ACCESS_TOKEN, json=data)
    print(resp.content)

@app.route('/rapidpro', methods=['GET'])
def handle_verifications():
    return request.method
    print request.method


@app.route('/rapidpro', methods=['POST'])
def handle_incoming_messagess():
    datas = request.get_data().decode('utf-8')
    length= len(eval(request.form["values"]))
    val = (eval(request.form["values"])[length-1]["label"])
    rapidpro_value_key.append(val)
    hey =  urllib.unquote(datas)
    if (len(senders) >=1):
        reply(senders[0])
    return "ok"

@app.route('/facebook', methods=['GET'])
def handle_verification():
    if request.args['hub.verify_token'] == VERIFY_TOKEN:
        return request.args['hub.challenge']
    else:
        return "Invalid verification token"


@app.route('/facebook', methods=['POST'])
def handle_incoming_messages():
    data = request.json
    sender = data['entry'][0]['messaging'][0]['sender']['id']
    length = len(data['entry'][0]['messaging'])
    senders.append(sender)
    return "ok"
    print senders[0]
if __name__ == '__main__':
    app.run(debug=True)

